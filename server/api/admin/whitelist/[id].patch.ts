import { updateWhitelistedSite, getSiteByName, isSiteNameUnique, isSiteAliasUnique } from '../../../utils/whitelist'
import { getPrismaClient } from '../../../utils/prisma'

const prisma = getPrismaClient()

/**
 * PATCH /api/admin/whitelist/[id]
 * 
 * Обновление сайта в белом списке.
 * Доступно только для модераторов.
 */
export default defineEventHandler(async (event) => {
  console.log('📥 PATCH /api/admin/whitelist/[id] - Update site request received')
  
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
        message: 'ID сайта обязателен для обновления'
      }]
    }
  }
  
  const body = await readBody<{
    siteName?: string
    siteAlias?: string
    requiresModeration?: boolean
    isActive?: boolean
  }>(event)
  
  // Если siteName указан, но siteAlias нет, используем siteName как siteAlias
  if (body.siteName !== undefined && body.siteAlias === undefined) {
    body.siteAlias = body.siteName.trim()
  }
  
  try {
    // Проверяем, существует ли сайт
    const existingSite = await prisma.whitelistedSite.findUnique({
      where: { id: siteId }
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
    
    // Валидация и проверка уникальности, если поля изменяются
    const errors: Array<{ field: string; message: string }> = []
    
    if (body.siteName !== undefined) {
      if (!body.siteName || typeof body.siteName !== 'string' || !body.siteName.trim()) {
        errors.push({
          field: 'siteName',
          message: 'Поле "siteName" не может быть пустым'
        })
      } else if (body.siteName.trim() !== existingSite.siteName) {
        // Проверяем уникальность только если имя изменилось
        const isNameUnique = await isSiteNameUnique(body.siteName.trim(), siteId)
        if (!isNameUnique) {
          errors.push({
            field: 'siteName',
            message: 'Сайт с таким именем уже существует в белом списке'
          })
        }
      }
    }
    
    if (body.siteAlias !== undefined) {
      const trimmedAlias = body.siteAlias.trim()
      if (!trimmedAlias) {
        errors.push({
          field: 'siteAlias',
          message: 'Поле "siteAlias" не может быть пустым'
        })
      } else if (trimmedAlias !== existingSite.siteAlias) {
        // Проверяем уникальность только если псевдоним изменился и отличается от siteName
        if (body.siteName && trimmedAlias !== body.siteName.trim()) {
          const isAliasUnique = await isSiteAliasUnique(trimmedAlias, siteId)
          if (!isAliasUnique) {
            errors.push({
              field: 'siteAlias',
              message: 'Сайт с таким псевдонимом уже существует в белом списке'
            })
          }
        }
      }
    }
    
    if (errors.length > 0) {
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Ошибка валидации данных',
        errors
      }
    }
    
    // Подготавливаем данные для обновления
    const updateData: any = {}
    
    if (body.siteName !== undefined) {
      updateData.siteName = body.siteName.trim()
    }
    
    if (body.siteAlias !== undefined) {
      updateData.siteAlias = body.siteAlias.trim()
    }
    
    if (body.requiresModeration !== undefined) {
      updateData.requiresModeration = body.requiresModeration
    }
    
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive
    }
    
    // Обновляем сайт
    const updatedSite = await updateWhitelistedSite(siteId, updateData)
    
    if (!updatedSite) {
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Ошибка обновления сайта',
        errors: [{
          field: 'server',
          message: 'Не удалось обновить сайт в базе данных'
        }]
      }
    }
    
    console.log('✅ Site updated in whitelist:', updatedSite.id, updatedSite.siteName)
    
    return {
      success: true,
      message: 'Сайт успешно обновлен',
      data: updatedSite
    }
  } catch (error: any) {
    console.error('❌ Error updating site in whitelist:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: 'Внутренняя ошибка сервера при обновлении сайта',
      errors: [{
        field: 'server',
        message: error.message || 'Неизвестная ошибка'
      }]
    }
  }
})
