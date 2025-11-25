# Seed-скрипт для белых списков и тестовых данных

## Обзор

Этот скрипт создает тестовые данные для системы белых списков сайтов и демонстрационные события для различных сценариев тестирования.

## Что создается

### 1. Белые списки сайтов

Скрипт создает 6 тестовых сайтов с различными настройками:

| Имя сайта | Псевдоним | Модерация | Активен | Назначение |
|-----------|-----------|-----------|---------|------------|
| `demo-site-1` | Демо-сайт 1 | ❌ | ✅ | Быстрое тестирование без модерации |
| `demo-site-2` | Демо-сайт 2 | ✅ | ✅ | Тестирование процесса модерации |
| `partner-events` | События партнеров | ✅ | ✅ | Имитация партнерского сайта |
| `trusted-organizer` | Доверенный организатор | ❌ | ✅ | Доверенный источник без модерации |
| `test-inactive` | Неактивный тест | ❌ | ❌ | Тестирование ошибок доступа |
| `external-api-test` | API тестирование | ✅ | ✅ | Тестирование внешнего API |

### 2. Тестовые события

Создается 3 демонстрационных события:

1. **[SEED] Мастер-класс по кулинарии**
   - Статус: `published` (опубликовано)
   - Модерация: не требуется
   - Прием заявок: уже начался
   - Назначение: тестирование работающего события

2. **[SEED] Семинар по фотографии**
   - Статус: `draft` (черновик)
   - Модерация: требуется
   - Прием заявок: через 2 дня
   - Назначение: тестирование модерации

3. **[SEED] Конференция по IT**
   - Статус: `published` (опубликовано)
   - Модерация: не требуется
   - Большое количество мест (100)
   - Назначение: тестирование масштабируемости

## Использование

### Запуск скрипта

```bash
# Убедитесь, что база данных настроена
npx prisma migrate dev

# Запустите seed-скрипт
npx tsx scripts/seed-whitelist.ts
```

### Альтернативный запуск через npm

Добавьте в `package.json`:

```json
{
  "scripts": {
    "seed:whitelist": "tsx scripts/seed-whitelist.ts"
  }
}
```

Затем запустите:

```bash
npm run seed:whitelist
```

### Запуск из другого скрипта

```typescript
import { seedWhitelistedSites, seedTestEvents } from './seed-whitelist'

async function customSeed() {
  await seedWhitelistedSites()
  await seedTestEvents()
}
```

## Безопасность

### Проверки дублирования

- **Сайты:** Скрипт проверяет существующие сайты по `siteName` и пропускает дубликаты
- **События:** Скрипт проверяет наличие событий с префиксом `[SEED]` и пропускает создание, если они уже есть

### Идемпотентность

Скрипт можно запускать многократно без риска создания дубликатов или ошибок.

## Тестовые сценарии

### 1. Тестирование без модерации

```bash
# Используйте demo-site-1 или trusted-organizer
curl -X POST http://localhost:3000/api/external/events \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "demo-site-1",
    "title": "Тест без модерации",
    "authorName": "Тестовый автор",
    "location": "Тестовая локация",
    "seatLimit": 10,
    "pricePerSeat": 1000,
    "timezone": "Europe/Moscow",
    "startApplicationsAt": "2025-11-26T10:00:00.000Z",
    "endApplicationsAt": "2025-11-30T18:00:00.000Z",
    "startContractsAt": "2025-12-01T10:00:00.000Z",
    "startAt": "2025-12-05T14:00:00.000Z"
  }'
```

### 2. Тестирование с модерацией

```bash
# Используйте demo-site-2 или partner-events
curl -X POST http://localhost:3000/api/external/events \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "demo-site-2",
    "title": "Тест с модерацией",
    "authorName": "Тестовый автор",
    "location": "Тестовая локация",
    "seatLimit": 10,
    "pricePerSeat": 1000,
    "timezone": "Europe/Moscow",
    "startApplicationsAt": "2025-11-26T10:00:00.000Z",
    "endApplicationsAt": "2025-11-30T18:00:00.000Z",
    "startContractsAt": "2025-12-01T10:00:00.000Z",
    "startAt": "2025-12-05T14:00:00.000Z"
  }'
```

### 3. Тестирование ошибок доступа

```bash
# Используйте test-inactive (деактивированный сайт)
curl -X POST http://localhost:3000/api/external/events \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "test-inactive",
    "title": "Тест ошибки доступа",
    ...
  }'
# Ожидаемый результат: 403 Forbidden
```

### 4. Тестирование несуществующего сайта

```bash
# Используйте несуществующее имя сайта
curl -X POST http://localhost:3000/api/external/events \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "nonexistent-site",
    "title": "Тест несуществующего сайта",
    ...
  }'
# Ожидаемый результат: 403 Forbidden
```

## Проверка результатов

### 1. Административные страницы

- **Белые списки:** http://localhost:3000/admin/whitelist
- **Модерация:** http://localhost:3000/admin/moderation
- **Каталог событий:** http://localhost:3000/catalog

### 2. Демо-страницы

- **Настройки демо:** http://localhost:3000/demo/settings
- **Загрузка событий:** http://localhost:3000/demo/external-upload
- **Отчет платформы:** http://localhost:3000/demo/platform-report

### 3. API эндпоинты

```bash
# Проверка созданных сайтов
curl http://localhost:3000/api/admin/whitelist

# Проверка событий на модерации
curl http://localhost:3000/api/admin/moderation
```

## Очистка тестовых данных

### Удаление seed-событий

```sql
-- Удалить события с префиксом [SEED]
DELETE FROM "EventStatusHistory" 
WHERE "eventId" IN (
  SELECT id FROM "Event" WHERE title LIKE '[SEED]%'
);

DELETE FROM "Event" WHERE title LIKE '[SEED]%';
```

### Удаление seed-сайтов

```sql
-- Удалить тестовые сайты (осторожно!)
DELETE FROM "WhitelistedSite" 
WHERE "siteName" IN (
  'demo-site-1', 'demo-site-2', 'partner-events', 
  'trusted-organizer', 'test-inactive', 'external-api-test'
);
```

## Расширение

### Добавление новых тестовых сайтов

Отредактируйте массив `SEED_SITES` в `seed-whitelist.ts`:

```typescript
const SEED_SITES: SeedSite[] = [
  // ... существующие сайты
  {
    siteName: 'my-new-test-site',
    siteAlias: 'Мой новый тестовый сайт',
    requiresModeration: true,
    isActive: true,
    description: 'Описание нового тестового сайта'
  }
]
```

### Добавление новых тестовых событий

Отредактируйте массив `testEvents` в функции `seedTestEvents()`.

## Устранение неполадок

### Ошибка подключения к базе данных

```bash
# Проверьте переменные окружения
cat .env

# Проверьте статус базы данных
npx prisma db push
```

### Ошибки валидации Prisma

```bash
# Обновите схему базы данных
npx prisma migrate dev

# Сгенерируйте клиент Prisma
npx prisma generate
```

### Конфликты уникальности

Скрипт автоматически пропускает существующие записи, но если возникают ошибки:

```bash
# Очистите тестовые данные и запустите заново
# (см. раздел "Очистка тестовых данных")
```
