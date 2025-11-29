import { getPrismaClient } from '../../../utils/prisma'
import { validateExternalEvent, type ExternalEventData } from '../../../utils/externalEventValidation'
import { isTi20Passed } from '../../../utils/moderationTimeRestrictions'
import { getAllWhitelistedSites, normalizeSiteName } from '../../../utils/whitelist'

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
 * Публикация происходит автоматически или через модерацию (в зависимости от настроек сайта).
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
    title: body.title
  })

  // Автоматически определяем сайт по заголовкам Origin или Referer
  const origin = getRequestHeader(event, 'origin')
  const referer = getRequestHeader(event, 'referer')
  
  console.log('🌐 Request headers:', { origin, referer })
  
  // Используем Origin, если есть, иначе Referer
  const requestUrl = origin || referer || ''
  
  if (!requestUrl) {
    console.warn('🚫 No Origin or Referer header found')
    setResponseStatus(event, 400)
    return {
      success: false,
      errors: [{
        field: 'origin',
        message: 'Не удалось определить источник запроса. Убедитесь, что запрос отправляется с разрешенного домена.'
      }]
    }
  }

  // Нормализуем URL для сравнения
  const normalizedRequestUrl = normalizeSiteName(requestUrl)
  
  console.log('🔍 Normalized request URL:', normalizedRequestUrl)

  // Получаем все сайты из белого списка и сравниваем нормализованные URL
  const allSites = await getAllWhitelistedSites(false) // Только активные
  
  // Ищем совпадение по нормализованному siteName
  let siteInfo = null
  for (const site of allSites) {
    const normalizedSiteName = normalizeSiteName(site.siteName)
    if (normalizedSiteName === normalizedRequestUrl) {
      siteInfo = site
      break
    }
  }

  if (!siteInfo) {
    console.warn('🚫 Site not whitelisted:', normalizedRequestUrl)
    setResponseStatus(event, 403)
    return {
      success: false,
      errors: [{
        field: 'origin',
        message: `Сайт "${requestUrl}" не найден в белом списке или деактивирован. Обратитесь к модератору платформы для добавления вашего домена в белый список.`
      }]
    }
  }

  const siteName = siteInfo.siteName // Используем оригинальное имя из БД для логирования

  console.log('✅ Site whitelisted:', siteName, 'alias:', siteInfo.siteAlias)

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

    // Определяем необходимость модерации на основе настроек сайта
    const requiresModeration = siteInfo.requiresModeration
    
    // Определяем статус и publishedAt в зависимости от настроек модерации сайта
    const eventStatus: 'draft' | 'published' = requiresModeration ? 'draft' : 'published'
    const publishedAt = requiresModeration ? undefined : new Date()

    console.log('🔍 Moderation check:', {
      siteName: siteName,
      siteAlias: siteInfo.siteAlias,
      requiresModeration: requiresModeration,
      eventStatus: eventStatus
    })

    if (requiresModeration) {
      console.log('⏸️ Site requires moderation: event will be saved as draft')
    } else {
      console.log('🚀 Site does not require moderation: event will be published immediately')
    }

    const eventData: any = {
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
      status: eventStatus,
      requiresModeration: requiresModeration,
      siteAlias: siteInfo.siteAlias,
      timezone: data.timezone.trim(),
      createdAtClient: new Date(data.createdAtClient),
      // Стандартный controlPlan для всех событий
      controlPlan: JSON.stringify(['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999']),
      currentControlPoint: 't0',
      isCancelled: false
    }

    // Добавляем publishedAt только если автомодерация включена
    if (publishedAt) {
      eventData.publishedAt = publishedAt
    }

    let savedEvent

    if (data.id) {
      // Обновление существующего черновика
      console.log(`✏️ Updating draft event: ${data.id}`)
      
      const existing = await prisma.event.findUnique({ 
        where: { id: data.id },
        select: { id: true, status: true, siteAlias: true, endApplicationsAt: true }
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

      // Проверка прав: только сайт-владелец может обновлять событие
      if (existing.siteAlias && existing.siteAlias !== siteInfo.siteAlias) {
        console.warn('🚫 Site alias mismatch:', existing.siteAlias, 'vs', siteInfo.siteAlias)
        setResponseStatus(event, 403)
        return {
          success: false,
          errors: [{
            field: 'siteName',
            message: 'Недостаточно прав для обновления этого мероприятия'
          }]
        }
      }

      // Опубликованные события нельзя обновлять через внешний API (если сайт требует модерации)
      if (requiresModeration && existing.status === 'published') {
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

      // Если сайт не требует модерации и событие уже опубликовано, разрешаем обновление
      // (но только если не прошло ti20)
      if (!requiresModeration && existing.status === 'published') {
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
      // Создание нового черновика (или опубликованного, если сайт не требует модерации)
      console.log(`✨ Creating new ${requiresModeration ? 'draft' : 'published'} event`)
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

