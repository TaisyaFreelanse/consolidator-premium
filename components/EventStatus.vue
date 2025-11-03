<script setup lang="ts">
import { computed } from 'vue'
import type { EventItem, MonitoringSnapshot } from '~/types'
import { 
  getCurrentTimeInterval, 
  getStatusMessage, 
  getMoneyStatus, 
  getSeatsStatus,
  getTimeRemaining 
} from '~/utils/statusMessages'

interface Props {
  event: EventItem
  snapshot?: MonitoringSnapshot
  compact?: boolean // Компактный вид для каталога
}

const props = defineProps<Props>()

// Текущий временной интервал
const timeInterval = computed(() => {
  return getCurrentTimeInterval(props.event)
})

// Определяем, отменено ли мероприятие (если собрано недостаточно средств)
const isCancelled = computed(() => {
  if (!props.snapshot) return false
  const collected = props.snapshot.collected || 0
  // Мероприятие отменяется, если собрано менее 100% от требуемой суммы
  // и мы находимся на этапе после ti20 (окончание приема заявок)
  const interval = timeInterval.value?.currentInterval || ''
  const isAfterCollection = ['ti20-ti30', 'ti30-ti40', 'ti40-ti50', 'ti50-t999'].includes(interval)
  return isAfterCollection && collected < props.event.priceTotal
})

// Сообщение о статусе
const statusMessage = computed(() => {
  if (!timeInterval.value) return null
  return getStatusMessage(timeInterval.value.currentInterval, isCancelled.value)
})

// Статус денег (дефицит/профицит)
const moneyStatus = computed(() => {
  if (!props.snapshot) {
    return getMoneyStatus(0, props.event.priceTotal)
  }
  
  const applicantsCount = props.snapshot.applicants.length
  const seatLimit = props.event.seatLimit || 20
  
  // Если участников >= лимита, считаем сумму топ-N участников
  if (applicantsCount >= seatLimit) {
    // Сортируем участников по убыванию взноса
    const sortedApplicants = [...props.snapshot.applicants].sort((a, b) => b.paidAmount - a.paidAmount)
    // Берем топ-N
    const topN = sortedApplicants.slice(0, seatLimit)
    // Считаем сумму топ-N
    const topNTotal = topN.reduce((sum, app) => sum + app.paidAmount, 0)
    return getMoneyStatus(topNTotal, props.event.priceTotal)
  }
  
  // Если участников < лимита, берем общую собранную сумму
  const collected = props.snapshot.collected || 0
  return getMoneyStatus(collected, props.event.priceTotal)
})

// Статус мест
const seatsStatus = computed(() => {
  const applicantsCount = props.snapshot?.applicants.length || 0
  const seatLimit = props.event.seatLimit || 20
  return getSeatsStatus(applicantsCount, seatLimit)
})

// Время до конца сбора
const timeRemaining = computed(() => {
  if (!props.event.endApplicationsAt) return null
  return getTimeRemaining(props.event.endApplicationsAt)
})

// Процент собранных средств
const collectedPercent = computed(() => {
  const collected = props.snapshot?.collected || 0
  return Math.min(100, Math.round((collected / props.event.priceTotal) * 100))
})

// Форматирование суммы
const formatMoney = (amount: number) => {
  return (amount / 100).toLocaleString('ru-RU', { minimumFractionDigits: 0 })
}

