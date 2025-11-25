import { getPrismaClient } from '../../../utils/prisma'

const prisma = getPrismaClient()

/**
 * GET /api/external/events/[id]
 * 
 * Получение статуса мероприятия по ID через внешний API.
 * Возвращает информацию о статусе загрузки, публикации и текущем состоянии на платформе.
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
  
  console.log('📥 GET /api/external/events/[id] - Status request received')
  
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
    // Ищем мероприятие в базе данных
    const foundEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        status: true,
        requiresModeration: true,
        siteAlias: true,
        createdAt: true,
        updatedAt: true,
        startApplicationsAt: true,
        endApplicationsAt: true,
        startContractsAt: true,
        startAt: true,
        endAt: true
      }
    })

    if (!foundEvent) {
      setResponseStatus(event, 404)
      return {
        success: false,
        errors: [{
          field: 'id',
          message: 'Мероприятие не найдено на платформе'
        }]
      }
    }

    console.log('✅ Event found:', foundEvent.id, foundEvent.status)

    return {
      success: true,
      data: {
        id: foundEvent.id,
        title: foundEvent.title,
        status: foundEvent.status, // 'draft' | 'published'
        requiresModeration: foundEvent.requiresModeration,
        siteAlias: foundEvent.siteAlias,
        uploadedAtServer: foundEvent.createdAt.toISOString(),
        updatedAtServer: foundEvent.updatedAt.toISOString(),
        isPublished: foundEvent.status === 'published',
        // Информация о контрольных точках для проверки возможности редактирования
        endApplicationsAt: foundEvent.endApplicationsAt?.toISOString() || null,
        startContractsAt: foundEvent.startContractsAt?.toISOString() || null,
        startAt: foundEvent.startAt?.toISOString() || null,
        endAt: foundEvent.endAt?.toISOString() || null
      }
    }
  } catch (error: any) {
    console.error('❌ Database error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      errors: [{
        field: 'server',
        message: 'Внутренняя ошибка сервера при получении статуса мероприятия'
      }]
    }
  }
})

