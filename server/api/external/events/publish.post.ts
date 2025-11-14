import { getPrismaClient } from '../../../utils/prisma'
import { isTi20Passed } from '../../../utils/externalEventValidation'

const prisma = getPrismaClient()

/**
 * POST /api/external/events/publish
 * 
 * Публикация ранее загруженного черновика.
 * Переводит мероприятие из статуса 'draft' в 'published'.
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
  
  console.log('📥 POST /api/external/events/publish - Publish request received')
  
  const body = await readBody<{ id: string; producerCode: string }>(event)
  console.log('📦 Request body:', { id: body.id, producerCode: body.producerCode })

  // Валидация обязательных полей
  if (!body.id || !body.producerCode) {
    setResponseStatus(event, 400)
    return {
      success: false,
      errors: [{
        field: body.id ? 'producerCode' : 'id',
        message: 'Поля "id" и "producerCode" обязательны для публикации'
      }]
    }
  }

  try {
    // Находим мероприятие
    const existing = await prisma.event.findUnique({
      where: { id: body.id },
      select: {
        id: true,
        status: true,
        producerCode: true,
        endApplicationsAt: true
      }
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

    // Проверка прав: только владелец может публиковать
    if (existing.producerCode && existing.producerCode !== body.producerCode.trim()) {
      console.warn('🚫 Producer code mismatch for publish')
      setResponseStatus(event, 403)
      return {
        success: false,
        errors: [{
          field: 'producerCode',
          message: 'Недостаточно прав для публикации этого мероприятия'
        }]
      }
    }

    // Проверка: мероприятие должно быть черновиком
    if (existing.status !== 'draft') {
      console.warn('🚫 Attempt to publish non-draft event')
      setResponseStatus(event, 409)
      return {
        success: false,
        errors: [{
          field: 'id',
          message: existing.status === 'published'
            ? 'Мероприятие уже опубликовано'
            : 'Мероприятие не может быть опубликовано'
        }]
      }
    }

    // Проверка ti20: после окончания приема заявок нельзя публиковать
    if (isTi20Passed({ endApplicationsAt: existing.endApplicationsAt })) {
      console.warn('🚫 Attempt to publish after ti20')
      setResponseStatus(event, 409)
      return {
        success: false,
        errors: [{
          field: 'id',
          message: 'Нельзя публиковать черновики после окончания приема заявок (ti20)'
        }]
      }
    }

    // Публикуем мероприятие
    const published = await prisma.event.update({
      where: { id: body.id },
      data: {
        status: 'published',
        publishedAt: new Date()
      },
      select: {
        id: true,
        status: true,
        publishedAt: true
      }
    })

    console.log('✅ Event published:', published.id)

    return {
      success: true,
      data: {
        id: published.id,
        status: published.status,
        publishedAt: published.publishedAt!.toISOString()
      }
    }
  } catch (error: any) {
    console.error('❌ Database error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      errors: [{
        field: 'server',
        message: 'Внутренняя ошибка сервера при публикации мероприятия'
      }]
    }
  }
})

