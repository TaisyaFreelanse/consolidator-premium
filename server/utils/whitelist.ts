import { getPrismaClient } from './prisma'

const prisma = getPrismaClient()

/**
 * Интерфейс для данных создания сайта в белом списке
 */
export interface CreateSiteData {
  siteName: string
  siteAlias: string
  requiresModeration?: boolean
  isActive?: boolean
}

/**
 * Получение сайта по имени
 */
export async function getSiteByName(siteName: string): Promise<any | null> {
  try {
    const site = await prisma.whitelistedSite.findUnique({
      where: { siteName: siteName.trim() }
    })
    return site
  } catch (error) {
    console.error('Error fetching site by name:', error)
    return null
  }
}

/**
 * Проверка, находится ли сайт в белом списке и активен
 */
export async function isSiteWhitelisted(siteName: string): Promise<boolean> {
  try {
    const site = await getSiteByName(siteName)
    return !!(site && site.isActive)
  } catch (error) {
    console.error('Error checking site whitelist status:', error)
    return false
  }
}

/**
 * Создание нового сайта в белом списке
 */
export async function createWhitelistedSite(data: CreateSiteData): Promise<any> {
  const site = await prisma.whitelistedSite.create({
    data: {
      siteName: data.siteName.trim(),
      siteAlias: data.siteAlias.trim(),
      requiresModeration: data.requiresModeration ?? false,
      isActive: data.isActive ?? true
    }
  })
  return site
}

/**
 * Получение всех сайтов в белом списке (включая неактивные для администрирования)
 */
export async function getAllWhitelistedSites(includeInactive: boolean = true): Promise<any[]> {
  try {
    const whereClause = includeInactive ? {} : { isActive: true }
    const sites = await prisma.whitelistedSite.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })
    return sites
  } catch (error) {
    console.error('Error fetching whitelisted sites:', error)
    return []
  }
}

/**
 * Получение только активных сайтов в белом списке
 */
export async function getActiveWhitelistedSites(): Promise<any[]> {
  return getAllWhitelistedSites(false)
}

/**
 * Обновление сайта в белом списке
 */
export async function updateWhitelistedSite(
  id: string,
  data: Partial<CreateSiteData>
): Promise<any | null> {
  try {
    const site = await prisma.whitelistedSite.update({
      where: { id },
      data: {
        ...(data.siteName && { siteName: data.siteName.trim() }),
        ...(data.siteAlias && { siteAlias: data.siteAlias.trim() }),
        ...(data.requiresModeration !== undefined && { requiresModeration: data.requiresModeration }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    })
    return site
  } catch (error) {
    console.error('Error updating whitelisted site:', error)
    return null
  }
}

/**
 * Деактивация сайта в белом списке
 */
export async function deactivateWhitelistedSite(id: string): Promise<boolean> {
  try {
    await prisma.whitelistedSite.update({
      where: { id },
      data: { isActive: false }
    })
    return true
  } catch (error) {
    console.error('Error deactivating whitelisted site:', error)
    return false
  }
}

/**
 * Проверка уникальности имени сайта
 */
export async function isSiteNameUnique(siteName: string, excludeId?: string): Promise<boolean> {
  try {
    const whereClause: any = { siteName: siteName.trim() }
    if (excludeId) {
      whereClause.id = { not: excludeId }
    }
    
    const existing = await prisma.whitelistedSite.findFirst({
      where: whereClause
    })
    
    return !existing
  } catch (error) {
    console.error('Error checking site name uniqueness:', error)
    return false
  }
}

/**
 * Проверка уникальности псевдонима сайта
 */
export async function isSiteAliasUnique(siteAlias: string, excludeId?: string): Promise<boolean> {
  try {
    const whereClause: any = { siteAlias: siteAlias.trim() }
    if (excludeId) {
      whereClause.id = { not: excludeId }
    }
    
    const existing = await prisma.whitelistedSite.findFirst({
      where: whereClause
    })
    
    return !existing
  } catch (error) {
    console.error('Error checking site alias uniqueness:', error)
    return false
  }
}
