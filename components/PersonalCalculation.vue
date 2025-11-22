<script setup lang="ts">
import { computed, watch } from 'vue'
import type { EventItem, MonitoringSnapshot, Applicant, PersonalCalculationResult } from '~/types'

const props = defineProps<{
  event: EventItem
  snapshot: MonitoringSnapshot
  isOpen: boolean
  currentUserCode?: string
  currentUserLogin?: string
}>()

const emit = defineEmits<{ close: [] }>()

// Логирование для отладки
if (process.client) {
  watch(() => props.isOpen, (newVal) => {
    console.log('🔔 PersonalCalculation: isOpen changed to', newVal)
    console.log('📋 PersonalCalculation props:', {
      isOpen: props.isOpen,
      hasEvent: !!props.event,
      hasSnapshot: !!props.snapshot,
      currentUserCode: props.currentUserCode,
      currentUserLogin: props.currentUserLogin,
      hasPersonalCalculations: !!props.snapshot.personalCalculations,
      personalCalculationsCount: props.snapshot.personalCalculations?.length || 0
    })
  }, { immediate: true })
}

// Находим персональный расчет для текущего пользователя из готовых данных API
const personalCalculation = computed<PersonalCalculationResult | null>(() => {
  if (!props.snapshot.personalCalculations || props.snapshot.personalCalculations.length === 0) {
    if (process.client) {
      console.warn('PersonalCalculation: personalCalculations not found in snapshot')
    }
    return null
  }

  // Сначала ищем по логину (предпочтительно)
  if (props.currentUserLogin) {
    const normalizedLogin = props.currentUserLogin.trim().toLowerCase()
    const found = props.snapshot.personalCalculations.find(calc => {
      if (!calc.applicantLogin) return false
      return calc.applicantLogin.trim().toLowerCase() === normalizedLogin
    })
    if (found) {
      if (process.client) {
        console.log('✅ PersonalCalculation: found by login', found)
      }
      return found
    }
  }

  // Если не нашли по логину, ищем по коду
  if (props.currentUserCode) {
    const normalizedCode = props.currentUserCode.trim()
    const found = props.snapshot.personalCalculations.find(calc => {
      if (!calc.applicantCode) return false
      return calc.applicantCode.trim() === normalizedCode
    })
    if (found) {
      if (process.client) {
        console.log('✅ PersonalCalculation: found by code', found)
      }
      return found
    }
  }

  if (process.client) {
    console.warn('❌ PersonalCalculation: calculation not found for user', {
      currentUserCode: props.currentUserCode,
      currentUserLogin: props.currentUserLogin,
      availableCodes: props.snapshot.personalCalculations.map(c => c.applicantCode),
      availableLogins: props.snapshot.personalCalculations.map(c => c.applicantLogin).filter(Boolean)
    })
  }
  return null
})

// Находим заявителя для отображения дополнительной информации
const ownerApplicant = computed<Applicant | null>(() => {
  if (!props.currentUserCode && !props.currentUserLogin) return null

  // Сначала ищем по логину
  if (props.currentUserLogin) {
    const normalizedLogin = props.currentUserLogin.trim().toLowerCase()
    const found = props.snapshot.applicants.find(applicant => {
      if (!applicant.login) return false
      return applicant.login.trim().toLowerCase() === normalizedLogin
    })
    if (found) return found
  }

  // Ищем по коду
  if (props.currentUserCode) {
    const normalizedCode = props.currentUserCode.trim()
    const found = props.snapshot.applicants.find(applicant => {
      if (!applicant.code) return false
      return applicant.code.trim() === normalizedCode
    })
    if (found) return found
  }

  return null
})

// Проверяем, является ли просматривающий участником
const isViewerParticipant = computed(() => {
  return !!personalCalculation.value || !!ownerApplicant.value
})

// Статус сбора мероприятия
const eventSuccessful = computed(() => {
  if (props.snapshot.isCancelled) return false
  const deficit = props.snapshot.deficit ?? Math.max(0, (props.event.priceTotal || 0) - (props.snapshot.collected || 0))
  return deficit <= 0
})

// Цена за место из персонального расчета или события
const pricePerSeat = computed(() => {
  if (personalCalculation.value?.pricePerSeat) {
    return personalCalculation.value.pricePerSeat
  }
  if (props.event.pricePerSeat && props.event.pricePerSeat > 0) {
    return props.event.pricePerSeat
  }
  return 0
})

