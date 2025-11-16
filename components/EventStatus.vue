<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { DateTime } from 'luxon'
import type { EventItem, MonitoringSnapshot } from '~/types'
import { 
  getCurrentTimeInterval, 
  getStatusMessage,
  controlPointToInterval,
  getMoneyStatus, 
  getSeatsStatus,
  getCountdownTimer 
} from '~/utils/statusMessages'

interface Props {
  event: EventItem
  snapshot?: MonitoringSnapshot
  compact?: boolean // Компактный вид для каталога
}

const props = defineProps<Props>()

const controlPointOrder: Record<ControlPointCode, number> = {
  t0: 0,
  ti10: 1,
  ti20: 2,
  ti30: 3,
  ti40: 4,
  ti50: 5,
  t999: 6
}

const fallbackInterval = computed(() => getCurrentTimeInterval(props.event, props.event.createdAt, props.event.timezone))

// Текущий временной интервал — выбираем наиболее продвинутую точку между snapshot и локальным вычислением
const timeInterval = computed(() => {
  const fallbackPoint = fallbackInterval.value.currentPoint
  const fallbackOrder = controlPointOrder[fallbackPoint] ?? 0

  if (props.snapshot?.nowPoint) {
    const snapshotPoint = props.snapshot.nowPoint
    const snapshotOrder = controlPointOrder[snapshotPoint] ?? 0

    if (snapshotOrder >= fallbackOrder) {
      return {
        currentInterval: controlPointToInterval(snapshotPoint),
        currentPoint: snapshotPoint,
        progress: fallbackInterval.value.progress
      }
    }
  }

  return fallbackInterval.value
})

const effectiveCollected = computed(() => {
  if (!props.snapshot) return 0

  const totalCollected = props.snapshot.collected || 0
  const seatLimit = props.event.seatLimit || 0

  if (seatLimit > 0 && props.snapshot.applicants.length >= seatLimit) {
    const sortedApplicants = [...props.snapshot.applicants].sort((a, b) => b.paidAmount - a.paidAmount)
    const topNTotal = sortedApplicants.slice(0, seatLimit).reduce((sum, applicant) => sum + applicant.paidAmount, 0)
    return topNTotal
  }

  return totalCollected
})

// Определяем, отменено ли мероприятие
const isCancelled = computed(() => {
  if (props.snapshot?.isCancelled === true) {
    return true
  }

  const requiredAmount = props.event.priceTotal || 0
  if (!requiredAmount) {
    return false
  }

  const interval = timeInterval.value?.currentInterval || ''
  const isAfterCollection = ['ti20-ti30', 'ti30-ti40', 'ti40-ti50', 'ti50-t999'].includes(interval)
  if (!isAfterCollection) {
    return false
  }

  return effectiveCollected.value < requiredAmount
})

// Сообщение о статусе
const statusMessage = computed(() => {
  if (!timeInterval.value) return null
  return getStatusMessage(timeInterval.value.currentInterval, isCancelled.value)
})

// Статус денег (дефицит/профицит)
const moneyStatus = computed(() => {
  return getMoneyStatus(effectiveCollected.value, props.event.priceTotal)
})

// Статус мест
const seatsStatus = computed(() => {
  const applicantsCount = props.snapshot?.applicants.length || 0
  const seatLimit = props.event.seatLimit || 20
  return getSeatsStatus(applicantsCount, seatLimit)
})

// Количество оплаченных мест
const paidSeatsCount = computed(() => {
  if (!props.snapshot?.applicants) return 0
  return props.snapshot.applicants
    .filter(applicant => applicant.paidAmount > 0)
    .reduce((sum, applicant) => sum + (applicant.seats || 1), 0)
})

// Процент собранных средств
const collectedPercent = computed(() => {
  const requiredAmount = props.event.priceTotal || 0
  if (!requiredAmount) return 0

  const collected = effectiveCollected.value
  return Math.min(100, Math.round((collected / requiredAmount) * 100))
})

// Форматирование суммы
const formatMoney = (amount: number) => {
  return (amount / 100).toLocaleString('ru-RU', { minimumFractionDigits: 0 })
}

