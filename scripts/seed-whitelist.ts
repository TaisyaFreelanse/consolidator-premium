import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SeedSite {
  siteName: string
  siteAlias: string
  requiresModeration: boolean
  isActive: boolean
  description?: string
}

// Тестовые сайты для различных сценариев
const SEED_SITES: SeedSite[] = [
  {
    siteName: 'demo-site-1',
    siteAlias: 'Демо-сайт 1',
    requiresModeration: false,
    isActive: true,
    description: 'Основной демо-сайт без модерации для быстрого тестирования'
  },
  {
    siteName: 'demo-site-2',
    siteAlias: 'Демо-сайт 2',
    requiresModeration: true,
    isActive: true,
    description: 'Демо-сайт с модерацией для тестирования процесса одобрения'
  },
  {
    siteName: 'partner-events',
    siteAlias: 'События партнеров',
    requiresModeration: true,
    isActive: true,
    description: 'Сайт партнеров с обязательной модерацией'
  },
  {
    siteName: 'trusted-organizer',
    siteAlias: 'Доверенный организатор',
    requiresModeration: false,
    isActive: true,
    description: 'Доверенный организатор без модерации'
  },
  {
    siteName: 'test-inactive',
    siteAlias: 'Неактивный тест',
    requiresModeration: false,
    isActive: false,
    description: 'Деактивированный сайт для тестирования ошибок доступа'
  },
  {
    siteName: 'external-api-test',
    siteAlias: 'API тестирование',
    requiresModeration: true,
    isActive: true,
    description: 'Сайт для тестирования внешнего API с модерацией'
  }
]

async function seedWhitelistedSites() {
  console.log('🌱 Starting whitelist seeding...')

  try {
    // Проверяем существующие сайты
    const existingSites = await prisma.whitelistedSite.findMany({
      select: { siteName: true }
    })
    const existingSiteNames = new Set(existingSites.map(site => site.siteName))

    let createdCount = 0
    let skippedCount = 0

    for (const siteData of SEED_SITES) {
      if (existingSiteNames.has(siteData.siteName)) {
        console.log(`⏭️  Skipping existing site: ${siteData.siteName}`)
        skippedCount++
        continue
      }

      const createdSite = await prisma.whitelistedSite.create({
        data: {
          siteName: siteData.siteName,
          siteAlias: siteData.siteAlias,
          requiresModeration: siteData.requiresModeration,
          isActive: siteData.isActive,
        }
      })

      console.log(`✅ Created site: ${createdSite.siteName} (${createdSite.siteAlias}) - Moderation: ${createdSite.requiresModeration ? 'Yes' : 'No'}, Active: ${createdSite.isActive ? 'Yes' : 'No'}`)
      createdCount++
    }

    console.log(`\n📊 Seeding completed:`)
    console.log(`   - Created: ${createdCount} sites`)
    console.log(`   - Skipped: ${skippedCount} sites (already exist)`)
    console.log(`   - Total in database: ${existingSites.length + createdCount} sites`)

    // Показываем итоговую статистику
    const finalStats = await prisma.whitelistedSite.groupBy({
      by: ['requiresModeration', 'isActive'],
      _count: true
    })

    console.log(`\n📈 Current whitelist statistics:`)
    finalStats.forEach(stat => {
      const moderationText = stat.requiresModeration ? 'with moderation' : 'without moderation'
      const activeText = stat.isActive ? 'active' : 'inactive'
      console.log(`   - ${stat._count} sites ${moderationText}, ${activeText}`)
    })

  } catch (error) {
    console.error('❌ Error during whitelist seeding:', error)
    throw error
  }
}