// Утилиты форматирования
const formatMoney = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return '0.00'
  return (amount / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatDateTime = (iso: string) => {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTimestamp = (timestamp: number | null | undefined) => {
  if (timestamp === null || timestamp === undefined) return '—'
  return new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const closeModal = () => {
  emit('close')
}

// Получаем платежи из заявителя
const payments = computed(() => {
  if (!ownerApplicant.value?.payments) return []
  return ownerApplicant.value.payments.map(payment => ({
    amount: payment.amount,
    createdAt: payment.createdAt
  }))
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      @click.self="closeModal"
    >
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 scale-95 -translate-y-4"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 -translate-y-4"
      >
        <div
          v-if="isOpen"
          class="w-full max-w-[520px] bg-gradient-to-br from-[#1a1a1a] to-[#0f0f1a] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-8 relative z-[10000]"
        >
          <div class="relative bg-gradient-to-r from-[#007AFF]/20 to-[#5E5CE6]/20 border-b border-white/10 p-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold text-white mb-2" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
                  Персональная калькуляция
                </h2>
                <p class="text-white/70 text-xs">Расчет возврата средств по итогам приема заявок</p>
              </div>
              <button
                @click="closeModal"
                class="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="p-6 space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="info-card">
                <span class="label">Мест всего</span>
                <span class="value">{{ props.event.seatLimit ?? snapshot.applicants.length }}</span>
              </div>
              <div class="info-card">
                <span class="label">Базовая цена за место</span>
                <span class="value">{{ formatMoney(pricePerSeat) }} ₽</span>
              </div>
              <div class="info-card" :class="eventSuccessful ? 'text-success' : 'text-danger'">
                <span class="label">Статус сбора</span>
                <span class="value">{{ eventSuccessful ? 'Состоится' : 'Не состоится' }}</span>
              </div>
            </div>

            <div v-if="!isViewerParticipant" class="p-6 rounded-2xl border border-white/10 bg-white/5 text-white/70 text-sm">
              Вы еще не подавали заявку на это мероприятие. Подайте заявку, чтобы увидеть персональный расчет.
            </div>

            <div v-else-if="ownerApplicant && !personalCalculation" class="p-6 rounded-2xl border border-white/10 bg-white/5 text-white/80 text-sm space-y-2">
              <div class="flex justify-between">
                <span>Ваш логин</span>
                <span class="font-mono text-white">{{ ownerApplicant.login || '—' }}</span>
              </div>
              <div class="flex justify-between" v-if="ownerApplicant.paidAmount">
                <span>Всего оплачено</span>
                <span class="font-semibold text-white">{{ formatMoney(ownerApplicant.paidAmount) }} ₽</span>
              </div>
              <div class="mt-4 text-yellow-400 text-sm">
                ⏳ Персональный расчет появится после обработки ваших платежей на платформе.
              </div>
            </div>

            <div v-else-if="personalCalculation" class="space-y-5">
              <div v-if="ownerApplicant" class="p-6 rounded-2xl border border-white/10 bg-white/5 text-white/80 text-sm space-y-2">
                <div class="flex justify-between">
                  <span>Ваш логин</span>
                  <span class="font-mono text-white">{{ ownerApplicant.login || personalCalculation.applicantLogin || '—' }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Всего оплачено</span>
                  <span class="font-semibold text-white">{{ formatMoney(personalCalculation.totalPaid) }} ₽</span>
                </div>
              </div>

              <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 class="section-title">Платежи заявителя</h3>
                <div v-if="payments.length > 0" class="space-y-3">
                  <div v-for="(payment, index) in payments" :key="index" class="flex items-center justify-between">
                    <span class="text-white/60">{{ formatDateTime(payment.createdAt) }}</span>
                    <span class="text-white font-semibold">{{ formatMoney(payment.amount) }} ₽</span>
                  </div>
                </div>
                <div v-else class="text-white/60 text-sm">Нет детальной информации о платежах</div>
              </div>

              <!-- Статус: Сбор не состоялся -->
              <div v-if="personalCalculation.status === 'failed'" class="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                <h3 class="section-title text-red-400">Сбор не состоялся</h3>
                <p class="text-white/80 text-sm mb-4">
                  Недостаточно собранных средств. Все платежи будут возвращены в полном объеме.
                </p>
                <div class="flex justify-between text-white/80 text-sm">
                  <span>Общая сумма взносов</span>
                  <span class="font-semibold text-white">{{ formatMoney(personalCalculation.totalPaid) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/60 text-xs mt-2" v-if="personalCalculation.deficit !== undefined && personalCalculation.deficit > 0">
                  <span>Дефицит:</span>
                  <span>{{ formatMoney(personalCalculation.deficit) }} ₽</span>
                </div>
              </div>

              <!-- Статус: Сверх лимита -->
              <div v-else-if="personalCalculation.status === 'overflow'" class="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
                <h3 class="section-title text-yellow-300">Вы не вошли в список участников</h3>
                <p class="text-white/80 text-sm mb-4">
                  <template v-if="personalCalculation.reason === 'late'">
                    Ваша ставка поступила позже других участников с такой же суммой. Все внесенные средства будут возвращены полностью.
                  </template>
                  <template v-else>
                    Ваша ставка оказалась ниже порога. Внесенные средства будут возвращены полностью.
                  </template>
                </p>
                <div class="flex justify-between text-white/80 text-sm">
                  <span>Общая сумма взносов</span>
                  <span class="font-semibold text-white">{{ formatMoney(personalCalculation.totalPaid) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/60 text-xs mt-2" v-if="personalCalculation.thresholdAmount !== null && personalCalculation.thresholdAmount !== undefined">
                  <span>Пороговая ставка</span>
                  <span>{{ formatMoney(personalCalculation.thresholdAmount) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/60 text-xs mt-2" v-if="personalCalculation.reason === 'late' && personalCalculation.thresholdTime !== null && personalCalculation.thresholdTime !== undefined">
                  <span>Время порогового платежа</span>
                  <span>{{ formatTimestamp(personalCalculation.thresholdTime) }}</span>
                </div>
                <div class="flex justify-between text-white/60 text-xs mt-1" v-if="personalCalculation.reason === 'late' && personalCalculation.selectedTime !== null && personalCalculation.selectedTime !== undefined">
                  <span>Ваш платеж поступил</span>
                  <span>{{ formatTimestamp(personalCalculation.selectedTime) }}</span>
                </div>
              </div>

              <!-- Статус: Успешно в лимите -->
              <div v-else-if="personalCalculation.status === 'success'" class="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 space-y-3">
                <h3 class="section-title text-blue-300">Событие состоится</h3>
                <div class="flex justify-between text-white/70 text-sm" v-if="personalCalculation.expectedPayment !== undefined">
                  <span>Минимальный взнос ({{ ownerApplicant?.seats || 1 }} × {{ formatMoney(pricePerSeat) }} ₽)</span>
                  <span class="text-white font-semibold">{{ formatMoney(personalCalculation.expectedPayment) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/70 text-sm">
                  <span>Фактически внесено</span>
                  <span class="text-white font-semibold">{{ formatMoney(personalCalculation.totalPaid) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/70 text-sm" v-if="personalCalculation.extraContribution !== undefined && personalCalculation.extraContribution > 0">
                  <span>Переплата</span>
                  <span class="text-white font-semibold">{{ formatMoney(personalCalculation.extraContribution) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/70 text-sm" v-if="personalCalculation.deficit !== undefined && personalCalculation.deficit > 0">
                  <span>Недоплата</span>
                  <span class="text-white font-semibold">{{ formatMoney(personalCalculation.deficit) }} ₽</span>
                </div>
                <div class="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70" v-if="personalCalculation.refundFromSurplus !== undefined && personalCalculation.refundFromSurplus > 0">
                  <div class="flex justify-between" v-if="personalCalculation.share !== undefined">
                    <span>Доля в распределении профицита</span>
                    <span class="text-white font-semibold">{{ (personalCalculation.share * 100).toFixed(2) }}%</span>
                  </div>
                  <div class="flex justify-between mt-2" v-if="personalCalculation.surplusAvailable !== undefined">
                    <span>Профицит для распределения</span>
                    <span class="text-white font-semibold">{{ formatMoney(personalCalculation.surplusAvailable) }} ₽</span>
                  </div>
                  <div class="flex justify-between mt-2">
                    <span>Возврат из профицита</span>
                    <span class="text-white font-semibold">{{ formatMoney(personalCalculation.refundFromSurplus) }} ₽</span>
                  </div>
                </div>
                <div v-else class="text-white/60 text-sm">
                  Дополнительный возврат не предусмотрен — переплат не обнаружено.
                </div>
              </div>

              <div class="summary-card">
                <div class="summary-label">Итого к возврату</div>
                <div class="summary-value">{{ formatMoney(personalCalculation.refundTotal) }} ₽</div>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                @click="closeModal"
                class="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all duration-300"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.info-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-card .label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.info-card .value {
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.info-card.text-success .value {
  color: #30d158;
}

.info-card.text-danger .value {
  color: #ff453a;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 10px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.25), rgba(94, 92, 230, 0.2));
  border: 1px solid rgba(0, 122, 255, 0.35);
  text-align: center;
}

.summary-label {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
}

.summary-value {
  font-size: 26px;
  font-weight: 800;
  color: white;
}

.text-success {
  color: #34c759 !important;
}

.text-danger {
  color: #ff3b30 !important;
}
</style>
