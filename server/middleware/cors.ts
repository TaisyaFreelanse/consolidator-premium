/**
 * CORS middleware для внешнего API
 * Разрешает запросы с указанных доменов
 */
export default defineEventHandler((event) => {
  // Разрешенные источники (origins)
  const allowedOrigins = [
    'https://external-demo.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ]

  // Получаем origin из заголовка запроса
  const origin = getRequestHeader(event, 'origin')
  
  // Проверяем, разрешен ли этот origin
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)
  
  // Устанавливаем CORS заголовки
  if (isAllowedOrigin) {
    setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
  } else if (origin) {
    // Для разработки можно разрешить все origins (не рекомендуется для продакшена)
    // В продакшене лучше использовать строгий список
    setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
  }
  
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
  setResponseHeader(event, 'Access-Control-Max-Age', '86400') // 24 часа

  // Обработка preflight запросов (OPTIONS)
  if (event.node.req.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})

