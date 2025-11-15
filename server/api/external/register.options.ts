/**
 * OPTIONS /api/external/register
 * 
 * Обработка preflight CORS запросов для регистрации API ключа.
 */
export default defineEventHandler((event) => {
  // CORS заголовки для preflight запросов
  const origin = getRequestHeader(event, 'origin')
  const allowedOrigins = [
    'https://external-demo.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ]
  
  console.log('🔍 OPTIONS handler called:', { origin, allowedOrigins })
  
  // Для preflight запросов всегда устанавливаем заголовки, если origin разрешен
  if (origin && allowedOrigins.includes(origin)) {
    setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
    setResponseHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
    setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
    setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
    setResponseHeader(event, 'Access-Control-Max-Age', '86400') // 24 часа
    console.log('✅ CORS headers set for origin:', origin)
  } else {
    console.warn('⚠️ CORS: Origin not allowed:', origin, 'Allowed:', allowedOrigins)
    // Все равно устанавливаем заголовки для отладки (в продакшене убрать)
    if (origin) {
      setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
      setResponseHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
      setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
      setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
    }
  }
  
  setResponseStatus(event, 204)
  return ''
})