// Форматирование даты начала и конца сбора (с годом для юридической значимости)
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', { 
    day: '2-digit', 
    month: 'short',
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Форматирование полной даты для извещений
const formatFullDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Форматирование даты загрузки на сервер
const formatUploadDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const controlPointLabels: Record<Exclude<ControlPointCode, 't999'>, string> = {
  t0: 'Публикация',
  ti10: 'Старт заявок',
  ti20: 'Стоп заявок',
  ti30: 'Договоры',
  ti40: 'Старт события',
  ti50: 'Финиш события'
}

const formatTimelineDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const controlTimeline = computed(() => {
  const currentPoint = timeInterval.value?.currentPoint ?? 't0'
  const currentOrder = controlPointOrder[currentPoint] ?? 0

  const nodes: Array<{ code: Exclude<ControlPointCode, 't999'>; date?: string | null }> = [
    { code: 't0', date: props.event.createdAt || props.event.updatedAt || props.event.startApplicationsAt },
    { code: 'ti10', date: props.event.startApplicationsAt },
    { code: 'ti20', date: props.event.endApplicationsAt },
    { code: 'ti30', date: props.event.startContractsAt },
    { code: 'ti40', date: props.event.startAt },
    { code: 'ti50', date: props.event.endAt }
  ]

  return nodes.map((node) => {
    const order = controlPointOrder[node.code] ?? 0
    let state: 'done' | 'current' | 'upcoming' = 'upcoming'
    if (order < currentOrder) state = 'done'
    else if (order === currentOrder) state = 'current'

    return {
      code: node.code,
      label: controlPointLabels[node.code],
      date: formatTimelineDate(node.date ?? undefined),
      state
    }
  })
})

// Получить дату следующего ключевого момента и его описание
const getNextMilestone = computed(() => {
  const interval = timeInterval.value?.currentInterval || ''
  const message = statusMessage.value
  if (!message || !message.извещение2) return null

  let date: string | undefined
  switch (interval) {
    case 't0-ti10':
      date = props.event.startApplicationsAt || undefined
      break
    case 'ti10-ti20':
      date = props.event.endApplicationsAt || undefined
      break
    case 'ti20-ti30':
      date = props.event.startContractsAt || undefined
      break
    case 'ti30-ti40':
      date = props.event.startAt
      break
    case 'ti40-ti50':
      date = props.event.endAt || undefined
      break
    default:
      date = undefined
  }

  if (!date) return null

  return {
    description: message.извещение2,
    date: formatFullDate(date)
  }
})

// Таймер обратного отсчета (реактивный)
const countdownTick = ref(0) // Для принудительного обновления каждую секунду
const countdownDeadline = computed(() => {
  if (props.snapshot?.deadlineNext) {
    const snapshotDeadline = new Date(props.snapshot.deadlineNext).getTime()
    if (snapshotDeadline > Date.now()) {
      return props.snapshot.deadlineNext
    }
  }

  const interval = timeInterval.value?.currentInterval
  if (!interval) return null

  switch (interval) {
    case 't0-ti10':
      return props.event.startApplicationsAt || props.event.startAt
    case 'ti10-ti20':
      return props.event.endApplicationsAt || props.event.startContractsAt || props.event.startAt
    case 'ti20-ti30':
      return props.event.startContractsAt || props.event.startAt
    case 'ti30-ti40':
      return props.event.startAt
    case 'ti40-ti50':
      return props.event.endAt
    default:
      return null
  }
})

const countdown = computed(() => {
  countdownTick.value // Зависимость для реактивности
  return getCountdownTimer(
    countdownDeadline.value,
    timeInterval.value?.currentInterval,
    props.event.timezone
  )
})

// Обновление таймера каждую секунду
let countdownInterval: NodeJS.Timeout | null = null
let timeUpdateInterval: NodeJS.Timeout | null = null

// Текущее время для обновления календаря и часов Продюсера
const currentTime = ref(Date.now())

