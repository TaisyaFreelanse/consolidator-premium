import type { ControlPointCode } from '~/types'
import { getPrismaClient } from '../../../../utils/prisma'

const prisma = getPrismaClient()

interface Applicant {
  code: string
  seats: number
  paidAmount: number
  payments: { amount: number; createdAt: string; paymentId?: string; status?: string }[]
  login?: string
}

interface PersonalCalculationResult {
  applicantCode: string
  applicantLogin?: string
  status: 'success' | 'failed' | 'overflow'
  totalPaid: number
  expectedPayment?: number
  extraContribution?: number
  deficit?: number
  share?: number
  refundFromSurplus?: number
  refundTotal: number
  pricePerSeat: number
  surplusAvailable?: number
  overflowTotal?: number
  reason?: 'lower' | 'late'
  thresholdAmount?: number | null
  thresholdTime?: number | null
  selectedTime?: number | null
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

    // Мониторинг доступен для всех после Ti20

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

    // Функция для генерации детерминированного секретного кода на основе userId
    // Используем простой хеш для создания кода вида "КонXX"
    const generateSecretCode = (userId: string, eventId: string): string => {
      if (userId === 'anonymous') {
        return 'Аноним'
      }
      // Создаем детерминированный хеш на основе userId и eventId
      let hash = 0
      const str = `${userId}-${eventId}`
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      // Генерируем код вида "КонXX", где XX - двузначное число от 01 до 99
      const codeNum = Math.abs(hash) % 99 + 1
      return `Кон${String(codeNum).padStart(2, '0')}`
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
        // ВАЖНО: userId теперь ВСЕГДА должен быть логином (name пользователя), а не кодом
        // Генерируем секретный код для каждого заявителя
        const secretCode = generateSecretCode(userId, eventId)
        applicantsMap.set(userId, {
          code: secretCode, // Секретный код для анонимности
          seats: 1, // Один участник = одно место
          paidAmount: amount,
          payments: [paymentRecord],
          login: userId !== 'anonymous' ? userId : undefined // userId должен быть логином (name), не кодом
        })
      }
    })

    // Сортируем заявителей: сначала по сумме платежа (убывание), затем по времени последнего платежа
    const getLastPaymentTimestamp = (applicant: Applicant): number | null => {
      if (!applicant.payments || applicant.payments.length === 0) return null
      const lastPayment = applicant.payments[applicant.payments.length - 1]
      const timestamp = new Date(lastPayment.createdAt).getTime()
      return Number.isNaN(timestamp) ? null : timestamp
    }

    const applicants = Array.from(applicantsMap.values()).sort((a, b) => {
      if (b.paidAmount !== a.paidAmount) {
        return b.paidAmount - a.paidAmount
      }
      const timeA = getLastPaymentTimestamp(a)
      const timeB = getLastPaymentTimestamp(b)
      if (timeA !== null && timeB !== null && timeA !== timeB) {
        return timeA - timeB
      }
      if (timeA !== null && timeB === null) return -1
      if (timeA === null && timeB !== null) return 1
      return a.code.localeCompare(b.code)
    })
    
    // Вычисляем общую собранную сумму
    const collected = applicants.reduce((sum, app) => sum + app.paidAmount, 0)
    
    // Вычисляем дефицит/профицит (конвертируем BigInt в Number)
    const priceTotal = Number(eventData.priceTotal)
    const deficit = Math.max(0, priceTotal - collected)
    const surplus = Math.max(0, collected - priceTotal)
    const isCancelled = eventData.isCancelled || false

    // Определяем лимит мест
    const seatLimit = eventData.seatLimit ? Number(eventData.seatLimit) : 0
    const limitIndex = seatLimit > 0 ? Math.min(seatLimit, applicants.length) : applicants.length

    // Разделяем на участников в лимите и сверх лимита
    const withinLimitApplicants = applicants.slice(0, limitIndex)
    const overflowApplicants = applicants.slice(limitIndex)
    const overflowTotal = overflowApplicants.reduce((sum, app) => sum + app.paidAmount, 0)

    // Вычисляем цену за место
    const pricePerSeatValue = eventData.pricePerSeat 
      ? Number(eventData.pricePerSeat)
      : (limitIndex > 0 ? Math.round(priceTotal / limitIndex) : (applicants.length > 0 ? Math.round(priceTotal / applicants.length) : priceTotal))

    // Вычисляем профицит для распределения
    const surplusForDistribution = Math.max(0, surplus - overflowTotal)

    // Вычисляем ожидаемые платежи, переплаты и дефициты для участников в лимите
    const extrasMap = new Map<string, { expected: number; extra: number; deficit: number }>()
    withinLimitApplicants.forEach((applicant) => {
      const expected = (applicant.seats || 1) * pricePerSeatValue
      const extra = Math.max(0, applicant.paidAmount - expected)
      const deficit = Math.max(0, expected - applicant.paidAmount)
      extrasMap.set(applicant.code, { expected, extra, deficit })
    })

    const totalExtras = Array.from(extrasMap.values()).reduce((sum, data) => sum + data.extra, 0)

    // Функция вычисления персонального результата для участника
    const computePersonalResult = (applicant: Applicant, positionIndex: number): PersonalCalculationResult => {
      const totalPaid = applicant.paidAmount

      // Событие не состоялось - возвращаем все
      if (isCancelled || deficit > 0) {
        return {
          applicantCode: applicant.code,
          applicantLogin: applicant.login,
          status: 'failed',
          totalPaid,
          refundTotal: totalPaid,
          pricePerSeat: pricePerSeatValue,
          deficit
        }
      }

      // Участник сверх лимита - возвращаем все
      if (positionIndex >= limitIndex) {
        const thresholdApplicant = limitIndex > 0 ? applicants[limitIndex - 1] : null
        const thresholdAmount = thresholdApplicant?.paidAmount ?? null
        const thresholdTime = thresholdApplicant ? getLastPaymentTimestamp(thresholdApplicant) : null
        const selectedTime = getLastPaymentTimestamp(applicant)

        let reason: 'lower' | 'late' = 'lower'
        if (
          thresholdApplicant &&
          thresholdAmount !== null &&
          thresholdAmount === totalPaid &&
          selectedTime !== null &&
          thresholdTime !== null &&
          selectedTime > thresholdTime
        ) {
          reason = 'late'
        }

        return {
          applicantCode: applicant.code,
          applicantLogin: applicant.login,
          status: 'overflow',
          totalPaid,
          refundTotal: totalPaid,
          pricePerSeat: pricePerSeatValue,
          reason,
          thresholdAmount,
          thresholdTime,
          selectedTime
        }
      }

      // Участник в лимите - вычисляем возврат
      const extraData = extrasMap.get(applicant.code)
      const expectedPayment = extraData?.expected ?? ((applicant.seats || 1) * pricePerSeatValue)
      const extraContribution = extraData?.extra ?? Math.max(0, totalPaid - expectedPayment)
      const applicantDeficit = extraData?.deficit ?? Math.max(0, expectedPayment - totalPaid)

      // Вычисляем долю в распределении профицита
      let share = 0
      if (surplusForDistribution > 0) {
        const count = withinLimitApplicants.length || 1
        if (count === 1) {
          share = 1
        } else if (totalExtras > 0) {
          share = extraContribution / totalExtras
        } else {
          share = 1 / count
        }
      }

      const refundFromSurplus = Math.round(surplusForDistribution * share)

      // Итоговый возврат
      let refundTotal = 0
      if (extraContribution > 0) {
        if (surplusForDistribution >= totalExtras && totalExtras > 0) {
          refundTotal = extraContribution
        } else {
          refundTotal = Math.min(extraContribution, refundFromSurplus)
        }
      } else {
        refundTotal = refundFromSurplus
      }

      return {
        applicantCode: applicant.code,
        applicantLogin: applicant.login,
        status: 'success',
        totalPaid,
        expectedPayment,
        extraContribution,
        deficit: applicantDeficit,
        share,
        refundFromSurplus,
        refundTotal,
        pricePerSeat: pricePerSeatValue,
        surplusAvailable: surplusForDistribution,
        overflowTotal
      }
    }

    // Вычисляем персональные результаты для всех участников
    const personalCalculations = applicants.map((applicant, index) => {
      return computePersonalResult(applicant, index)
    })

    console.log('✅ Monitoring data retrieved for event:', eventId)


    // Возвращаем данные в формате MonitoringSnapshot с готовыми персональными расчетами
    return {
      success: true,
      data: {
        eventId: eventData.id,
        nowPoint: current,
        deadlineNext: nextDeadline || undefined,
        collected,
        deficit,
        surplus,
        isCancelled: isCancelled,
        applicants,
        personalCalculations, // Готовые персональные расчеты для всех участников
        totalParticipantsExtras: totalExtras // Суммарная переплата всех участников, вошедших в лимит
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

