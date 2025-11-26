import { getPrismaClient } from '../../../utils/prisma'

const prisma = getPrismaClient()

export default defineEventHandler(async (event) => {
  console.log('📥 DELETE /api/events/[id] - Request received')

  const eventId = getRouterParam(event, 'id')
  
  if (!eventId) {
    console.error('❌ Event ID is required')
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  console.log(`🔍 Attempting to delete event: ${eventId}`)

  try {
    // Проверяем, существует ли событие
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { 
        id: true, 
        title: true, 
        status: true,
        _count: {
          select: {
            applications: true,
            payments: true
          }
        }
      }
    })

    if (!existingEvent) {
      console.warn(`⚠️ Event not found: ${eventId}`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    console.log(`📊 Event "${existingEvent.title}" has ${existingEvent._count.applications} applications and ${existingEvent._count.payments} payments`)

    // ПОЛНОЕ УДАЛЕНИЕ - удаляем все связанные данные
    
    // 1. Удаляем все платежи связанные с событием
    const deletedPayments = await prisma.payment.deleteMany({
      where: { eventId: eventId }
    })
    console.log(`🗑️ Deleted ${deletedPayments.count} payments`)

    // 2. Удаляем все заявки связанные с событием
    const deletedApplications = await prisma.application.deleteMany({
      where: { eventId: eventId }
    })
    console.log(`🗑️ Deleted ${deletedApplications.count} applications`)

    // 3. Удаляем историю статусов события
    const deletedStatusHistory = await prisma.eventStatusHistory.deleteMany({
      where: { eventId: eventId }
    })
    console.log(`🗑️ Deleted ${deletedStatusHistory.count} status history records`)

    // 4. Наконец, удаляем само событие
    const deletedEvent = await prisma.event.delete({
      where: { id: eventId }
    })

    console.log(`✅ Event "${deletedEvent.title}" completely deleted from platform`)

    return {
      success: true,
      message: 'Event completely deleted from platform',
      data: {
        eventId: eventId,
        title: deletedEvent.title,
        deletedRelatedData: {
          payments: deletedPayments.count,
          applications: deletedApplications.count,
          statusHistory: deletedStatusHistory.count
        }
      }
    }

  } catch (error: any) {
    // Если это уже HTTP ошибка, пробрасываем её
    if (error.statusCode) {
      throw error
    }

    console.error('❌ Error deleting event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete event: ' + (error.message || 'Unknown error')
    })
  }
})
