import { createWhitelistedSite, isSiteNameUnique, isSiteAliasUnique } from '../../../utils/whitelist'

/**
 * POST /api/admin/whitelist
 * 
 * Добавление нового сайта в белый список.
 * Доступно только для модераторов.
 */
export default defineEventHandler(async (event) => {
  console.log('📥 POST /api/admin/whitelist - Add site request received')
  
  // TODO: Добавить проверку прав модератора
  // В реальном приложении здесь должна быть проверка JWT токена или сессии
  // и проверка роли пользователя (модератор)
  
  const body = await readBody<{
    siteName: string
    siteAlias?: string
    requiresModeration?: boolean
    isActive?: boolean
  }>(event)
  
  // Валидация входных данных
  const errors: Array<{ field: string; message: string }> = []
  
  if (!body.siteName || typeof body.siteName !== 'string' || !body.siteName.trim()) {
    errors.push({
      field: 'siteName',
      message: 'Поле "siteName" обязательно для заполнения'
    })
  }
  
  if (errors.length > 0) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Ошибка валидации данных',
      errors
    }
  }
  
  const siteName = body.siteName.trim()
  // Используем siteName как siteAlias, если siteAlias не указан
  const siteAlias = body.siteAlias?.trim() || siteName
  
  try {
    // Проверяем уникальность имени сайта
    const isNameUnique = await isSiteNameUnique(siteName)
    if (!isNameUnique) {
      setResponseStatus(event, 409)
      return {
        success: false,
        message: 'Сайт с таким именем уже существует',
        errors: [{
          field: 'siteName',
          message: 'Сайт с таким именем уже существует в белом списке'
        }]
      }
    }
    
    // Проверяем уникальность псевдонима (если он отличается от siteName)
    if (siteAlias !== siteName) {
      const isAliasUnique = await isSiteAliasUnique(siteAlias)
      if (!isAliasUnique) {
        setResponseStatus(event, 409)
        return {
          success: false,
          message: 'Сайт с таким псевдонимом уже существует',
          errors: [{
            field: 'siteAlias',
            message: 'Сайт с таким псевдонимом уже существует в белом списке'
          }]
        }
      }
    }
    
    // Создаем новый сайт
    const newSite = await createWhitelistedSite({
      siteName,
      siteAlias,
      requiresModeration: body.requiresModeration ?? false,
      isActive: body.isActive ?? true
    })
    
    console.log('✅ Site added to whitelist:', newSite.id, siteName)
    
    return {
      success: true,
      message: 'Сайт успешно добавлен в белый список',
      data: newSite
    }
  } catch (error: any) {
    console.error('❌ Error adding site to whitelist:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: 'Внутренняя ошибка сервера при добавлении сайта',
      errors: [{
        field: 'server',
        message: error.message || 'Неизвестная ошибка'
      }]
    }
  }
})
