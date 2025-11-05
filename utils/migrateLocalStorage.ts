// Миграция старых данных в localStorage

export const migrateLocalStorage = () => {
  if (typeof window === 'undefined') return

  console.log('🔄 === Starting localStorage migration ===')

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
              user.name === 'producer1' || user.name === 'producer2') {
            user.role = 'producer'
          } else {
            user.role = 'applicant'
          }
          usersUpdated = true
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

      events.forEach((event: any) => {
        // Добавляем status если его нет
        if (!event.status) {
          event.status = 'published' // Старые события считаем опубликованными
          eventsUpdated = true
        }

        // Добавляем producerName если его нет
        if (!event.producerName) {
          event.producerName = 'producer1' // Неизвестный продюсер
          eventsUpdated = true
        }

        // Добавляем createdAt если его нет
        if (!event.createdAt) {
          event.createdAt = new Date('2025-01-01').toISOString()
          eventsUpdated = true
        }

        // Добавляем updatedAt если его нет
        if (!event.updatedAt) {
          event.updatedAt = event.createdAt || new Date('2025-01-01').toISOString()
          eventsUpdated = true
        }
      })

      if (eventsUpdated) {
        localStorage.setItem('customEvents', JSON.stringify(events))
        console.log('✅ Events migrated: added status, producer, dates')
      } else {
        console.log('✓ Events already up-to-date')
      }
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

