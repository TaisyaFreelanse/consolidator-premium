import { getPrismaClient } from '../../../utils/prisma'
import { validateExternalEvent, isTi20Passed, type ExternalEventData } from '../../../utils/externalEventValidation'
import { extractApiKeyFromHeader, getProducerByApiKey } from '../../../utils/apiKey'

const prisma = getPrismaClient()

/**
 * POST /api/external/events
 * 
 * Создание или обновление черновика мероприятия через внешний API.
 * 
 * Если автомодерация включена (AUTO_MODERATION_ENABLED=true), мероприятия автоматически
 * публикуются при создании/обновлении (статус 'published').
 * 
 * Если автомодерация отключена, мероприятия создаются в статусе 'draft'.
 * Для публикации используйте отдельный эндпоинт /api/external/events/publish.
 */
export default defineEventHandler(async (event) => {
  // CORS заголовки для внешнего API
  const origin = getRequestHeader(event, 'origin')
  
  // Разрешенные origins
  const allowedOrigins = [
    'https://external-demo.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ]
  
  if (origin && allowedOrigins.includes(origin)) {
    setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
    setResponseHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
    setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
    setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
  }
  
  // Обработка preflight запросов
  if (event.node.req.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
  
  console.log('📥 POST /api/external/events - External API request received')
  
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
  
  const body = await readBody<Partial<ExternalEventData>>(event)
  console.log('📦 Request body:', { 
    id: body.id,
    title: body.title
  })

  // Валидация входных данных (без producerCode, так как он берется из API ключа)
  const validationErrors = validateExternalEvent(body, { skipProducerCode: true })
  if (validationErrors.length > 0) {
    console.error('❌ Validation errors:', validationErrors)
    setResponseStatus(event, 400)
    return {
      success: false,
      errors: validationErrors
    }
  }

  const data = body as ExternalEventData
  // Добавляем producerCode из API ключа
  data.producerCode = producerCode

  // Проверка ti20: после окончания приема заявок нельзя создавать/обновлять черновики
  if (isTi20Passed({ endApplicationsAt: data.endApplicationsAt })) {
    console.warn('🚫 Attempt to create/update draft after ti20')
    setResponseStatus(event, 409)
    return {
      success: false,
      errors: [{
        field: 'endApplicationsAt',
        message: 'Нельзя создавать или обновлять черновики после окончания приема заявок (ti20)'
      }]
    }
  }

  try {
    // Преобразуем данные для БД
    const pricePerSeatKopecks = Math.round(Number(data.pricePerSeat) * 100)
    const priceTotalKopecks = Math.round(Number(data.seatLimit) * pricePerSeatKopecks)

    const eventData = {
      title: data.title.trim(),
      author: data.authorName.trim(), // Сохраняем authorName в поле author
      location: data.location.trim(),
      startAt: new Date(data.startAt),
      endAt: data.endAt ? new Date(data.endAt) : null,
      seatLimit: Number(data.seatLimit),
      priceTotal: BigInt(priceTotalKopecks),
      pricePerSeat: BigInt(pricePerSeatKopecks),
      description: data.description.trim(),
      startApplicationsAt: new Date(data.startApplicationsAt),
      endApplicationsAt: new Date(data.endApplicationsAt),
      startContractsAt: new Date(data.startContractsAt),
      status: 'draft' as const,
      producerName: data.producerName?.trim() || data.producerCode.trim() || null, // Используем producerName если есть, иначе producerCode, иначе null
      producerCode: data.producerCode.trim(),
      timezone: data.timezone.trim(),
      createdAtClient: new Date(data.createdAtClient),
      // Стандартный controlPlan для всех событий
      controlPlan: JSON.stringify(['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999']),
      currentControlPoint: 't0',
      isCancelled: false
    }

    // Проверяем, включена ли автомодерация
    const config = useRuntimeConfig()
    const autoModerationEnabled = String(config.autoModerationEnabled) === 'true' || process.env.AUTO_MODERATION_ENABLED === 'true'

    // Если автомодерация включена, сразу публикуем черновик
    if (autoModerationEnabled) {
      // @ts-ignore // Тип eventData.status изначально 'draft', но здесь нужно присвоить 'published'
      eventData.status = 'published'
      // Добавляем поле publishedAt только если автомодерация включена
      (eventData as any).publishedAt = new Date()
      console.log('🤖 Auto-moderation enabled: event will be published immediately')
    }

    let savedEvent

    if (data.id) {
      // Обновление существующего черновика
      console.log(`✏️ Updating draft event: ${data.id}`)
      
      const existing = await prisma.event.findUnique({ 
        where: { id: data.id },
        select: { id: true, status: true, producerCode: true, endApplicationsAt: true }
      })

      if (!existing) {
        setResponseStatus(event, 404)
        return {
          success: false,
          errors: [{
            field: 'id',
            message: 'Мероприятие не найдено'
          }]
        }
      }

      // Проверка прав: только владелец может обновлять черновик
      if (existing.producerCode && existing.producerCode !== producerCode) {
        console.warn('🚫 Producer code mismatch')
        setResponseStatus(event, 403)
        return {
          success: false,
          errors: [{
            field: 'authorization',
            message: 'Недостаточно прав для обновления этого мероприятия'
          }]
        }
      }

      // Опубликованные события нельзя обновлять через внешний API (если автомодерация отключена)
      if (!autoModerationEnabled && existing.status === 'published') {
        console.warn('🚫 Attempt to update published event via external API')
        setResponseStatus(event, 409)
        return {
          success: false,
          errors: [{
            field: 'id',
            message: 'Опубликованные мероприятия нельзя обновлять через внешний API'
          }]
        }
      }

      // Если автомодерация включена и событие уже опубликовано, разрешаем обновление
      // (но только если это тот же продюсер и не прошло ti20)
      if (autoModerationEnabled && existing.status === 'published') {
        // Проверяем, что не прошло ti20
        if (existing.endApplicationsAt && isTi20Passed({ endApplicationsAt: existing.endApplicationsAt })) {
          console.warn('🚫 Attempt to update published event after ti20')
          setResponseStatus(event, 409)
          return {
            success: false,
            errors: [{
              field: 'id',
              message: 'Нельзя обновлять опубликованные мероприятия после окончания приема заявок (ti20)'
            }]
          }
        }
      }
      
      // Обновляем событие (единый вызов после всех проверок)
      savedEvent = await prisma.event.update({
        where: { id: data.id },
        data: eventData
      })
    } else {
      // Создание нового черновика (или опубликованного, если автомодерация включена)
      console.log(`✨ Creating new ${autoModerationEnabled ? 'published' : 'draft'} event`)
      savedEvent = await prisma.event.create({
        data: eventData
      })
    }

    console.log('✅ Event saved:', savedEvent.id, savedEvent.status)

    return {
      success: true,
      data: {
        id: savedEvent.id,
        status: savedEvent.status,
        uploadedAtServer: savedEvent.createdAt.toISOString(),
        ...(savedEvent.publishedAt && { publishedAt: savedEvent.publishedAt.toISOString() })
      }
    }
  } catch (error: any) {
    console.error('❌ Database error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      errors: [{
        field: 'server',
        message: 'Внутренняя ошибка сервера при сохранении мероприятия'
      }]
    }
  }
})

