import { getPrismaClient } from '../../utils/prisma'

const prisma = getPrismaClient()

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'id')

  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'Event ID is required' })
  }

  try {
    const eventData = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!eventData) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    // Парсим JSON строки в массивы
    let activities: string[] = []
    let controlPlan: string[] = []
    
    try {
      activities = eventData.activities ? JSON.parse(eventData.activities) : []
    } catch {
      activities = []
    }
    
    try {
      controlPlan = eventData.controlPlan ? JSON.parse(eventData.controlPlan) : []
    } catch {
      controlPlan = []
    }
    
    // Форматируем данные для фронтенда
    return {
      success: true,
      data: {
        id: eventData.id,
        title: eventData.title,
        author: eventData.author,
        authorName: eventData.author, // Для внешнего API authorName = author (свободный текст)
        location: eventData.location,
        startAt: eventData.startAt.toISOString(),
        endAt: eventData.endAt?.toISOString(),
        seatLimit: eventData.seatLimit,
        priceTotal: Number(eventData.priceTotal), // BigInt -> Number для API
        pricePerSeat: eventData.pricePerSeat ? Number(eventData.pricePerSeat) : null,
        image: eventData.image,
        controlPlan: controlPlan,
        category: eventData.category,
        description: eventData.description,
        activities: activities,
        startApplicationsAt: eventData.startApplicationsAt?.toISOString(),
        endApplicationsAt: eventData.endApplicationsAt?.toISOString(),
        startContractsAt: eventData.startContractsAt?.toISOString(),
        status: eventData.status,
        siteAlias: eventData.siteAlias,
        timezone: eventData.timezone,
        createdAt: eventData.createdAt.toISOString(),
        updatedAt: eventData.updatedAt.toISOString()
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('Error fetching event:', error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Failed to fetch event' 
    })
  }
})

