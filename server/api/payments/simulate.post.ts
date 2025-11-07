/**
 * POST /api/payments/simulate
 * Имитация платежа (виртуальная интеграция с ЮKassa)
 * 
 * Проверяет:
 * - Алгоритм Luhn для номера карты
 * - Срок действия карты
 * - CVV/CVC код
 * 
 * НЕ сохраняет номер карты!
 * Все платежи помечаются как тестовые (isTest = true)
 */

import { validateCard, maskCardNumber, getCardType } from '../../utils/cardValidator'
import { getPrismaClient } from '../../utils/prisma'

const prisma = getPrismaClient()

interface SimulatePaymentBody {
  eventId: string
  userId?: string
  cardNumber: string
  expiry: string // MM/YY
  cvc: string
  amount: number // в рублях
  currency?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SimulatePaymentBody>(event)
  
  // Валидация обязательных полей
  if (!body.eventId || !body.cardNumber || !body.expiry || !body.cvc || !body.amount) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: eventId, cardNumber, expiry, cvc, amount'
    })
  }
  
  // Валидация суммы
  if (body.amount <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Amount must be greater than 0'
    })
  }
  
  try {
    // Проверяем существование мероприятия
    const eventData = await prisma.event.findUnique({
      where: { id: body.eventId },
      select: {
        id: true,
        title: true,
        status: true,
        isCancelled: true
      }
    })
    
    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }
    
    // Проверяем, что мероприятие не отменено
    if (eventData.isCancelled) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot make payment for cancelled event'
      })
    }
    
    // Валидация карты
    const validation = validateCard(body.cardNumber, body.expiry, body.cvc)
    
    if (!validation.valid) {
      return {
        success: false,
        status: 'FAILED',
        errors: validation.errors,
        message: 'Card validation failed'
      }
    }
    
    // Генерируем тестовый ID транзакции
    const providerTxnId = `TEST-${crypto.randomUUID()}`
    
    // Определяем тип карты
    const cardType = getCardType(body.cardNumber)
    
    // Маскируем номер карты для логирования (НЕ сохраняем реальный номер!)
    const maskedCard = maskCardNumber(body.cardNumber)
    
    // Имитация обработки платежа (99% успешных, 1% неудачных)
    const isSuccess = Math.random() > 0.01
    
    // Создаем запись о платеже в БД
    const payment = await prisma.payment.create({
      data: {
        eventId: body.eventId,
        userId: body.userId || null,
        amount: Math.round(body.amount * 100), // конвертируем в копейки
        currency: body.currency || 'RUB',
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        providerTxnId,
        isTest: true
      }
    })
    
    // Создаем запись в истории статусов мероприятия
    await prisma.eventStatusHistory.create({
      data: {
        eventId: body.eventId,
        statusCode: eventData.isCancelled ? 'payment_failed' : 'payment_received',
        note: `Платеж ${isSuccess ? 'успешный' : 'отклонен'}: ${body.amount} ${body.currency || 'RUB'} (${maskedCard}, ${cardType})`
      }
    })
    
    console.log(`💳 Payment simulation:`, {
      id: payment.id,
      eventId: body.eventId,
      amount: body.amount,
      card: maskedCard,
      cardType,
      status: payment.status,
      txnId: providerTxnId
    })
    
    return {
      success: isSuccess,
      status: payment.status,
      message: isSuccess 
        ? 'Payment processed successfully' 
        : 'Payment declined by issuing bank',
      data: {
        paymentId: payment.id,
        transactionId: providerTxnId,
        amount: body.amount,
        currency: payment.currency,
        cardType,
        cardMask: maskedCard,
        isTest: true,
        createdAt: payment.createdAt
      }
    }
  } catch (error: any) {
    // Если это уже наша ошибка, пробрасываем дальше
    if (error.statusCode) {
      throw error
    }
    
    // Иначе логируем и возвращаем 500
    console.error('Error simulating payment:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process payment'
    })
  }
})

