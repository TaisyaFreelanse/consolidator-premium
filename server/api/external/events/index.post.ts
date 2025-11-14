import { getPrismaClient } from '../../../utils/prisma'
import { validateExternalEvent, isTi20Passed, type ExternalEventData } from '../../../utils/externalEventValidation'

const prisma = getPrismaClient()

/**
 * POST /api/external/events
 * 
 * Создание или обновление черновика мероприятия через внешний API.
 * Все мероприятия создаются в статусе 'draft'.
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
  
  const body = await readBody<Partial<ExternalEventData>>(event)
  console.log('📦 Request body:', { 
    id: body.id,
    title: body.title, 
    producerCode: body.producerCode
  })

  // Валидация входных данных
  const validationErrors = validateExternalEvent(body)
  if (validationErrors.length > 0) {
    console.error('❌ Validation errors:', validationErrors)
    setResponseStatus(event, 400)
    return {
      success: false,
      errors: validationErrors
    }
  }

  const data = body as ExternalEventData

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
      producerName: data.producerName.trim(),
      producerCode: data.producerCode.trim(),
      timezone: data.timezone.trim(),
      createdAtClient: new Date(data.createdAtClient),
      // Стандартный controlPlan для всех событий
      controlPlan: JSON.stringify(['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999']),
      currentControlPoint: 't0',
      isCancelled: false
    }

    let savedEvent

    if (data.id) {
      // Обновление существующего черновика
      console.log(`✏️ Updating draft event: ${data.id}`)
      
      const existing = await prisma.event.findUnique({ 
        where: { id: data.id },
        select: { id: true, status: true, producerCode: true }
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
      if (existing.producerCode && existing.producerCode !== data.producerCode.trim()) {
        console.warn('🚫 Producer code mismatch')
        setResponseStatus(event, 403)
        return {
          success: false,
          errors: [{
            field: 'producerCode',
            message: 'Недостаточно прав для обновления этого мероприятия'
          }]
        }
      }

      // Опубликованные события нельзя обновлять через внешний API
      if (existing.status === 'published') {
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

      // Обновляем черновик
      savedEvent = await prisma.event.update({
        where: { id: data.id },
        data: eventData
      })
    } else {
      // Создание нового черновика
      console.log('✨ Creating new draft event')
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
        uploadedAtServer: savedEvent.createdAt.toISOString()
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