// Дата и время в часовом поясе Продюсера
const producerDateTime = computed(() => {
  const _ = currentTime.value // Make computed reactive to currentTime updates
  
  const timezone = props.event.timezone || 'Europe/Moscow'
  
  if (!timezone) {
    return {
      fullDate: '-- -- ----',
      weekday: '--',
      time: '--:--:--',
      timezoneOffset: ''
    }
  }

  try {
    const dt = DateTime.now().setZone(timezone)
    
    if (!dt.isValid) {
      return {
        fullDate: '-- -- ----',
        weekday: '--',
        time: '--:--:--',
        timezoneOffset: ''
      }
    }

    // Названия месяцев на русском
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ]

    // Названия дней недели на русском
    const weekdays = [
      'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
      'Четверг', 'Пятница', 'Суббота'
    ]

    const offset = dt.offset
    const offsetHours = Math.floor(Math.abs(offset) / 60)
    const offsetMinutes = Math.abs(offset) % 60
    const offsetSign = offset >= 0 ? '+' : '-'
    const offsetString = `UTC${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`

    // Форматируем полную дату в одну строку: "15 ноября 2025"
    const fullDate = `${dt.day} ${months[dt.month - 1]} ${dt.year}`
    
    return {
      fullDate: fullDate,
      weekday: weekdays[dt.weekday % 7],
      time: dt.toFormat('HH:mm:ss'),
      timezoneOffset: offsetString
    }
  } catch (error) {
    console.error('Error formatting producer date/time:', error)
    return {
      fullDate: '-- -- ----',
      weekday: '--',
      time: '--:--:--',
      timezoneOffset: ''
    }
  }
})

onMounted(() => {
  if (process.client) {
    countdownInterval = setInterval(() => {
      countdownTick.value++
    }, 1000)
    
    // Обновляем время для календаря Продюсера каждую секунду
    timeUpdateInterval = setInterval(() => {
      currentTime.value = Date.now()
    }, 1000)
  }
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
    timeUpdateInterval = null
  }
})
</script>

