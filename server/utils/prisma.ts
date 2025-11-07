/**
 * Prisma Client singleton для использования в API эндпоинтах
 */

import { PrismaClient } from '@prisma/client'
import { existsSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'

// Singleton instance
let prisma: PrismaClient
let initAttempted = false

/**
 * Проверить и создать директорию БД, если нужно
 */
function ensureDatabaseDirectory(): void {
  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl || !dbUrl.startsWith('file:')) {
    return // Не SQLite или путь не указан
  }
  
  try {
    const dbPath = dbUrl.replace('file:', '').trim()
    const fullPath = dbPath.startsWith('/') || dbPath.startsWith('\\') 
      ? dbPath 
      : resolve(process.cwd(), dbPath)
    
    const dbDir = dirname(fullPath)
    
    if (!existsSync(dbDir)) {
      console.log(`📁 Создаю директорию для БД: ${dbDir}`)
      mkdirSync(dbDir, { recursive: true })
    }
  } catch (error: any) {
    console.warn(`⚠️ Не удалось создать директорию БД: ${error.message}`)
  }
}

/**
 * Получить экземпляр Prisma Client
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    // При первом вызове проверяем директорию БД
    if (!initAttempted) {
      ensureDatabaseDirectory()
      initAttempted = true
    }
    
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    })
  }
  return prisma
}

/**
 * Закрыть соединение с БД
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
  }
}

// Экспорт по умолчанию для удобства
export default getPrismaClient()

