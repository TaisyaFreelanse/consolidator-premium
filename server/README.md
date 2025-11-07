# Backend API Documentation

## 📋 Overview

This is the backend API for the Consolidator Premium platform. It provides endpoints for:
- Event management
- Monitoring and analytics
- Payment processing (virtual/test mode)
- Control point management

---

## 🌐 Base URL

```
http://localhost:3000/api
```

---

## 📚 Endpoints

### **Events**

#### `GET /api/events`
Get list of all published events.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ev_test_early",
      "title": "Охота на медведя с рогатиной",
      "author": "author-001",
      "location": "Тайга, Урал",
      "startAt": "2025-11-28T13:01:00.000Z",
      "endAt": "2025-12-03T13:01:00.000Z",
      "priceTotal": 15000000,
      "pricePerSeat": 468750,
      "seatLimit": 32,
      "status": "published",
      ...
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/api/events
```

---

#### `GET /api/events/:id`
Get single event by ID.

**Parameters:**
- `id` (path) - Event ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ev_test_early",
    "title": "Охота на медведя с рогатиной",
    ...
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/events/ev_test_early
```

---

### **Monitoring**

#### `GET /api/monitoring/:eventId`
Get monitoring data for a specific event (applicants, payments, etc).

**Parameters:**
- `eventId` (path) - Event ID

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "ev_test_early",
    "nowPoint": "ti10",
    "applicants": [
      {
        "code": "USER123",
        "seats": 1,
        "paidAmount": 50000
      }
    ]
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/monitoring/ev_test_early
```

---

### **Applications**

#### `POST /api/applications/create`
Create new application with payment.

**Request Body:**
```json
{
  "eventId": "ev_test_early",
  "userId": "USER123",
  "cardNumber": "4532015112830366",
  "expiry": "12/25",
  "cvc": "123",
  "amount": 500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "paymentId": "pay_abc123",
    "status": "SUCCESS",
    "providerTxnId": "TEST-uuid-here",
    "amount": 500,
    "currency": "RUB"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/applications/create \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "ev_test_early",
    "userId": "USER123",
    "cardNumber": "4532015112830366",
    "expiry": "12/25",
    "cvc": "123",
    "amount": 500
  }'
```

---

# Backend API Documentation (Original Content Below)

## Обзор

Виртуальная интеграция с платежной системой (имитация ЮKassa) для проекта consolidator-premium.

**Важно:** Все платежи являются тестовыми (isTest = true). Реальные номера карт НЕ сохраняются в базе данных.

## Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

Создайте файл `.env` в корне проекта:

```env
DATABASE_URL="file:./prisma/dev.db"
API_PORT=3001
NODE_ENV=development
```

### 3. Инициализация Prisma

```bash
# Генерация Prisma Client
npm run prisma:generate

# Применение миграций
npm run prisma:migrate

# (Опционально) Открыть Prisma Studio для просмотра БД
npm run prisma:studio
```

### 4. Запуск сервера

```bash
npm run dev
```

Сервер будет доступен на `http://localhost:3000`  
API эндпоинты: `http://localhost:3000/api`

## Тестирование

```bash
# Запуск всех тестов
npm test

# Запуск тестов с UI
npm run test:ui

# Запуск тестов в watch режиме
npm test -- --watch
```

---

## API Эндпоинты

### 1. GET /api/events/:id/control-points

Получить информацию о контрольных точках мероприятия.

#### Параметры

- `id` (path) - ID мероприятия

#### Пример запроса

```bash
curl -X GET http://localhost:3000/api/events/ev_test_early/control-points
```

#### Пример ответа

```json
{
  "success": true,
  "data": {
    "eventId": "ev_test_early",
    "title": "Охота на медведя с рогатиной",
    "controlPlan": ["t0", "ti10", "ti20", "ti30", "ti40", "ti50", "t999"],
    "currentControlPoint": "ti10",
    "isCancelled": false,
    "status": "published",
    "notices": {
      "notice1": "Принимаем заявки на участие в мероприятии и обеспечительные платежи",
      "notice1Cancelled": "",
      "notice2": "Окончание приема заявок на участие, начало калькуляции складочных цен",
      "notice2Cancelled": ""
    }
  }
}
```

