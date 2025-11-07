/**
 * Prisma Client singleton для использования в API эндпоинтах
 */

import { PrismaClient } from '@prisma/client'

// Singleton instance
let prisma: PrismaClient

/**
 * Получить экземпляр Prisma Client
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
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

