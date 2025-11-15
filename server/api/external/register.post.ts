import { createApiKey } from '../../utils/apiKey'

/**
 * POST /api/external/register
 * 
 * Регистрация нового клиентского сайта и получение API ключа.
 * 
 * Тело запроса:
 * {
 *   producerCode: string (обязательно) - внутренний код продюсера
 *   clientName?: string (опционально) - название клиентского сайта
 *   clientUrl?: string (опционально) - URL клиентского сайта
 * }
 * 
 * Ответ:
 * {
 *   success: true,
 *   data: {
 *     apiKey: string - API ключ для использования в запросах
 *     producerCode: string - код продюсера (для подтверждения)
 *   }
 * }
 */
export default defineEventHandler(async (event) => {
  // CORS заголовки - устанавливаем ДО проверки метода для preflight запросов
  const origin = getRequestHeader(event, 'origin')
  const method = event.node.req.method
  const allowedOrigins = [
    'https://external-demo.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ]
  
  // Логирование для отладки CORS
  if (method === 'OPTIONS') {
    console.log('🔍 OPTIONS preflight request:', { origin, method })
  }
  
  // Для preflight запросов (OPTIONS) всегда устанавливаем заголовки, если origin разрешен
  if (origin && allowedOrigins.includes(origin)) {
    setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
    setResponseHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
    setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
    setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
    setResponseHeader(event, 'Access-Control-Max-Age', '86400') // 24 часа
  } else if (origin) {
    console.warn('⚠️ CORS: Origin not allowed:', origin, 'Allowed:', allowedOrigins)
  }
  
  // Обработка preflight запроса (OPTIONS)
  if (method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }

  console.log('📥 POST /api/external/register - Registration request received')
  
  const body = await readBody<{
    producerCode: string
    clientName?: string
    clientUrl?: string
  }>(event)

  // Валидация
  if (!body.producerCode || typeof body.producerCode !== 'string' || !body.producerCode.trim()) {
    // Убеждаемся, что CORS заголовки установлены даже при ошибке
    if (origin && allowedOrigins.includes(origin)) {
      setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
      setResponseHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
      setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
      setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
    }
    setResponseStatus(event, 400)
    return {
      success: false,
      errors: [{
        field: 'producerCode',
        message: 'Поле "producerCode" обязательно для регистрации'
      }]
    }
  }

  try {
    // Создаем API ключ
    const { key, id } = await createApiKey(
      body.producerCode.trim(),
      body.clientName,
      body.clientUrl
    )

    console.log('✅ API key created:', id, 'for producer:', body.producerCode)

    return {
      success: true,
      data: {
        apiKey: key,
        producerCode: body.producerCode.trim(),
        clientName: body.clientName || null,
        clientUrl: body.clientUrl || null
      }
    }
  } catch (error: any) {
    console.error('❌ Error creating API key:', error)
    // Убеждаемся, что CORS заголовки установлены даже при ошибке
    if (origin && allowedOrigins.includes(origin)) {
      setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
      setResponseHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
      setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
      setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
    }
    setResponseStatus(event, 500)
    return {
      success: false,
      errors: [{
        field: 'server',
        message: 'Внутренняя ошибка сервера при создании API ключа'
      }]
    }
  }
})

