import { deactivateWhitelistedSite } from '../../../utils/whitelist'
import { getPrismaClient } from '../../../utils/prisma'

const prisma = getPrismaClient()

/**
 * DELETE /api/admin/whitelist/[id]
 * 
 * Удаление (деактивация) сайта из белого списка.
 * Доступно только для модераторов.
 * 
 * Примечание: Мы не удаляем сайт физически из базы данных,
 * а только деактивируем его для сохранения истории.
 */
export default defineEventHandler(async (event) => {
  console.log('📥 DELETE /api/admin/whitelist/[id] - Delete site request received')
  
  // TODO: Добавить проверку прав модератора
  // В реальном приложении здесь должна быть проверка JWT токена или сессии
  // и проверка роли пользователя (модератор)
  
  const siteId = getRouterParam(event, 'id')
  
  if (!siteId) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'ID сайта не указан',
      errors: [{
        field: 'id',
        message: 'ID сайта обязателен для удаления'
      }]
    }
  }
  
  try {
    // Проверяем, существует ли сайт
    const existingSite = await prisma.whitelistedSite.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        siteName: true,
        siteAlias: true,
        isActive: true
      }
    })
    
    if (!existingSite) {
      setResponseStatus(event, 404)
      return {
        success: false,
        message: 'Сайт не найден',
        errors: [{
          field: 'id',
          message: 'Сайт с указанным ID не найден в белом списке'
        }]
      }
    }
    
    // Проверяем, не используется ли сайт в существующих событиях
    const eventsCount = await prisma.event.count({
      where: { siteAlias: existingSite.siteAlias }
    })
    
    if (eventsCount > 0) {
      console.warn(`⚠️ Attempt to delete site with existing events: ${existingSite.siteName} (${eventsCount} events)`)
      setResponseStatus(event, 409)
      return {
        success: false,
        message: 'Невозможно удалить сайт',
        errors: [{
          field: 'id',
          message: `Сайт используется в ${eventsCount} событии(ях). Сначала удалите или измените события.`
        }]
      }
    }
    
    // Деактивируем сайт (мягкое удаление)
    const success = await deactivateWhitelistedSite(siteId)
    
    if (!success) {
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Ошибка удаления сайта',
        errors: [{
          field: 'server',
          message: 'Не удалось деактивировать сайт в базе данных'
        }]
      }
    }
    
    console.log('✅ Site deactivated from whitelist:', existingSite.siteName)
    
    return {
      success: true,
      message: 'Сайт успешно удален из белого списка',
      data: {
        id: existingSite.id,
        siteName: existingSite.siteName,
        siteAlias: existingSite.siteAlias,
        isActive: false
      }
    }
  } catch (error: any) {
    console.error('❌ Error deleting site from whitelist:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: 'Внутренняя ошибка сервера при удалении сайта',
      errors: [{
        field: 'server',
        message: error.message || 'Неизвестная ошибка'
      }]
    }
  }
})