<template>
  <div :class="['event-status-widget', compact ? 'compact' : 'detailed']">
    <!-- Заголовок с названием мероприятия (только для detailed) -->
    <div v-if="!compact" class="status-header">
      <div class="event-title-row">
        <h3 class="event-title">{{ event.title }}</h3>
        <span v-if="event.createdAt" class="upload-date">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          Загружено: {{ formatUploadDate(event.createdAt) }}
        </span>
      </div>
      <div class="event-meta">
        <span class="meta-item">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          {{ event.author }}
        </span>
        <span class="meta-item">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          </svg>
          {{ event.location }}
        </span>
      </div>
    </div>

    <!-- ТАЙМЕР ОБРАТНОГО ОТСЧЕТА и КАЛЕНДАРЬ ПРОДЮСЕРА -->
    <div v-if="!compact && countdown && getNextMilestone" class="timer-and-calendar-container">
      <!-- ТАЙМЕР ОБРАТНОГО ОТСЧЕТА -->
      <div class="countdown-timer" 
           :class="{ urgent: countdown.urgent, zero: countdown.isZero }">
        <div class="countdown-header">
          <svg class="timer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="countdown-label">Обратный отсчет до следующей контрольной точки:</span>
        </div>
        
        <div class="countdown-display">
          <div class="countdown-unit">
            <div class="countdown-number">{{ countdown.days.toString().padStart(2, '0') }}</div>
            <div class="countdown-unit-label">дней</div>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-unit">
            <div class="countdown-number">{{ countdown.hours.toString().padStart(2, '0') }}</div>
            <div class="countdown-unit-label">часов</div>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-unit">
            <div class="countdown-number">{{ countdown.minutes.toString().padStart(2, '0') }}</div>
            <div class="countdown-unit-label">минут</div>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-unit">
            <div class="countdown-number">{{ countdown.seconds.toString().padStart(2, '0') }}</div>
            <div class="countdown-unit-label">секунд</div>
          </div>
        </div>
        
        <div class="countdown-milestone">
          <span class="milestone-icon">📅</span>
          <span class="milestone-text">{{ getNextMilestone.description }}</span>
        </div>
      </div>

      <!-- КАЛЕНДАРЬ И ЧАСЫ ПРОДЮСЕРА -->
      <div v-if="event.timezone" class="producer-calendar">
        <div class="producer-calendar-header">
          <svg class="calendar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="producer-calendar-label">Календарь и часы Продюсера</span>
        </div>
        
        <div class="producer-calendar-content">
          <div class="producer-date-section">
            <div class="producer-full-date">{{ producerDateTime.fullDate }}</div>
            <div class="producer-weekday">{{ producerDateTime.weekday }}</div>
          </div>
          
          <div class="producer-time-section">
            <div class="producer-time">{{ producerDateTime.time }}</div>
            <div class="producer-timezone">{{ producerDateTime.timezoneOffset }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Контрольные точки -->
    <div class="control-timeline">
      <div
        v-for="point in controlTimeline"
        :key="point.code"
        :class="['timeline-item', point.state]"
      >
        <div class="point-dot"></div>
        <div class="point-label">{{ point.label }}</div>
        <div class="point-date">{{ point.date }}</div>
      </div>
    </div>

    <!-- Участники и средства (компактный вид) -->
    <div class="status-section compact">
      <div class="section-header">
        <span class="section-title">Участники и средства</span>
      </div>

      <div class="stats-line">
        <div class="stat-pill">
          <span class="pill-label">Участники</span>
          <span class="pill-value">{{ snapshot?.applicants.length || 0 }} / {{ event.seatLimit || 20 }}</span>
        </div>
        <div class="stat-pill">
          <span class="pill-label">Места</span>
          <span class="pill-value">
            <template v-if="seatsStatus.type === 'available'">Свободно {{ seatsStatus.freeSeats }}</template>
            <template v-else-if="seatsStatus.type === 'full'">Заполнено</template>
            <template v-else>Перебор +{{ seatsStatus.overflowCount }}</template>
          </span>
          <span v-if="paidSeatsCount > 0" class="pill-extra">Оплачено: {{ paidSeatsCount }}</span>
        </div>
        <div class="stat-pill">
          <span class="pill-label">Собрано</span>
          <span class="pill-value">{{ formatMoney(effectiveCollected) }} ₽</span>
        </div>
        <div class="stat-pill">
          <span class="pill-label">Требуется</span>
          <span class="pill-value">{{ formatMoney(props.event.priceTotal) }} ₽</span>
        </div>
        <div class="stat-pill" :class="moneyStatus.type">
          <span class="pill-label">
            <template v-if="moneyStatus.type === 'deficit'">Недобор</template>
            <template v-else-if="moneyStatus.type === 'surplus'">Профицит</template>
            <template v-else>Баланс</template>
          </span>
          <span class="pill-value">
            <template v-if="moneyStatus.type === 'deficit'">{{ formatMoney(moneyStatus.amount) }} ₽</template>
            <template v-else-if="moneyStatus.type === 'surplus'">{{ formatMoney(moneyStatus.amount) }} ₽</template>
            <template v-else>Достигнут</template>
          </span>
        </div>
      </div>
    </div>

    <!-- Извещения о текущем статусе (из таблицы) -->
    <div v-if="statusMessage && !compact" class="messages-section">
      <div class="section-header">
        <span class="section-title">Текущий статус</span>
      </div>
      
      <div class="message-card primary">
        <div class="message-icon">📢</div>
        <p class="message-text">{{ statusMessage.извещение1 }}</p>
      </div>
      
      <!-- Извещение-2 с конкретной датой следующего этапа -->
      <div v-if="getNextMilestone" class="message-card secondary">
        <div class="message-icon">📅</div>
        <div class="message-content">
          <p class="message-label">Следующая контрольная точка:</p>
          <p class="message-title">{{ getNextMilestone.description }}</p>
          <p class="message-date">{{ getNextMilestone.date }}</p>
        </div>
      </div>
    </div>

    <!-- Информация о правилах -->
    <div v-if="!compact" class="rules-info">
      <div class="section-title">Правила отбора участников</div>
      <p class="hint">
        • Если участников больше лимита — побеждают те, кто внес больше средств<br>
        • Мероприятие состоится только при достижении требуемой суммы<br>
        • После подведения итогов излишне собранные деньги возвращаются участникам
      </p>
    </div>
  </div>
</template>

<style scoped>
.event-status-widget {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
}

.compact {
  padding: 12px;
}

/* Header */
.status-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.event-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.event-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  flex: 1;
  min-width: 0;
}

