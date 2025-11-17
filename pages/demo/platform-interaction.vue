<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white">
    <div class="container mx-auto px-4 py-8 max-w-[1000px]">
      <!-- Главное меню -->
      <DemoNavigation />
      
      <!-- Header -->
      <div class="mb-8">
        <div>
          <h1 class="text-4xl font-bold mb-1 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] bg-clip-text text-transparent">
            Взаимодействовать с платформой
          </h1>
          <p class="text-white/60 text-sm">Загрузка эскизов на платформу, обновление статуса и публикация мероприятий</p>
        </div>
      </div>

      <!-- Выбранный Ивент для взаимодействия с платформой -->
      <div v-if="!selectedEventId" class="bg-white/5 border border-white/10 rounded-2xl p-12 text-center mb-6">
        <p class="text-white/50 text-lg mb-2">Ивент не выбран</p>
        <p class="text-white/40 text-sm mb-4">
          Выберите Ивент на странице <NuxtLink to="/demo/select" class="text-blue-400 hover:text-blue-300 underline">Выбрать</NuxtLink> для взаимодействия с платформой
        </p>
      </div>
      
      <div v-else-if="!currentEvent" class="bg-white/5 border border-white/10 rounded-2xl p-12 text-center mb-6">
        <p class="text-white/50 text-lg mb-2">Ивент не найден</p>
        <p class="text-white/40 text-sm">
          Выбранный Ивент был удален. Выберите другой Ивент на странице <NuxtLink to="/demo/select" class="text-blue-400 hover:text-blue-300 underline">Выбрать</NuxtLink>
        </p>
      </div>
      
      <!-- Карточка выбранного Ивента -->
      <div v-else class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div class="flex-1 min-w-0">
            <h2 class="text-2xl font-semibold break-words">Ивент: {{ currentEvent.title }}</h2>
          </div>
          <NuxtLink
            to="/demo/select"
            class="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-300 text-sm transition-colors flex-shrink-0"
          >
            🔄 Выбрать другой Ивент
          </NuxtLink>
        </div>
        
        <!-- Информация о выбранном Ивенте -->
        <div class="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
          <div class="text-xs text-white/50 mb-2 space-y-1">
            <div>Создан: {{ formatEventDate(currentEvent.createdAt) }}</div>
            <div v-if="currentEvent.uploadHistory && currentEvent.uploadHistory.length > 0">
              <div class="mb-1">История загрузок:</div>
              <div class="ml-2 space-y-1">
                <div 
                  v-for="(item, idx) in currentEvent.uploadHistory.slice().reverse()" 
                  :key="idx"
                  :class="[
                    'text-xs',
                    item.status === 'success' ? 'text-green-300/70' : 'text-red-300/70'
                  ]"
                >
                  <span>{{ formatEventDate(item.timestamp) }}</span>
                  <span :class="item.status === 'success' ? 'text-green-400' : 'text-red-400'">
                    {{ item.status === 'success' ? ' ✅' : ' ❌' }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else-if="currentEvent.lastUploadAttempt" class="text-white/40 italic">
              (старая версия данных - история загрузок недоступна)
            </div>
          </div>
          
          <!-- Статус загрузки на платформу -->
          <div class="mb-4">
            <div v-if="currentEvent.uploadStatus === 'upload_success'" class="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
              <span>✅</span>
              <span>Успешно загружен</span>
              <span 
                v-if="currentEvent.uploadHistory && currentEvent.uploadHistory.length > 0" 
                class="text-green-300/70 text-xs"
              >
                ({{ formatEventDate(currentEvent.uploadHistory[currentEvent.uploadHistory.length - 1].timestamp) }})
              </span>
              <span 
                v-else-if="currentEvent.lastUploadAttempt" 
                class="text-green-300/70 text-xs"
              >
                ({{ formatEventDate(currentEvent.lastUploadAttempt) }})
              </span>
            </div>
            <div v-else-if="currentEvent.uploadStatus === 'upload_failed'" class="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
              <span>❌</span>
              <span>В загрузке отказано - обнаружена ошибка</span>
            </div>
            <div v-else class="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
              <span>⏸️</span>
              <span>Не загружен</span>
            </div>
            
            <!-- Дополнительная информация о статусе -->
            <div v-if="currentEvent.uploadStatus === 'upload_success'" class="text-xs text-green-300/70 space-y-1">
              <div v-if="currentEvent.serverId">ID на платформе: <span class="font-mono">{{ currentEvent.serverId }}</span></div>
              <div v-if="currentEvent.isPublished" class="flex items-center gap-1">
                <span>📢</span>
                <span>Опубликован</span>
              </div>
              <div v-else class="flex items-center gap-1">
                <span>📝</span>
                <span>Черновик</span>
              </div>
            </div>
            
            <!-- Отображение ошибок загрузки -->
            <div v-if="currentEvent.uploadStatus === 'upload_failed' && currentEvent.uploadError" class="mt-2">
              <div class="text-xs text-red-300/70 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <!-- Если одна ошибка или массив с одной ошибкой -->
                    <div v-if="getErrorCount(currentEvent.uploadError) === 1" class="break-words">
                      {{ getFirstError(currentEvent.uploadError) }}
                    </div>
                    <!-- Если несколько ошибок -->
                    <div v-else>
                      <div class="font-medium mb-1">
                        Обнаружено {{ getErrorCount(currentEvent.uploadError) }} ошибок:
                      </div>
                      <button
                        @click.stop="toggleErrorList(currentEvent.id)"
                        class="text-red-300/80 hover:text-red-300 text-xs underline mb-1"
                      >
                        {{ expandedErrors.has(currentEvent.id) ? 'Скрыть список' : 'Показать все ошибки' }}
                      </button>
                      <ul v-if="expandedErrors.has(currentEvent.id)" class="list-disc pl-4 space-y-1 mt-1">
                        <li v-for="(err, idx) in getErrorArray(currentEvent.uploadError)" :key="idx" class="break-words">
                          {{ err }}
                        </li>
                      </ul>
                      <div v-else class="text-red-300/60 italic">
                        {{ getFirstError(currentEvent.uploadError) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Действия с выбранным Ивентом -->
      <div v-if="apiKey && selectedEventId && currentEvent" class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4 break-words">Действия с Ивентом: {{ currentEvent.title }}</h2>
        
        <!-- Предупреждение о блокировке -->
        <div v-if="!canEditCurrentEvent" class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
          <div class="flex items-center gap-2 text-red-300 font-medium mb-1">
            <span>🔒</span>
            <span>Редактирование заблокировано</span>
          </div>
          <div class="text-red-200/70 text-sm">
            Время Ти-20 (окончание приема заявок) уже прошло. Загрузка и обновление на платформе невозможны.
          </div>
        </div>
        
        <!-- Кнопки действий -->
        <div class="space-y-3">
          <button
            @click="uploadEventToPlatform"
            :disabled="isSubmitting || !canEditCurrentEvent"
            class="w-full bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? '⏳ Загрузка на платформу...' : (currentEvent.serverId ? '🔄 Обновить на платформе' : '📤 Загрузить на платформу') }}
          </button>
          
          <div class="mt-3 text-xs text-white/50 text-center">
            <p v-if="currentEvent.isPublished" class="text-green-300">
              ✅ Мероприятие опубликовано на платформе
            </p>
            <p v-else-if="currentEvent.serverId" class="text-blue-300">
              📝 Мероприятие загружено как черновик. Публикация выполняется автоматически или модератором платформы.
            </p>
            <p v-else class="text-white/40">
              После загрузки мероприятие будет автоматически опубликовано (если включена автомодерация) или отправлено на модерацию.
            </p>
          </div>
        </div>
      </div>

      <!-- Ответы сервера (всегда видимая область) -->
      <div class="sticky bottom-0 bg-[#1A1F2E] border-t border-white/10 rounded-t-2xl p-6 shadow-2xl">
        <!-- Индикатор длительного процесса -->
        <div v-if="isSubmitting || isRefreshingStatus" class="flex items-start gap-3 mb-4 bg-white/5 border border-white/10 rounded-xl p-4">
          <svg class="w-5 h-5 text-blue-300 animate-spin mt-0.5" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <div class="flex-1">
            <div class="text-blue-300 font-medium">
              {{ isSubmitting ? 'Выполняется загрузка на платформу…' : 'Выполняется запрос статуса…' }}
            </div>
            <div class="text-white/60 text-sm">
              {{ progressMessage }}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Ответы сервера</h2>
          <button
            v-if="response || error"
            @click="clearServerMessages"
            class="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-sm transition-colors"
          >
            Очистить
          </button>
        </div>
        
        <!-- Успешный ответ -->
        <div v-if="response" class="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
          <div class="flex items-start gap-3">
            <span class="text-green-400 text-xl">✅</span>
            <div class="flex-1">
              <div class="text-green-300 font-medium mb-2">{{ response.message || 'Успешно' }}</div>
              <pre class="bg-black/30 rounded-lg p-3 text-xs overflow-auto max-h-64 text-green-200/80">{{ JSON.stringify(response, null, 2) }}</pre>
            </div>
          </div>
        </div>
        
        <!-- Ошибка -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <span class="text-red-400 text-xl">❌</span>
            <div class="flex-1">
              <div class="text-red-300 font-medium mb-2">{{ error.message || 'Ошибка' }}</div>
              <ul v-if="formattedErrors.length" class="list-disc pl-5 space-y-1 text-red-200/80 text-sm">
                <li v-for="(msg, idx) in formattedErrors" :key="idx">{{ msg }}</li>
              </ul>
              <pre v-else class="bg-black/30 rounded-lg p-3 text-xs overflow-auto max-h-64 text-red-200/80">{{ JSON.stringify(error, null, 2) }}</pre>
            </div>
          </div>
        </div>
        
        <!-- Пустое состояние -->
        <div v-if="!response && !error" class="text-center text-white/30 text-sm py-8">
          Здесь будут отображаться ответы сервера при выполнении действий
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { DateTime } from 'luxon'

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl

// API Key management
const apiKey = ref<string>('')
const copied = ref(false)

// Прогресс длительных операций
const progressMessage = ref<string>('')
let progressStartTime: number | null = null
let progressInterval: ReturnType<typeof setInterval> | null = null

const startProgress = (label: string) => {
  progressStartTime = Date.now()
  const update = () => {
    if (progressStartTime == null) return
    const seconds = Math.floor((Date.now() - progressStartTime) / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    progressMessage.value = `${label}. Прошло ${mins > 0 ? mins + ' мин ' : ''}${secs} сек`
  }
  update()
  progressInterval && clearInterval(progressInterval)
  progressInterval = setInterval(update, 5000)
}

const stopProgress = () => {
  progressStartTime = null
  progressMessage.value = ''
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

// Управление эскизами
const EVENTS_STORAGE_KEY = 'external_events_list'
const LAST_SELECTED_EVENT_KEY = 'last_selected_event_id'

interface UploadHistoryItem {
  timestamp: string
  status: 'success' | 'failed'
  error?: string | string[]
}

interface SavedEvent {
  id: string
  title: string
  data: any
  createdAt: string
  uploadStatus?: 'not_uploaded' | 'upload_success' | 'upload_failed'
  serverId?: string
  lastUploadAttempt?: string
  uploadHistory?: UploadHistoryItem[] // История всех загрузок
  uploadError?: string | string[] // Может быть строкой (для обратной совместимости) или массивом ошибок
  isPublished?: boolean
  publishedAt?: string
}

const savedEvents = ref<SavedEvent[]>([])
const selectedEventId = ref<string | null>(null)
const isSubmitting = ref(false)
const isRefreshingStatus = ref<string | null>(null)
const expandedErrors = ref<Set<string>>(new Set()) // Отслеживание раскрытых списков ошибок
const response = ref<any>(null)
const error = ref<any>(null)

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

// Загрузка списка Ивентов
const getSavedEvents = (): SavedEvent[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveEventsList = (events: SavedEvent[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
    savedEvents.value = events
  }
}

const loadEventsList = () => {
  savedEvents.value = getSavedEvents()
}

// Форматирование даты
const formatEventDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

// Текущий выбранный Ивент
const currentEvent = computed(() => {
  if (!selectedEventId.value) return null
  return savedEvents.value.find(e => e.id === selectedEventId.value) || null
})

// Проверка возможности редактирования
const canEditEvent = (event: SavedEvent): boolean => {
  if (event.uploadStatus !== 'upload_success') {
    return true
  }
  
  if (!event.data || !event.data.endApplicationsAtDate || !event.data.endApplicationsAtTime) {
    return true
  }
  
  try {
    const endApplicationsDate = event.data.endApplicationsAtDate
    const endApplicationsTime = event.data.endApplicationsAtTime
    const timezone = event.data.timezone || 'Europe/Moscow'
    
    const timeParts = endApplicationsTime.split(':')
    if (timeParts.length < 2) return true
    
    const hours = Number.parseInt(timeParts[0], 10)
    const minutes = Number.parseInt(timeParts[1], 10)
    
    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return true
    }
    
    const dateParts = endApplicationsDate.split('-')
    if (dateParts.length !== 3) return true
    
    const year = Number.parseInt(dateParts[0], 10)
    const month = Number.parseInt(dateParts[1], 10)
    const day = Number.parseInt(dateParts[2], 10)
    
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
      return true
    }
    
    const eventDateTime = DateTime.fromObject(
      { year, month, day, hour: hours, minute: minutes, second: 0 },
      { zone: timezone }
    )
    
    if (!eventDateTime.isValid) return true
    
    const endDateUtcTimestamp = eventDateTime.toMillis()
    const nowUtc = Date.now()
    return nowUtc < endDateUtcTimestamp
  } catch {
    return true
  }
}

const canEditCurrentEvent = computed(() => {
  if (!currentEvent.value) return true
  return canEditEvent(currentEvent.value)
})

// Форматирование ошибок для списка
const formattedErrors = computed(() => {
  if (!error.value) return []
  if (Array.isArray(error.value)) {
    return error.value
  }
  if (error.value.errors && Array.isArray(error.value.errors)) {
    return error.value.errors.map((e: any) => e.message || e)
  }
  if (error.value.message && typeof error.value.message === 'string') {
    return [error.value.message]
  }
  return []
})

// Функции для работы с ошибками в карточках Ивентов
const getErrorArray = (uploadError: string | string[] | undefined): string[] => {
  if (!uploadError) return []
  if (Array.isArray(uploadError)) return uploadError
  return [uploadError]
}

const getErrorCount = (uploadError: string | string[] | undefined): number => {
  return getErrorArray(uploadError).length
}

const getFirstError = (uploadError: string | string[] | undefined): string => {
  const errors = getErrorArray(uploadError)
  return errors[0] || 'Неизвестная ошибка'
}

const toggleErrorList = (eventId: string) => {
  if (expandedErrors.value.has(eventId)) {
    expandedErrors.value.delete(eventId)
  } else {
    expandedErrors.value.add(eventId)
  }
}

// Загрузка Ивента для получения данных формы
const loadEventData = (eventId: string) => {
  const event = savedEvents.value.find(e => e.id === eventId)
  if (!event) return null
  
  let draftData = { ...event.data }
  
  // Конвертируем старый формат если нужно
  if (draftData.createdAtClient && !draftData.createdAtClientDate) {
    const { date, time } = splitDateTime(draftData.createdAtClient)
    draftData.createdAtClientDate = date
    draftData.createdAtClientTime = time
    delete draftData.createdAtClient
  }
  
  const dateTimeFields = ['startApplicationsAt', 'endApplicationsAt', 'startContractsAt', 'startAt', 'endAt']
  dateTimeFields.forEach(field => {
    if (draftData[field] && !draftData[`${field}Date`]) {
      const { date, time } = splitDateTime(draftData[field])
      draftData[`${field}Date`] = date
      draftData[`${field}Time`] = time
      delete draftData[field]
    }
  })
  
  return draftData
}

const splitDateTime = (dateTimeString: string): { date: string; time: string } => {
  try {
    const dt = new Date(dateTimeString)
    const year = dt.getFullYear()
    const month = String(dt.getMonth() + 1).padStart(2, '0')
    const day = String(dt.getDate()).padStart(2, '0')
    const hours = String(dt.getHours()).padStart(2, '0')
    const minutes = String(dt.getMinutes()).padStart(2, '0')
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    }
  } catch {
    return { date: '', time: '' }
  }
}

const toISOString = (date: string, time: string, timezone: string): string | undefined => {
  if (!date || !time) return undefined
  try {
    const dt = DateTime.fromObject(
      {
        year: Number.parseInt(date.split('-')[0], 10),
        month: Number.parseInt(date.split('-')[1], 10),
        day: Number.parseInt(date.split('-')[2], 10),
        hour: Number.parseInt(time.split(':')[0], 10),
        minute: Number.parseInt(time.split(':')[1], 10),
        second: 0
      },
      { zone: timezone }
    )
    return dt.isValid ? dt.toISO() : undefined
  } catch {
    return undefined
  }
}

// Заголовки для API запросов
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey.value}`
  }
}

// Загрузка Ивента на платформу
const uploadEventToPlatform = async () => {
  if (!apiKey.value) {
    error.value = { message: 'API ключ не установлен' }
    return
  }

  if (!selectedEventId.value) {
    error.value = { message: 'Ивент не выбран' }
    return
  }

  if (!canEditCurrentEvent.value) {
    error.value = { message: 'Редактирование заблокировано. Время Ти-20 прошло.' }
    return
  }

  const eventData = loadEventData(selectedEventId.value)
  if (!eventData) {
    error.value = { message: 'Не удалось загрузить данные Ивента' }
    return
  }

  isSubmitting.value = true
  error.value = null
  response.value = null

  const uploadTimestamp = new Date().toISOString()
  startProgress('Загрузка на платформу выполняется')

  try {
    const payload = {
      id: eventData.id || undefined,
      title: eventData.title,
      authorName: eventData.authorName,
      location: eventData.location,
      seatLimit: eventData.seatLimit,
      pricePerSeat: eventData.pricePerSeat,
      description: eventData.description,
      timezone: eventData.timezone,
      createdAtClient: toISOString(eventData.createdAtClientDate, eventData.createdAtClientTime, eventData.timezone),
      startApplicationsAt: toISOString(eventData.startApplicationsAtDate, eventData.startApplicationsAtTime, eventData.timezone),
      endApplicationsAt: toISOString(eventData.endApplicationsAtDate, eventData.endApplicationsAtTime, eventData.timezone),
      startContractsAt: toISOString(eventData.startContractsAtDate, eventData.startContractsAtTime, eventData.timezone),
      startAt: toISOString(eventData.startAtDate, eventData.startAtTime, eventData.timezone),
      endAt: toISOString(eventData.endAtDate, eventData.endAtTime, eventData.timezone)
    }

    const res = await fetch(`${apiBaseUrl}/api/external/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    
    const events = getSavedEvents()
    const eventIndex = events.findIndex(e => e.id === selectedEventId.value)
    
    if (eventIndex >= 0) {
      if (res.ok && data.success) {
        events[eventIndex].uploadStatus = 'upload_success'
        // Всегда используем текущее время загрузки как время последней загрузки
        // (uploadedAtServer от сервера - это время первой загрузки, не последней)
        events[eventIndex].lastUploadAttempt = uploadTimestamp
        // Добавляем запись в историю загрузок
        if (!events[eventIndex].uploadHistory) {
          events[eventIndex].uploadHistory = []
        }
        events[eventIndex].uploadHistory.push({
          timestamp: uploadTimestamp,
          status: 'success'
        })
        events[eventIndex].serverId = data.data?.id || eventData.id
        events[eventIndex].uploadError = undefined
        events[eventIndex].isPublished = data.data?.status === 'published' || false
        
        if (data.data?.id) {
          events[eventIndex].data.id = data.data.id
        }
        
        response.value = data
      } else {
        events[eventIndex].uploadStatus = 'upload_failed'
        events[eventIndex].lastUploadAttempt = uploadTimestamp
        // Сохраняем все ошибки из массива data.errors, если они есть
        let errorMessages: string | string[] = 'Неизвестная ошибка'
        if (data.errors && Array.isArray(data.errors)) {
          // Извлекаем сообщения из массива ошибок
          errorMessages = data.errors.map((e: any) => e.message || String(e))
          events[eventIndex].uploadError = errorMessages.length > 0 ? errorMessages : [data.message || `HTTP ${res.status}` || 'Неизвестная ошибка']
        } else if (data.message) {
          errorMessages = data.message
          events[eventIndex].uploadError = data.message
        } else {
          errorMessages = `HTTP ${res.status}` || 'Неизвестная ошибка'
          events[eventIndex].uploadError = errorMessages
        }
        // Добавляем запись в историю загрузок
        if (!events[eventIndex].uploadHistory) {
          events[eventIndex].uploadHistory = []
        }
        events[eventIndex].uploadHistory.push({
          timestamp: uploadTimestamp,
          status: 'failed',
          error: errorMessages
        })
        error.value = data
      }
      
      saveEventsList(events)
    }
  } catch (err: any) {
    const events = getSavedEvents()
    const eventIndex = events.findIndex(e => e.id === selectedEventId.value)
    
    if (eventIndex >= 0) {
      events[eventIndex].uploadStatus = 'upload_failed'
      events[eventIndex].lastUploadAttempt = uploadTimestamp
      const errorMsg = err.message || 'Ошибка сети'
      events[eventIndex].uploadError = errorMsg
      // Добавляем запись в историю загрузок
      if (!events[eventIndex].uploadHistory) {
        events[eventIndex].uploadHistory = []
      }
      events[eventIndex].uploadHistory.push({
        timestamp: uploadTimestamp,
        status: 'failed',
        error: errorMsg
      })
      saveEventsList(events)
    }
    
    error.value = { message: err.message || 'Неизвестная ошибка' }
  } finally {
    isSubmitting.value = false
    stopProgress()
  }
}

