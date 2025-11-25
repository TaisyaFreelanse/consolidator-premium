import { getAllWhitelistedSites } from '../../../utils/whitelist'

/**
 * GET /api/admin/whitelist
 * 
 * Получение списка всех сайтов в белом списке.
 * Доступно только для модераторов.
 */
export default defineEventHandler(async (event) => {
  console.log('📥 GET /api/admin/whitelist - Admin request received')
  
  // TODO: Добавить проверку прав модератора
  // В реальном приложении здесь должна быть проверка JWT токена или сессии
  // и проверка роли пользователя (модератор)
  
  try {
    // Получаем все сайты (включая неактивные для администрирования)
    const sites = await getAllWhitelistedSites()
    
    console.log(`✅ Found ${sites.length} sites in whitelist`)
    
    return {
      success: true,
      data: sites
    }
  } catch (error: any) {
    console.error('❌ Error fetching whitelisted sites:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: 'Внутренняя ошибка сервера при получении списка сайтов',
      errors: [{
        field: 'server',
        message: error.message || 'Неизвестная ошибка'
      }]
    }
  }
})