// Форматирование даты начала и конца сбора
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', { 
    day: '2-digit', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<template>
  <div :class="['event-status-widget', compact ? 'compact' : 'detailed']">
    <!-- Заголовок с названием мероприятия (только для detailed) -->
    <div v-if="!compact" class="status-header">
      <h3 class="event-title">{{ event.title }}</h3>
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

    <!-- Сроки сбора заявок (КРИТИЧНО ВАЖНО) -->
    <div class="dates-block">
      <div class="date-row">
        <span class="date-label">Начало приема заявок:</span>
        <span class="date-value">{{ event.startApplicationsAt ? formatDate(event.startApplicationsAt) : 'Не указано' }}</span>
      </div>
      <div class="date-row">
        <span class="date-label">Окончание приема заявок:</span>
        <span class="date-value">{{ event.endApplicationsAt ? formatDate(event.endApplicationsAt) : 'Не указано' }}</span>
      </div>
      <div v-if="timeRemaining" class="time-remaining" :class="{ urgent: timeRemaining.urgent, ended: timeRemaining.ended }">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>{{ timeRemaining.formatted }}</span>
      </div>
    </div>

    <!-- СТАТУС УЧАСТНИКОВ И ДЕНЕГ -->
    <!-- Логика: если участников < лимита → показываем дефицит денег -->
    <!-- Если участников ≥ лимита → денег достаточно (priceTotal = seatLimit × pricePerSeat), показываем конкуренцию -->
    <div class="status-section">
      <div class="section-header">
        <span class="section-title">Участники и средства</span>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Зарегистрировано:</div>
          <div class="stat-value">{{ snapshot?.applicants.length || 0 }} чел.</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Лимит мест:</div>
          <div class="stat-value">{{ event.seatLimit || 20 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Собрано:</div>
          <div class="stat-value">{{ formatMoney(snapshot?.collected || 0) }} ₽</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Требуется:</div>
          <div class="stat-value">{{ formatMoney(event.priceTotal) }} ₽</div>
        </div>
      </div>

      <!-- СЛУЧАЙ 1: Участников < лимита → показываем статус мест и денег -->
      <div v-if="seatsStatus.type === 'available'">
        <!-- Прогресс сбора средств -->
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">Прогресс сбора:</span>
            <span class="progress-percent">{{ collectedPercent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: collectedPercent + '%' }"></div>
          </div>
        </div>

        <!-- Дефицит денег (если есть) -->
        <div v-if="moneyStatus.type === 'deficit'" class="status-badge red">
          <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <div class="badge-content">
            <span class="badge-label">НЕДОБОР СРЕДСТВ</span>
            <span class="badge-amount">Не хватает: {{ formatMoney(moneyStatus.amount) }} ₽</span>
          </div>
        </div>

        <!-- Достаточно средств -->
        <div v-else class="status-badge green">
          <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <div class="badge-content">
            <span class="badge-label">СРЕДСТВ ДОСТАТОЧНО</span>
            <span class="badge-amount">Есть свободные места: {{ seatsStatus.freeSeats }}</span>
          </div>
        </div>
      </div>

      <!-- СЛУЧАЙ 2: Участников ≥ лимита → показываем только конкуренцию (денег точно достаточно после отбора топ-N) -->
      <div v-else>
        <!-- Средств достаточно (после отбора топ-N) -->
        <div class="status-badge green">
          <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <div class="badge-content">
            <span class="badge-label">СРЕДСТВ ДОСТАТОЧНО</span>
            <span class="badge-amount">Топ-{{ event.seatLimit || 20 }} участников внесли достаточно</span>
          </div>
        </div>

        <!-- Перебор участников -->
        <div v-if="seatsStatus.type === 'overflow'" class="status-badge red">
          <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <div class="badge-content">
            <span class="badge-label">ПЕРЕБОР УЧАСТНИКОВ</span>
            <span class="badge-amount">Претендентов: {{ snapshot?.applicants.length || 0 }} / Мест: {{ event.seatLimit || 20 }}</span>
          </div>
        </div>

        <!-- Мест ровно хватает -->
        <div v-else class="status-badge yellow">
          <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/>
          </svg>
          <div class="badge-content">
            <span class="badge-label">МЕСТ РОВНО ХВАТАЕТ</span>
            <span class="badge-amount">Заняты все {{ event.seatLimit || 20 }} мест</span>
          </div>
        </div>

        <!-- Подсказка о конкуренции -->
        <div v-if="seatsStatus.type === 'overflow'" class="hint overflow-hint">
          ⚠️ <strong>Конкуренция за места!</strong> Будут отобраны топ-{{ event.seatLimit || 20 }} участников с наибольшими взносами. Повышайте ставку для гарантии участия.
        </div>
      </div>
    </div>

    <!-- Извещения о текущем статусе (из таблицы) -->
    <div v-if="statusMessage && !compact" class="messages-section">
      <div class="section-header">
        <span class="section-title">Текущий статус</span>
        <span class="period-badge">{{ statusMessage.period }}</span>
      </div>
      
      <div class="message-card primary">
        <div class="message-icon">📢</div>
        <p class="message-text">{{ statusMessage.извещение1 }}</p>
      </div>
      
      <div v-if="statusMessage.извещение2" class="message-card secondary">
        <div class="message-icon">💡</div>
        <p class="message-text">{{ statusMessage.извещение2 }}</p>
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
  padding: 20px;
}

.compact {
  padding: 16px;
}

/* Header */
.status-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.event-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px 0;
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

/* Dates Block - КРИТИЧНО ВАЖНО */
.dates-block {
  background: #f8f9fa;
  border: 2px solid #007AFF;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.date-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.date-row:last-child {
  margin-bottom: 0;
}

.date-label {
  font-weight: 600;
  color: #444;
}

.date-value {
  font-weight: 700;
  color: #007AFF;
}

.time-remaining {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
  font-size: 16px;
  font-weight: 700;
  color: #007AFF;
}

.time-remaining.urgent {
  color: #ff3b30;
  animation: pulse 2s infinite;
}

.time-remaining.ended {
  color: #8e8e93;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
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

/* Status Section (Участники и средства) */
.status-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  color: #1a1a1a;
  font-weight: 700;
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
  margin-bottom: 20px;
}

.period-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #007AFF;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.message-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.message-card.primary {
  background: #e3f2fd;
  border: 1px solid #90caf9;
}

.message-card.secondary {
  background: #fff9c4;
  border: 1px solid #fff59d;
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

/* Rules Info */
.rules-info {
  padding: 16px;
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
}
</style>

