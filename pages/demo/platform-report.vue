<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white">
    <div class="container mx-auto px-4 py-8 max-w-[1400px]">
      <!-- Главное меню -->
      <DemoNavigation />
      
      <div class="mb-4"></div>

      <!-- Основной контент -->
      <div v-if="!selectedEventId || !currentEvent" class="bg-white/5 border border-white/10 rounded-2xl p-12 text-center mb-6">
        <p v-if="!selectedEventId" class="text-white/50 text-lg mb-2">Ивент не выбран</p>
        <p v-else class="text-white/50 text-lg mb-2">Ивент не найден</p>
        <p class="text-white/40 text-sm mb-4">
          Выберите Ивент на странице <NuxtLink to="/demo/select" class="text-blue-400 hover:text-blue-300 underline">Выбрать ивент</NuxtLink> для запроса данных мониторинга
        </p>
      </div>
      
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Левая колонка: Действия и данные мониторинга -->
        <div class="lg:col-span-2">
          <!-- Кнопка запроса мониторинга -->
          <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 class="text-2xl font-semibold mb-4">Запрос данных мониторинга</h2>
            
            <!-- Предупреждение о Ти20 -->
            <div v-if="!hasTi20Passed" class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-4">
              <div class="flex items-center gap-2 text-yellow-300 font-medium mb-1">
                <span>⏳</span>
                <span>Контрольная точка Ти20 еще не наступила</span>
              </div>
              <div class="text-yellow-200/70 text-sm">
                Запрос данных мониторинга доступен только после окончания приема заявок (Ти20).
                <div v-if="ti20DateTime" class="mt-1">
                  Ти20 наступит: <strong>{{ formatTi20DateTime }}</strong>
                </div>
              </div>
            </div>

            <!-- Предупреждение об отсутствии serverId -->
            <div v-if="!currentEvent.serverId" class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
              <div class="flex items-center gap-2 text-red-300 font-medium mb-1">
                <span>⚠️</span>
                <span>Ивент не загружен на платформу</span>
              </div>
              <div class="text-red-200/70 text-sm">
                Для запроса данных мониторинга необходимо сначала загрузить Ивент на платформу.
              </div>
            </div>

            <!-- Предупреждение об отсутствии API-ключа -->
            <div v-if="!apiKey" class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
              <div class="flex items-center gap-2 text-red-300 font-medium mb-1">
                <span>🔑</span>
                <span>API-ключ не установлен</span>
              </div>
              <div class="text-red-200/70 text-sm">
                Для запроса данных мониторинга необходим API-ключ. Получите его на странице 
                <NuxtLink to="/demo/settings" class="text-blue-400 hover:text-blue-300 underline">Настройки/регистр</NuxtLink>.
              </div>
            </div>
        
            <!-- Кнопка запроса -->
            <button
              @click="requestMonitoringData"
              :disabled="isLoading || !canRequestMonitoring"
              class="w-full bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {{ isLoading ? '⏳ Загрузка данных мониторинга...' : '📊 Запросить данные мониторинга' }}
            </button>

            <!-- Индикатор прогресса -->
            <div v-if="isLoading && progressMessage" class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-300 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <div class="flex-1">
                  <div class="text-blue-300 font-medium">
                    Выполняется запрос данных мониторинга…
                  </div>
                  <div class="text-white/60 text-sm">
                    {{ progressMessage }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Ошибка -->
            <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
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

            <!-- Данные мониторинга -->
            <div v-if="monitoringData" class="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold">Данные мониторинга</h3>
                <button
                  @click="generateAndDownloadZip"
                  :disabled="isGeneratingZip"
                  class="bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-2 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span v-if="isGeneratingZip">⏳</span>
                  <span v-else>📥</span>
                  <span>{{ isGeneratingZip ? 'Генерация ZIP...' : 'Скачать ZIP с PDF-отчетами' }}</span>
                </button>
              </div>
              
              <div class="mb-6">
                <SummaryMetricsRow
                  theme="dark"
                  :total-applicants="monitoringData?.applicants?.length || 0"
                  :seat-limit="currentEvent.data.seatLimit"
                  :collected="effectiveCollected"
                  :required="currentEvent.data.priceTotal"
                  :money-status-type="moneyStatusType"
                  :money-status-amount="moneyStatusAmount"
                  :refund-to-overlimit="refundToOverlimit"
                  :surplus-to-distribute="surplusToDistribute"
                />
              </div>

              <!-- Таблица заявителей -->
              <div class="mb-4">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs uppercase tracking-[0.2em] text-white/50">Участников: {{ monitoringData?.applicants?.length || 0 }}</span>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-white/10">
                        <th class="text-left py-2 px-3 text-white/70">Логин/Код</th>
                        <th class="text-right py-2 px-3 text-white/70">Мест</th>
                        <th class="text-right py-2 px-3 text-white/70">Оплачено</th>
                        <th class="text-left py-2 px-3 text-white/70">Статус</th>
                        <th class="text-right py-2 px-3 text-white/70">Возврат</th>
                        <th class="text-left py-2 px-3 text-white/70">Платежи</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr 
                        v-for="(applicant, index) in sortedApplicants" 
                        :key="applicantKey(applicant) || index"
                        class="border-b border-white/5 hover:bg-white/5"
                      >
                        <td class="py-2 px-3 font-mono text-xs">{{ getApplicantDisplayLabel(applicant) }}</td>
                        <td class="py-2 px-3 text-right">{{ applicant.seats || 0 }}</td>
                        <td class="py-2 px-3 text-right font-medium">{{ formatPrice(applicant.paidAmount || 0) }}</td>
                        <td class="py-2 px-3">
                          <span 
                            class="inline-block px-2 py-1 rounded text-xs"
                            :class="getStatusClass(applicant)"
                          >
                            {{ getStatusText(applicant) }}
                          </span>
                        </td>
                        <td class="py-2 px-3 text-right font-medium" :class="getRefundAmount(applicant) > 0 ? 'text-red-400' : 'text-white/50'">
                          {{ formatPrice(getRefundAmount(applicant)) }}
                        </td>
                        <td class="py-2 px-3">
                          <button
                            @click="togglePayments(applicantKey(applicant))"
                            class="text-blue-400 hover:text-blue-300 text-xs underline"
                          >
                            {{ expandedApplicantKey === applicantKey(applicant) ? 'Скрыть' : `Показать (${applicant.payments?.length || 0})` }}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Детали платежей -->
                <div v-for="(applicant, index) in sortedApplicants" :key="`payments-${index}`" class="mt-4">
                  <div v-if="expandedApplicantKey === applicantKey(applicant)" class="bg-black/30 rounded-xl p-4">
                    <h5 class="font-semibold mb-2 text-sm">
                      Платежи заявителя: {{ getApplicantDisplayLabel(applicant) }}
                    </h5>
                    <div v-if="applicant.payments && applicant.payments.length > 0" class="space-y-2">
                      <div 
                        v-for="(payment, pIndex) in applicant.payments" 
                        :key="pIndex"
                        class="bg-black/50 rounded-lg p-3 text-xs"
                      >
                        <div class="flex justify-between items-center mb-1">
                          <span class="text-white/70">Сумма:</span>
                          <span class="font-medium">{{ formatPrice(payment.amount || 0) }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-white/70">Дата:</span>
                          <span>{{ formatDate(payment.createdAt) }}</span>
                        </div>
                        <div v-if="payment.paymentId" class="flex justify-between items-center mt-1">
                          <span class="text-white/70">ID платежа:</span>
                          <span class="font-mono text-xs">{{ payment.paymentId }}</span>
                        </div>
                        <div v-if="payment.status" class="flex justify-between items-center mt-1">
                          <span class="text-white/70">Статус:</span>
                          <span>{{ payment.status }}</span>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-white/50 text-xs">
                      Платежи не найдены
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Пустое состояние -->
            <div v-if="!monitoringData && !isLoading && !error" class="text-center text-white/30 text-sm py-8">
              Нажмите кнопку "Запросить данные мониторинга" для загрузки данных
            </div>
          </div>
        </div>

        <!-- Правая колонка: активное событие -->
        <div class="lg:col-span-1">
          <EventDetailsCard
            v-if="currentEvent"
            class="sticky top-6"
            :event="currentEvent"
          >
            <template #action>
              <NuxtLink
                to="/demo/select"
                class="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                🔄 Выбрать другой Ивент
              </NuxtLink>
            </template>
          </EventDetailsCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { DateTime } from 'luxon'
import type { MonitoringSnapshot, Applicant } from '~/types/index'
import SummaryMetricsRow from '~/components/SummaryMetricsRow.vue'

const config = useRuntimeConfig()
const apiBaseUrl = config?.public?.apiBaseUrl || ''

// API Key management
const apiKey = ref<string>('')

// Управление эскизами
const EVENTS_STORAGE_KEY = 'external_events_list'
const LAST_SELECTED_EVENT_KEY = 'last_selected_event_id'

interface SavedEvent {
  id: string
  title: string
  data: any
  createdAt: string
  uploadStatus?: 'not_uploaded' | 'upload_success' | 'upload_failed'
  serverId?: string
  lastUploadAttempt?: string
  uploadHistory?: any[]
  uploadError?: string | string[]
  isPublished?: boolean
  publishedAt?: string
}

const savedEvents = ref<SavedEvent[]>([])
const selectedEventId = ref<string | null>(null)
const isLoading = ref(false)
const error = ref<any>(null)
const monitoringData = ref<MonitoringSnapshot | null>(null)
const expandedApplicantKey = ref<string | null>(null)
const progressMessage = ref<string>('')
const isGeneratingZip = ref(false)
let progressStartTime: number | null = null
let progressInterval: ReturnType<typeof setInterval> | null = null

// Загрузка API ключа
const loadApiKey = () => {
  if (typeof window !== 'undefined') {
    apiKey.value = localStorage.getItem('external_api_key') || ''
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

const loadEventsList = () => {
  savedEvents.value = getSavedEvents()
}

// Текущий выбранный Ивент
const currentEvent = computed(() => {
  if (!selectedEventId.value) return null
  return savedEvents.value.find(e => e.id === selectedEventId.value) || null
})

// Проверка наступления Ти20
const hasTi20Passed = computed(() => {
  if (!currentEvent.value || !currentEvent.value.data) return false
  
  const eventData = currentEvent.value.data
  if (!eventData.endApplicationsAtDate || !eventData.endApplicationsAtTime) return false
  
  try {
    const timezone = eventData.timezone || 'Europe/Moscow'
    const dateParts = eventData.endApplicationsAtDate.split('-')
    const timeParts = eventData.endApplicationsAtTime.split(':')
    
    if (dateParts.length !== 3 || timeParts.length < 2) return false
    
    const year = Number.parseInt(dateParts[0], 10)
    const month = Number.parseInt(dateParts[1], 10)
    const day = Number.parseInt(dateParts[2], 10)
    const hours = Number.parseInt(timeParts[0], 10)
    const minutes = Number.parseInt(timeParts[1], 10)
    
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) ||
        Number.isNaN(hours) || Number.isNaN(minutes)) return false
    
    const ti20DateTime = DateTime.fromObject(
      { year, month, day, hour: hours, minute: minutes, second: 0 },
      { zone: timezone }
    )
    
    if (!ti20DateTime.isValid) return false
    
    return DateTime.now().toMillis() >= ti20DateTime.toMillis()
  } catch {
    return false
  }
})

// Дата и время Ти20 для отображения
const ti20DateTime = computed(() => {
  if (!currentEvent.value || !currentEvent.value.data) return null
  
  const eventData = currentEvent.value.data
  if (!eventData.endApplicationsAtDate || !eventData.endApplicationsAtTime) return null
  
  try {
    const timezone = eventData.timezone || 'Europe/Moscow'
    const dateParts = eventData.endApplicationsAtDate.split('-')
    const timeParts = eventData.endApplicationsAtTime.split(':')
    
    if (dateParts.length !== 3 || timeParts.length < 2) return null
    
    const year = Number.parseInt(dateParts[0], 10)
    const month = Number.parseInt(dateParts[1], 10)
    const day = Number.parseInt(dateParts[2], 10)
    const hours = Number.parseInt(timeParts[0], 10)
    const minutes = Number.parseInt(timeParts[1], 10)
    
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) ||
        Number.isNaN(hours) || Number.isNaN(minutes)) return null
    
    return DateTime.fromObject(
      { year, month, day, hour: hours, minute: minutes, second: 0 },
      { zone: timezone }
    )
  } catch {
    return null
  }
})

