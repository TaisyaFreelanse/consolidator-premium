<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white">
    <div class="container mx-auto px-4 py-8 max-w-[1200px]">
      <!-- Главное меню -->
      <DemoNavigation />
      

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Левая колонка: Картотека Ивентов -->
        <div class="lg:col-span-2">
          <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div v-if="savedEvents.length === 0" class="text-white/50 text-sm py-8 text-center bg-white/5 rounded-lg">
              Нет сохраненных Ивентов. Создайте Ивент на странице "Редактировать / Создать".
            </div>
            
                  <!-- Grid с карточками Ивентов -->
                  <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      v-for="event in savedEvents"
                      :key="event.id"
                :class="[
                  'bg-white/5 border rounded-2xl p-5 transition-all cursor-pointer',
                  selectedEventId === event.id
                    ? 'border-[#007AFF] bg-[#007AFF]/10 shadow-lg shadow-[#007AFF]/20'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/10'
                ]"
                @click="selectEvent(event.id)"
              >
                <!-- Заголовок карточки -->
                <div class="flex items-start justify-between mb-3 gap-2">
                  <h3 class="text-lg font-semibold text-white/90 flex-1 break-words min-w-0">
                    {{ event.title }}
                  </h3>
                  <div v-if="selectedEventId === event.id" class="text-[#007AFF] text-xl font-bold flex-shrink-0">
                    ✓
                  </div>
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
                    <span v-if="event.lastUploadAttempt" class="text-green-300/70 text-xs">
                      ({{ formatEventDate(event.lastUploadAttempt) }})
                    </span>
                  </div>
                  <div v-else-if="event.uploadStatus === 'upload_failed'" class="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                    <span>❌</span>
                    <span>В загрузке отказано - обнаружена ошибка</span>
                    <span v-if="getLastFailedUploadTime(event)" class="text-red-300/70 text-xs">
                      ({{ formatEventDate(getLastFailedUploadTime(event)!) }})
                    </span>
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
                  
                  <!-- Отображение ошибок загрузки -->
                  <div v-if="event.uploadStatus === 'upload_failed' && event.uploadError" class="mt-2">
                    <div class="text-xs text-red-300/70 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                      <div class="flex items-start justify-between gap-2">
                        <div class="flex-1">
                          <!-- Если одна ошибка или массив с одной ошибкой -->
                          <div v-if="getErrorCount(event.uploadError) === 1" class="break-words">
                            {{ getFirstError(event.uploadError) }}
                          </div>
                          <!-- Если несколько ошибок -->
                          <div v-else>
                            <div class="font-medium mb-1">
                              Обнаружено {{ getErrorCount(event.uploadError) }} ошибок:
                            </div>
                            <button
                              @click.stop="toggleErrorList(event.id)"
                              class="text-red-300/80 hover:text-red-300 text-xs underline mb-1"
                            >
                              {{ expandedErrors.has(event.id) ? 'Скрыть список' : 'Показать все ошибки' }}
                            </button>
                            <ul v-if="expandedErrors.has(event.id)" class="list-disc pl-4 space-y-1 mt-1">
                              <li v-for="(err, idx) in getErrorArray(event.uploadError)" :key="idx" class="break-words">
                                {{ err }}
                              </li>
                            </ul>
                            <div v-else class="text-red-300/60 italic">
                              {{ getFirstError(event.uploadError) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Правая колонка: активное событие -->
        <div class="lg:col-span-1">
          <div v-if="currentEvent" class="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-6">
            <div class="space-y-4">
              <!-- Название -->
              <div>
                <div class="text-xs text-white/50 mb-1">Название активного Ивента</div>
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
                  <div class="text-xs text-white/50 mb-1 pl-1">Мест</div>
                  <div class="text-white/90 font-semibold">{{ currentEvent.data?.seatLimit || '—' }}</div>
                </div>
                <div>
                  <div class="text-xs text-white/50 mb-1 pl-1">Цена места</div>
                  <div class="text-white/90 font-semibold pl-1">{{ formatPriceValue(currentEvent.data?.pricePerSeat) }}</div>
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
                  <div class="text-xs text-white/50 mb-1">Нач. оформ.<br>договоров</div>
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
                  <span v-if="currentEvent.lastUploadAttempt" class="text-green-300/70 text-xs">
                    ({{ formatEventDate(currentEvent.lastUploadAttempt) }})
                  </span>
                </div>
                <div v-else-if="currentEvent.uploadStatus === 'upload_failed'" class="flex items-center gap-2 text-red-400">
                  <span>❌</span>
                  <span>В загрузке отказано - обнаружена ошибка</span>
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
                
                <!-- Кнопка редактирования -->
                <NuxtLink
                  to="/demo/external-upload"
                  class="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  ✏️ Редактировать
                </NuxtLink>
              </div>
            </div>
          </div>
          
          <div v-else class="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div class="text-white/50 text-sm py-8">
              Выберите Ивент из картотеки, чтобы увидеть подробную информацию
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { DateTime } from 'luxon'

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
  uploadError?: string | string[]
  uploadHistory?: UploadHistoryItem[]
  isPublished?: boolean
  publishedAt?: string
}

const savedEvents = ref<SavedEvent[]>([])
const selectedEventId = ref<string | null>(null)
const expandedErrors = ref<Set<string>>(new Set())

const getSavedEvents = (): SavedEvent[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

const loadEventsList = () => {
  savedEvents.value = getSavedEvents()
}

const saveEventsList = (events: SavedEvent[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
    savedEvents.value = events
  }
}

// Текущий выбранный Ивент
const currentEvent = computed(() => {
  if (!selectedEventId.value) return null
  return savedEvents.value.find(e => e.id === selectedEventId.value) || null
})

// Выбор Ивента
const selectEvent = (eventId: string) => {
  selectedEventId.value = selectedEventId.value === eventId ? null : eventId
  if (typeof window !== 'undefined') {
    if (selectedEventId.value) {
      localStorage.setItem(LAST_SELECTED_EVENT_KEY, selectedEventId.value)
    } else {
      localStorage.removeItem(LAST_SELECTED_EVENT_KEY)
    }
  }
}

// Функции для работы с ошибками
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

onMounted(() => {
  loadEventsList()
  // Восстанавливаем ранее выбранный Ивент
  if (typeof window !== 'undefined') {
    const lastId = localStorage.getItem(LAST_SELECTED_EVENT_KEY)
    if (lastId) {
      const exists = savedEvents.value.some(e => e.id === lastId)
      if (exists) {
        selectedEventId.value = lastId
      }
    }
  }
})
</script>

<style scoped>
/* Стили для переноса длинных названий */
h3 {
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
</style>





