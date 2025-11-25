<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DemoNavigation from '~/components/DemoNavigation.vue'

// Middleware для проверки прав модератора
definePageMeta({
  middleware: 'auth-moderator'
})

interface ModerationEvent {
  id: string
  title: string
  author: string
  location: string
  startAt: string
  endAt?: string
  seatLimit?: number
  priceTotal: number
  pricePerSeat?: number
  description?: string
  startApplicationsAt?: string
  endApplicationsAt?: string
  startContractsAt?: string
  status: string
  requiresModeration: boolean
  siteAlias?: string
  siteAlias?: string
  timezone?: string
  createdAt: string
  updatedAt: string
  createdAtClient?: string
  timeUntilTi20?: number
}

// Состояние
const events = ref<ModerationEvent[]>([])
const loading = ref(false)
const error = ref('')
const selectedSite = ref('')
const searchQuery = ref('')
const showDetails = ref<string | null>(null)
const actionLoading = ref<string | null>(null)

// Фильтрация
const sites = computed(() => {
  const uniqueSites = [...new Set(events.value.map(e => e.siteAlias).filter(Boolean))]
  return uniqueSites.sort()
})

const filteredEvents = computed(() => {
  let filtered = events.value

  // Фильтр по сайту
  if (selectedSite.value) {
    filtered = filtered.filter(e => e.siteAlias === selectedSite.value)
  }

  // Поиск по названию, автору или локации
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(e => 
      e.title.toLowerCase().includes(query) ||
      e.author.toLowerCase().includes(query) ||
      e.location.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Статистика
const stats = computed(() => {
  const total = events.value.length
  const urgent = events.value.filter(e => 
    e.timeUntilTi20 && e.timeUntilTi20 < 24 * 60 * 60 * 1000
  ).length
  const byStatus = events.value.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return { total, urgent, byStatus }
})

// Форматирование времени
const formatTimeUntil = (ms: number) => {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}д ${hours % 24}ч`
  } else if (hours > 0) {
    return `${hours}ч`
  } else {
    const minutes = Math.floor(ms / (1000 * 60))
    return `${minutes}м`
  }
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (kopecks: number) => {
  return (kopecks / 100).toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

// Загрузка данных
const loadEvents = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('/api/admin/moderation')
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to load events')
    }
    
    if (result.success) {
      events.value = result.data || []
      console.log('✅ Loaded events for moderation:', events.value.length)
    } else {
      throw new Error(result.message || 'Failed to load events')
    }
  } catch (err: any) {
    console.error('❌ Error loading events:', err)
    error.value = err.message || 'Ошибка загрузки событий'
  } finally {
    loading.value = false
  }
}

// Действия модерации
const approveEvent = async (eventId: string) => {
  actionLoading.value = eventId
  
  try {
    const response = await fetch(`/api/events/${eventId}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.statusMessage || 'Failed to approve event')
    }
    
    if (result.success) {
      // Удаляем событие из списка (оно больше не требует модерации)
      events.value = events.value.filter(e => e.id !== eventId)
      console.log('✅ Event approved:', eventId)
    } else {
      throw new Error(result.message || 'Failed to approve event')
    }
  } catch (err: any) {
    console.error('❌ Error approving event:', err)
    alert(`Ошибка одобрения события: ${err.message}`)
  } finally {
    actionLoading.value = null
  }
}

