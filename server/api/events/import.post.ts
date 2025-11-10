import { getPrismaClient } from '../../utils/prisma'

const prisma = getPrismaClient()

interface ImportedEvent {
  id?: string
  title: string
  author: string
  location: string
  startAt: string
  endAt?: string | null
  seatLimit?: number | null
  priceTotal: number
  pricePerSeat?: number | null
  image?: string | null
  category?: string | null
  description?: string | null
  activities?: string[] | null
  controlPlan?: string[] | null
  startApplicationsAt?: string | null
  endApplicationsAt?: string | null
  startContractsAt?: string | null
  status?: string | null
  producerName?: string | null
  producerCode?: string | null
  currentControlPoint?: string | null
  isCancelled?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
}

const normalizeArray = (value?: string[] | null) => {
  if (!value) return []
  return Array.isArray(value) ? value : []
}

const toDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ events?: ImportedEvent[] }>(event)

    if (!body?.events || !Array.isArray(body.events)) {
      throw createError({ statusCode: 400, statusMessage: 'Payload must include events array' })
    }

    let imported = 0
    const ids: string[] = []

    for (const rawEvent of body.events) {
      if (!rawEvent.title || !rawEvent.author || !rawEvent.location || !rawEvent.startAt || !rawEvent.priceTotal) {
        console.warn('⚠️ Skipping event without required fields:', rawEvent)
        continue
      }

      const data = {
        title: rawEvent.title,
        author: rawEvent.author,
        location: rawEvent.location,
        startAt: new Date(rawEvent.startAt),
        endAt: toDate(rawEvent.endAt),
        seatLimit: rawEvent.seatLimit ?? null,
        priceTotal: BigInt(Math.round(rawEvent.priceTotal)),
        pricePerSeat: rawEvent.pricePerSeat != null ? BigInt(Math.round(rawEvent.pricePerSeat)) : null,
        image: rawEvent.image || null,
        category: rawEvent.category || null,
        description: rawEvent.description || null,
        activities: JSON.stringify(normalizeArray(rawEvent.activities)),
        controlPlan: JSON.stringify(normalizeArray(rawEvent.controlPlan)),
        startApplicationsAt: toDate(rawEvent.startApplicationsAt),
        endApplicationsAt: toDate(rawEvent.endApplicationsAt),
        startContractsAt: toDate(rawEvent.startContractsAt),
        status: rawEvent.status || 'draft',
        producerName: rawEvent.producerName || null,
        producerCode: rawEvent.producerCode || null,
        currentControlPoint: rawEvent.currentControlPoint || 't0',
        isCancelled: rawEvent.isCancelled ?? false
      }

      const createdAt = toDate(rawEvent.createdAt)
      const updatedAt = toDate(rawEvent.updatedAt)

      const result = rawEvent.id
        ? await prisma.event.upsert({
            where: { id: rawEvent.id },
            update: {
              ...data,
              updatedAt: updatedAt ?? undefined
            },
            create: {
              id: rawEvent.id,
              ...data,
              createdAt: createdAt ?? undefined,
              updatedAt: updatedAt ?? undefined
            }
          })
        : await prisma.event.create({
            data: {
              ...data,
              createdAt: createdAt ?? undefined,
              updatedAt: updatedAt ?? undefined
            }
          })

      imported += 1
      ids.push(result.id)
    }

    return {
      success: true,
      message: `Imported ${imported} events`,
      data: { imported, ids }
    }
  } catch (error: any) {
    console.error('❌ Failed to import events:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to import events: ' + (error.message || 'Unknown error')
    })
  }
})

