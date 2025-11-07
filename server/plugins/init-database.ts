/**
 * Nuxt server plugin для инициализации базы данных при старте сервера
 * Запускается автоматически при старте Nuxt сервера
 */

import { initDatabase, testDatabaseConnection } from '../utils/initDatabase'

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🔌 Server plugin: инициализация базы данных...')

  const rootDir = nitroApp.options?.rootDir || process.env.NUXT_ROOT_DIR || process.cwd()
  process.env.PRISMA_ROOT_DIR = rootDir
  
  try {
    // Инициализируем БД
    const initSuccess = await initDatabase({ rootDir })
    
    if (!initSuccess) {
      console.error('❌ Не удалось инициализировать БД, но продолжаем работу')
      // Не прерываем запуск сервера, но логируем ошибку
    }
    
    // Проверяем подключение
    const connectionOk = await testDatabaseConnection()
    
    if (!connectionOk) {
      console.error('❌ Не удалось подключиться к БД')
      // В production можно прервать запуск, но для development продолжаем
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Критическая ошибка: БД недоступна в production')
        // Не прерываем, но логируем критическую ошибку
      }
    }
    
    console.log('✅ Server plugin: инициализация БД завершена')
  } catch (error: any) {
    console.error(`❌ Ошибка в server plugin инициализации БД: ${error.message}`)
    console.error(error)
    // Не прерываем запуск сервера
  }
})