// Обновление статуса Ивента с сервера
const refreshEventStatus = async (eventId: string) => {
  const event = savedEvents.value.find(e => e.id === eventId)
  if (!event || !event.serverId) {
    error.value = { message: 'Ивент не найден или не загружен на платформу' }
    return
  }

  if (!apiKey.value) {
    error.value = { message: 'API ключ не установлен' }
    return
  }

  isRefreshingStatus.value = eventId
  error.value = null
  response.value = null
  startProgress('Запрос статуса на платформе выполняется')

  try {
    const res = await fetch(`${apiBaseUrl}/api/external/events/${event.serverId}`, {
      method: 'GET',
      headers: getHeaders()
    })

    const data = await res.json()

    if (res.ok && data.success) {
      const events = getSavedEvents()
      const eventIndex = events.findIndex(e => e.id === eventId)

      if (eventIndex >= 0) {
        events[eventIndex].uploadStatus = 'upload_success'
        events[eventIndex].isPublished = data.data.isPublished || false
        events[eventIndex].serverId = data.data.id
        // Не обновляем lastUploadAttempt при проверке статуса - это поле только для реальных загрузок
        events[eventIndex].uploadError = undefined

        saveEventsList(events)

        response.value = {
          success: true,
          message: `Статус Ивента "${event.title}" обновлен с платформы`,
          data: data.data
        }
      }
    } else {
      if (res.status === 404) {
        const events = getSavedEvents()
        const eventIndex = events.findIndex(e => e.id === eventId)

        if (eventIndex >= 0) {
          events[eventIndex].uploadStatus = 'not_uploaded'
          events[eventIndex].serverId = undefined
          events[eventIndex].uploadError = 'Ивент не найден на платформе'
          saveEventsList(events)
        }
      }

      error.value = data
    }
  } catch (err: any) {
    error.value = { message: err.message || 'Неизвестная ошибка при запросе статуса' }
  } finally {
    isRefreshingStatus.value = null
    stopProgress()
  }
}

// Очистка сообщений сервера
const clearServerMessages = () => {
  response.value = null
  error.value = null
}

onMounted(() => {
  loadApiKey()
  loadEventsList()
  // Восстанавливаем ранее выбранный Ивент при навигации между формами
  if (typeof window !== 'undefined') {
    const lastId = localStorage.getItem(LAST_SELECTED_EVENT_KEY)
    if (lastId) {
      // Устанавливаем только если такой Ивент существует в локальном списке
      const exists = savedEvents.value.some(e => e.id === lastId)
      if (exists) {
        selectedEventId.value = lastId
      }
    }
  }
})

onBeforeUnmount(() => {
  // Ensure any running progress interval is cleared and state reset
  stopProgress()
})
</script>

<style scoped>
/* Стили для переноса длинных названий обрабатываются через break-words в классах */
</style>

