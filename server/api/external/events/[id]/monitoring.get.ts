import type { ControlPointCode } from '~/types'
import { getPrismaClient } from '../../../../utils/prisma'
import { extractApiKeyFromHeader, getProducerByApiKey } from '../../../../utils/apiKey'

const prisma = getPrismaClient()

interface Applicant {
  code: string
  seats: number
  paidAmount: number
  payments: { amount: number; createdAt: string; paymentId?: string; status?: string }[]
  login?: string
}

function resolveControlPoint(eventData: any): { current: ControlPointCode; nextDeadline: string | null } {
  const now = Date.now()

  const timeline: Array<{ code: ControlPointCode; at?: Date | null }> = [
    { code: 't0', at: eventData.createdAt ?? null },
    { code: 'ti10', at: eventData.startApplicationsAt ?? null },
    { code: 'ti20', at: eventData.endApplicationsAt ?? null },
    { code: 'ti30', at: eventData.startContractsAt ?? null },
    { code: 'ti40', at: eventData.startAt ?? null },
    { code: 'ti50', at: eventData.endAt ?? null }
  ]

  let current: ControlPointCode = 't0'
  let nextDeadline: string | null = null

  for (const point of timeline) {
    if (!point.at) {
      continue
    }

    const time = point.at.getTime()
    if (time <= now) {
      current = point.code
      continue
    }

    if (!nextDeadline) {
      nextDeadline = point.at.toISOString()
    }
    break
  }

  return { current, nextDeadline }
}

/**
 * GET /api/external/events/[id]/monitoring
 * 
 * Получение данных мониторинга мероприятия по ID через внешний API.
 * Доступно только после контрольной точки Ти20.
 * Возвращает информацию о заявителях, платежах и текущем состоянии сбора средств.
 */
