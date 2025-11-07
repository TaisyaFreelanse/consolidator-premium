import { getPrismaClient } from '../../utils/prisma'
import { validateCard } from '../../utils/cardValidator'

const prisma = getPrismaClient()

interface CreateApplicationBody {
  eventId: string
  userId: string // Код пользователя
  cardNumber: string
  expiry: string // MM/YY
  cvc: string
  amount: number // в рублях
}

export default defineEventHandler(async (event) => {
  console.log('📥 POST /api/applications/create - Request received')
  
  const body = await readBody<CreateApplicationBody>(event)
  console.log('📦 Request body:', { 
    eventId: body.eventId, 
    userId: body.userId, 
    hasCardNumber: !!body.cardNumber,
    hasExpiry: !!body.expiry,
    hasCvc: !!body.cvc,
    amount: body.amount 
  })

  // Валидация обязательных полей
  if (!body.eventId || !body.userId || !body.cardNumber || !body.expiry || !body.cvc || !body.amount) {
    console.error('❌ Missing required fields')
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const { eventId, userId, cardNumber, expiry, cvc, amount } = body

  try {
    console.log(`🔍 Looking for event: ${eventId}`)
    // 1. Проверяем, существует ли событие
    const eventData = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!eventData) {
      throw createError({ statusCode: 404, statusMessage: 'Event not found' })
    }

    // 2. Валидация карты (в тестовом режиме всегда успешна)
    const validationResult = validateCard(cardNumber, expiry, cvc)
    console.log('💳 Card validation result:', validationResult.valid ? '✅ Valid' : '❌ Invalid')

    if (!validationResult.valid) {
      console.error('❌ Card validation failed:', validationResult.errors)
      throw createError({ 
        statusCode: 400, 
        statusMessage: validationResult.errors.join(', ') || 'Invalid card details' 
      })
    }

    // 3. Создаем платеж (имитация - все карты проходят)
    const providerTxnId = `TEST-${crypto.randomUUID()}`
    console.log(`💰 Creating payment: ${providerTxnId} for event ${eventId}, user ${userId}, amount ${amount} RUB`)

    const payment = await prisma.payment.create({
      data: {
        eventId: eventId,
        userId: userId,
        amount: amount * 100, // Сохраняем в копейках
        currency: 'RUB',
        status: 'SUCCESS', // Для имитации всегда SUCCESS
        providerTxnId: providerTxnId,
        isTest: true
      }
    })

    console.log('✅ Payment created successfully:', payment.id)

    return {
      success: true,
      message: 'Application submitted successfully',
      data: {
        paymentId: payment.id,
        status: payment.status,
        providerTxnId: payment.providerTxnId,
        amount: payment.amount / 100,
        currency: payment.currency
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('Error creating application:', error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Failed to create application' 
    })
  }
})