---

### 2. PUT /api/events/:id/control-point

Обновить текущую контрольную точку и статус отмены мероприятия.

#### Параметры

- `id` (path) - ID мероприятия

#### Тело запроса

```json
{
  "currentControlPoint": "ti20",
  "isCancelled": false,
  "note": "Переход на следующий этап"
}
```

#### Пример запроса

```bash
curl -X PUT http://localhost:3000/api/events/ev_test_early/control-point \
  -H "Content-Type: application/json" \
  -d '{
    "currentControlPoint": "ti20",
    "isCancelled": false,
    "note": "Прием заявок завершен"
  }'
```

#### Пример ответа

```json
{
  "success": true,
  "message": "Control point updated successfully",
  "data": {
    "eventId": "ev_test_early",
    "title": "Охота на медведя с рогатиной",
    "controlPlan": ["t0", "ti10", "ti20", "ti30", "ti40", "ti50", "t999"],
    "currentControlPoint": "ti20",
    "isCancelled": false
  }
}
```

---

### 3. POST /api/payments/simulate

Имитация платежа (виртуальная интеграция с ЮKassa).

**Безопасность:** Номер карты НЕ сохраняется в БД. Сохраняется только тестовый ID транзакции.

#### Тело запроса

```json
{
  "eventId": "ev_test_early",
  "userId": "user123",
  "cardNumber": "4532015112830366",
  "expiry": "12/25",
  "cvc": "123",
  "amount": 1000,
  "currency": "RUB"
}
```

#### Валидация

- **cardNumber**: проверяется алгоритмом Luhn
- **expiry**: формат MM/YY или MM/YYYY, не должна быть просрочена
- **cvc**: 3 или 4 цифры
- **amount**: больше 0

#### Пример запроса (успешный)

```bash
curl -X POST http://localhost:3000/api/payments/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "ev_test_early",
    "userId": "user123",
    "cardNumber": "4532015112830366",
    "expiry": "12/25",
    "cvc": "123",
    "amount": 1000,
    "currency": "RUB"
  }'
```

#### Пример ответа (успешный)

```json
{
  "success": true,
  "status": "SUCCESS",
  "message": "Payment processed successfully",
  "data": {
    "paymentId": "550e8400-e29b-41d4-a716-446655440000",
    "transactionId": "TEST-7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "amount": 1000,
    "currency": "RUB",
    "cardType": "Visa",
    "cardMask": "**** **** **** 0366",
    "isTest": true,
    "createdAt": "2025-11-07T12:34:56.789Z"
  }
}
```

#### Пример ответа (ошибка валидации)

```json
{
  "success": false,
  "status": "FAILED",
  "message": "Card validation failed",
  "errors": [
    "Неверный номер карты",
    "Неверный срок действия карты или карта просрочена"
  ]
}
```

---

## Тестовые карты

Используйте эти номера карт для тестирования (все проходят проверку Luhn):

### Visa
- `4532015112830366`
- `4556737586899855`

### MasterCard
- `5425233430109903`
- `2221000000000009`

### Mir
- `2200000000000004`

### Невалидные карты (для тестирования ошибок)
- `1234567890123456` - не проходит Luhn
- `0000000000000000` - не проходит Luhn

---

## Контрольные точки

| Код | Описание |
|-----|----------|
| `t0` | Момент записи мероприятия в каталог (появление на сайте) |
| `ti10` | Начало приема заявок |
| `ti20` | Окончание приема заявок |
| `ti30` | Начало оформления договоров на участие |
| `ti40` | Начало проведения мероприятия |
| `ti50` | Окончание проведения мероприятия |
| `t999` | Момент удаления мероприятия из каталога |

---

## Тексты извещений

### t0 → ti10
- **Извещение-1**: Опубликовали объявление о мероприятии – цену, сроки и другие необходимые сведения.
- **Извещение-2**: Начало приема заявок на участие