export default defineEventHandler(async (event) => {
  // CORS заголовки для внешнего API
  const origin = getRequestHeader(event, 'origin')
  
  // Разрешенные origins из конфигурации
  const config = useRuntimeConfig(event)
  const defaultOrigin = 'https://external-demo.onrender.com'
  
  // Получаем строку origins из config.public.corsOrigins или process.env.CORS_ORIGINS
  const corsOriginsString = String(config.public?.corsOrigins || process.env.CORS_ORIGINS || '')
  
  // Разбиваем строку по запятой, обрезаем пробелы, фильтруем пустые значения
  // Если строка пуста или undefined, используем только default origin
  let allowedOrigins = corsOriginsString.trim()
    ? corsOriginsString.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [defaultOrigin]
  
  // Если после фильтрации массив пуст (например, строка содержала только запятые/пробелы),
  // используем default origin
  if (allowedOrigins.length === 0) {
    allowedOrigins = [defaultOrigin]
  }
  
  if (origin && allowedOrigins.includes(origin)) {
    setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
    setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, OPTIONS')
    setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
    setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
  }
  
  // Обработка preflight запросов
  if (event.node.req.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
  
  console.log('📥 GET /api/external/events/[id]/monitoring - Monitoring request received')
  
  // Получаем API ключ из заголовка Authorization
  const authHeader = getRequestHeader(event, 'authorization')
  const apiKey = extractApiKeyFromHeader(authHeader)
  
  if (!apiKey) {
    setResponseStatus(event, 401)
    return {
      success: false,
      errors: [{
        field: 'authorization',
        message: 'API ключ не предоставлен. Используйте заголовок Authorization: Bearer <api_key>'
      }]
    }
  }

  // Получаем информацию о продюсере по API ключу
  const producerInfo = await getProducerByApiKey(apiKey)
  if (!producerInfo) {
    setResponseStatus(event, 401)
    return {
      success: false,
      errors: [{
        field: 'authorization',
        message: 'Неверный или неактивный API ключ'
      }]
    }
  }

  const producerCode = producerInfo.producerCode
  console.log('🔑 API key validated for producer:', producerCode)
  
  // Получаем ID из параметров маршрута
  const eventId = getRouterParam(event, 'id')
  
  if (!eventId) {
    setResponseStatus(event, 400)
    return {
      success: false,
      errors: [{
        field: 'id',
        message: 'ID мероприятия не указан'
      }]
    }
  }

  try {
    // Получаем событие с платежами
    const eventData = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        payments: {
          where: {
            status: 'SUCCESS'
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!eventData) {
      setResponseStatus(event, 404)
      return {
        success: false,
        errors: [{
          field: 'id',
          message: 'Мероприятие не найдено на платформе'
        }]
      }
    }

    // Проверка прав: только владелец может запрашивать мониторинг
    if (eventData.producerCode && eventData.producerCode !== producerCode) {
      console.warn('🚫 Producer code mismatch')
      setResponseStatus(event, 403)
      return {
        success: false,
        errors: [{
          field: 'authorization',
          message: 'Недостаточно прав для просмотра мониторинга этого мероприятия'
        }]
      }
    }

    // Проверка контрольной точки Ти20
    const { current, nextDeadline } = resolveControlPoint(eventData)
    
    // Проверяем, что Ти20 наступила (current должен быть 'ti20' или позже)
    const ti20Time = eventData.endApplicationsAt?.getTime() || 0
    const now = Date.now()
    
    if (ti20Time > now) {
      setResponseStatus(event, 400)
      return {
        success: false,
        errors: [{
          field: 'timing',
          message: 'Данные мониторинга доступны только после контрольной точки Ти20 (окончание приема заявок)'
        }]
      }
    }

    // Обновляем текущую контрольную точку, если изменилась
    if (eventData.currentControlPoint !== current) {
      try {
        await prisma.event.update({
          where: { id: eventId },
          data: { currentControlPoint: current }
        })
      } catch (updateError) {
        console.warn('⚠️ Failed to update currentControlPoint:', updateError)
      }
    }

    // Группируем платежи по пользователям (userId)
    const applicantsMap = new Map<string, Applicant>()

    eventData.payments.forEach(payment => {
      const userId = payment.userId || 'anonymous'
      const existing = applicantsMap.get(userId)
      const amount = Number(payment.amount) // BigInt -> Number
      const paymentRecord = {
        amount,
        createdAt: payment.createdAt ? payment.createdAt.toISOString() : new Date().toISOString(),
        paymentId: payment.id || undefined,
        status: payment.status || undefined
      }

      if (existing) {
        existing.paidAmount += amount
        existing.payments.push(paymentRecord)
      } else {
        // userId используется как code, а также может быть логином (на платформе все заявители авторизованы)
        applicantsMap.set(userId, {
          code: userId,
          seats: 1, // Один участник = одно место
          paidAmount: amount,
          payments: [paymentRecord],
          login: userId !== 'anonymous' ? userId : undefined // userId может быть логином
        })
      }
    })

    const applicants = Array.from(applicantsMap.values()).sort((a, b) => b.paidAmount - a.paidAmount)
    
    // Вычисляем общую собранную сумму
    const collected = applicants.reduce((sum, app) => sum + app.paidAmount, 0)
    
    // Вычисляем дефицит/профицит (конвертируем BigInt в Number)
    const priceTotal = Number(eventData.priceTotal)
    const deficit = Math.max(0, priceTotal - collected)
    const surplus = Math.max(0, collected - priceTotal)

    console.log('✅ Monitoring data retrieved for event:', eventId)

    // Возвращаем данные в формате MonitoringSnapshot
    return {
      success: true,
      data: {
        eventId: eventData.id,
        nowPoint: current,
        deadlineNext: nextDeadline || undefined,
        collected,
        deficit,
        surplus,
        isCancelled: eventData.isCancelled || false,
        applicants
      }
    }
  } catch (error: any) {
    console.error('❌ Database error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      errors: [{
        field: 'server',
        message: 'Внутренняя ошибка сервера при получении данных мониторинга'
      }]
    }
  }
})

