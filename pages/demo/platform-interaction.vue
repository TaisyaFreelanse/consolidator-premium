<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white">
    <div class="container mx-auto px-4 py-8 max-w-[1000px]">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] bg-clip-text text-transparent">
              Взаимодействие с платформой
            </h1>
            <p class="text-white/60 text-sm">
              Загрузка эскизов на платформу, обновление статуса и публикация мероприятий
            </p>
          </div>
          <NuxtLink
            to="/demo/external-upload"
            class="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-colors"
          >
            ← Создание/редактирование
          </NuxtLink>
        </div>
        
        <!-- API Key Info -->
        <div v-if="apiKey" class="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-green-300 text-sm font-medium mb-1">API ключ активен</p>
              <p class="text-green-200/70 text-xs font-mono break-all">{{ apiKey }}</p>
            </div>
            <button
              @click="copyApiKey"
              class="ml-4 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-300 text-sm transition-colors"
            >
              {{ copied ? 'Скопировано!' : 'Копировать' }}
            </button>
            <button
              @click="clearApiKey"
              class="ml-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 text-sm transition-colors"
            >
              Очистить
            </button>
          </div>
        </div>
        
        <div v-else class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
          <div class="flex items-center justify-between">
            <p class="text-yellow-300 text-sm">
              Для работы с API необходимо получить API ключ
            </p>
            <NuxtLink
              to="/demo/api-register"
              class="ml-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Получить API ключ
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Картотека Ивентов -->
      <div v-if="apiKey" class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-semibold">Картотека Ивентов</h2>
          <button
            @click="loadEventsList"
            class="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-300 text-sm transition-colors"
          >
            🔄 Обновить список
          </button>
        </div>
        
        <div v-if="savedEvents.length === 0" class="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p class="text-white/50 text-lg mb-2">Нет сохраненных Ивентов</p>
          <p class="text-white/40 text-sm">
            Создайте Ивент на странице <NuxtLink to="/demo/external-upload" class="text-blue-400 hover:text-blue-300 underline">Создание/редактирование</NuxtLink>
          </p>
        </div>
        
        <!-- Grid с карточками Ивентов -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div
            v-for="event in savedEvents"
            :key="event.id"
            :class="[
              'bg-white/5 border rounded-2xl p-5 transition-all',
              selectedEventId === event.id
                ? 'border-[#007AFF] bg-[#007AFF]/10 shadow-lg shadow-[#007AFF]/20'
                : 'border-white/10 hover:border-white/20 hover:bg-white/10'
            ]"
          >
            <!-- Заголовок карточки -->
            <div class="flex items-start justify-between mb-3">
              <h3 class="text-lg font-semibold text-white/90 flex-1 pr-2 line-clamp-2">
                {{ event.title }}
              </h3>
              <button
                v-if="selectedEventId === event.id"
                @click="selectedEventId = null"
                class="text-white/50 hover:text-white/80 transition-colors flex-shrink-0"
                title="Снять выделение"
              >
                ✕
              </button>
            </div>
            
            <!-- Метаинформация -->
            <div class="text-xs text-white/50 mb-4 space-y-1">
              <div>Создан: {{ formatEventDate(event.createdAt) }}</div>
              <div v-if="event.lastUploadAttempt">
                Последняя загрузка: {{ formatEventDate(event.lastUploadAttempt) }}
              </div>
            </div>
            
            <!-- Статус загрузки на платформу -->
            <div class="mb-4">
              <div v-if="event.uploadStatus === 'upload_success'" class="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
                <span>✅</span>
                <span>Успешно загружен</span>
              </div>
              <div v-else-if="event.uploadStatus === 'upload_failed'" class="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                <span>❌</span>
                <span>Ошибка загрузки</span>
              </div>
              <div v-else class="flex items-center gap-2 text-gray-400 text-sm font-medium mb-2">
                <span>⏸️</span>
                <span>Не загружен</span>
              </div>
              
              <!-- Дополнительная информация о статусе -->
              <div v-if="event.uploadStatus === 'upload_success'" class="text-xs text-green-300/70 space-y-1">
                <div v-if="event.serverId">ID на платформе: <span class="font-mono">{{ event.serverId }}</span></div>
                <div v-if="event.isPublished" class="flex items-center gap-1">
                  <span>📢</span>
                  <span>Опубликован</span>
                </div>
                <div v-else class="flex items-center gap-1">
                  <span>📝</span>
                  <span>Черновик</span>
                </div>
              </div>
              
              <div v-if="event.uploadStatus === 'upload_failed' && event.uploadError" class="text-xs text-red-300/70 mt-1 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                {{ event.uploadError }}
              </div>
            </div>
            
            <!-- Кнопки действий -->
            <div class="flex flex-col gap-2">
              <button
                @click="selectEvent(event.id)"
                :class="[
                  'w-full px-4 py-2 rounded-xl font-medium text-sm transition-colors',
                  selectedEventId === event.id
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30'
                ]"
              >
                {{ selectedEventId === event.id ? '✓ Выбран' : 'Выбрать для действий' }}
              </button>
              
              <button
                v-if="selectedEventId === event.id"
                @click="refreshEventStatus(event.id)"
                :disabled="isRefreshingStatus === event.id"
                class="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isRefreshingStatus === event.id ? '⏳ Обновление...' : '🔄 Обновить статус' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Действия с выбранным Ивентом -->
      <div v-if="apiKey && selectedEventId && currentEvent" class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">Действия с Ивентом: {{ currentEvent.title }}</h2>
        
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
              <pre v-if="error.errors || (typeof error === 'object' && Object.keys(error).length > 1)" class="bg-black/30 rounded-lg p-3 text-xs overflow-auto max-h-64 text-red-200/80">{{ JSON.stringify(error, null, 2) }}</pre>
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
import { ref, onMounted, computed } from 'vue'
import { DateTime } from 'luxon'

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl

// API Key management
const apiKey = ref<string>('')
const copied = ref(false)

// Управление эскизами
const EVENTS_STORAGE_KEY = 'external_events_list'

interface SavedEvent {
  id: string
  title: string
  data: any
  createdAt: string
  uploadStatus?: 'not_uploaded' | 'upload_success' | 'upload_failed'
  serverId?: string
  lastUploadAttempt?: string
  uploadError?: string
  isPublished?: boolean
  publishedAt?: string
}

const savedEvents = ref<SavedEvent[]>([])
const selectedEventId = ref<string | null>(null)
const isSubmitting = ref(false)
const isRefreshingStatus = ref<string | null>(null)
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

// Выбор Ивента
const selectEvent = (eventId: string) => {
  selectedEventId.value = selectedEventId.value === eventId ? null : eventId
  error.value = null
  response.value = null
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
        events[eventIndex].lastUploadAttempt = uploadTimestamp
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
        events[eventIndex].uploadError = data.message || data.errors?.[0]?.message || `HTTP ${res.status}` || 'Неизвестная ошибка'
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
      events[eventIndex].uploadError = err.message || 'Ошибка сети'
      saveEventsList(events)
    }
    
    error.value = { message: err.message || 'Неизвестная ошибка' }
  } finally {
    isSubmitting.value = false
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
        events[eventIndex].lastUploadAttempt = new Date().toISOString()
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
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

