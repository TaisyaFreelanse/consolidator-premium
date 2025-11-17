<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white">
    <div class="container mx-auto px-4 py-8 max-w-[1400px]">
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

      <!-- Основной контент в две колонки -->
      <div v-if="!selectedEventId || !currentEvent" class="bg-white/5 border border-white/10 rounded-2xl p-12 text-center mb-6">
        <p v-if="!selectedEventId" class="text-white/50 text-lg mb-2">Ивент не выбран</p>
        <p v-else class="text-white/50 text-lg mb-2">Ивент не найден</p>
        <p class="text-white/40 text-sm mb-4">
          Выберите Ивент на странице <NuxtLink to="/demo/select" class="text-blue-400 hover:text-blue-300 underline">Выбрать ивент</NuxtLink> для взаимодействия с платформой
        </p>
      </div>
      
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Левая колонка: Действия с Ивентом -->
        <div class="lg:col-span-2">
          <div v-if="apiKey" class="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 class="text-2xl font-semibold mb-4">Действия с Ивентом</h2>
        
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
          
          <!-- Ответы сервера (внутри левой колонки) -->
          <div class="bg-[#1A1F2E] border border-white/10 rounded-2xl p-4 mt-6">
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

        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">Ответы сервера</h2>
          <button
            v-if="response || error"
            @click="clearServerMessages"
            class="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-xs transition-colors"
          >
            Очистить
          </button>
        </div>
        
        <!-- Успешный ответ -->
        <div v-if="response" class="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-3">
          <div class="flex items-start gap-2">
            <span class="text-green-400 text-lg">✅</span>
            <div class="flex-1">
              <div class="text-green-300 font-medium mb-2 text-sm">{{ response.message || 'Успешно' }}</div>
              <pre class="bg-black/30 rounded-lg p-2 text-xs overflow-auto max-h-48 text-green-200/80">{{ JSON.stringify(response, null, 2) }}</pre>
            </div>
          </div>
        </div>
        
        <!-- Ошибка -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <div class="flex items-start gap-2">
            <span class="text-red-400 text-lg">❌</span>
            <div class="flex-1">
              <div class="text-red-300 font-medium mb-2 text-sm">{{ error.message || 'Ошибка' }}</div>
              <ul v-if="formattedErrors.length" class="list-disc pl-5 space-y-1 text-red-200/80 text-xs">
                <li v-for="(msg, idx) in formattedErrors" :key="idx">{{ msg }}</li>
              </ul>
              <pre v-else class="bg-black/30 rounded-lg p-2 text-xs overflow-auto max-h-48 text-red-200/80">{{ JSON.stringify(error, null, 2) }}</pre>
            </div>
          </div>
        </div>
        
        <!-- Пустое состояние -->
        <div v-if="!response && !error" class="text-center text-white/30 text-xs py-6">
          Здесь будут отображаться ответы сервера при выполнении действий
        </div>
      </div>
        </div>

        <!-- Правая колонка: Активный Ивент -->
        <div class="lg:col-span-1">
          <div class="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-6">
            <h2 class="text-2xl font-semibold mb-4">Активный Ивент</h2>
            
            <div class="space-y-4">
              <!-- Название -->
              <div>
                <div class="text-xs text-white/50 mb-1">Название</div>
                <div class="text-lg font-semibold text-white break-words">{{ currentEvent.title }}</div>
              </div>
              
              <!-- Автор -->
              <div v-if="currentEvent.data?.authorName">
                <div class="text-xs text-white/50 mb-1">Автор</div>
                <div class="text-white/90">{{ currentEvent.data.authorName }}</div>
              </div>
              
              <!-- Местоположение -->
              <div v-if="currentEvent.data?.location">
                <div class="text-xs text-white/50 mb-1">Местоположение</div>
                <div class="text-white/90">{{ currentEvent.data.location }}</div>
              </div>
              
              <!-- Места и цена в одной строке -->
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <div class="text-xs text-white/50 mb-1">Мест</div>
                  <div class="text-white/90 font-semibold">{{ currentEvent.data?.seatLimit || '—' }}</div>
                </div>
                <div>
                  <div class="text-xs text-white/50 mb-1">Цена места</div>
                  <div class="text-white/90 font-semibold">{{ formatPriceValue(currentEvent.data?.pricePerSeat) }}</div>
                </div>
                <div>
                  <div class="text-xs text-white/50 mb-1">Цена общая</div>
                  <div class="text-white/90 font-semibold">{{ formatPriceValue(calculateTotalPrice(currentEvent)) }}</div>
                </div>
              </div>
              
              <!-- Начало - конец сбора заявок, начало оформления договоров в одной строке -->
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <div class="text-xs text-white/50 mb-1">Начало сбора заявок</div>
                  <div class="text-white/90 text-sm">{{ formatDateDisplay(currentEvent.data?.startApplicationsAtDate, currentEvent.data?.startApplicationsAtTime) }}</div>
                </div>
                <div>
                  <div class="text-xs text-white/50 mb-1">Конец сбора заявок</div>
                  <div class="text-white/90 text-sm">{{ formatDateDisplay(currentEvent.data?.endApplicationsAtDate, currentEvent.data?.endApplicationsAtTime) }}</div>
                </div>
                <div>
                  <div class="text-xs text-white/50 mb-1">Начало оформления договоров</div>
                  <div class="text-white/90 text-sm">{{ formatDateDisplay(currentEvent.data?.startContractsAtDate, currentEvent.data?.startContractsAtTime) }}</div>
                </div>
              </div>
              
              <!-- Начало-окончание Ивента в одной строке -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-xs text-white/50 mb-1">Начало Ивента</div>
                  <div class="text-white/90 text-sm">{{ formatDateDisplay(currentEvent.data?.startAtDate, currentEvent.data?.startAtTime) }}</div>
                </div>
                <div>
                  <div class="text-xs text-white/50 mb-1">Окончание Ивента</div>
                  <div class="text-white/90 text-sm">{{ formatDateDisplay(currentEvent.data?.endAtDate, currentEvent.data?.endAtTime) }}</div>
                </div>
              </div>
              
              <!-- Статус на платформе -->
              <div class="pt-4 border-t border-white/10">
                <div class="text-xs text-white/50 mb-2">Статус на платформе</div>
                <div v-if="currentEvent.uploadStatus === 'upload_success'" class="flex items-center gap-2 text-green-400">
                  <span>✅</span>
                  <span>Успешно загружен</span>
                  <span v-if="currentEvent.uploadHistory && currentEvent.uploadHistory.length > 0" class="text-green-300/70 text-xs">
                    ({{ formatEventDate(currentEvent.uploadHistory[currentEvent.uploadHistory.length - 1].timestamp) }})
                  </span>
                  <span v-else-if="currentEvent.lastUploadAttempt" class="text-green-300/70 text-xs">
                    ({{ formatEventDate(currentEvent.lastUploadAttempt) }})
                  </span>
                </div>
                <div v-else-if="currentEvent.uploadStatus === 'upload_failed'" class="flex items-center gap-2 text-red-400">
                  <span>❌</span>
                  <span>В загрузке отказано - обнаружена ошибка</span>
                  <span v-if="getLastFailedUploadTime(currentEvent)" class="text-red-300/70 text-xs">
                    ({{ formatEventDate(getLastFailedUploadTime(currentEvent)!) }})
                  </span>
                </div>
                <div v-else class="flex items-center gap-2 text-gray-400">
                  <span>⏸️</span>
                  <span>Не загружен</span>
                </div>
                
                <div v-if="currentEvent.serverId" class="mt-2 text-xs text-white/50">
                  ID: <span class="font-mono text-white/70">{{ currentEvent.serverId }}</span>
                </div>
              </div>
              
              <!-- Дата создания/редактирования на демо-сайте -->
              <div class="pt-4 border-t border-white/10">
                <div class="text-xs text-white/50 mb-1">Создан/отредактирован на демо-сайте</div>
                <div class="text-white/90 text-sm mb-4">{{ formatEventDate(currentEvent.createdAt) }}</div>
                
                <!-- Кнопка выбора другого Ивента -->
                <NuxtLink
                  to="/demo/select"
                  class="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  🔄 Выбрать другой Ивент
                </NuxtLink>
              </div>
            </div>
          </div>
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

