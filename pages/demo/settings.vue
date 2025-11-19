<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white">
    <div class="container mx-auto px-4 py-8 max-w-[1200px]">
      <!-- Главное меню -->
      <DemoNavigation />
      
      <!-- Header -->
      <div class="mb-8">
        <div>
          <h1 class="text-4xl font-bold mb-1 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] bg-clip-text text-transparent">
            Настройки/регистр
          </h1>
          <p class="text-white/60 text-sm">Управление API-ключом и документация по внешнему API</p>
        </div>
      </div>

      <!-- Раздел 1: Управление API-ключом -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">🔑 Управление API-ключом</h2>
        <p class="text-white/60 text-sm mb-4">
          Зарегистрируйтесь и получите уникальный API ключ для работы с внешним API. Producer Name будет автоматически привязан к вашему ключу.
        </p>
        
        <!-- Текущий API-ключ -->
        <div v-if="apiKey" class="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-green-300 text-sm font-medium">Текущий API-ключ:</p>
            <div class="flex gap-2">
              <button
                @click="copyApiKey"
                class="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-xs transition-colors"
              >
                {{ copied ? '✓ Скопировано' : '📋 Копировать' }}
              </button>
              <button
                @click="clearApiKey"
                class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 text-xs transition-colors"
              >
                🗑️ Очистить
              </button>
            </div>
          </div>
          <pre class="text-green-200 text-xs font-mono break-all bg-black/30 p-2 rounded">{{ apiKey }}</pre>
        </div>

        <!-- Форма регистрации -->
        <form @submit.prevent="register" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Producer Name <span class="text-red-400">*</span>
            </label>
            <input 
              v-model="registerForm.producerCode"
              type="text" 
              required
              placeholder="прод1"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
            >
            <p class="text-xs text-white/50 mt-1">Отображаемое имя продюсера (будет привязано к API ключу)</p>
          </div>

          <button
            type="submit"
            :disabled="isRegistering"
            class="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isRegistering ? 'Регистрация...' : 'Зарегистрироваться и получить API ключ' }}
          </button>
        </form>

        <!-- Сообщение о прогрессе регистрации -->
        <div v-if="registerProgressMessage && isRegistering" class="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-blue-300 text-sm">{{ registerProgressMessage }}</p>
          </div>
        </div>

        <div v-if="registerResponse" class="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <p class="text-green-300 text-sm font-medium mb-2">Регистрация успешна!</p>
          <p class="text-green-200/70 text-xs mb-2">Ваш API ключ (сохранен автоматически):</p>
          <pre class="text-green-200 text-xs font-mono break-all bg-black/30 p-2 rounded mb-4">{{ registerResponse.data?.apiKey || registerResponse.apiKey }}</pre>
        </div>

        <div v-if="registerError" class="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <p class="text-red-300 text-sm font-medium mb-2">Ошибка регистрации</p>
          <ul class="space-y-1">
            <li v-for="(errorMessage, index) in formattedRegisterErrors" :key="index" class="text-red-300 text-xs">
              {{ errorMessage }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Раздел 2: Документация API -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 class="text-2xl font-semibold mb-4">📚 Документация внешнего API</h2>
        
        <div class="space-y-6">
          <!-- Общая информация -->
          <div>
            <h3 class="text-xl font-semibold mb-3 text-[#007AFF]">Общая информация</h3>
            <div class="bg-black/30 rounded-xl p-4 space-y-3 text-sm">
              <p class="text-white/80">
                <strong class="text-white">Базовый URL:</strong> <code class="bg-white/10 px-2 py-1 rounded">{{ apiBaseUrl }}/api/external</code>
              </p>
              <p class="text-white/80">
                <strong class="text-white">Авторизация:</strong> Все запросы (кроме регистрации) требуют заголовок <code class="bg-white/10 px-2 py-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
              </p>
              <p class="text-white/80">
                <strong class="text-white">Формат данных:</strong> JSON (Content-Type: application/json)
              </p>
              <p class="text-white/80">
                <strong class="text-white">Формат ответов:</strong> Все ответы возвращаются в формате JSON с полями <code class="bg-white/10 px-2 py-1 rounded">success</code>, <code class="bg-white/10 px-2 py-1 rounded">data</code>, <code class="bg-white/10 px-2 py-1 rounded">message</code>, <code class="bg-white/10 px-2 py-1 rounded">errors</code>
              </p>
            </div>
          </div>

          <!-- Эндпоинт 1: Регистрация -->
          <div>
            <h3 class="text-xl font-semibold mb-3 text-[#007AFF]">1. Регистрация и получение API-ключа</h3>
            <div class="bg-black/30 rounded-xl p-4 space-y-3">
              <div>
                <p class="text-white font-medium mb-2">POST <code class="bg-white/10 px-2 py-1 rounded">/api/external/register</code></p>
                <p class="text-white/70 text-sm mb-3">Регистрирует нового продюсера и возвращает API-ключ для дальнейшей работы.</p>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Параметры запроса:</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>{
  "producerCode": "string"  // Имя продюсера (обязательно)
}</code></pre>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример успешного ответа (200 OK):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>{
  "success": true,
  "data": {
    "apiKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "producerCode": "прод1"
  },
  "message": "Регистрация успешна"
}</code></pre>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример ответа с ошибкой (400 Bad Request):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>{
  "success": false,
  "errors": [
    {
      "message": "Producer Code уже существует"
    }
  ],
  "message": "Ошибка валидации"
}</code></pre>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример использования (JavaScript):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>const response = await fetch('{{ apiBaseUrl }}/api/external/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    producerCode: 'прод1'
  })
});

