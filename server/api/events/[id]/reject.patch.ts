import { getPrismaClient } from '../../../utils/prisma'
import { canModerateEvent, createTi20ExpiredError } from '../../../utils/moderationTimeRestrictions'

const prisma = getPrismaClient()

interface RejectEventBody {
  reason?: string // Причина отклонения (опционально)
}

export default defineEventHandler(async (event) => {
  console.log('📥 PATCH /api/events/[id]/reject - Request received')
  
  const eventId = getRouterParam(event, 'id')
  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'Event ID is required' })
  }

  const body = await readBody<RejectEventBody>(event).catch(() => ({}))
  
  console.log(`🔍 Looking for event to reject: ${eventId}`)

  try {
    // 1. Проверяем, существует ли событие
    const eventData = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!eventData) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    // 2. Проверяем, что событие находится в статусе draft и требует модерации
    if (eventData.status !== 'draft') {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Only draft events can be rejected' 
      })
    }

    if (!eventData.requiresModeration) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'This event does not require moderation' 
      })
    }

    // 3. Проверяем возможность модерации события (временные ограничения)
    if (!canModerateEvent(eventData)) {
      console.warn('🚫 Attempt to reject event outside moderation window:', {
        eventId: eventId,
        title: eventData.title,
        status: eventData.status,
        endApplicationsAt: eventData.endApplicationsAt
      })
      throw createError(createTi20ExpiredError('reject'))
    }

    // 4. Помечаем событие как отклоненное (можно использовать статус 'rejected' или удалить)
    // Для простоты будем удалять отклоненные события
    await prisma.event.delete({
      where: { id: eventId }
    })

    console.log(`✅ Event rejected and deleted: ${eventId}`)

    return {
      success: true,
      message: 'Event rejected and removed successfully',
      data: {
        id: eventId,
        reason: body.reason || 'No reason provided'
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('❌ Error rejecting event:', error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Failed to reject event: ' + (error.message || 'Unknown error')
    })
  }
})