async function seedTestEvents() {
  console.log('\n🎪 Starting test events seeding...')

  try {
    // Получаем существующие сайты
    const sites = await prisma.whitelistedSite.findMany({
      where: { isActive: true }
    })

    if (sites.length === 0) {
      console.log('⚠️  No active whitelisted sites found. Skipping event seeding.')
      return
    }

    // Проверяем, есть ли уже тестовые события
    const existingTestEvents = await prisma.event.count({
      where: {
        title: {
          startsWith: '[SEED]'
        }
      }
    })

    if (existingTestEvents > 0) {
      console.log(`⏭️  Found ${existingTestEvents} existing seed events. Skipping event seeding.`)
      return
    }

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Создаем тестовые события для разных сценариев
    const testEvents = [
      {
        title: '[SEED] Мастер-класс по кулинарии',
        author: 'Иван Кулинаров',
        location: 'Москва, Кулинарная студия',
        seatLimit: 15,
        priceTotal: 75000, // 15 * 5000
        description: 'Тестовое событие без модерации',
        siteAlias: sites.find(s => !s.requiresModeration)?.siteAlias || sites[0].siteAlias,
        requiresModeration: false,
        status: 'published',
        publishedAt: now,
        startApplicationsAt: now,
        endApplicationsAt: tomorrow,
        startContractsAt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        startAt: nextWeek,
        endAt: new Date(nextWeek.getTime() + 4 * 60 * 60 * 1000)
      },
      {
        title: '[SEED] Семинар по фотографии',
        author: 'Анна Фотографова',
        location: 'СПб, Фотостудия "Свет"',
        seatLimit: 10,
        priceTotal: 50000, // 10 * 5000
        description: 'Тестовое событие с модерацией (черновик)',
        siteAlias: sites.find(s => s.requiresModeration)?.siteAlias || sites[0].siteAlias,
        requiresModeration: true,
        status: 'draft',
        publishedAt: null,
        startApplicationsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        endApplicationsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        startContractsAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        startAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        endAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)
      },
      {
        title: '[SEED] Конференция по IT',
        author: 'Петр Программистов',
        location: 'Онлайн',
        seatLimit: 100,
        priceTotal: 300000, // 100 * 3000
        description: 'Большое тестовое событие',
        siteAlias: sites.find(s => !s.requiresModeration)?.siteAlias || sites[0].siteAlias,
        requiresModeration: false,
        status: 'published',
        publishedAt: now,
        startApplicationsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endApplicationsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        startContractsAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        startAt: nextMonth,
        endAt: new Date(nextMonth.getTime() + 8 * 60 * 60 * 1000)
      }
    ]

    let createdEventsCount = 0

    for (const eventData of testEvents) {
      const createdEvent = await prisma.event.create({
        data: {
          ...eventData,
          timezone: 'Europe/Moscow',
          createdAt: now,
          updatedAt: now
        }
      })

      console.log(`✅ Created event: ${createdEvent.title} (${createdEvent.status}) - Site: ${createdEvent.siteAlias}`)
      createdEventsCount++

      // Добавляем запись в историю статусов
      await prisma.eventStatusHistory.create({
        data: {
          eventId: createdEvent.id,
          statusCode: createdEvent.status,
          note: `Тестовое событие создано через seed-скрипт. Модерация: ${createdEvent.requiresModeration ? 'требуется' : 'не требуется'}`
        }
      })
    }

    console.log(`\n📊 Events seeding completed:`)
    console.log(`   - Created: ${createdEventsCount} test events`)

  } catch (error) {
    console.error('❌ Error during events seeding:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting whitelist and test data seeding...')
  console.log('=' .repeat(50))

  try {
    await seedWhitelistedSites()
    await seedTestEvents()

    console.log('\n' + '=' .repeat(50))
    console.log('🎉 Seeding completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Check the admin whitelist page: /admin/whitelist')
    console.log('2. Check the moderation page: /admin/moderation')
    console.log('3. Test the demo site with different site names')
    console.log('4. Try creating events through the external API')

  } catch (error) {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Запуск скрипта
if (require.main === module) {
  main()
}

export { seedWhitelistedSites, seedTestEvents }