const data = await response.json();
if (data.success) {
  console.log('API Key:', data.data.apiKey);
}</code></pre>
              </div>
            </div>
          </div>

          <!-- Эндпоинт 2: Создание/обновление события -->
          <div>
            <h3 class="text-xl font-semibold mb-3 text-[#007AFF]">2. Создание/обновление события</h3>
            <div class="bg-black/30 rounded-xl p-4 space-y-3">
              <div>
                <p class="text-white font-medium mb-2">POST <code class="bg-white/10 px-2 py-1 rounded">/api/external/events</code></p>
                <p class="text-white/70 text-sm mb-3">Создает новое событие или обновляет существующее (если передан <code class="bg-white/10 px-1 rounded">id</code>). Требует авторизацию через API-ключ.</p>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Параметры запроса:</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>{
  "id": "string",                    // ID события (опционально, для обновления)
  "title": "string",                 // Название мероприятия (обязательно)
  "authorName": "string",            // Имя автора в свободной форме (обязательно)
  "location": "string",              // Место проведения (обязательно)
  "seatLimit": number,               // Лимит мест (обязательно)
  "pricePerSeat": number,            // Цена за место в рублях (обязательно)
  "description": "string",           // Описание (опционально)
  "timezone": "string",              // IANA timezone (например, "Europe/Moscow") (обязательно)
  "createdAtClient": "ISO8601",      // Дата создания на клиенте (опционально)
  "startApplicationsAt": "ISO8601", // Начало приема заявок (ti10) (обязательно)
  "endApplicationsAt": "ISO8601",    // Окончание приема заявок (ti20) (обязательно)
  "startContractsAt": "ISO8601",     // Начало оформления договоров (ti30) (обязательно)
  "startAt": "ISO8601",              // Начало мероприятия (ti40) (обязательно)
  "endAt": "ISO8601"                 // Окончание мероприятия (ti50) (опционально)
}</code></pre>
                <p class="text-white/60 text-xs mt-2">
                  <strong>Примечание:</strong> Все даты должны быть в формате ISO 8601 (например, "2025-11-15T14:30:00.000Z"). 
                  Если передается <code class="bg-white/10 px-1 rounded">id</code>, событие обновляется; иначе создается новое.
                </p>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример успешного ответа (200 OK):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>{
  "success": true,
  "data": {
    "id": "evt_1234567890",
    "title": "Мастер-класс по кулинарии",
    "status": "draft",
    "createdAt": "2025-11-15T10:00:00.000Z",
    "updatedAt": "2025-11-15T10:00:00.000Z"
  },
  "message": "Событие успешно создано"
}</code></pre>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример ответа с ошибкой (400 Bad Request):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>{
  "success": false,
  "errors": [
    {
      "message": "Поле 'title' обязательно для заполнения"
    },
    {
      "message": "Дата окончания приема заявок должна быть позже даты начала"
    }
  ],
  "message": "Ошибка валидации"
}</code></pre>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример использования (JavaScript):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>const apiKey = 'YOUR_API_KEY';
const eventData = {
  title: 'Мастер-класс по кулинарии',
  authorName: 'Иван Иванов',
  location: 'Москва, ул. Примерная, 1',
  seatLimit: 20,
  pricePerSeat: 5000,
  description: 'Увлекательный мастер-класс...',
  timezone: 'Europe/Moscow',
  startApplicationsAt: '2025-11-15T10:00:00.000Z',
  endApplicationsAt: '2025-11-20T18:00:00.000Z',
  startContractsAt: '2025-11-21T10:00:00.000Z',
  startAt: '2025-11-25T14:00:00.000Z',
  endAt: '2025-11-25T18:00:00.000Z'
};