.upload-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}

.upload-date .icon {
  width: 16px;
  height: 16px;
  color: #64748b;
}

.event-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

/* КОНТЕЙНЕР ДЛЯ ТАЙМЕРА И КАЛЕНДАРЯ */
.timer-and-calendar-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .timer-and-calendar-container {
    grid-template-columns: 1fr;
  }
}

/* ТАЙМЕР ОБРАТНОГО ОТСЧЕТА */
.countdown-timer {
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  border: 3px solid #007AFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
  transition: all 0.3s ease;
}

.countdown-timer.urgent {
  background: linear-gradient(135deg, #ff3b30 0%, #ff9500 100%);
  border-color: #ff3b30;
  box-shadow: 0 8px 24px rgba(255, 59, 48, 0.4);
  animation: pulse-urgent 2s infinite;
}

.countdown-timer.zero {
  background: linear-gradient(135deg, #8e8e93 0%, #aeaeb2 100%);
  border-color: #8e8e93;
  box-shadow: 0 4px 12px rgba(142, 142, 147, 0.2);
}

@keyframes pulse-urgent {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 24px rgba(255, 59, 48, 0.4);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 12px 32px rgba(255, 59, 48, 0.6);
  }
}

.countdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.timer-icon {
  width: 24px;
  height: 24px;
  color: #fff;
}

.countdown-label {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.countdown-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 80px;
}

.countdown-number {
  font-size: 36px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.countdown-unit-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

.countdown-separator {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  opacity: 0.7;
}

.countdown-milestone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 10px 16px;
}

.milestone-icon {
  font-size: 20px;
}

.milestone-text {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

/* Контрольные точки */
.control-timeline {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.timeline-item {
  position: relative;
  flex: 1;
  text-align: center;
  padding-top: 8px;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 16px;
  right: -6px;
  width: 12px;
  height: 2px;
  background: #cbd5f5;
  opacity: 0.7;
}

.timeline-item.done:not(:last-child)::after {
  background: #34c759;
  opacity: 0.8;
}

.timeline-item.current:not(:last-child)::after {
  background: linear-gradient(90deg, #34c759 0%, #007aff 100%);
  opacity: 1;
}

.point-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin: 0 auto;
  background: #cbd5f5;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.timeline-item.done .point-dot {
  background: #34c759;
  box-shadow: 0 0 0 4px rgba(52, 199, 89, 0.15);
}

.timeline-item.current .point-dot {
  background: #007aff;
  box-shadow: 0 0 0 5px rgba(0, 122, 255, 0.2);
}

.point-label {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #475569;
}

.timeline-item.done .point-label {
  color: #0f172a;
}

.timeline-item.current .point-label {
  color: #1d4ed8;
}

.point-date {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.timeline-item.current .point-date {
  color: #1d4ed8;
}

.timeline-item.done .point-date {
  color: #0f172a;
}

/* Секция участников (компактно) */
.status-section.compact {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.5);
}

.stats-line {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 140px;
  padding: 10px 14px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(15, 23, 42, 0.08);
}

.stat-pill .pill-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.stat-pill .pill-value {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.stat-pill .pill-extra {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.stat-pill .pill-extra.deficit {
  color: #b91c1c;
}

.stat-pill .pill-extra.surplus {
  color: #059669;
}

.stat-pill.deficit {
  background: rgba(252, 165, 165, 0.15);
  border-color: rgba(220, 38, 38, 0.3);
}

.stat-pill.deficit .pill-label {
  color: #b91c1c;
}

.stat-pill.deficit .pill-value {
  color: #b91c1c;
}

.stat-pill.surplus {
  background: rgba(134, 239, 172, 0.15);
  border-color: rgba(5, 150, 105, 0.3);
}

.stat-pill.surplus .pill-label {
  color: #059669;
}

.stat-pill.surplus .pill-value {
  color: #059669;
}

.flag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(148, 163, 184, 0.15);
  color: #475569;
}

.flag.deficit {
  background: rgba(252, 165, 165, 0.2);
  color: #b91c1c;
}

.flag.surplus {
  background: rgba(134, 239, 172, 0.2);
  color: #166534;
}

.flag.balanced {
  background: rgba(96, 165, 250, 0.2);
  color: #1d4ed8;
}

/* Section Headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.progress-percent {
  font-size: 18px;
  font-weight: 700;
  color: #007AFF;
}

/* Progress Section */
.progress-section {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.progress-percent {
  font-size: 16px;
  font-weight: 700;
  color: #007AFF;
}

.progress-bar {
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007AFF 0%, #5856D6 100%);
  transition: width 0.5s ease;
}

/* Status Badges */
.status-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 8px;
  font-weight: 600;
  border: 2px solid;
}

.status-badge.red {
  background: #ffebee;
  border-color: #f44336;
  color: #c62828;
}

.status-badge.green {
  background: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}

.status-badge.blue {
  background: #e3f2fd;
  border-color: #2196f3;
  color: #1565c0;
}

.status-badge.yellow {
  background: #fff9c4;
  border-color: #ffeb3b;
  color: #f57f17;
}

.badge-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.badge-label {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-amount {
  font-size: 18px;
  font-weight: 700;
}


/* Messages Section */
.messages-section {
  margin-bottom: 16px;
}

.status-badge-small {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge-small.starting {
  background: #e3f2fd;
  color: #1565c0;
}

.status-badge-small.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge-small.processing {
  background: #fff9c4;
  color: #f57f17;
}

.status-badge-small.ongoing {
  background: #e1bee7;
  color: #6a1b9a;
}

.status-badge-small.completed {
  background: #c8e6c9;
  color: #1b5e20;
}

.status-badge-small.cancelled {
  background: #ffcdd2;
  color: #b71c1c;
}

.message-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.message-card.primary {
  background: #e3f2fd;
  border: 1px solid #90caf9;
}

.message-card.secondary {
  background: #fff9c4;
  border: 2px solid #ffd54f;
}

.message-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.message-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #1a1a1a;
}

.message-content {
  flex: 1;
}

.message-label {
  margin: 0 0 4px 0;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.message-title {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.message-date {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #f57f17;
}

/* Rules Info */
.rules-info {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.hint {
  font-size: 13px;
  line-height: 1.6;
  color: #666;
  margin: 8px 0 0 0;
}

.overflow-hint {
  margin-top: 12px;
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  font-weight: 600;
  color: #856404;
}

/* Icons */
.icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.status-badge .icon {
  width: 20px;
  height: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .event-title {
    font-size: 20px;
  }
  
  .event-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stat-value {
    font-size: 16px;
  }
  
  /* Таймер на мобильных */
  .countdown-timer {
    padding: 16px;
  }
  
  .countdown-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .countdown-label {
    font-size: 13px;
  }
  
  .countdown-display {
    gap: 4px;
    margin-bottom: 12px;
  }
  
  .countdown-unit {
    padding: 8px 10px;
    min-width: 60px;
  }
  
  .countdown-number {
    font-size: 24px;
  }
  
  .countdown-unit-label {
    font-size: 9px;
  }
  
  .countdown-separator {
    font-size: 24px;
  }
  
  .countdown-milestone {
    padding: 8px 12px;
  }
  
  .milestone-text {
    font-size: 13px;
  }
}

/* КАЛЕНДАРЬ И ЧАСЫ ПРОДЮСЕРА */
.producer-calendar {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  border: 3px solid #10b981;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
}

.producer-calendar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.calendar-icon {
  width: 24px;
  height: 24px;
  color: #fff;
}

.producer-calendar-label {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.producer-calendar-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.producer-date-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 16px;
}

.producer-full-date {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 8px;
  line-height: 1.2;
}

.producer-weekday {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.producer-time-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 16px;
}

.producer-time {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: 8px;
  line-height: 1;
}

.producer-timezone {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
}

@media (max-width: 768px) {
  .producer-calendar-content {
    grid-template-columns: 1fr;
  }
  
  .producer-time {
    font-size: 28px;
  }
  
  .producer-full-date {
    font-size: 18px;
  }
}
</style>

