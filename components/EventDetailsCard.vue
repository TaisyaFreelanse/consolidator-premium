<script setup lang="ts">
import { computed } from 'vue'

interface UploadHistoryItem {
  timestamp: string
  status: 'success' | 'failed'
  error?: string | string[]
}

interface EventData {
  authorName?: string
  location?: string
  seatLimit?: number | string
  pricePerSeat?: number | string
  startApplicationsAtDate?: string
  startApplicationsAtTime?: string
  endApplicationsAtDate?: string
  endApplicationsAtTime?: string
  startContractsAtDate?: string
  startContractsAtTime?: string
  startAtDate?: string
  startAtTime?: string
  endAtDate?: string
  endAtTime?: string
}

interface EventRecord {
  id: string
  title: string
  data: EventData
  createdAt: string
  uploadStatus?: 'not_uploaded' | 'upload_success' | 'upload_failed'
  uploadHistory?: UploadHistoryItem[]
  lastUploadAttempt?: string
  uploadError?: string | string[]
  serverId?: string
}

const props = defineProps<{
  event: EventRecord
  titleLabel?: string
}>()

const titleLabel = computed(() => props.titleLabel ?? 'Название активного Ивента')

const formatEventDate = (dateString?: string | null): string => {
  if (!dateString) return '—'
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

const formatDateDisplay = (date?: string, time?: string): string => {
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

const calculateTotalPrice = (event: EventRecord): string => {
  const seatLimit = event.data?.seatLimit
  const pricePerSeat = event.data?.pricePerSeat
  if (!seatLimit || !pricePerSeat) return '—'
  const seats = typeof seatLimit === 'string' ? Number(seatLimit) : seatLimit
  const price = typeof pricePerSeat === 'string' ? Number(pricePerSeat) : pricePerSeat
  if (Number.isNaN(seats) || Number.isNaN(price)) return '—'
  return `${(seats * price).toLocaleString('ru-RU')} ₽`
}

const getLastFailedUploadTime = (event: EventRecord): string | null => {
  if (event.uploadHistory && event.uploadHistory.length > 0) {
    const failedAttempts = event.uploadHistory.filter(item => item.status === 'failed')
    if (failedAttempts.length > 0) {
      const sorted = failedAttempts.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      return sorted[0].timestamp
    }
  }
  if (event.uploadStatus === 'upload_failed' && event.lastUploadAttempt) {
    return event.lastUploadAttempt
  }
  return null
}

const getFirstSuccessfulUploadTime = (event: EventRecord): string | null => {
  if (event.uploadHistory && event.uploadHistory.length > 0) {
    const firstSuccess = event.uploadHistory.find(item => item.status === 'success')
    if (firstSuccess) {
      return firstSuccess.timestamp
    }
  }
  return event.lastUploadAttempt || null
}

const getLatestSuccessfulUploadTime = (event: EventRecord): string | null => {
  if (event.uploadHistory && event.uploadHistory.length > 0) {
    for (let i = event.uploadHistory.length - 1; i >= 0; i -= 1) {
      if (event.uploadHistory[i].status === 'success') {
        return event.uploadHistory[i].timestamp
      }
    }
  }
  return event.lastUploadAttempt || null
}
</script>

<template>
  <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
    <div class="space-y-4">
      <div>
        <div class="text-xs text-white/50 mb-1">{{ titleLabel }}</div>
        <div class="text-lg font-semibold text-white break-words">{{ event.title }}</div>
      </div>

      <div v-if="event.data?.authorName">
        <div class="text-xs text-white/50 mb-1">Автор</div>
        <div class="text-white/90">{{ event.data.authorName }}</div>
      </div>

      <div v-if="event.data?.location">
        <div class="text-xs text-white/50 mb-1">Местоположение</div>
        <div class="text-white/90">{{ event.data.location }}</div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <div class="text-xs text-white/50 mb-1 pl-1">Мест</div>
          <div class="text-white/90 font-semibold">{{ event.data?.seatLimit ?? '—' }}</div>
        </div>
        <div>
          <div class="text-xs text-white/50 mb-1 pl-1">Цена места</div>
          <div class="text-white/90 font-semibold pl-1">{{ formatPriceValue(event.data?.pricePerSeat) }}</div>
        </div>
        <div>
          <div class="text-xs text-white/50 mb-1">Цена общая</div>
          <div class="text-white/90 font-semibold">{{ calculateTotalPrice(event) }}</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <div class="text-xs text-white/50 mb-1">Начало сбора заявок</div>
          <div class="text-white/90 text-sm">
            {{ formatDateDisplay(event.data?.startApplicationsAtDate, event.data?.startApplicationsAtTime) }}
          </div>
        </div>
        <div>
          <div class="text-xs text-white/50 mb-1">Конец сбора заявок</div>
          <div class="text-white/90 text-sm">
            {{ formatDateDisplay(event.data?.endApplicationsAtDate, event.data?.endApplicationsAtTime) }}
          </div>
        </div>
        <div>
          <div class="text-xs text-white/50 mb-1">Нач. оформ.<br>договоров</div>
          <div class="text-white/90 text-sm">
            {{ formatDateDisplay(event.data?.startContractsAtDate, event.data?.startContractsAtTime) }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-xs text-white/50 mb-1">Начало Ивента</div>
          <div class="text-white/90 text-sm">
            {{ formatDateDisplay(event.data?.startAtDate, event.data?.startAtTime) }}
          </div>
        </div>
        <div>
          <div class="text-xs text-white/50 mb-1">Окончание Ивента</div>
          <div class="text-white/90 text-sm">
            {{ formatDateDisplay(event.data?.endAtDate, event.data?.endAtTime) }}
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-white/10 space-y-2">
        <div class="text-xs text-white/50 mb-1">Статус на платформе</div>
        <div v-if="event.uploadStatus === 'upload_success'" class="flex items-center gap-2 text-green-400">
          <span>✅</span>
          <span>Успешно загружен</span>
        </div>
        <div v-else-if="event.uploadStatus === 'upload_failed'" class="flex items-center gap-2 text-red-400">
          <span>❌</span>
          <span>В загрузке отказано - обнаружена ошибка</span>
          <span v-if="getLastFailedUploadTime(event)" class="text-red-300/70 text-xs">
            ({{ formatEventDate(getLastFailedUploadTime(event)!) }})
          </span>
        </div>
        <div v-else class="flex items-center gap-2 text-gray-400">
          <span>⏸️</span>
          <span>Не загружен</span>
        </div>

        <div class="text-xs text-white/60 space-y-1">
          <div class="flex justify-between gap-4">
            <span>Загрузка первичная</span>
            <span class="text-white/80">
              {{ formatEventDate(getFirstSuccessfulUploadTime(event) || event.createdAt) }}
            </span>
          </div>
          <div class="flex justify-between gap-4">
            <span>Загрузка актуальная</span>
            <span class="text-white/80">
              {{ formatEventDate(getLatestSuccessfulUploadTime(event) || event.lastUploadAttempt) }}
            </span>
          </div>
        </div>

        <div v-if="event.serverId" class="text-xs text-white/50">
          ID: <span class="font-mono text-white/70">{{ event.serverId }}</span>
        </div>
      </div>

      <div class="pt-4 border-t border-white/10">
        <div class="text-xs text-white/50 mb-1">Создан/актуализирован на сайте</div>
        <div class="text-white/90 text-sm mb-4">{{ formatEventDate(event.createdAt) }}</div>

        <slot name="action" />
      </div>
    </div>
  </div>
</template>

