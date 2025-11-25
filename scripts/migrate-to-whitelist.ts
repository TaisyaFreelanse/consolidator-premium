#!/usr/bin/env tsx

/**
 * Скрипт миграции данных для перехода на систему белых списков
 * 
 * Выполняет:
 * 1. Создание записей в WhitelistedSite на основе существующих producerCode
 * 2. Обновление событий: producerCode -> siteAlias
 * 3. Установка флага requiresModeration для новых сайтов
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface MigrationStats {
  eventsProcessed: number
  sitesCreated: number
  eventsUpdated: number
  errors: string[]
}

async function migrateToWhitelist(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    eventsProcessed: 0,
    sitesCreated: 0,
    eventsUpdated: 0,
    errors: []
  }

  console.log('🚀 Начинаем миграцию к системе белых списков...')

  try {
    // 1. Получаем все уникальные producerCode из существующих событий
    const events = await prisma.event.findMany({
      select: {
        id: true,
        producerCode: true,
        producerName: true
      },
      where: {
        producerCode: {
          not: null
        }
      }
    })

    console.log(`📊 Найдено ${events.length} событий с producerCode`)
    stats.eventsProcessed = events.length

    // 2. Создаем карту уникальных продюсеров
    const producerMap = new Map<string, { name: string; alias: string }>()
    
    events.forEach(event => {
      if (event.producerCode && !producerMap.has(event.producerCode)) {
        // Создаем псевдоним на основе producerName или producerCode
        const alias = event.producerName || event.producerCode
        producerMap.set(event.producerCode, {
          name: event.producerCode,
          alias: alias
        })
      }
    })

    console.log(`🏢 Найдено ${producerMap.size} уникальных продюсеров`)

    // 3. Создаем записи в WhitelistedSite
    for (const [producerCode, producer] of producerMap) {
      try {
        // Проверяем, не существует ли уже такой сайт
        const existingSite = await prisma.whitelistedSite.findFirst({
          where: {
            OR: [
              { siteName: producer.name },
              { siteAlias: producer.alias }
            ]
          }
        })

        if (existingSite) {
          console.log(`⚠️ Сайт уже существует: ${producer.name} -> ${producer.alias}`)
          continue
        }

        // Создаем новый сайт в белом списке
        await prisma.whitelistedSite.create({
          data: {
            siteName: producer.name,
            siteAlias: producer.alias,
            requiresModeration: false, // Существующие продюсеры не требуют модерации
            isActive: true
          }
        })

        console.log(`✅ Создан сайт: ${producer.name} -> ${producer.alias}`)
        stats.sitesCreated++
      } catch (error: any) {
        const errorMsg = `Ошибка создания сайта ${producer.name}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
    }

    // 4. Обновляем события: заменяем producerCode на siteAlias
    for (const event of events) {
      if (!event.producerCode) continue

      try {
        const producer = producerMap.get(event.producerCode)
        if (!producer) continue

        await prisma.event.update({
          where: { id: event.id },
          data: {
            siteAlias: producer.alias,
            requiresModeration: false // Существующие события не требуют модерации
          }
        })

        stats.eventsUpdated++
      } catch (error: any) {
        const errorMsg = `Ошибка обновления события ${event.id}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
    }

    console.log('✅ Миграция завершена успешно!')
    
  } catch (error: any) {
    const errorMsg = `Критическая ошибка миграции: ${error.message}`
    console.error(`💥 ${errorMsg}`)
    stats.errors.push(errorMsg)
  }

  return stats
}

async function main() {
  try {
    console.log('🔌 Подключение к базе данных...')
    await prisma.$connect()
    
    const stats = await migrateToWhitelist()
    
    console.log('\n📈 Статистика миграции:')
    console.log(`  События обработано: ${stats.eventsProcessed}`)
    console.log(`  Сайтов создано: ${stats.sitesCreated}`)
    console.log(`  События обновлено: ${stats.eventsUpdated}`)
    console.log(`  Ошибок: ${stats.errors.length}`)
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Ошибки:')
      stats.errors.forEach(error => console.log(`  - ${error}`))
    }
    
  } catch (error: any) {
    console.error('💥 Критическая ошибка:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Запускаем миграцию только если скрипт вызван напрямую
if (require.main === module) {
  main()
}

export { migrateToWhitelist }
