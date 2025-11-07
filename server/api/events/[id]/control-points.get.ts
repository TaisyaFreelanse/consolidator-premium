/**
 * GET /api/events/:id/control-points
 * Получить информацию о контрольных точках мероприятия
 */

import { getNotices, isValidControlPoint } from '../../../utils/getNotices'
import { getPrismaClient } from '../../../utils/prisma'

const prisma = getPrismaClient()

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'id')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }
  
  try {
    // Получаем мероприятие из БД
    const eventData = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        controlPlan: true,
        currentControlPoint: true,
        isCancelled: true,
        status: true
      }
    })
    
    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    // Парсим controlPlan (он хранится как JSON string)
    let controlPlan: string[]
    try {
      controlPlan = JSON.parse(eventData.controlPlan)
    } catch (e) {
      controlPlan = ['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999']
    }
    
    // Получаем тексты извещений
    const notices = getNotices(
      eventData.currentControlPoint as any,
      eventData.isCancelled
    )
    
    return {
      success: true,
      data: {
        eventId: eventData.id,
        title: eventData.title,
        controlPlan,
        currentControlPoint: eventData.currentControlPoint,
        isCancelled: eventData.isCancelled,
        status: eventData.status,
        notices
      }
    }
  } catch (error: any) {
    // Если это уже наша ошибка, пробрасываем дальше
    if (error.statusCode) {
      throw error
    }
    
    // Иначе логируем и возвращаем 500
    console.error('Error fetching control points:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch event control points'
    })
  }
})

