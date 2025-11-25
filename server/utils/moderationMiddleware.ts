import type { EventHandler } from 'h3'
import { getPrismaClient } from './prisma'
import { canModerateEvent, createTi20ExpiredError } from './moderationTimeRestrictions'

const prisma = getPrismaClient()

/**
 * Middleware для проверки возможности модерации события
 * Проверяет временные ограничения и права доступа
 */
export function withModerationTimeCheck(handler: EventHandler): EventHandler {
  return defineEventHandler(async (event) => {
    // Получаем ID события из параметров маршрута
    const eventId = getRouterParam(event, 'id')
    
    if (!eventId) {
      throw createError({ statusCode: 400, statusMessage: 'Event ID is required' })
    }

    // Проверяем существование события и его параметры
    const eventData = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        requiresModeration: true,
        endApplicationsAt: true,
        title: true
      }
    })

    if (!eventData) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    // Проверяем временные ограничения
    if (!canModerateEvent(eventData)) {
      console.warn(`🚫 Moderation attempt blocked for event ${eventId}:`, {
        status: eventData.status,
        requiresModeration: eventData.requiresModeration,
        endApplicationsAt: eventData.endApplicationsAt,
        title: eventData.title
      })

      // Определяем причину блокировки
      if (eventData.status === 'published') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Event is already published and cannot be moderated'
        })
      }

      if (eventData.requiresModeration === false) {
        throw createError({
          statusCode: 400,
          statusMessage: 'This event does not require moderation'
        })
      }

      // Если дошли сюда, значит время истекло
      throw createError(createTi20ExpiredError('moderate'))
    }

    // Добавляем данные события в контекст для использования в обработчике
    event.context.eventData = eventData

    // Вызываем оригинальный обработчик
    return handler(event)
  })
}

/**
 * Проверка прав модератора (заглушка для будущей реализации)
 * TODO: Добавить проверку JWT токена или сессии
 */
export function checkModeratorPermissions(event: any): boolean {
  // В будущем здесь будет проверка JWT токена или сессии
  // Пока возвращаем true, так как защита осуществляется на уровне middleware страниц
  return true
}

/**
 * Middleware для проверки прав модератора
 */
export function withModeratorCheck(handler: EventHandler): EventHandler {
  return defineEventHandler(async (event) => {
    if (!checkModeratorPermissions(event)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Moderator permissions required'
      })
    }

    return handler(event)
  })
}

/**
 * Комбинированный middleware для модерации
 * Проверяет и права модератора, и временные ограничения
 */
export function withModerationChecks(handler: EventHandler): EventHandler {
  return withModeratorCheck(withModerationTimeCheck(handler))
}
