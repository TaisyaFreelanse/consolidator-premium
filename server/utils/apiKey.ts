import { getPrismaClient } from './prisma'
import crypto from 'crypto'

const prisma = getPrismaClient()

/**
 * Генерация нового API ключа
 * Формат: sk_live_<32 символа hex>
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(16)
  const key = randomBytes.toString('hex')
  return `sk_live_${key}`
}

/**
 * Извлечение API ключа из заголовка Authorization
 * Поддерживает форматы:
 * - "Bearer sk_live_..."
 * - "sk_live_..."
 */
export function extractApiKeyFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader) {
    return null
  }

  // Убираем пробелы
  const trimmed = authHeader.trim()

  // Если начинается с "Bearer ", убираем префикс
  if (trimmed.startsWith('Bearer ')) {
    return trimmed.substring(7).trim()
  }

  // Иначе возвращаем как есть
  return trimmed
}

/**
 * Получение информации о продюсере по API ключу
 */
export async function getProducerByApiKey(apiKey: string): Promise<{
  producerCode: string
  clientName: string | null
  isValid: boolean
} | null> {
  try {
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      select: {
        producerCode: true,
        clientName: true,
        isActive: true
      }
    })

    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return null
    }

    // Обновляем время последнего использования
    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsedAt: new Date() }
    }).catch(() => {
      // Игнорируем ошибки обновления (не критично)
    })

    return {
      producerCode: apiKeyRecord.producerCode,
      clientName: apiKeyRecord.clientName,
      isValid: true
    }
  } catch (error) {
    console.error('Error fetching API key:', error)
    return null
  }
}

/**
 * Создание нового API ключа для продюсера
 */
export async function createApiKey(
  producerCode: string,
  clientName?: string,
  clientUrl?: string
): Promise<{ key: string; id: string }> {
  let key: string
  let isUnique = false

  // Генерируем уникальный ключ
  while (!isUnique) {
    key = generateApiKey()
    const existing = await prisma.apiKey.findUnique({
      where: { key }
    })
    if (!existing) {
      isUnique = true
    }
  }

  const apiKey = await prisma.apiKey.create({
    data: {
      key: key!,
      producerCode: producerCode.trim(),
      clientName: clientName?.trim() || null,
      clientUrl: clientUrl?.trim() || null,
      isActive: true
    }
  })

  return {
    key: apiKey.key,
    id: apiKey.id
  }
}

/**
 * Деактивация API ключа
 */
export async function deactivateApiKey(apiKey: string): Promise<boolean> {
  try {
    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { isActive: false }
    })
    return true
  } catch (error) {
    console.error('Error deactivating API key:', error)
    return false
  }
}