const response = await fetch('{{ apiBaseUrl }}/api/external/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify(eventData)
});

const data = await response.json();
if (data.success) {
  console.log('Событие создано:', data.data.id);
}</code></pre>
              </div>
            </div>
          </div>

          <!-- Эндпоинт 3: Получение статуса события -->
          <div>
            <h3 class="text-xl font-semibold mb-3 text-[#007AFF]">3. Получение статуса события</h3>
            <div class="bg-black/30 rounded-xl p-4 space-y-3">
              <div>
                <p class="text-white font-medium mb-2">GET <code class="bg-white/10 px-2 py-1 rounded">/api/external/events/:id</code></p>
                <p class="text-white/70 text-sm mb-3">Получает информацию о событии по его ID. Требует авторизацию через API-ключ. Позволяет проверить статус публикации и актуальные данные события на платформе.</p>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Параметры URL:</p>
                <ul class="list-disc list-inside text-white/70 text-sm space-y-1 ml-4">
                  <li><code class="bg-white/10 px-1 rounded">:id</code> — ID события на платформе (обязательно)</li>
                </ul>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример успешного ответа (200 OK):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>{
  "success": true,
  "data": {
    "id": "evt_1234567890",
    "title": "Мастер-класс по кулинарии",
    "authorName": "Иван Иванов",
    "location": "Москва, ул. Примерная, 1",
    "seatLimit": 20,
    "pricePerSeat": 5000,
    "status": "published",
    "isPublished": true,
    "createdAt": "2025-11-15T10:00:00.000Z",
    "updatedAt": "2025-11-15T12:00:00.000Z",
    "startApplicationsAt": "2025-11-15T10:00:00.000Z",
    "endApplicationsAt": "2025-11-20T18:00:00.000Z",
    "startContractsAt": "2025-11-21T10:00:00.000Z",
    "startAt": "2025-11-25T14:00:00.000Z",
    "endAt": "2025-11-25T18:00:00.000Z"
  },
  "message": "Событие найдено"
}</code></pre>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример ответа с ошибкой (404 Not Found):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>{
  "success": false,
  "message": "Событие не найдено",
  "errors": [
    {
      "message": "Событие с указанным ID не существует"
    }
  ]
}</code></pre>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример ответа с ошибкой авторизации (401 Unauthorized):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>{
  "success": false,
  "message": "Не авторизован",
  "errors": [
    {
      "message": "Неверный или отсутствующий API-ключ"
    }
  ]
}</code></pre>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример использования (JavaScript):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>const apiKey = 'YOUR_API_KEY';
const eventId = 'evt_1234567890';

