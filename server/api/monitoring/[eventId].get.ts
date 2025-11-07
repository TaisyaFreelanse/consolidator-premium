import { getPrismaClient } from '../../utils/prisma'

const prisma = getPrismaClient()

interface Applicant {
  code: string
  seats: number
  paidAmount: number
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

    // Группируем платежи по пользователям (userId)
    const applicantsMap = new Map<string, Applicant>()

    eventData.payments.forEach(payment => {
      const userId = payment.userId || 'anonymous'
      const existing = applicantsMap.get(userId)

      if (existing) {
        existing.paidAmount += payment.amount
      } else {
        applicantsMap.set(userId, {
          code: userId,
          seats: 1, // Один участник = одно место
          paidAmount: payment.amount
        })
      }
    })

    const applicants = Array.from(applicantsMap.values())
    
    // Вычисляем общую собранную сумму
    const collected = applicants.reduce((sum, app) => sum + app.paidAmount, 0)
    
    // Вычисляем дефицит/профицит
    const deficit = Math.max(0, eventData.priceTotal - collected)
    const surplus = Math.max(0, collected - eventData.priceTotal)

    // Возвращаем данные в формате MonitoringSnapshot
    return {
      success: true,
      data: {
        eventId: eventData.id,
        nowPoint: eventData.currentControlPoint || 't0',
        collected: collected,
        deficit: deficit,
        surplus: surplus,
        isCancelled: eventData.isCancelled || false,
        applicants: applicants
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

