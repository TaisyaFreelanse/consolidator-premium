import type { ControlPointCode } from '~/types'
import { getPrismaClient } from '../../utils/prisma'

const prisma = getPrismaClient()

interface Applicant {
  code: string
  seats: number
  paidAmount: number
  payments: { amount: number; createdAt: string }[]
}

function resolveControlPoint(eventData: any): { current: ControlPointCode; nextDeadline: string | null } {
  const now = Date.now()

  const timeline: Array<{ code: ControlPointCode; at?: Date | null }> = [
    { code: 't0', at: eventData.createdAt ?? null },
    { code: 'ti10', at: eventData.startApplicationsAt ?? null },
    { code: 'ti20', at: eventData.endApplicationsAt ?? null },
    { code: 'ti30', at: eventData.startContractsAt ?? null },
    { code: 'ti40', at: eventData.startAt ?? null },
    { code: 'ti50', at: eventData.endAt ?? null }
  ]

  let current: ControlPointCode = 't0'
  let nextDeadline: string | null = null

  for (const point of timeline) {
    if (!point.at) {
      continue
    }

    const time = point.at.getTime()
    if (time <= now) {
      current = point.code
      continue
    }

    if (!nextDeadline) {
      nextDeadline = point.at.toISOString()
    }
    break
  }

  return { current, nextDeadline }
}

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')

  if (!eventId) {
    throw createError({ statusCode: 400, statusMessage: 'Event ID is required' })
  }

  try {
    // Получаем событие
    const eventData = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        payments: {
          where: {
            status: 'SUCCESS'
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!eventData) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    const { current, nextDeadline } = resolveControlPoint(eventData)

    if (eventData.currentControlPoint !== current) {
      try {
        await prisma.event.update({
          where: { id: eventId },
          data: { currentControlPoint: current }
        })
      } catch (updateError) {
        console.warn('⚠️ Failed to update currentControlPoint:', updateError)
      }
    }

    // Группируем платежи по пользователям (userId)
    const applicantsMap = new Map<string, Applicant>()

    eventData.payments.forEach(payment => {
      const userId = payment.userId || 'anonymous'
      const existing = applicantsMap.get(userId)
      const amount = Number(payment.amount) // BigInt -> Number
      const paymentRecord = {
        amount,
        createdAt: payment.createdAt ? payment.createdAt.toISOString() : new Date().toISOString()
      }

      if (existing) {
        existing.paidAmount += amount
        existing.payments.push(paymentRecord)
      } else {
        applicantsMap.set(userId, {
          code: userId,
          seats: 1, // Один участник = одно место
          paidAmount: amount,
          payments: [paymentRecord]
        })
      }
    })

    const applicants = Array.from(applicantsMap.values()).sort((a, b) => b.paidAmount - a.paidAmount)
    
    // Вычисляем общую собранную сумму
    const collected = applicants.reduce((sum, app) => sum + app.paidAmount, 0)
    
    // Вычисляем дефицит/профицит (конвертируем BigInt в Number)
    const priceTotal = Number(eventData.priceTotal)
    const deficit = Math.max(0, priceTotal - collected)
    const surplus = Math.max(0, collected - priceTotal)

    // Возвращаем данные в формате MonitoringSnapshot
    return {
      success: true,
      data: {
        eventId: eventData.id,
        nowPoint: current,
        deadlineNext: nextDeadline || undefined,
        collected,
        deficit,
        surplus,
        isCancelled: eventData.isCancelled || false,
        applicants
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('Error fetching monitoring data:', error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Failed to fetch monitoring data' 
    })
  }
})

