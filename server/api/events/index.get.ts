import { getPrismaClient } from '../../utils/prisma'

const prisma = getPrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // Возвращаем все события (и draft, и published)
    // Фронтенд может фильтровать по необходимости
    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Преобразуем данные для фронтенда
    const formattedEvents = events.map(e => {
      // Парсим JSON строки в массивы
      let activities: string[] = []
      let controlPlan: string[] = []
      
      try {
        activities = e.activities ? JSON.parse(e.activities) : []
      } catch {
        activities = []
      }
      
      try {
        controlPlan = e.controlPlan ? JSON.parse(e.controlPlan) : []
      } catch {
        controlPlan = []
      }
      
      return {
        id: e.id,
        title: e.title,
        author: e.author,
        location: e.location,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt?.toISOString(),
        seatLimit: e.seatLimit,
        priceTotal: e.priceTotal,
        pricePerSeat: e.pricePerSeat,
        image: e.image,
        controlPlan: controlPlan,
        category: e.category,
        description: e.description,
        activities: activities,
        startApplicationsAt: e.startApplicationsAt?.toISOString(),
        endApplicationsAt: e.endApplicationsAt?.toISOString(),
        startContractsAt: e.startContractsAt?.toISOString(),
        status: e.status,
        producerName: e.producerName,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString()
      }
    })

    return {
      success: true,
      data: formattedEvents
    }
  } catch (error: any) {
    console.error('Error fetching events:', error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Failed to fetch events' 
    })
  }
})

