/**
 * PUT /api/events/:id/control-point
 * Обновить текущую контрольную точку и статус отмены мероприятия
 */

import { isValidControlPoint } from '../../../utils/getNotices'
import { getPrismaClient } from '../../../utils/prisma'

const prisma = getPrismaClient()

interface UpdateControlPointBody {
  currentControlPoint?: string
  isCancelled?: boolean
  note?: string
}

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'id')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }
  
  const body = await readBody<UpdateControlPointBody>(event)
  
  // Валидация
  if (body.currentControlPoint && !isValidControlPoint(body.currentControlPoint)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid control point. Must be one of: t0, ti10, ti20, ti30, ti40, ti50, t999'
    })
  }
  
  try {
    // Проверяем существование мероприятия
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    })
    
    if (!existingEvent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    // Обновляем мероприятие
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        currentControlPoint: body.currentControlPoint ?? existingEvent.currentControlPoint,
        isCancelled: body.isCancelled ?? existingEvent.isCancelled
      }
    })
    
    // Создаем запись в истории статусов
    if (body.currentControlPoint && body.currentControlPoint !== existingEvent.currentControlPoint) {
      await prisma.eventStatusHistory.create({
        data: {
          eventId,
          statusCode: body.currentControlPoint,
          note: body.note || `Переход на контрольную точку ${body.currentControlPoint}`
        }
      })
    }
    
    // Если мероприятие отменено и это изменилось
    if (body.isCancelled !== undefined && body.isCancelled !== existingEvent.isCancelled) {
      await prisma.eventStatusHistory.create({
        data: {
          eventId,
          statusCode: updatedEvent.currentControlPoint || 't0',
          note: body.isCancelled 
            ? 'Мероприятие отменено' 
            : 'Отмена мероприятия отменена'
        }
      })
    }
    
    // Парсим controlPlan
    let controlPlan: string[]
    try {
      controlPlan = JSON.parse(updatedEvent.controlPlan)
    } catch (e) {
      controlPlan = ['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999']
    }
    
    return {
      success: true,
      message: 'Control point updated successfully',
      data: {
        eventId: updatedEvent.id,
        title: updatedEvent.title,
        controlPlan,
        currentControlPoint: updatedEvent.currentControlPoint,
        isCancelled: updatedEvent.isCancelled
      }
    }
  } catch (error: any) {
    // Если это уже наша ошибка, пробрасываем дальше
    if (error.statusCode) {
      throw error
    }
    
    // Иначе логируем и возвращаем 500
    console.error('Error updating control point:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update event control point'
    })
  }
})

