// Миграция старых данных в localStorage

export const migrateLocalStorage = () => {
  if (typeof window === 'undefined') return

  console.log('🔄 === Starting localStorage migration ===')

  const LEGACY_NAME_MAP: Record<string, string> = {
    producer1: 'прод1',
    producer2: 'прод2',
    moderator: 'мод1'
  }

  try {
    // 1. Миграция пользователей (добавляем роль, если её нет)
    const usersRaw = localStorage.getItem('users')
    if (usersRaw) {
      const users = JSON.parse(usersRaw)
      let usersUpdated = false

      users.forEach((user: any) => {
        if (!user.role) {
          // Если это продюсер (по коду или имени)
          if (user.code === 'PROD001' || user.code === 'PROD002' || 
              user.name === 'producer1' || user.name === 'producer2' ||
              user.name === 'прод1' || user.name === 'прод2') {
            user.role = 'producer'
          } else {
            user.role = 'applicant'
          }
          usersUpdated = true
        }

        if (LEGACY_NAME_MAP[user.name]) {
          user.name = LEGACY_NAME_MAP[user.name]
          usersUpdated = true
        }

        if (user.code === 'PROD001') {
          if (user.password !== 'пар1') {
            user.password = 'пар1'
            usersUpdated = true
          }
        } else if (user.code === 'PROD002') {
          if (user.password !== 'пар2') {
            user.password = 'пар2'
            usersUpdated = true
          }
        } else if (user.code === 'MOD001') {
          if (user.password !== 'пар0') {
            user.password = 'пар0'
            usersUpdated = true
          }
        }
      })

      if (usersUpdated) {
        localStorage.setItem('users', JSON.stringify(users))
        console.log('✅ Users migrated: added roles')
      } else {
        console.log('✓ Users already up-to-date')
      }
    }

    // 2. Миграция событий (добавляем status, producerName, createdAt, updatedAt)
    const eventsRaw = localStorage.getItem('customEvents')
    if (eventsRaw) {
      const events = JSON.parse(eventsRaw)
      let eventsUpdated = false

      console.log('🔍 Migrating events, found:', events.length)

      events.forEach((event: any, index: number) => {
        console.log(`  Event ${index}:`, {
          id: event.id,
          title: event.title,
          status: event.status || 'MISSING',
          producer: event.producerName || 'MISSING',
          author: event.author
        })

        // Добавляем status если его нет
        if (!event.status) {
          event.status = 'published' // Старые события считаем опубликованными
          eventsUpdated = true
          console.log(`    ⚠️ Added status: published`)
        }

        if (event.producerName && LEGACY_NAME_MAP[event.producerName]) {
          event.producerName = LEGACY_NAME_MAP[event.producerName]
          eventsUpdated = true
          console.log(`    ⚠️ Updated producer name to ${event.producerName}`)
        }

        if (!event.producerName) {
          event.producerName = 'прод1' // Неизвестный продюсер
          eventsUpdated = true
          console.log(`    ⚠️ Added producer: прод1`)
        }

        // Добавляем createdAt если его нет
        if (!event.createdAt) {
          event.createdAt = new Date('2025-01-01').toISOString()
          eventsUpdated = true
          console.log(`    ⚠️ Added createdAt`)
        }

        // Добавляем updatedAt если его нет
        if (!event.updatedAt) {
          event.updatedAt = event.createdAt || new Date('2025-01-01').toISOString()
          eventsUpdated = true
          console.log(`    ⚠️ Added updatedAt`)
        }

        // Миграция author: если это не ID (не начинается с 'author-'), заменяем на автора по умолчанию
        if (event.author && !event.author.startsWith('author-')) {
          event.author = 'author-001' // Автор по умолчанию
          eventsUpdated = true
          console.log(`    ⚠️ Migrated author to ID: author-001`)
        }

        // Удаляем старое поле authorInfo, если оно есть
        if (event.authorInfo) {
          delete event.authorInfo
          eventsUpdated = true
          console.log(`    ⚠️ Removed deprecated authorInfo field`)
        }
      })

      if (eventsUpdated) {
        localStorage.setItem('customEvents', JSON.stringify(events))
        console.log('✅ Events migrated: added missing fields')
      } else {
        console.log('✓ Events already up-to-date')
      }
    } else {
      console.log('ℹ️ No custom events found in localStorage')
    }

    console.log('🔄 === Migration complete ===')
    return true
  } catch (e) {
    console.error('❌ Migration failed:', e)
    return false
  }
}

// Автоматически запускаем миграцию при импорте
if (typeof window !== 'undefined') {
  // Запускаем с небольшой задержкой, чтобы дать время загрузиться stores
  setTimeout(() => {
    migrateLocalStorage()
  }, 100)
}

