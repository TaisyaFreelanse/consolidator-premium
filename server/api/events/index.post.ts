import { getPrismaClient } from '../../utils/prisma'

const prisma = getPrismaClient()

interface CreateEventBody {
  id?: string // Если есть - обновление, если нет - создание
  title: string
  author: string
  location: string
  startAt: string // ISO string
  endAt?: string
  seatLimit: number
  priceTotal: number // в копейках
  pricePerSeat?: number // в копейках
  image?: string
  category?: string
  description?: string
  activities: string[] // массив строк
  controlPlan: string[] // массив контрольных точек
  startApplicationsAt?: string // ISO string
  endApplicationsAt?: string // ISO string
  startContractsAt?: string // ISO string
  status: 'draft' | 'published'
  producerName?: string
}

export default defineEventHandler(async (event) => {
  console.log('📥 POST /api/events - Request received')
  
  const body = await readBody<CreateEventBody>(event)
  console.log('📦 Request body:', { 
    id: body.id,
    title: body.title, 
    status: body.status,
    producerName: body.producerName
  })

  // Валидация обязательных полей
  if (!body.title || !body.author || !body.location || !body.startAt || !body.seatLimit || !body.priceTotal) {
    console.error('❌ Missing required fields')
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields: title, author, location, startAt, seatLimit, priceTotal' })
  }

  try {
    // Преобразуем данные для БД
    const eventData = {
      title: body.title,
      author: body.author,
      location: body.location,
      startAt: new Date(body.startAt),
      endAt: body.endAt ? new Date(body.endAt) : null,
      seatLimit: body.seatLimit,
      priceTotal: BigInt(body.priceTotal), // Number -> BigInt для БД
      pricePerSeat: body.pricePerSeat ? BigInt(body.pricePerSeat) : BigInt(Math.round(body.priceTotal / body.seatLimit)),
      image: body.image || '/mock/placeholder.jpg',
      category: body.category || null,
      description: body.description || null,
      activities: JSON.stringify(body.activities || []),
      controlPlan: JSON.stringify(body.controlPlan || []),
      startApplicationsAt: body.startApplicationsAt ? new Date(body.startApplicationsAt) : null,
      endApplicationsAt: body.endApplicationsAt ? new Date(body.endApplicationsAt) : null,
      startContractsAt: body.startContractsAt ? new Date(body.startContractsAt) : null,
      status: body.status,
      producerName: body.producerName || null,
      currentControlPoint: 't0', // По умолчанию начальная точка
      isCancelled: false
    }

    let savedEvent

    if (body.id) {
      // Обновление существующего события
      console.log(`✏️ Updating event: ${body.id}`)
      
      // Проверяем, что событие существует
      const existing = await prisma.event.findUnique({ where: { id: body.id } })
      if (!existing) {
        throw createError({ statusCode: 404, statusMessage: 'Event not found' })
      }
      
      // Проверяем права доступа:
      // - Опубликованные события нельзя редактировать (защита от манипуляций)
      // - Черновики может редактировать только создавший их продюсер
      if (existing.status === 'published') {
        throw createError({ statusCode: 403, statusMessage: 'Cannot edit published events' })
      }
      
      // Проверка: продюсер может редактировать только свои черновики
      if (existing.producerName && body.producerName && existing.producerName !== body.producerName) {
        throw createError({ statusCode: 403, statusMessage: 'You can only edit your own draft events' })
      }

      savedEvent = await prisma.event.update({
        where: { id: body.id },
        data: eventData
      })
      console.log('✅ Event updated:', savedEvent.id)
    } else {
      // Создание нового события
      console.log('➕ Creating new event')
      savedEvent = await prisma.event.create({
        data: eventData
      })
      console.log('✅ Event created:', savedEvent.id)
    }

    // Парсим JSON строки обратно для ответа
    let activities: string[] = []
    let controlPlan: string[] = []
    
    try {
      activities = savedEvent.activities ? JSON.parse(savedEvent.activities) : []
    } catch {
      activities = []
    }
    
    try {
      controlPlan = savedEvent.controlPlan ? JSON.parse(savedEvent.controlPlan) : []
    } catch {
      controlPlan = []
    }

    return {
      success: true,
      message: body.id ? 'Event updated successfully' : 'Event created successfully',
      data: {
        id: savedEvent.id,
        title: savedEvent.title,
        author: savedEvent.author,
        location: savedEvent.location,
        startAt: savedEvent.startAt.toISOString(),
        endAt: savedEvent.endAt?.toISOString(),
        seatLimit: savedEvent.seatLimit,
        priceTotal: Number(savedEvent.priceTotal), // BigInt -> Number для API
        pricePerSeat: savedEvent.pricePerSeat ? Number(savedEvent.pricePerSeat) : null,
        image: savedEvent.image,
        controlPlan: controlPlan,
        category: savedEvent.category,
        description: savedEvent.description,
        activities: activities,
        startApplicationsAt: savedEvent.startApplicationsAt?.toISOString(),
        endApplicationsAt: savedEvent.endApplicationsAt?.toISOString(),
        startContractsAt: savedEvent.startContractsAt?.toISOString(),
        status: savedEvent.status,
        producerName: savedEvent.producerName,
        createdAt: savedEvent.createdAt.toISOString(),
        updatedAt: savedEvent.updatedAt.toISOString()
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('❌ Error creating/updating event:', error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Failed to create/update event: ' + (error.message || 'Unknown error')
    })
  }
})

