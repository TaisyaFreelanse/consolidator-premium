<script setup lang="ts">
import { computed, watch } from 'vue'
import type { EventItem, MonitoringSnapshot, Applicant } from '~/types'

const props = defineProps<{
  event: EventItem
  snapshot: MonitoringSnapshot
  isOpen: boolean
  currentUserCode?: string
  currentUserLogin?: string // Добавляем поддержку логина
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
      currentUserLogin: props.currentUserLogin
    })
  }, { immediate: true })
}

const getLastPaymentTimestamp = (applicant: Applicant): number | null => {
  const payments = applicant.payments ?? []
  if (!payments.length) return null
  const lastPayment = payments[payments.length - 1]
  const timestamp = new Date(lastPayment.createdAt).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

const sortedApplicants = computed<Applicant[]>(() => {
  return [...props.snapshot.applicants].sort((a, b) => {
    if (b.paidAmount !== a.paidAmount) {
      return b.paidAmount - a.paidAmount
    }

    const timeA = getLastPaymentTimestamp(a)
    const timeB = getLastPaymentTimestamp(b)

    if (timeA !== null && timeB !== null && timeA !== timeB) {
      return timeA - timeB
    }

    if (timeA !== null && timeB === null) return -1
    if (timeA === null && timeB !== null) return 1

    return a.code.localeCompare(b.code)
  })
})

const limitIndex = computed(() => {
  const limit = props.event.seatLimit ?? 0
  if (!limit || limit <= 0) {
    return sortedApplicants.value.length
  }
  return Math.min(limit, sortedApplicants.value.length)
})

const withinLimitApplicants = computed(() => sortedApplicants.value.slice(0, limitIndex.value))
const overflowApplicants = computed(() => sortedApplicants.value.slice(limitIndex.value))

const overflowTotal = computed(() => overflowApplicants.value.reduce((sum, applicant) => sum + applicant.paidAmount, 0))

const pricePerSeat = computed(() => {
  if (props.event.pricePerSeat && props.event.pricePerSeat > 0) {
    return props.event.pricePerSeat
  }
  const base = props.event.priceTotal || 0
  const divisor = limitIndex.value > 0 ? limitIndex.value : sortedApplicants.value.length || 1
  return Math.round(base / divisor)
})

const totalSurplus = computed(() => {
  if (typeof props.snapshot.surplus === 'number') return props.snapshot.surplus
  const collected = props.snapshot.collected ?? 0
  const target = props.event.priceTotal ?? 0
  return Math.max(0, collected - target)
})

const surplusForDistribution = computed(() => Math.max(0, totalSurplus.value - overflowTotal.value))

const expectedPaymentFor = (applicant: Applicant) => {
  const seats = applicant.seats || 1
  return seats * pricePerSeat.value
}

const extrasMap = computed(() => {
  const map = new Map<string, { expected: number; extra: number; deficit: number }>()
  withinLimitApplicants.value.forEach((applicant) => {
    const expected = expectedPaymentFor(applicant)
    const extra = Math.max(0, applicant.paidAmount - expected)
    const deficit = Math.max(0, expected - applicant.paidAmount)
    map.set(applicant.code, { expected, extra, deficit })
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
  if (props.snapshot.isCancelled) return false
  const deficit = props.snapshot.deficit ?? Math.max(0, (props.event.priceTotal || 0) - (props.snapshot.collected || 0))
  return deficit <= 0
})

const formatMoney = (amount: number) => {
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

const formatTimestamp = (timestamp: number | null) => {
  if (timestamp === null) return '—'
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

const isViewerParticipant = computed(() => {
  if (!props.currentUserCode && !props.currentUserLogin) return false
  return sortedApplicants.value.some(applicant => {
    // Проверяем по логину (предпочтительно)
    if (props.currentUserLogin && applicant.login) {
      return applicant.login === props.currentUserLogin
    }
    // Проверяем по коду (для обратной совместимости)
    if (props.currentUserCode && applicant.code) {
      return applicant.code === props.currentUserCode
    }
    return false
  })
})

const ownerApplicant = computed(() => {
  if (!props.currentUserCode && !props.currentUserLogin) {
    if (process.client) {
      console.log('PersonalCalculation: no currentUserCode or currentUserLogin provided')
    }
    return null
  }
  
  if (process.client) {
    console.log('🔍 PersonalCalculation: searching for applicant', {
      currentUserCode: props.currentUserCode,
      currentUserLogin: props.currentUserLogin,
      applicantsCount: sortedApplicants.value.length,
      applicants: sortedApplicants.value.map(a => ({
        code: a.code,
        codeType: typeof a.code,
        codeLength: a.code?.length,
        login: a.login,
        loginType: typeof a.login,
        paidAmount: a.paidAmount
      }))
    })
  }
  
  // Сначала ищем по логину (предпочтительно)
  if (props.currentUserLogin) {
    // Нормализуем логин (убираем пробелы, приводим к нижнему регистру для сравнения)
    const normalizedLogin = props.currentUserLogin.trim().toLowerCase()
    const foundByLogin = sortedApplicants.value.find(applicant => {
      if (!applicant.login) return false
      return applicant.login.trim().toLowerCase() === normalizedLogin
    })
    if (foundByLogin) {
      if (process.client) {
        console.log('✅ PersonalCalculation: found by login', foundByLogin)
      }
      return foundByLogin
    }
    if (process.client) {
      console.log('❌ PersonalCalculation: not found by login', {
        searchedLogin: props.currentUserLogin,
        normalizedLogin,
        availableLogins: sortedApplicants.value.map(a => ({
          original: a.login,
          normalized: a.login?.trim().toLowerCase()
        })).filter(a => a.original)
      })
    }
  }
  
  // Если не нашли по логину, ищем по коду
  if (props.currentUserCode) {
    // Нормализуем код (убираем пробелы)
    const normalizedCode = props.currentUserCode.trim()
    const foundByCode = sortedApplicants.value.find(applicant => {
      if (!applicant.code) return false
      return applicant.code.trim() === normalizedCode
    })
    if (foundByCode) {
      if (process.client) {
        console.log('✅ PersonalCalculation: found by code', foundByCode)
      }
      return foundByCode
    }
    if (process.client) {
      console.log('❌ PersonalCalculation: not found by code', {
        searchedCode: props.currentUserCode,
        normalizedCode,
        availableCodes: sortedApplicants.value.map(a => ({
          code: a.code,
          codeType: typeof a.code,
          codeLength: a.code?.length,
          matches: a.code?.trim() === normalizedCode
        }))
      })
    }
  }
  
  if (process.client) {
    console.log('❌ PersonalCalculation: applicant not found')
  }
  return null
})

const resultForOwner = computed(() => {
  if (!ownerApplicant.value) {
    if (!sortedApplicants.value.length) return null
    return null
  }
  return computeResult(ownerApplicant.value)
})

const result = computed(() => resultForOwner.value)

const computeResult = (applicant: Applicant | null) => {
  if (!applicant) return null

  const payments = (applicant.payments ?? []).map((payment) => ({
    amount: payment.amount,
    createdAt: payment.createdAt
  }))
  const totalPaid = applicant.paidAmount

  if (!eventSuccessful.value) {
    const deficit = props.snapshot.deficit ?? Math.max(0, (props.event.priceTotal || 0) - (props.snapshot.collected || 0))
    return {
      status: 'failed' as const,
      totalPaid,
      payments,
      refundTotal: totalPaid,
      deficit
    }
  }

  const index = sortedApplicants.value.findIndex((candidate) => candidate.code === applicant.code)
  const effectiveIndex = index === -1 && ownerApplicant.value ? sortedApplicants.value.findIndex((candidate) => candidate.code === ownerApplicant.value?.code) : index
  const positionIndex = effectiveIndex === -1 ? sortedApplicants.value.findIndex(candidate => candidate.code === applicant.code) : effectiveIndex

  if (positionIndex >= limitIndex.value) {
    const thresholdApplicant = limitIndex.value > 0 ? sortedApplicants.value[limitIndex.value - 1] : null
    const thresholdAmount = thresholdApplicant?.paidAmount ?? null
    const thresholdTime = thresholdApplicant ? getLastPaymentTimestamp(thresholdApplicant) : null
    const selectedTime = getLastPaymentTimestamp(applicant)

    let reason: 'lower' | 'late' = 'lower'
    if (
      thresholdApplicant &&
      thresholdAmount !== null &&
      thresholdAmount === totalPaid &&
      selectedTime !== null &&
      thresholdTime !== null &&
      selectedTime > thresholdTime
    ) {
      reason = 'late'
    }

    return {
      status: 'overflow' as const,
      totalPaid,
      payments,
      refundTotal: totalPaid,
      reason,
      thresholdAmount,
      thresholdTime,
      selectedTime
    }
  }

  const extraData = extrasMap.value.get(applicant.code)
  const expectedPayment = extraData?.expected ?? expectedPaymentFor(applicant)
  const extraContribution = extraData?.extra ?? Math.max(0, applicant.paidAmount - expectedPayment)
  const deficit = extraData?.deficit ?? Math.max(0, expectedPayment - applicant.paidAmount)

  let share = 0
  if (surplusForDistribution.value > 0) {
    const count = withinLimitApplicants.value.length || 1
    if (count === 1) {
      // Для одного участника весь профицит возвращается ему
      share = 1
    } else if (totalExtras.value > 0) {
      // Распределяем пропорционально переплатам
      share = extraContribution / totalExtras.value
    } else {
      // Нет переплат - распределяем поровну
      share = 1 / count
    }
  }
  const refundFromSurplus = Math.round(surplusForDistribution.value * share)

  // Итоговый возврат: если участник переплатил, возвращаем его переплату (но не больше профицита)
  // Если профицит >= суммы всех переплат, возвращаем всю переплату участника
  // Если профицит < суммы всех переплат, возвращаем пропорциональную долю из профицита
  // Но в любом случае не больше, чем переплата участника
  let refundTotal = 0
  if (extraContribution > 0) {
    // Если профицит больше или равен сумме всех переплат, возвращаем всю переплату
    if (surplusForDistribution.value >= totalExtras.value && totalExtras.value > 0) {
      refundTotal = extraContribution
    } else {
      // Если профицит меньше суммы всех переплат, возвращаем пропорциональную долю
      // Но не больше, чем переплата участника
      refundTotal = Math.min(extraContribution, refundFromSurplus)
    }
  } else {
    // Если нет переплаты, возврат из профицита (если профицит распределяется поровну)
    refundTotal = refundFromSurplus
  }

  return {
    status: 'success' as const,
    totalPaid,
    payments,
    expectedPayment,
    extraContribution,
    deficit,
    share,
    refundFromSurplus,
    refundTotal,
    pricePerSeat: pricePerSeat.value,
    surplusAvailable: surplusForDistribution.value,
    overflowTotal: overflowTotal.value
  }
}
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
                <span class="value">{{ props.event.seatLimit ?? sortedApplicants.length }}</span>
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

            <div v-else-if="ownerApplicant" class="p-6 rounded-2xl border border-white/10 bg-white/5 text-white/80 text-sm space-y-2">
              <div class="flex justify-between">
                <span>Ваш логин</span>
                <span class="font-mono text-white">{{ ownerApplicant.login || '—' }}</span>
              </div>
              <div class="flex justify-between" v-if="ownerApplicant.paidAmount">
                <span>Всего оплачено</span>
                <span class="font-semibold text-white">{{ formatMoney(ownerApplicant.paidAmount) }} ₽</span>
              </div>
            </div>

            <div v-if="result" class="space-y-5">
              <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 class="section-title">Платежи заявителя</h3>
                <div v-if="result.payments.length > 0" class="space-y-3">
                  <div v-for="(payment, index) in result.payments" :key="index" class="flex items-center justify-between">
                    <span class="text-white/60">{{ formatDateTime(payment.createdAt) }}</span>
                    <span class="text-white font-semibold">{{ formatMoney(payment.amount) }} ₽</span>
                  </div>
                </div>
                <div v-else class="text-white/60 text-sm">Нет детальной информации о платежах</div>
              </div>

              <div v-if="result.status === 'failed'" class="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                <h3 class="section-title text-red-400">Сбор не состоялся</h3>
                <p class="text-white/80 text-sm mb-4">
                  Недостаточно собранных средств. Все платежи будут возвращены в полном объеме.
                </p>
                <div class="flex justify-between text-white/80 text-sm">
                  <span>Общая сумма взносов</span>
                  <span class="font-semibold text-white">{{ formatMoney(result.totalPaid) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/60 text-xs mt-2">
                  <span>Дефицит:</span>
                  <span>{{ formatMoney(result.deficit) }} ₽</span>
                </div>
              </div>

              <div v-else-if="result.status === 'overflow'" class="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
                <h3 class="section-title text-yellow-300">Вы не вошли в список участников</h3>
                <p class="text-white/80 text-sm mb-4">
                  <template v-if="result.reason === 'late'">
                    Ваша ставка поступила позже других участников с такой же суммой. Все внесенные средства будут возвращены полностью.
                  </template>
                  <template v-else>
                    Ваша ставка оказалась ниже порога. Внесенные средства будут возвращены полностью.
                  </template>
                </p>
                <div class="flex justify-between text-white/80 text-sm">
                  <span>Общая сумма взносов</span>
                  <span class="font-semibold text-white">{{ formatMoney(result.totalPaid) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/60 text-xs mt-2" v-if="result.thresholdAmount !== null">
                  <span>Пороговая ставка</span>
                  <span>{{ formatMoney(result.thresholdAmount) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/60 text-xs mt-2" v-if="result.reason === 'late' && result.thresholdTime !== null">
                  <span>Время порогового платежа</span>
                  <span>{{ formatTimestamp(result.thresholdTime) }}</span>
                </div>
                <div class="flex justify-between text-white/60 text-xs mt-1" v-if="result.reason === 'late' && result.selectedTime !== null">
                  <span>Ваш платеж поступил</span>
                  <span>{{ formatTimestamp(result.selectedTime) }}</span>
                </div>
              </div>

              <div v-else class="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 space-y-3">
                <h3 class="section-title text-blue-300">Событие состоится</h3>
                <div class="flex justify-between text-white/70 text-sm">
                  <span>Минимальный взнос ({{ (ownerApplicant?.seats || 1) }} × {{ formatMoney(pricePerSeat) }} ₽)</span>
                  <span class="text-white font-semibold">{{ formatMoney(result.expectedPayment) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/70 text-sm">
                  <span>Фактически внесено</span>
                  <span class="text-white font-semibold">{{ formatMoney(result.totalPaid) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/70 text-sm">
                  <span>Переплата</span>
                  <span class="text-white font-semibold">{{ formatMoney(result.extraContribution) }} ₽</span>
                </div>
                <div class="flex justify-between text-white/70 text-sm" v-if="result.deficit > 0">
                  <span>Недоплата</span>
                  <span class="text-white font-semibold">{{ formatMoney(result.deficit) }} ₽</span>
                </div>
                <div class="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70" v-if="result.refundFromSurplus > 0">
                  <div class="flex justify-between">
                    <span>Доля в распределении профицита</span>
                    <span class="text-white font-semibold">{{ (result.share * 100).toFixed(2) }}%</span>
                  </div>
                  <div class="flex justify-between mt-2">
                    <span>Профицит для распределения</span>
                    <span class="text-white font-semibold">{{ formatMoney(result.surplusAvailable) }} ₽</span>
                  </div>
                  <div class="flex justify-between mt-2">
                    <span>Возврат из профицита</span>
                    <span class="text-white font-semibold">{{ formatMoney(result.refundFromSurplus) }} ₽</span>
                  </div>
                </div>
                <div v-else class="text-white/60 text-sm">
                  Дополнительный возврат не предусмотрен — переплат не обнаружено.
                </div>
              </div>

              <div class="summary-card">
                <div class="summary-label">Итого к возврату</div>
                <div class="summary-value">{{ formatMoney(result.refundTotal) }} ₽</div>
              </div>
            </div>

            <div v-else-if="isViewerParticipant" class="text-center py-12 text-white/60">
              Персональный расчет появится после обработки ваших платежей.
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

