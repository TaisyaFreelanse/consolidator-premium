import { getPrismaClient } from './prisma'
import { isTi20Passed } from './moderationTimeRestrictions'

const prisma = getPrismaClient()

/**
 * Очистка просроченных событий, которые не были промодерированы вовремя
 * События остаются в статусе draft, но помечаются как просроченные
 */
export async function cleanupExpiredModerationEvents(): Promise<{
  processed: number
  expired: number
  errors: string[]
}> {
  console.log('🧹 Starting moderation cleanup task...')
  
  const errors: string[] = []
  let processed = 0
  let expired = 0

  try {
    // Находим все события, требующие модерации и находящиеся в статусе draft
    const events = await prisma.event.findMany({
      where: {
        status: 'draft',
        requiresModeration: true,
        endApplicationsAt: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        endApplicationsAt: true,
        status: true,
        requiresModeration: true
      }
    })

    console.log(`📋 Found ${events.length} events requiring moderation check`)

    for (const event of events) {
      processed++
      
      try {
        // Проверяем, истекло ли время модерации
        if (isTi20Passed(event)) {
          console.log(`⏰ Event ${event.id} (${event.title}) has expired moderation window`)
          
          // Можно либо удалить событие, либо пометить его как просроченное
          // Для безопасности будем помечать как просроченное, а не удалять
          await prisma.event.update({
            where: { id: event.id },
            data: {
              // Добавляем префикс к названию для индикации просроченности
              title: event.title.startsWith('[ПРОСРОЧЕНО]') 
                ? event.title 
                : `[ПРОСРОЧЕНО] ${event.title}`,
              // Можно добавить специальное поле или использовать description
              description: event.title.startsWith('[ПРОСРОЧЕНО]')
                ? undefined // Не обновляем, если уже помечено
                : `СОБЫТИЕ НЕ БЫЛО ПРОМОДЕРИРОВАНО ВОВРЕМЯ. Время модерации истекло: ${event.endApplicationsAt?.toISOString()}`
            }
          })
          
          expired++
        }
      } catch (error: any) {
        const errorMsg = `Failed to process event ${event.id}: ${error.message}`
        console.error('❌', errorMsg)
        errors.push(errorMsg)
      }
    }

    console.log(`✅ Moderation cleanup completed: ${processed} processed, ${expired} expired, ${errors.length} errors`)
    
    return {
      processed,
      expired,
      errors
    }
  } catch (error: any) {
    const errorMsg = `Moderation cleanup failed: ${error.message}`
    console.error('❌', errorMsg)
    errors.push(errorMsg)
    
    return {
      processed,
      expired,
      errors
    }
  }
}

/**
 * Получение статистики по просроченным событиям
 */
export async function getModerationExpirationStats(): Promise<{
  totalDrafts: number
  requireModeration: number
  expired: number
  expiringSoon: number // В течение 24 часов
}> {
  try {
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const [totalDrafts, requireModeration, expired, expiringSoon] = await Promise.all([
      // Всего черновиков
      prisma.event.count({
        where: { status: 'draft' }
      }),
      
      // Требуют модерации
      prisma.event.count({
        where: {
          status: 'draft',
          requiresModeration: true
        }
      }),
      
      // Просроченные (ti20 уже прошло)
      prisma.event.count({
        where: {
          status: 'draft',
          requiresModeration: true,
          endApplicationsAt: {
            lt: now
          }
        }
      }),
      
      // Истекают в ближайшие 24 часа
      prisma.event.count({
        where: {
          status: 'draft',
          requiresModeration: true,
          endApplicationsAt: {
            gte: now,
            lte: in24Hours
          }
        }
      })
    ])

    return {
      totalDrafts,
      requireModeration,
      expired,
      expiringSoon
    }
  } catch (error: any) {
    console.error('❌ Failed to get moderation stats:', error)
    return {
      totalDrafts: 0,
      requireModeration: 0,
      expired: 0,
      expiringSoon: 0
    }
  }
}

/**
 * Планировщик для автоматической очистки (можно вызывать по cron)
 */
export async function scheduleModerationCleanup(): Promise<void> {
  console.log('⏰ Scheduling moderation cleanup...')
  
  // Запускаем очистку каждые 6 часов
  const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000 // 6 часов
  
  const runCleanup = async () => {
    try {
      const result = await cleanupExpiredModerationEvents()
      console.log('📊 Cleanup result:', result)
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error)
    }
  }

  // Запускаем сразу
  await runCleanup()
  
  // Затем по расписанию
  setInterval(runCleanup, CLEANUP_INTERVAL)
  
  console.log(`✅ Moderation cleanup scheduled every ${CLEANUP_INTERVAL / 1000 / 60 / 60} hours`)
}
