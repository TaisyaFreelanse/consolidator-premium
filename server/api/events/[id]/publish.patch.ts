import { getPrismaClient } from '../../../utils/prisma'

const prisma = getPrismaClient()

interface PublishEventBody {
  producerName?: string // Имя продюсера для проверки прав (опционально)
}

export default defineEventHandler(async (event) => {
  console.log('📥 PATCH /api/events/[id]/publish - Request received')
  
  const eventId = getRouterParam(event, 'id')
  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'Event ID is required' })
  }

  const body = await readBody<PublishEventBody>(event).catch(() => ({}))
  
  console.log(`🔍 Looking for event: ${eventId}`)

  try {
    // 1. Проверяем, существует ли событие
    const eventData = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!eventData) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    // 2. Проверяем, что событие еще не опубликовано
    if (eventData.status === 'published') {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Event is already published' 
      })
    }

    // 3. Обновляем статус на published
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'published',
        currentControlPoint: 't0' // Начинаем с начальной точки
      }
    })

    console.log(`✅ Event published: ${eventId}`)

    // Парсим JSON строки для ответа
    let activities: string[] = []
    let controlPlan: string[] = []
    
    try {
      activities = updatedEvent.activities ? JSON.parse(updatedEvent.activities) : []
    } catch {
      activities = []
    }
    
    try {
      controlPlan = updatedEvent.controlPlan ? JSON.parse(updatedEvent.controlPlan) : []
    } catch {
      controlPlan = []
    }

    return {
      success: true,
      message: 'Event published successfully',
      data: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        status: updatedEvent.status,
        currentControlPoint: updatedEvent.currentControlPoint
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('❌ Error publishing event:', error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Failed to publish event: ' + (error.message || 'Unknown error')
    })
  }
})