const rejectEvent = async (eventId: string) => {
  const reason = prompt('Укажите причину отклонения (опционально):')
  
  actionLoading.value = eventId
  
  try {
    const response = await fetch(`/api/events/${eventId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || undefined })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.statusMessage || 'Failed to reject event')
    }
    
    if (result.success) {
      // Удаляем событие из списка (оно отклонено и удалено)
      events.value = events.value.filter(e => e.id !== eventId)
      console.log('✅ Event rejected:', eventId)
    } else {
      throw new Error(result.message || 'Failed to reject event')
    }
  } catch (err: any) {
    console.error('❌ Error rejecting event:', err)
    alert(`Ошибка отклонения события: ${err.message}`)
  } finally {
    actionLoading.value = null
  }
}

const toggleDetails = (eventId: string) => {
  showDetails.value = showDetails.value === eventId ? null : eventId
}

// Инициализация
onMounted(() => {
  loadEvents()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1B3A] to-[#2D1B69]">
    <DemoNavigation />
    
    <div class="container mx-auto px-6 py-8">
      <!-- Заголовок -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">
          🛡️ Модерация событий
        </h1>
        <p class="text-white/70">
          Управление событиями, ожидающими модерации
        </p>
      </div>

      <!-- Статистика -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ stats.total }}</p>
              <p class="text-white/60 text-sm">Всего событий</p>
            </div>
          </div>
        </div>

        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ stats.urgent }}</p>
              <p class="text-white/60 text-sm">Срочные (&lt;24ч)</p>
            </div>
          </div>
        </div>

        <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ sites.length }}</p>
              <p class="text-white/60 text-sm">Активных сайтов</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Фильтры -->
      <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Поиск -->
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск по названию, автору или локации..."
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <!-- Фильтр по сайту -->
          <div class="md:w-64">
            <select
              v-model="selectedSite"
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все сайты</option>
              <option v-for="site in sites" :key="site" :value="site">
                {{ site }}
              </option>
            </select>
          </div>
          
          <!-- Обновить -->
          <button
            @click="loadEvents"
            :disabled="loading"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Обновить
          </button>
        </div>
      </div>

      <!-- Ошибка -->
      <div v-if="error" class="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-red-400">{{ error }}</p>
        </div>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>

      <!-- Список событий -->
      <div v-else-if="filteredEvents.length === 0" class="text-center py-12">
        <div class="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Нет событий для модерации</h3>
        <p class="text-white/60">Все события обработаны или отсутствуют события, требующие модерации</p>
      </div>

      <div v-else class="space-y-6">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
        >
          <!-- Основная информация -->
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-xl font-semibold text-white">{{ event.title }}</h3>
                  <span
                    v-if="event.timeUntilTi20 && event.timeUntilTi20 < 24 * 60 * 60 * 1000"
                    class="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full"
                  >
                    Срочно
                  </span>
                </div>
                <div class="flex items-center gap-6 text-sm text-white/70">
                  <span>👤 {{ event.author }}</span>
                  <span>📍 {{ event.location }}</span>
                  <span v-if="event.siteAlias">🌐 {{ event.siteAlias }}</span>
                </div>
              </div>
              
              <!-- Время до окончания модерации -->
              <div v-if="event.timeUntilTi20" class="text-right">
                <p class="text-xs text-white/50">До окончания модерации:</p>
                <p class="text-sm font-semibold" :class="{
                  'text-red-400': event.timeUntilTi20 < 6 * 60 * 60 * 1000,
                  'text-orange-400': event.timeUntilTi20 < 24 * 60 * 60 * 1000,
                  'text-white': event.timeUntilTi20 >= 24 * 60 * 60 * 1000
                }">
                  {{ formatTimeUntil(event.timeUntilTi20) }}
                </p>
              </div>
            </div>

            <!-- Краткая информация -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p class="text-xs text-white/50">Дата мероприятия</p>
                <p class="text-sm text-white">{{ formatDateTime(event.startAt) }}</p>
              </div>
              <div>
                <p class="text-xs text-white/50">Мест</p>
                <p class="text-sm text-white">{{ event.seatLimit || 'Не указано' }}</p>
              </div>
              <div>
                <p class="text-xs text-white/50">Цена за место</p>
                <p class="text-sm text-white">{{ event.pricePerSeat ? formatPrice(event.pricePerSeat) : 'Не указано' }}</p>
              </div>
              <div>
                <p class="text-xs text-white/50">Создано</p>
                <p class="text-sm text-white">{{ formatDateTime(event.createdAt) }}</p>
              </div>
            </div>

            <!-- Действия -->
            <div class="flex items-center justify-between">
              <button
                @click="toggleDetails(event.id)"
                class="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                {{ showDetails === event.id ? 'Скрыть детали' : 'Показать детали' }}
              </button>
              
              <div class="flex items-center gap-3">
                <button
                  @click="rejectEvent(event.id)"
                  :disabled="actionLoading === event.id"
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white text-sm rounded-lg transition-colors"
                >
                  {{ actionLoading === event.id ? 'Отклонение...' : 'Отклонить' }}
                </button>
                <button
                  @click="approveEvent(event.id)"
                  :disabled="actionLoading === event.id"
                  class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-sm rounded-lg transition-colors"
                >
                  {{ actionLoading === event.id ? 'Одобрение...' : 'Одобрить' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Детальная информация -->
          <div v-if="showDetails === event.id" class="border-t border-white/10 p-6 bg-white/5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="text-lg font-semibold text-white mb-3">Основная информация</h4>
                <div class="space-y-2 text-sm">
                  <div><span class="text-white/50">ID:</span> <span class="text-white font-mono">{{ event.id }}</span></div>
                  <div><span class="text-white/50">Автор:</span> <span class="text-white">{{ event.author }}</span></div>
                  <div><span class="text-white/50">Локация:</span> <span class="text-white">{{ event.location }}</span></div>
                  <div><span class="text-white/50">Часовой пояс:</span> <span class="text-white">{{ event.timezone || 'Не указан' }}</span></div>
                  <div><span class="text-white/50">Сайт:</span> <span class="text-white">{{ event.siteAlias || 'Не указан' }}</span></div>
                  <div><span class="text-white/50">Источник:</span> <span class="text-white">{{ event.siteAlias || 'Платформа' }}</span></div>
                </div>
              </div>
              
              <div>
                <h4 class="text-lg font-semibold text-white mb-3">Временные рамки</h4>
                <div class="space-y-2 text-sm">
                  <div><span class="text-white/50">Начало мероприятия:</span> <span class="text-white">{{ formatDateTime(event.startAt) }}</span></div>
                  <div v-if="event.endAt"><span class="text-white/50">Окончание мероприятия:</span> <span class="text-white">{{ formatDateTime(event.endAt) }}</span></div>
                  <div v-if="event.startApplicationsAt"><span class="text-white/50">Начало приема заявок:</span> <span class="text-white">{{ formatDateTime(event.startApplicationsAt) }}</span></div>
                  <div v-if="event.endApplicationsAt"><span class="text-white/50">Окончание приема заявок:</span> <span class="text-white">{{ formatDateTime(event.endApplicationsAt) }}</span></div>
                  <div v-if="event.startContractsAt"><span class="text-white/50">Начало оформления договоров:</span> <span class="text-white">{{ formatDateTime(event.startContractsAt) }}</span></div>
                </div>
              </div>
            </div>
            
            <div v-if="event.description" class="mt-6">
              <h4 class="text-lg font-semibold text-white mb-3">Описание</h4>
              <p class="text-white/80 text-sm leading-relaxed">{{ event.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Дополнительные стили если нужны */
</style>