### ti10 → ti20
- **Извещение-1**: Принимаем заявки на участие в мероприятии и обеспечительные платежи
- **Извещение-2**: Окончание приема заявок на участие, начало калькуляции складочных цен

### ti20 → ti30
- **Извещение-1**: Подводим итоги сбора средств, готовим документы для расчетов с заявителями.
- **Извещение-2**: Объявление результатов калькуляции складочных цен

### ti30 → ti40
- **Извещение-1**: Собрано достаточно средств, мероприятие состоится, проводим расчеты с заявителями
- **Извещение-1 (отмена)**: Собрано недостаточно средств, проводим расчеты с заявителями
- **Извещение-2**: Начало мероприятия
- **Извещение-2 (отмена)**: Мероприятие не состоится

### ti40 → ti50
- **Извещение-1**: Проводится мероприятие
- **Извещение-1 (отмена)**: Собрано недостаточно средств, проводим расчеты с заявителями
- **Извещение-2**: Окончание мероприятия
- **Извещение-2 (отмена)**: Мероприятие не состоится

### ti50 → t999
- **Извещение-1**: Мероприятие завершилось
- **Извещение-1 (отмена)**: Истек срок проведения мероприятия

---

## База данных

### Модели

#### Event
Основная информация о мероприятии

```prisma
model Event {
  id                   String   @id @default(uuid())
  title                String
  controlPlan          String   // JSON: ["t0", "ti10", ...]
  currentControlPoint  String?  // t0 | ti10 | ti20 | ...
  isCancelled          Boolean  @default(false)
  // ... другие поля
}
```

#### EventStatusHistory
История изменений статусов мероприятия

```prisma
model EventStatusHistory {
  id         String   @id @default(uuid())
  eventId    String
  statusCode String   // t0 | ti10 | ti20 | ...
  note       String?
  createdAt  DateTime @default(now())
}
```

#### Payment
Платежи (все тестовые)

```prisma
model Payment {
  id             String   @id @default(uuid())
  eventId        String
  userId         String?
  amount         Int      // в копейках
  currency       String   @default("RUB")
  status         String   // PENDING | SUCCESS | FAILED
  providerTxnId  String?  // TEST-UUID
  isTest         Boolean  @default(true)
  createdAt      DateTime @default(now())
}
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Bad Request - невалидные данные |
| 404 | Not Found - мероприятие не найдено |
| 500 | Internal Server Error - ошибка сервера |

---

## Безопасность

⚠️ **Важно:**

1. Номера карт **НЕ сохраняются** в базе данных
2. Все платежи помечены как тестовые (`isTest = true`)
3. Сохраняется только:
   - Замаскированный номер карты (**** **** **** 1234)
   - Тип платежной системы (Visa, MasterCard, etc.)
   - Тестовый ID транзакции (TEST-UUID)

---

## Примеры использования

### Полный цикл мероприятия

```bash
# 1. Получить текущее состояние
curl http://localhost:3000/api/events/ev_test_early/control-points

# 2. Начать прием заявок (ti10)
curl -X PUT http://localhost:3000/api/events/ev_test_early/control-point \
  -H "Content-Type: application/json" \
  -d '{"currentControlPoint": "ti10", "note": "Начали прием заявок"}'

# 3. Принять платеж
curl -X POST http://localhost:3000/api/payments/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "ev_test_early",
    "cardNumber": "4532015112830366",
    "expiry": "12/25",
    "cvc": "123",
    "amount": 10000
  }'

# 4. Закрыть прием заявок (ti20)
curl -X PUT http://localhost:3000/api/events/ev_test_early/control-point \
  -H "Content-Type: application/json" \
  -d '{"currentControlPoint": "ti20", "note": "Прием заявок завершен"}'

# 5. Проверить извещения
curl http://localhost:3000/api/events/ev_test_early/control-points
```

---

## Дополнительные ресурсы

- [Prisma Documentation](https://www.prisma.io/docs)
- [Nuxt 3 Server Routes](https://nuxt.com/docs/guide/directory-structure/server)
- [Vitest Documentation](https://vitest.dev/)