const response = await fetch(`{{ apiBaseUrl }}/api/external/events/${eventId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

const data = await response.json();
if (data.success) {
  console.log('Статус события:', data.data.status);
  console.log('Опубликовано:', data.data.isPublished);
}</code></pre>
              </div>
            </div>
          </div>

          <!-- Эндпоинт 4: Получение данных мониторинга -->
          <div>
            <h3 class="text-xl font-semibold mb-3 text-[#007AFF]">4. Получение данных мониторинга</h3>
            <div class="bg-black/30 rounded-xl p-4 space-y-3">
              <div>
                <p class="text-white font-medium mb-2">GET <code class="bg-white/10 px-2 py-1 rounded">/api/external/events/:id/monitoring</code></p>
                <p class="text-white/70 text-sm mb-3">
                  Получает данные мониторинга события по его ID. Доступен только после наступления контрольной точки Ти20 (окончание приема заявок). 
                  Требует авторизацию через API-ключ. Возвращает список заявителей, суммы оплат и другую статистику.
                </p>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Параметры URL:</p>
                <ul class="list-disc list-inside text-white/70 text-sm space-y-1 ml-4">
                  <li><code class="bg-white/10 px-1 rounded">:id</code> — ID события на платформе (обязательно)</li>
                </ul>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример успешного ответа (200 OK):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>{
  "success": true,
  "data": {
    "applicants": [
      {
        "code": "APP001",
        "login": "user1",
        "seats": 2,
        "paidAmount": 10000,
        "payments": [
          {
            "amount": 5000,
            "createdAt": "2025-11-15T10:00:00.000Z",
            "paymentId": "pay_123",
            "status": "completed"
          },
          {
            "amount": 5000,
            "createdAt": "2025-11-16T14:30:00.000Z",
            "paymentId": "pay_124",
            "status": "completed"
          }
        ]
      },
      {
        "code": "APP002",
        "login": "user2",
        "seats": 1,
        "paidAmount": 5000,
        "payments": [
          {
            "amount": 5000,
            "createdAt": "2025-11-15T12:00:00.000Z",
            "paymentId": "pay_125",
            "status": "completed"
          }
        ]
      }
    ],
    "collected": 15000
  },
  "message": "Данные мониторинга получены"
}</code></pre>
                <p class="text-white/60 text-xs mt-2">
                  <strong>Примечание:</strong> 
                  Поле <code class="bg-white/10 px-1 rounded">collected</code> содержит общую сумму всех платежей. 
                  Заявители отсортированы по сумме оплаты (по убыванию) для удобства анализа.
                </p>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример ответа с ошибкой (403 Forbidden - Ти20 еще не наступила):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>{
  "success": false,
  "message": "Данные мониторинга недоступны",
  "errors": [
    {
      "message": "Данные мониторинга доступны только после окончания приема заявок (Ти20)"
    }
  ]
}</code></pre>
              </div>

              <div>
                <p class="text-white font-medium mb-2">Пример использования (JavaScript):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>const apiKey = 'YOUR_API_KEY';
const eventId = 'evt_1234567890';

const response = await fetch(`{{ apiBaseUrl }}/api/external/events/${eventId}/monitoring`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

const data = await response.json();
if (data.success) {
  console.log('Всего заявителей:', data.data.applicants.length);
  console.log('Общая сумма:', data.data.collected);
  data.data.applicants.forEach(applicant => {
    console.log(`Заявитель ${applicant.code}: оплачено ${applicant.paidAmount}`);
  });
}</code></pre>
              </div>
            </div>
          </div>

          <!-- Коды ошибок -->
          <div>
            <h3 class="text-xl font-semibold mb-3 text-[#007AFF]">Коды ошибок HTTP</h3>
            <div class="bg-black/30 rounded-xl p-4">
              <div class="space-y-2 text-sm">
                <div class="flex items-start gap-3">
                  <code class="bg-red-500/20 text-red-300 px-2 py-1 rounded min-w-[80px] text-center">400</code>
                  <div>
                    <p class="text-white font-medium">Bad Request</p>
                    <p class="text-white/60">Ошибка валидации данных запроса</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <code class="bg-red-500/20 text-red-300 px-2 py-1 rounded min-w-[80px] text-center">401</code>
                  <div>
                    <p class="text-white font-medium">Unauthorized</p>
                    <p class="text-white/60">Неверный или отсутствующий API-ключ</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <code class="bg-red-500/20 text-red-300 px-2 py-1 rounded min-w-[80px] text-center">403</code>
                  <div>
                    <p class="text-white font-medium">Forbidden</p>
                    <p class="text-white/60">Доступ запрещен (событие принадлежит другому продюсеру)</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <code class="bg-red-500/20 text-red-300 px-2 py-1 rounded min-w-[80px] text-center">404</code>
                  <div>
                    <p class="text-white font-medium">Not Found</p>
                    <p class="text-white/60">Ресурс не найден</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <code class="bg-red-500/20 text-red-300 px-2 py-1 rounded min-w-[80px] text-center">500</code>
                  <div>
                    <p class="text-white font-medium">Internal Server Error</p>
                    <p class="text-white/60">Внутренняя ошибка сервера</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Важные замечания -->
          <div>
            <h3 class="text-xl font-semibold mb-3 text-[#007AFF]">⚠️ Важные замечания</h3>
            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-2 text-sm">
              <p class="text-yellow-200">
                <strong>1. Безопасность API-ключа:</strong> Никогда не публикуйте ваш API-ключ в публичных репозиториях или клиентском коде. Храните его в безопасном месте.
              </p>
              <p class="text-yellow-200">
                <strong>2. Ограничение редактирования:</strong> После наступления контрольной точки Ти20 (окончание приема заявок) редактирование события на платформе блокируется.
              </p>
              <p class="text-yellow-200">
                <strong>3. Формат дат:</strong> Все даты должны передаваться в формате ISO 8601 с указанием часового пояса или в UTC.
              </p>
              <p class="text-yellow-200">
                <strong>4. Валидация данных:</strong> Платформа проверяет корректность всех переданных данных. Убедитесь, что даты соответствуют логике временных точек (ti10 &lt; ti20 &lt; ti30 &lt; ti40).
              </p>
              <p class="text-yellow-200">
                <strong>5. Обновление событий:</strong> При обновлении события передавайте полный набор данных, а не только измененные поля.
              </p>
              <p class="text-yellow-200">
                <strong>6. Данные мониторинга:</strong> Получение данных мониторинга доступно только после наступления контрольной точки Ти20 (окончание приема заявок). До этого момента эндпоинт мониторинга будет возвращать ошибку 403.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl

// API Key management
const apiKey = ref<string>('')
const copied = ref(false)

// Форма регистрации
const registerForm = ref({
  producerCode: '' // Внутренне используем producerCode для соответствия API
})

const isRegistering = ref(false)
const registerResponse = ref<any>(null)
const registerError = ref<any>(null)
const registerProgressMessage = ref<string>('')
const registerStartTime = ref<number | null>(null)
let registerProgressInterval: NodeJS.Timeout | null = null

const formattedRegisterErrors = computed(() => {
  if (!registerError.value) return []
  
  if (registerError.value.errors && Array.isArray(registerError.value.errors)) {
    return registerError.value.errors.map((err: any) => err.message || err)
  }
  
  if (registerError.value.message) {
    return [registerError.value.message]
  }
  
  if (typeof registerError.value === 'string') {
    return [registerError.value]
  }
  
  return ['Произошла ошибка при регистрации']
})

// Загрузка API ключа
const loadApiKey = () => {
  if (typeof window !== 'undefined') {
    apiKey.value = localStorage.getItem('external_api_key') || ''
  }
}

// Копирование API ключа
const copyApiKey = async () => {
  if (apiKey.value && typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(apiKey.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

// Очистка API ключа
const clearApiKey = () => {
  if (confirm('Вы уверены, что хотите очистить API ключ?')) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('external_api_key')
      apiKey.value = ''
    }
  }
}

// Сохранение API ключа
const saveApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('external_api_key', key)
    apiKey.value = key
  }
}

const register = async () => {
  isRegistering.value = true
  registerError.value = null
  registerResponse.value = null
  registerProgressMessage.value = 'Начало регистрации...'
  registerStartTime.value = Date.now()

  // Очищаем предыдущий интервал, если он есть
  if (registerProgressInterval) {
    clearInterval(registerProgressInterval)
    registerProgressInterval = null
  }

  // Функция для обновления сообщения о прогрессе
  const updateProgressMessage = () => {
    if (registerStartTime.value) {
      const elapsedSeconds = Math.floor((Date.now() - registerStartTime.value) / 1000)
      const minutes = Math.floor(elapsedSeconds / 60)
      const seconds = elapsedSeconds % 60
      
      if (minutes > 0) {
        registerProgressMessage.value = `Регистрация выполняется уже ${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'} ${seconds > 0 ? `и ${seconds} ${seconds === 1 ? 'секунду' : seconds < 5 ? 'секунды' : 'секунд'}` : ''}. Пожалуйста, подождите...`
      } else {
        registerProgressMessage.value = `Регистрация выполняется уже ${elapsedSeconds} ${elapsedSeconds === 1 ? 'секунду' : elapsedSeconds < 5 ? 'секунды' : 'секунд'}. Пожалуйста, подождите...`
      }
    }
  }

  // Обновляем сообщение сразу
  updateProgressMessage()

  // Устанавливаем интервал для обновления сообщения каждые 5 секунд
  registerProgressInterval = setInterval(updateProgressMessage, 5000)

  try {
    const res = await fetch(`${apiBaseUrl}/api/external/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerForm.value)
    })

    const data = await res.json()
    
    if (res.ok && data.success) {
      registerResponse.value = data
      if (data.data?.apiKey) {
        saveApiKey(data.data.apiKey)
      }
      registerProgressMessage.value = 'Регистрация успешно завершена!'
    } else {
      registerError.value = data
      registerProgressMessage.value = ''
    }
  } catch (err: any) {
    registerError.value = { message: err.message || 'Неизвестная ошибка' }
    registerProgressMessage.value = ''
  } finally {
    isRegistering.value = false
    registerStartTime.value = null
    
    // Очищаем интервал
    if (registerProgressInterval) {
      clearInterval(registerProgressInterval)
      registerProgressInterval = null
    }
    
    // Очищаем сообщение через 3 секунды после завершения
    setTimeout(() => {
      registerProgressMessage.value = ''
    }, 3000)
  }
}

onMounted(() => {
  loadApiKey()
})

// Очистка интервала при размонтировании компонента
onUnmounted(() => {
  if (registerProgressInterval) {
    clearInterval(registerProgressInterval)
    registerProgressInterval = null
  }
})
</script>


