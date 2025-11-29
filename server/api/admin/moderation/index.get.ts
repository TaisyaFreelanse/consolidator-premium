import { getPrismaClient } from '../../../utils/prisma'
import { 
  getTimeUntilTi20, 
  getModerationUrgencyStatus,
  canModerateEvent 
} from '../../../utils/moderationTimeRestrictions'

const prisma = getPrismaClient()

export default defineEventHandler(async (event) => {
  console.log('📥 GET /api/admin/moderation - Request received')

  try {
    // Получаем все события, ожидающие модерации
    const events = await prisma.event.findMany({
      where: {
        status: 'draft',
        requiresModeration: true,
        // Исключаем события, у которых прошло время модерации (ti20)
        endApplicationsAt: {
          gte: new Date() // Только события, где ti20 еще не наступило
        }
      },
      select: {
        id: true,
        title: true,
        author: true,
        location: true,
        startAt: true,
        endAt: true,
        seatLimit: true,
        priceTotal: true,
        pricePerSeat: true,
        description: true,
        startApplicationsAt: true,
        endApplicationsAt: true,
        startContractsAt: true,
        status: true,
        requiresModeration: true,
        siteAlias: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        createdAtClient: true
      },
      orderBy: [
        { endApplicationsAt: 'asc' }, // Сначала те, у которых скоро истекает время модерации
        { createdAt: 'asc' } // Затем по времени создания
      ]
    })

    console.log(`✅ Found ${events.length} events awaiting moderation`)

    // Преобразуем данные для фронтенда
    const eventsForModeration = events
      .filter(event => canModerateEvent(event)) // Дополнительная фильтрация на уровне утилит
      .map(event => {
        const timeUntilTi20 = getTimeUntilTi20(event)
        const urgencyStatus = getModerationUrgencyStatus(event)
        
        return {
          id: event.id,
          title: event.title,
          author: event.author,
          location: event.location,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt?.toISOString(),
          seatLimit: event.seatLimit,
          priceTotal: Number(event.priceTotal), // BigInt -> Number
          pricePerSeat: event.pricePerSeat ? Number(event.pricePerSeat) : null,
          description: event.description,
          startApplicationsAt: event.startApplicationsAt?.toISOString(),
          endApplicationsAt: event.endApplicationsAt?.toISOString(),
          startContractsAt: event.startContractsAt?.toISOString(),
          status: event.status,
          requiresModeration: event.requiresModeration,
          siteAlias: event.siteAlias,
          timezone: event.timezone,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString(),
          createdAtClient: event.createdAtClient?.toISOString(),
          // Используем утилиты для вычисления времени и статуса
          timeUntilTi20: timeUntilTi20,
          urgencyStatus: urgencyStatus,
          canModerate: canModerateEvent(event)
        }
      })

    return {
      success: true,
      data: eventsForModeration,
      meta: {
        total: eventsForModeration.length,
        urgent: eventsForModeration.filter(e => 
          e.timeUntilTi20 && e.timeUntilTi20 < 24 * 60 * 60 * 1000 // Менее 24 часов
        ).length
      }
    }
  } catch (error: any) {
    console.error('❌ Error fetching events for moderation:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch events for moderation: ' + (error.message || 'Unknown error')
    })
  }
})
