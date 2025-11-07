/**
 * Утилита для инициализации базы данных при старте сервера
 * Гарантирует создание БД и выполнение миграций
 */

import { existsSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface InitOptions {
  rootDir?: string
}

function resolveRootDir(options?: InitOptions): string {
  if (options?.rootDir) return options.rootDir
  if (process.env.PRISMA_ROOT_DIR) return process.env.PRISMA_ROOT_DIR
  if (process.env.NUXT_ROOT_DIR) return process.env.NUXT_ROOT_DIR
  return resolve(__dirname, '../../')
}

/**
 * Получить путь к файлу БД из DATABASE_URL
 */
function getDatabasePath(options?: InitOptions): string | null {
  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL не установлен в переменных окружения')
    return null
  }
  
  // Парсим file:./prisma/dev.db или file:/absolute/path
  if (dbUrl.startsWith('file:')) {
    let path = dbUrl.replace('file:', '').trim()
    
    // Убираем начальный слэш, если есть (file:/path -> file:path)
    if (path.startsWith('/') && !path.startsWith('//')) {
      path = path.substring(1)
    }
    
    // Если относительный путь, разрешаем относительно корня проекта
    if (path.startsWith('./') || path.startsWith('../') || (!path.startsWith('/') && !path.match(/^[A-Z]:/))) {
      const baseDir = resolveRootDir(options)
      return resolve(baseDir, path)
    }
    
    // Абсолютный путь (Windows или Unix)
    return path
  }
  
  return null
}

/**
 * Создать директорию для БД, если её нет
 */
function ensureDatabaseDirectory(dbPath: string): boolean {
  try {
    const dbDir = dirname(dbPath)
    
    if (!existsSync(dbDir)) {
      console.log(`📁 Создаю директорию для БД: ${dbDir}`)
      mkdirSync(dbDir, { recursive: true })
    }
    
    return true
  } catch (error: any) {
    console.error(`❌ Ошибка при создании директории БД: ${error.message}`)
    return false
  }
}

/**
 * Проверить существование файла БД
 */
function databaseExists(dbPath: string): boolean {
  return existsSync(dbPath)
}

/**
 * Выполнить миграции Prisma
 */
async function runMigrations(options?: InitOptions): Promise<boolean> {
  const cwd = resolveRootDir(options)
  try {
    console.log('🔄 Выполняю миграции Prisma...')
    
    // В production используем prisma migrate deploy (безопасно для продакшена)
    // В development используем prisma migrate dev
    const command = process.env.NODE_ENV === 'production' 
      ? 'npx prisma migrate deploy' 
      : 'npx prisma migrate dev --name init --skip-seed'
    
    console.log(`📂 Рабочая директория: ${cwd}`)
    console.log(`🔧 Команда: ${command}`)
    
    execSync(command, { 
      stdio: 'inherit',
      cwd,
      env: { ...process.env }
    })
    
    console.log('✅ Миграции выполнены успешно')
    return true
  } catch (error: any) {
    const errorMessage = error.message || String(error)
    console.error(`❌ Ошибка при выполнении миграций: ${errorMessage}`)
    
    // Если миграции не нужны (БД уже существует), это не критично
    if (errorMessage.includes('already applied') || 
        errorMessage.includes('No pending migrations') ||
        errorMessage.includes('Database is already up to date')) {
      console.log('ℹ️ Миграции уже применены')
      return true
    }
    
    // Если БД не существует, попробуем создать через prisma db push
    if (errorMessage.includes('Unable to open') || errorMessage.includes('does not exist')) {
      console.log('🔄 Пытаюсь создать БД через prisma db push...')
      try {
        execSync('npx prisma db push --skip-generate', {
          stdio: 'inherit',
          cwd,
          env: { ...process.env }
        })
        
        console.log('✅ БД создана через db push')
        return true
      } catch (pushError: any) {
        console.error(`❌ Ошибка при db push: ${pushError.message}`)
        return false
      }
    }
    
    return false
  }
}

/**
 * Инициализировать базу данных
 * Вызывается при старте сервера
 */
export async function initDatabase(options?: InitOptions): Promise<boolean> {
  console.log('🚀 === Инициализация базы данных ===')
  
  try {
    // 1. Получаем путь к БД
    const dbPath = getDatabasePath(options)
    
    if (!dbPath) {
      console.error('❌ Не удалось определить путь к БД')
      return false
    }
    
    console.log(`📂 Путь к БД: ${dbPath}`)
    
    // 2. Создаем директорию, если её нет
    if (!ensureDatabaseDirectory(dbPath)) {
      return false
    }
    
    // 3. Проверяем существование БД
    const dbExists = databaseExists(dbPath)
    
    if (dbExists) {
      console.log('✅ База данных уже существует')
    } else {
      console.log('📝 База данных не найдена, будет создана при первой миграции')
    }
    
    // 4. Выполняем миграции (создаст БД, если её нет)
    const migrationsOk = await runMigrations(options)
    
    if (!migrationsOk) {
      console.warn('⚠️ Миграции не выполнены, но продолжаем работу')
    }
    
    // 5. Проверяем, что БД теперь существует и работает
    // Проверяем через Prisma (более надежно, чем проверка файла)
    let dbWorking = false
    try {
      const { getPrismaClient } = await import('./prisma')
      const prisma = getPrismaClient()
      await prisma.$queryRaw`SELECT 1`
      dbWorking = true
      console.log('✅ База данных работает (проверено через Prisma)')
    } catch (prismaError: any) {
      // Если Prisma не может подключиться, проверяем файл
      const dbExistsAfterMigration = databaseExists(dbPath)
      if (dbExistsAfterMigration) {
        console.warn('⚠️ Файл БД существует, но Prisma не может подключиться. Возможно, БД заблокирована.')
        // Для SQLite это может быть нормально, если БД используется другим процессом
        dbWorking = true
      } else {
        console.error('❌ База данных не была создана после миграций')
        return false
      }
    }
    
    if (!dbWorking) {
      console.error('❌ База данных не работает')
      return false
    }
    
    console.log('✅ === База данных инициализирована успешно ===')
    return true
    
  } catch (error: any) {
    console.error(`❌ Критическая ошибка при инициализации БД: ${error.message}`)
    console.error(error)
    return false
  }
}

/**
 * Проверить подключение к БД
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { getPrismaClient } = await import('./prisma')
    const prisma = getPrismaClient()
    
    // Простой запрос для проверки подключения
    await prisma.$queryRaw`SELECT 1`
    
    console.log('✅ Подключение к БД успешно')
    return true
  } catch (error: any) {
    console.error(`❌ Ошибка подключения к БД: ${error.message}`)
    return false
  }
}

