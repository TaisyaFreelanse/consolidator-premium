import { getPrismaClient } from '../../utils/prisma'

const prisma = getPrismaClient()

const toPlainEvent = (event: any) => {
  const safeParse = (value: any) => {
    if (!value) return []
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  return {
    id: event.id,
    title: event.title,
    author: event.author,
    location: event.location,
    startAt: event.startAt?.toISOString() || null,
    endAt: event.endAt?.toISOString() || null,
    seatLimit: event.seatLimit ?? null,
    priceTotal: event.priceTotal ? Number(event.priceTotal) : 0,
    pricePerSeat: event.pricePerSeat ? Number(event.pricePerSeat) : null,
    image: event.image,
    category: event.category,
    description: event.description,
    activities: safeParse(event.activities),
    controlPlan: safeParse(event.controlPlan),
    startApplicationsAt: event.startApplicationsAt?.toISOString() || null,
    endApplicationsAt: event.endApplicationsAt?.toISOString() || null,
    startContractsAt: event.startContractsAt?.toISOString() || null,
    status: event.status,
    producerName: event.producerName,
    currentControlPoint: event.currentControlPoint,
    isCancelled: event.isCancelled,
    createdAt: event.createdAt?.toISOString() || null,
    updatedAt: event.updatedAt?.toISOString() || null
  }
}

export default defineEventHandler(async () => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'asc' }
    })

    return {
      success: true,
      data: events.map(toPlainEvent)
    }
  } catch (error: any) {
    console.error('❌ Failed to export events:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to export events: ' + (error.message || 'Unknown error')
    })
  }
})

