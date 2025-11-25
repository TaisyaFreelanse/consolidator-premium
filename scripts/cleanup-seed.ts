import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupSeedData() {
  console.log('🧹 Starting cleanup of seed data...')
  console.log('=' .repeat(50))

  try {
    // 1. Удаляем seed-события и связанные данные
    console.log('\n📅 Cleaning up seed events...')
    
    // Находим все seed-события
    const seedEvents = await prisma.event.findMany({
      where: {
        title: {
          startsWith: '[SEED]'
        }
      },
      select: { id: true, title: true }
    })

    if (seedEvents.length === 0) {
      console.log('   ℹ️  No seed events found to cleanup.')
    } else {
      const eventIds = seedEvents.map(e => e.id)
      
      // Удаляем историю статусов
      const deletedStatusHistory = await prisma.eventStatusHistory.deleteMany({
        where: {
          eventId: {
            in: eventIds
          }
        }
      })
      console.log(`   ✅ Deleted ${deletedStatusHistory.count} status history records`)

      // Удаляем заявки (если есть)
      const deletedApplications = await prisma.application.deleteMany({
        where: {
          eventId: {
            in: eventIds
          }
        }
      })
      console.log(`   ✅ Deleted ${deletedApplications.count} applications`)

      // Удаляем платежи (если есть)
      const deletedPayments = await prisma.payment.deleteMany({
        where: {
          eventId: {
            in: eventIds
          }
        }
      })
      console.log(`   ✅ Deleted ${deletedPayments.count} payments`)

      // Удаляем сами события
      const deletedEvents = await prisma.event.deleteMany({
        where: {
          id: {
            in: eventIds
          }
        }
      })
      console.log(`   ✅ Deleted ${deletedEvents.count} seed events`)

      // Показываем какие события были удалены
      console.log('   📋 Deleted events:')
      seedEvents.forEach(event => {
        console.log(`      - ${event.title}`)
      })
    }

    // 2. Удаляем seed-сайты из белого списка
    console.log('\n🌐 Cleaning up seed whitelisted sites...')
    
    const seedSiteNames = [
      'demo-site-1',
      'demo-site-2', 
      'partner-events',
      'trusted-organizer',
      'test-inactive',
      'external-api-test'
    ]

    const existingSeedSites = await prisma.whitelistedSite.findMany({
      where: {
        siteName: {
          in: seedSiteNames
        }
      },
      select: { id: true, siteName: true, siteAlias: true }
    })

    if (existingSeedSites.length === 0) {
      console.log('   ℹ️  No seed whitelisted sites found to cleanup.')
    } else {
      const deletedSites = await prisma.whitelistedSite.deleteMany({
        where: {
          siteName: {
            in: seedSiteNames
          }
        }
      })
      console.log(`   ✅ Deleted ${deletedSites.count} seed whitelisted sites`)

      // Показываем какие сайты были удалены
      console.log('   📋 Deleted sites:')
      existingSeedSites.forEach(site => {
        console.log(`      - ${site.siteName} (${site.siteAlias})`)
      })
    }

    // 3. Показываем итоговую статистику
    console.log('\n📊 Final statistics:')
    
    const remainingEvents = await prisma.event.count()
    const remainingSites = await prisma.whitelistedSite.count()
    
    console.log(`   - Events remaining: ${remainingEvents}`)
    console.log(`   - Whitelisted sites remaining: ${remainingSites}`)

    console.log('\n' + '=' .repeat(50))
    console.log('🎉 Cleanup completed successfully!')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function confirmCleanup(): Promise<boolean> {
  // В Node.js окружении используем readline для подтверждения
  if (typeof process !== 'undefined' && process.stdin) {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise((resolve) => {
      rl.question('⚠️  Are you sure you want to delete all seed data? This cannot be undone. (y/N): ', (answer) => {
        rl.close()
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
      })
    })
  }
  
  // Fallback для других окружений
  return true
}

async function main() {
  console.log('🗑️  Seed Data Cleanup Script')
  console.log('This script will remove all test data created by the seed script.')
  
  const confirmed = await confirmCleanup()
  
  if (!confirmed) {
    console.log('❌ Cleanup cancelled by user.')
    process.exit(0)
  }

  try {
    await cleanupSeedData()
  } catch (error) {
    console.error('💥 Cleanup failed:', error)
    process.exit(1)
  }
}

// Запуск скрипта
if (require.main === module) {
  main()
}

export { cleanupSeedData }
