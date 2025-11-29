import { getPrismaClient } from '../../utils/prisma'

const prisma = getPrismaClient()

export default defineEventHandler(async (event) => {
  try {
    console.log('📥 GET /api/events - Request received')
    
    // Получаем параметры из query
    const query = getQuery(event)
    const allDrafts = query.allDrafts === 'true' || query.allDrafts === true // Для модератора
    
    // Фильтрация событий:
    // - Если передан allDrafts=true (модератор): показываем все события (опубликованные + все черновики)
    // - Если не передан: показываем только опубликованные (публичный доступ)
    const whereClause: any = {}
    
    if (allDrafts) {
      // Модератор: показываем все события (опубликованные + все черновики)
      // Не применяем фильтр по status - показываем все
      console.log('👮 Moderator access: showing all events (published + all drafts)')
    } else {
      // Публичный доступ: только опубликованные
      whereClause.status = 'published'
      console.log('🌐 Public access: showing only published events')
    }
    
    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📦 Found ${events.length} events in database`)

    // Преобразуем данные для фронтенда
    const formattedEvents = events.map((e, index) => {
      try {
        // Парсим JSON строки в массивы
        let activities: string[] = []
        let controlPlan: string[] = []
        
        try {
          if (e.activities) {
            if (typeof e.activities === 'string') {
              activities = JSON.parse(e.activities)
            } else if (Array.isArray(e.activities)) {
              activities = e.activities
            } else {
              activities = []
            }
          }
        } catch (parseError: any) {
          console.warn(`⚠️ Failed to parse activities for event ${e.id}:`, parseError.message)
          activities = []
        }
        
        try {
          if (e.controlPlan) {
            if (typeof e.controlPlan === 'string') {
              controlPlan = JSON.parse(e.controlPlan)
            } else if (Array.isArray(e.controlPlan)) {
              controlPlan = e.controlPlan
            } else {
              controlPlan = []
            }
          }
        } catch (parseError: any) {
          console.warn(`⚠️ Failed to parse controlPlan for event ${e.id}:`, parseError.message)
          controlPlan = []
        }
        
        return {
          id: e.id,
          title: e.title,
          author: e.author,
          location: e.location,
          startAt: e.startAt?.toISOString() || new Date().toISOString(),
          endAt: e.endAt?.toISOString(),
          seatLimit: e.seatLimit,
          priceTotal: Number(e.priceTotal), // BigInt -> Number для API
          pricePerSeat: e.pricePerSeat ? Number(e.pricePerSeat) : null,
          image: e.image,
          controlPlan: controlPlan,
          category: e.category,
          description: e.description,
          activities: activities,
          startApplicationsAt: e.startApplicationsAt?.toISOString(),
          endApplicationsAt: e.endApplicationsAt?.toISOString(),
          startContractsAt: e.startContractsAt?.toISOString(),
          status: e.status || 'draft',
          siteAlias: e.siteAlias,
          timezone: e.timezone,
          createdAt: e.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: e.updatedAt?.toISOString() || new Date().toISOString()
        }
      } catch (itemError: any) {
        console.error(`❌ Error formatting event ${e.id} (index ${index}):`, itemError)
        // Возвращаем минимальный объект для этого события
        return {
          id: e.id,
          title: e.title || 'Untitled Event',
          author: e.author || '',
          location: e.location || '',
          startAt: e.startAt?.toISOString() || new Date().toISOString(),
          endAt: e.endAt?.toISOString(),
          seatLimit: e.seatLimit || 0,
          priceTotal: e.priceTotal ? Number(e.priceTotal) : 0, // BigInt -> Number
          pricePerSeat: e.pricePerSeat ? Number(e.pricePerSeat) : 0, // BigInt -> Number
          image: e.image,
          controlPlan: [],
          category: e.category,
          description: e.description,
          activities: [],
          startApplicationsAt: e.startApplicationsAt?.toISOString(),
          endApplicationsAt: e.endApplicationsAt?.toISOString(),
          startContractsAt: e.startContractsAt?.toISOString(),
          status: e.status || 'draft',
          siteAlias: e.siteAlias,
          timezone: e.timezone,
          createdAt: e.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: e.updatedAt?.toISOString() || new Date().toISOString()
        }
      }
    })

    console.log(`✅ Successfully formatted ${formattedEvents.length} events`)

    return {
      success: true,
      data: formattedEvents
    }
  } catch (error: any) {
    console.error('❌ Error fetching events:', error)
    console.error('Error stack:', error.stack)
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Failed to fetch events: ' + (error.message || 'Unknown error')
    })
  }
})