const formatTi20DateTime = computed(() => {
  if (!ti20DateTime.value) return '—'
  return ti20DateTime.value.toLocaleString({
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow'
  })
})

// Проверка возможности запроса
const canRequestMonitoring = computed(() => {
  return hasTi20Passed.value && 
         !!currentEvent.value?.serverId && 
         !!apiKey.value &&
         !isLoading.value
})

// Прогресс длительных операций
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

// Заголовки для API запросов
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey.value}`
  }
}

// Запрос данных мониторинга
const requestMonitoringData = async () => {
  if (!canRequestMonitoring.value) {
    if (!hasTi20Passed.value) {
      error.value = { message: 'Контрольная точка Ти20 еще не наступила' }
      return
    }
    if (!currentEvent.value?.serverId) {
      error.value = { message: 'Ивент не загружен на платформу' }
      return
    }
    if (!apiKey.value) {
      error.value = { message: 'API-ключ не установлен' }
      return
    }
    return
  }

  isLoading.value = true
  error.value = null
  monitoringData.value = null

  startProgress('Запрос данных мониторинга выполняется')

  try {
    if (!currentEvent.value?.serverId) {
      throw new Error('Ивент не загружен на платформу')
    }
    
    const res = await fetch(`${apiBaseUrl}/api/external/events/${currentEvent.value.serverId}/monitoring`, {
      method: 'GET',
      headers: getHeaders()
    })

    const data = await res.json()

    if (res.ok && data.success) {
      monitoringData.value = data.data
    } else {
      error.value = data
    }
  } catch (err: any) {
    error.value = { message: err.message || 'Неизвестная ошибка при запросе данных мониторинга' }
  } finally {
    isLoading.value = false
    stopProgress()
  }
}

// Форматирование ошибок
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

// Сортировка заявителей по сумме оплаты (по убыванию)
const sortedApplicants = computed(() => {
  if (!monitoringData.value?.applicants) return []
  return [...monitoringData.value.applicants].sort((a, b) => (b.paidAmount || 0) - (a.paidAmount || 0))
})

// Получение лимита мест
const seatLimit = computed(() => {
  const raw = currentEvent.value?.data?.seatLimit
  if (typeof raw === 'string') {
    const parsed = Number(raw)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return raw || 0
})

const applicantKey = (applicant: Applicant) => applicant.login || applicant.code || ''
const getApplicantDisplayLabel = (applicant: Applicant) => applicant.login || applicant.code || '—'
const findApplicantIndexByKey = (key: string) => sortedApplicants.value.findIndex(a => applicantKey(a) === key)

// Расчет effectiveCollected
const effectiveCollected = computed(() => {
  if (!monitoringData.value) return 0
  
  // "Собрано" - это сумма ВСЕХ платежей всех заявителей, независимо от лимита мест
  // Лимит мест влияет только на то, кто попадает в лимит (для расчета возврата)
  return monitoringData.value.collected || 0
})

// Расчет moneyStatus
const moneyStatusType = computed(() => {
  if (!currentEvent.value?.data?.priceTotal) return 'balanced'
  const required = currentEvent.value.data.priceTotal
  const collected = effectiveCollected.value
  
  if (collected > required) return 'surplus'
  if (collected < required) return 'deficit'
  return 'balanced'
})

const moneyStatusAmount = computed(() => {
  if (!currentEvent.value?.data?.priceTotal) return 0
  const required = currentEvent.value.data.priceTotal
  const collected = effectiveCollected.value
  return Math.abs(collected - required)
})

// Расчет "Возврат сверхлимитчикам"
const refundToOverlimit = computed(() => {
  if (!monitoringData.value) return 0
  const limit = seatLimit.value
  if (limit <= 0) return 0
  
  const overflowApplicants = sortedApplicants.value.slice(limit)
  return overflowApplicants.reduce((sum, applicant) => sum + (applicant.paidAmount || 0), 0)
})

// Расчет "Профицит к распределению"
const surplusToDistribute = computed(() => {
  if (moneyStatusType.value !== 'surplus') return 0
  return Math.max(0, moneyStatusAmount.value - refundToOverlimit.value)
})

const withinLimitCount = computed(() => {
  if (seatLimit.value > 0) {
    return Math.min(seatLimit.value, sortedApplicants.value.length)
  }
  return sortedApplicants.value.length
})

const withinLimitApplicants = computed(() => sortedApplicants.value.slice(0, withinLimitCount.value))
const overflowApplicants = computed(() => sortedApplicants.value.slice(withinLimitCount.value))

const pricePerSeat = computed(() => {
  const eventData = currentEvent.value?.data
  if (!eventData) return 0
  const rawPrice = eventData.pricePerSeat
  const priceNumber = typeof rawPrice === 'string' ? Number(rawPrice) : rawPrice
  if (priceNumber && !Number.isNaN(priceNumber) && priceNumber > 0) {
    return priceNumber
  }
  const required = typeof eventData.priceTotal === 'string'
    ? Number(eventData.priceTotal)
    : (eventData.priceTotal || 0)
  const divisor = withinLimitCount.value > 0 ? withinLimitCount.value : sortedApplicants.value.length || 1
  if (divisor <= 0) return required
  return Math.round(required / divisor)
})

const extrasMap = computed(() => {
  const map = new Map<string, { expected: number; extra: number; deficit: number }>()
  withinLimitApplicants.value.forEach((applicant) => {
    const key = applicantKey(applicant)
    const seats = applicant.seats || 1
    const expected = seats * pricePerSeat.value
    const paidAmount = applicant.paidAmount || 0
    const extra = Math.max(0, paidAmount - expected)
    const deficit = Math.max(0, expected - paidAmount)
    map.set(key, { expected, extra, deficit })
  })
  return map
})

const totalExtras = computed(() => {
  let sum = 0
  for (const data of extrasMap.value.values()) {
    sum += data.extra
  }
  return sum
})

const eventSuccessful = computed(() => {
  if (!monitoringData.value) return false
  if (monitoringData.value.isCancelled) return false
  const required = typeof currentEvent.value?.data?.priceTotal === 'string'
    ? Number(currentEvent.value?.data?.priceTotal)
    : (currentEvent.value?.data?.priceTotal || 0)
  const deficit = monitoringData.value.deficit ?? Math.max(0, required - (monitoringData.value.collected || 0))
  return deficit <= 0
})

// Проверка вхождения в лимит
const isInLimit = (applicant: Applicant, index: number): boolean => {
  return index < withinLimitCount.value
}

// Получение статуса заявителя
const getStatusText = (applicant: Applicant): string => {
  const index = findApplicantIndexByKey(applicantKey(applicant))
  if (index < 0) return 'Неизвестно'
  if (isInLimit(applicant, index)) {
    return 'В лимите'
  }
  return 'Вне лимита'
}

const getStatusClass = (applicant: Applicant): string => {
  const index = findApplicantIndexByKey(applicantKey(applicant))
  if (index < 0) return 'bg-gray-500/20 text-gray-300'
  if (isInLimit(applicant, index)) {
    return 'bg-green-500/20 text-green-300'
  }
  return 'bg-red-500/20 text-red-300'
}

// Расчет возвращаемой суммы
const getRefundAmount = (applicant: Applicant): number => {
  if (!monitoringData.value) return 0
  const key = applicantKey(applicant)
  const index = findApplicantIndexByKey(key)
  if (index < 0) return 0

  const totalPaid = applicant.paidAmount || 0

  if (!eventSuccessful.value) {
    return totalPaid
  }

  if (index >= withinLimitCount.value) {
    return totalPaid
  }

  const extraData = extrasMap.value.get(key)
  const expected = extraData?.expected ?? (pricePerSeat.value * (applicant.seats || 1))
  const extraContribution = extraData?.extra ?? Math.max(0, totalPaid - expected)

  const surplus = surplusToDistribute.value
  if (surplus <= 0) {
    return 0
  }

  let share = 0
  if (withinLimitCount.value === 1) {
    share = 1
  } else if (totalExtras.value > 0) {
    share = extraContribution > 0 ? extraContribution / totalExtras.value : 0
  } else if (withinLimitCount.value > 0) {
    share = 1 / withinLimitCount.value
  }

  const refundFromSurplus = Math.round(surplus * share)

  if (extraContribution > 0) {
    if (surplus >= totalExtras.value && totalExtras.value > 0) {
      return extraContribution
    }
    return Math.min(extraContribution, refundFromSurplus)
  }

  return refundFromSurplus
}

// Переключение отображения платежей
const togglePayments = (key: string) => {
  expandedApplicantKey.value = expandedApplicantKey.value === key ? null : key
}

// Форматирование цены
const formatPrice = (value: number | string | null | undefined): string => {
  const amountNumber = Number(value) || 0
  const rubles = amountNumber / 100
  return `${rubles.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽`
}

// Форматирование даты
const formatDate = (dateString: string): string => {
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
    return dateString
  }
}

// Генерация и скачивание ZIP-архива
const generateAndDownloadZip = async () => {
  if (!monitoringData.value || !currentEvent.value) {
    error.value = { message: 'Нет данных для генерации отчетов' }
    return
  }

  isGeneratingZip.value = true
  error.value = null

  try {
    // Динамический импорт для client-only библиотек
    const { generateZipArchive, getZipFileName } = await import('~/utils/generatePdfReport')

    // Преобразование priceTotal в число, если это строка
    const priceTotal = typeof currentEvent.value.data.priceTotal === 'string'
      ? Number(currentEvent.value.data.priceTotal)
      : (currentEvent.value.data.priceTotal || 0)

    const zipBlob = await generateZipArchive(
      currentEvent.value,
      monitoringData.value,
      typeof seatLimit.value === 'string' ? Number(seatLimit.value) : seatLimit.value,
      effectiveCollected.value,
      priceTotal,
      moneyStatusType.value,
      moneyStatusAmount.value,
      refundToOverlimit.value,
      surplusToDistribute.value
    )

    // Скачивание ZIP-архива
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = getZipFileName()
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err: any) {
    error.value = { message: err.message || 'Ошибка при генерации ZIP-архива' }
    console.error('Ошибка генерации ZIP:', err)
  } finally {
    isGeneratingZip.value = false
  }
}

onMounted(() => {
  loadApiKey()
  loadEventsList()
  // Восстанавливаем ранее выбранный Ивент
  if (typeof window !== 'undefined') {
    const lastId = localStorage.getItem(LAST_SELECTED_EVENT_KEY)
    if (!apiKey.value) {
      if (lastId) {
        localStorage.removeItem(LAST_SELECTED_EVENT_KEY)
      }
      selectedEventId.value = null
      monitoringData.value = null
      return
    }
    if (lastId) {
      const exists = savedEvents.value.some(e => e.id === lastId)
      if (exists) {
        selectedEventId.value = lastId
      }
    }
  }
})

onBeforeUnmount(() => {
  stopProgress()
})

watch(monitoringData, () => {
  expandedApplicantKey.value = null
})
</script>
