<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EventItem, MonitoringSnapshot, Applicant } from '~/types'

const props = defineProps<{
  event: EventItem
  snapshot: MonitoringSnapshot
  isOpen: boolean
  currentUserCode?: string
}>()

const emit = defineEmits<{ close: [] }>()

const selectedApplicantCode = ref('')

const sortedApplicants = computed<Applicant[]>(() => {
  return [...props.snapshot.applicants].sort((a, b) => b.paidAmount - a.paidAmount)
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
  withinLimitApplicants.value.forEach((applicant) => {
    const data = extrasMap.value.get(applicant.code)
    if (data) {
      sum += data.extra
    }
  })
  return sum
})

const eventSuccessful = computed(() => {
  if (props.snapshot.isCancelled) return false
  const deficit = props.snapshot.deficit ?? Math.max(0, (props.event.priceTotal || 0) - (props.snapshot.collected || 0))
  return deficit <= 0
})

const selectedApplicant = computed(() => {
  if (!selectedApplicantCode.value) return null
  return sortedApplicants.value.find((applicant) => applicant.code === selectedApplicantCode.value) ?? null
})

const selectedIndex = computed(() => {
  if (!selectedApplicant.value) return -1
  return sortedApplicants.value.findIndex((applicant) => applicant.code === selectedApplicant.value?.code)
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

const result = computed(() => {
  const applicant = selectedApplicant.value
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

  if (selectedIndex.value >= limitIndex.value) {
    return {
      status: 'overflow' as const,
      totalPaid,
      payments,
      refundTotal: totalPaid
    }
  }

  const extraData = extrasMap.value.get(applicant.code)
  const expectedPayment = extraData?.expected ?? expectedPaymentFor(applicant)
  const extraContribution = extraData?.extra ?? Math.max(0, applicant.paidAmount - expectedPayment)
  const deficit = extraData?.deficit ?? Math.max(0, expectedPayment - applicant.paidAmount)

  let share = 0
  if (surplusForDistribution.value > 0) {
    if (totalExtras.value > 0) {
      share = extraContribution / totalExtras.value
    } else {
      const count = withinLimitApplicants.value.length || 1
      share = 1 / count
    }
  }
  const refundFromSurplus = Math.round(surplusForDistribution.value * share)

  return {
    status: 'success' as const,
    totalPaid,
    payments,
    expectedPayment,
    extraContribution,
    deficit,
    share,
    refundFromSurplus,
    refundTotal: refundFromSurplus,
    pricePerSeat: pricePerSeat.value,
    surplusAvailable: surplusForDistribution.value,
    overflowTotal: overflowTotal.value
  }
})

watch(
  () => props.isOpen,
  (opened) => {
    if (!opened) return
    const codes = sortedApplicants.value.map((app) => app.code)
    if (props.currentUserCode && codes.includes(props.currentUserCode)) {
      selectedApplicantCode.value = props.currentUserCode
    } else if (!codes.includes(selectedApplicantCode.value)) {
      selectedApplicantCode.value = codes[0] ?? ''
    }
  },
  { immediate: true }
)

watch(
  () => props.snapshot.applicants,
  (list) => {
    const codes = list.map((applicant) => applicant.code)
    if (!codes.includes(selectedApplicantCode.value)) {
      selectedApplicantCode.value = codes[0] ?? ''
    }
  },
  { deep: true }
)

const closeModal = () => {
  emit('close')
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
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
          class="w-full max-w-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f1a] border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div class="relative bg-gradient-to-r from-[#007AFF]/20 to-[#5E5CE6]/20 border-b border-white/10 p-8">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold text-white mb-2" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
                  Персональная калькуляция
                </h2>
                <p class="text-white/70 text-sm">Расчет возврата средств по итогам приема заявок</p>
              </div>
              <button
                @click="closeModal"
                class="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="p-8 space-y-6">
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

            <div>
              <label class="block text-white/80 font-semibold mb-3 text-sm uppercase tracking-wider">
                Выберите заявителя
              </label>
              <select
                v-model="selectedApplicantCode"
                class="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-[#007AFF] transition-colors font-mono text-lg"
              >
                <option value="" class="bg-[#1a1a1a] text-white/60">Выберите заявителя...</option>
                <option
                  v-for="applicant in sortedApplicants"
                  :key="applicant.code"
                  :value="applicant.code"
                  class="bg-[#1a1a1a] text-white"
                >
                  {{ applicant.code }} — {{ formatMoney(applicant.paidAmount) }} ₽
                </option>
              </select>
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
                  Ваша ставка оказалась ниже порога. Внесенные средства будут возвращены полностью.
                </p>
                <div class="flex justify-between text-white/80 text-sm">
                  <span>Общая сумма взносов</span>
                  <span class="font-semibold text-white">{{ formatMoney(result.totalPaid) }} ₽</span>
                </div>
              </div>

              <div v-else class="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 space-y-3">
                <h3 class="section-title text-blue-300">Событие состоится</h3>
                <div class="flex justify-between text-white/70 text-sm">
                  <span>Минимальный взнос ({{ (selectedApplicant?.seats || 1) }} × {{ formatMoney(pricePerSeat) }} ₽)</span>
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

            <div v-else class="text-center py-12 text-white/60">
              Выберите заявителя, чтобы увидеть расчет.
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
  padding: 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.info-card .label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.info-card .value {
  font-size: 20px;
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
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.25), rgba(94, 92, 230, 0.2));
  border: 1px solid rgba(0, 122, 255, 0.35);
  text-align: center;
}

.summary-label {
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
}

.summary-value {
  font-size: 32px;
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

