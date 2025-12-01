<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white">
    <div class="container mx-auto px-4 py-8 max-w-[1200px]">
      <!-- Главное меню -->
      <DemoNavigation />
      
      <!-- Header -->
      <div class="mb-8">
        <div>
          <h1 class="text-4xl font-bold mb-1 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] bg-clip-text text-transparent">
            Настройки
          </h1>
          <p class="text-white/60 text-sm">Настройки демо-сайта и документация по внешнему API</p>
        </div>
      </div>

      <!-- Раздел 0: Настройка URL платформы -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">🔗 URL Платформы</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Базовый URL платформы для API-запросов
            </label>
            <div class="flex gap-3">
              <input 
                v-model="platformUrlForm"
                type="text" 
                placeholder="https://consolidator-premium.onrender.com"
                class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
              <button
                @click="savePlatformUrl"
                class="bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
              >
                💾 Сохранить
              </button>
            </div>
            <p class="text-white/50 text-xs mt-2">
              Этот URL используется для всех API-запросов к платформе. По умолчанию: <code class="bg-white/10 px-1 rounded">{{ defaultPlatformUrl }}</code>
            </p>
          </div>
          
          <!-- Текущий сохраненный URL -->
          <div v-if="savedPlatformUrl" class="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-300 text-sm font-medium mb-1">✅ Текущий сохраненный URL:</p>
                <code class="text-green-200 text-sm bg-green-500/20 px-2 py-1 rounded">{{ savedPlatformUrl }}</code>
              </div>
              <button
                @click="clearPlatformUrl"
                class="text-red-400 hover:text-red-300 text-sm underline"
              >
                Очистить
              </button>
            </div>
          </div>
          
          <!-- Предупреждение если URL не установлен -->
          <div v-else class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p class="text-yellow-300 text-sm font-medium mb-1">⚠️ URL платформы не установлен</p>
            <p class="text-yellow-200/70 text-sm">
              Введите URL платформы выше и нажмите "Сохранить". Без этой настройки запросы к API могут не работать корректно.
            </p>
          </div>
          
          <!-- Уведомление об успешном сохранении -->
          <div v-if="platformUrlSaveSuccess" class="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
            <p class="text-green-300 text-sm">✅ URL платформы успешно сохранен!</p>
          </div>
        </div>
      </div>

      <!-- Раздел 1: Информация о сайте -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">ℹ️ Информация о сайте</h2>
        <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p class="text-blue-300 text-sm font-medium mb-2">Автоматическая идентификация</p>
          <p class="text-white/70 text-sm mb-3">
            API автоматически определяет ваш сайт по заголовку <code class="bg-white/10 px-1 rounded">Origin</code> или <code class="bg-white/10 px-1 rounded">Referer</code> из HTTP-запроса. 
            Указывать имя сайта в запросах не требуется.
          </p>
          <p class="text-white/70 text-sm">
            <strong>Важно:</strong> Убедитесь, что ваш домен добавлен в белый список платформы модератором. 
            Для этого обратитесь к администратору платформы с запросом на добавление вашего домена в таблицу "Белые списки".
          </p>
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
                <strong class="text-white">Авторизация:</strong> API автоматически определяет сайт по заголовку <code class="bg-white/10 px-2 py-1 rounded">Origin</code> или <code class="bg-white/10 px-2 py-1 rounded">Referer</code> из HTTP-запроса. Сайт должен быть добавлен в белый список платформы модератором (указан домен в таблице "Белые списки"). Указывать <code class="bg-white/10 px-2 py-1 rounded">siteName</code> в теле запроса не требуется.
              </p>
              <p class="text-white/80">
                <strong class="text-white">Формат данных:</strong> JSON (Content-Type: application/json)
              </p>
              <p class="text-white/80">
                <strong class="text-white">Формат ответов:</strong> Все ответы возвращаются в формате JSON с полями <code class="bg-white/10 px-2 py-1 rounded">success</code>, <code class="bg-white/10 px-2 py-1 rounded">data</code>, <code class="bg-white/10 px-2 py-1 rounded">message</code>, <code class="bg-white/10 px-2 py-1 rounded">errors</code>
              </p>
            </div>
          </div>

          <!-- Эндпоинт 1: Создание/обновление события -->
          <div>
            <h3 class="text-xl font-semibold mb-3 text-[#007AFF]">1. Создание/обновление события</h3>
            <div class="bg-black/30 rounded-xl p-4 space-y-3">
              <div>
                <p class="text-white font-medium mb-2">POST <code class="bg-white/10 px-2 py-1 rounded">/api/external/events</code></p>
                <p class="text-white/70 text-sm mb-3">Создает новое событие или обновляет существующее (если передан <code class="bg-white/10 px-1 rounded">id</code>). API автоматически определяет сайт по заголовку <code class="bg-white/10 px-1 rounded">Origin</code> или <code class="bg-white/10 px-1 rounded">Referer</code> из HTTP-запроса.</p>
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
    "requiresModeration": true,
    "createdAt": "2025-11-15T10:00:00.000Z",
    "updatedAt": "2025-11-15T10:00:00.000Z"
  },
  "message": "Событие успешно создано и ожидает модерации"
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
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>const eventData = {
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
    'Content-Type': 'application/json'
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

          <!-- Эндпоинт 2: Получение статуса события -->
          <div>
            <h3 class="text-xl font-semibold mb-3 text-[#007AFF]">2. Получение статуса события</h3>
            <div class="bg-black/30 rounded-xl p-4 space-y-3">
              <div>
                <p class="text-white font-medium mb-2">GET <code class="bg-white/10 px-2 py-1 rounded">/api/external/events/:id</code></p>
                <p class="text-white/70 text-sm mb-3">Получает информацию о событии по его ID. Позволяет проверить статус публикации и актуальные данные события на платформе.</p>
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
    "requiresModeration": false,
    "siteAlias": "demo-site-1",
    "isPublished": true,
    "createdAt": "2025-11-15T10:00:00.000Z",
    "updatedAt": "2025-11-15T12:00:00.000Z",
    "publishedAt": "2025-11-15T12:00:00.000Z",
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
                <p class="text-white font-medium mb-2">Пример использования (JavaScript):</p>
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>const eventId = 'evt_1234567890';

const response = await fetch(`{{ apiBaseUrl }}/api/external/events/${eventId}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
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

          <!-- Эндпоинт 3: Получение данных мониторинга -->
          <div>
            <h3 class="text-xl font-semibold mb-3 text-[#007AFF]">3. Получение данных мониторинга</h3>
            <div class="bg-black/30 rounded-xl p-4 space-y-3">
              <div>
                <p class="text-white font-medium mb-2">GET <code class="bg-white/10 px-2 py-1 rounded">/api/external/events/:id/monitoring</code></p>
                <p class="text-white/70 text-sm mb-3">
                  Получает данные мониторинга события по его ID. Доступен только после наступления контрольной точки Ти20 (окончание приема заявок). 
                  Возвращает список заявителей, суммы оплат и другую статистику.
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
    "collected": 15000,
    "personalCalculations": [
      {
        "applicantCode": "APP001",
        "applicantLogin": "user1",
        "expectedPayment": 10000,
        "actualPayment": 10000,
        "extraContribution": 0,
        "deficit": 0,
        "surplusShare": 0,
        "refundAmount": 0
      }
    ],
    "totalParticipantsExtras": 0
  },
  "message": "Данные мониторинга получены"
}</code></pre>
                <p class="text-white/60 text-xs mt-2">
                  <strong>Примечание:</strong> 
                  Поле <code class="bg-white/10 px-1 rounded">collected</code> содержит общую сумму всех платежей. 
                  Массив <code class="bg-white/10 px-1 rounded">personalCalculations</code> содержит предрассчитанные персональные результаты для каждого участника.
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
                <pre class="bg-black/50 rounded-lg p-3 text-xs overflow-x-auto"><code>const eventId = 'evt_1234567890';

const response = await fetch(`{{ apiBaseUrl }}/api/external/events/${eventId}/monitoring`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
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
                  <code class="bg-red-500/20 text-red-300 px-2 py-1 rounded min-w-[80px] text-center">403</code>
                  <div>
                    <p class="text-white font-medium">Forbidden</p>
                    <p class="text-white/60">Сайт не найден в белом списке, деактивирован или недостаточно прав</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <code class="bg-orange-500/20 text-orange-300 px-2 py-1 rounded min-w-[80px] text-center">409</code>
                  <div>
                    <p class="text-white font-medium">Conflict</p>
                    <p class="text-white/60">Операция невозможна из-за временных ограничений (например, после ti20)</p>
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
                <strong>1. Белый список сайтов:</strong> Ваш сайт должен быть добавлен в белый список платформы модератором. Обратитесь к администратору для добавления.
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
              <p class="text-yellow-200">
                <strong>7. Модерация событий:</strong> События от некоторых сайтов могут требовать модерации перед публикацией. Статус модерации можно проверить через эндпоинт получения статуса события.
              </p>
              <p class="text-yellow-200">
                <strong>8. Система белых списков:</strong> Замена API-ключей на систему белых списков упрощает интеграцию. Каждый сайт идентифицируется по имени и может иметь индивидуальные настройки модерации.
              </p>
              <p class="text-yellow-200">
                <strong>9. Персональные расчеты:</strong> Данные мониторинга теперь включают предрассчитанные персональные результаты для каждого участника, включая ожидаемые платежи, переплаты и возвраты.
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

// Platform URL management
const PLATFORM_URL_KEY = 'demo_platform_url'
const defaultPlatformUrl = 'https://consolidator-premium.onrender.com'
const platformUrlForm = ref<string>('')
const savedPlatformUrl = ref<string>('')
const platformUrlSaveSuccess = ref(false)

// Загрузка URL платформы
const loadPlatformUrl = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(PLATFORM_URL_KEY)
    savedPlatformUrl.value = stored || ''
    platformUrlForm.value = stored || defaultPlatformUrl
  }
}

// Сохранение URL платформы
const savePlatformUrl = () => {
  if (typeof window !== 'undefined') {
    const url = platformUrlForm.value.trim()
    if (url) {
      // Убираем trailing slash если есть
      const cleanUrl = url.replace(/\/+$/, '')
      localStorage.setItem(PLATFORM_URL_KEY, cleanUrl)
      savedPlatformUrl.value = cleanUrl
      platformUrlForm.value = cleanUrl
      
      // Также сохраняем как demo_site_name для совместимости
      localStorage.setItem('demo_site_name', cleanUrl)
      siteName.value = cleanUrl
      
      platformUrlSaveSuccess.value = true
      setTimeout(() => { platformUrlSaveSuccess.value = false }, 3000)
    }
  }
}

// Очистка URL платформы
const clearPlatformUrl = () => {
  if (confirm('Вы уверены, что хотите очистить URL платформы?')) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PLATFORM_URL_KEY)
      localStorage.removeItem('demo_site_name')
      savedPlatformUrl.value = ''
      platformUrlForm.value = defaultPlatformUrl
      siteName.value = ''
    }
  }
}

// Site Name management (legacy, для совместимости)
const siteName = ref<string>('')
const copied = ref(false)
const saveSuccess = ref(false)

// Форма настройки имени сайта
const siteNameForm = ref({
  siteName: ''
})

// Загрузка имени сайта
const loadSiteName = () => {
  if (typeof window !== 'undefined') {
    siteName.value = localStorage.getItem('demo_site_name') || ''
    siteNameForm.value.siteName = siteName.value
  }
}

// Копирование имени сайта
const copySiteName = async () => {
  if (siteName.value && typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(siteName.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

// Очистка имени сайта
const clearSiteName = () => {
  if (confirm('Вы уверены, что хотите очистить имя сайта?')) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_site_name')
      siteName.value = ''
      siteNameForm.value.siteName = ''
    }
  }
}

// Сохранение имени сайта
const saveSiteName = () => {
  if (siteNameForm.value.siteName.trim()) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_site_name', siteNameForm.value.siteName.trim())
      siteName.value = siteNameForm.value.siteName.trim()
      saveSuccess.value = true
      setTimeout(() => { saveSuccess.value = false }, 3000)
    }
  }
}

onMounted(() => {
  loadPlatformUrl()
  loadSiteName()
})
</script>