const formatDateDisplay = (date: string, time?: string): string => {
  if (!date) return '—'
  try {
    const [year, month, day] = date.split('-')
    const dateStr = `${day}.${month}.${year}`
    if (time) {
      return `${dateStr} ${time}`
    }
    return dateStr
  } catch {
    return date
  }
}

const formatPriceValue = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') {
    return '—'
  }
  const numericValue = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(numericValue)) {
    return '—'
  }
  const hasFraction = Math.abs(numericValue % 1) > 0
  return `${numericValue.toLocaleString('ru-RU', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2
  })} ₽`
}

// Вычислить общую цену
const calculateTotalPrice = (event: SavedEvent): number => {
  const seatLimit = event.data?.seatLimit
  const pricePerSeat = event.data?.pricePerSeat
  if (!seatLimit || !pricePerSeat) return 0
  const seats = typeof seatLimit === 'string' ? Number(seatLimit) : seatLimit
  const price = typeof pricePerSeat === 'string' ? Number(pricePerSeat) : pricePerSeat
  if (Number.isNaN(seats) || Number.isNaN(price)) return 0
  return seats * price
}

// Получить время последней неудачной загрузки
const getLastFailedUploadTime = (event: SavedEvent): string | null => {
  if (event.uploadHistory && event.uploadHistory.length > 0) {
    // Ищем последнюю неудачную попытку
    const failedAttempts = event.uploadHistory.filter(item => item.status === 'failed')
    if (failedAttempts.length > 0) {
      // Сортируем по времени (новые первыми) и берем последнюю
      const sorted = failedAttempts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      return sorted[0].timestamp
    }
  }
  // Fallback: если есть lastUploadAttempt и статус failed, используем его
  if (event.uploadStatus === 'upload_failed' && event.lastUploadAttempt) {
    return event.lastUploadAttempt
  }
  return null
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

