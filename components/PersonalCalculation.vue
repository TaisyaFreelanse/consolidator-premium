<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MonitoringSnapshot, EventItem, Applicant } from '~/types'

const props = defineProps<{
  event: EventItem
  snapshot: MonitoringSnapshot
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const selectedApplicantCode = ref('')

// Найти заявителя по коду
const selectedApplicant = computed(() => {
  if (!selectedApplicantCode.value) return null
  return props.snapshot.applicants.find(a => a.code === selectedApplicantCode.value)
})

// Расчет персональных данных
const calculation = computed(() => {
  if (!selectedApplicant.value) return null
  
  const applicant = selectedApplicant.value
  const totalPaid = applicant.paidAmount
  
  // Экстра-взнос = оплачено - (количество мест * цена за место)
  const expectedPayment = applicant.seats * (props.event.pricePerSeat || 0)
  const extraPayment = Math.max(0, totalPaid - expectedPayment)
  
  // Доля в возврате = экстра-взнос / общий профицит
  const shareInReturn = props.snapshot.surplus > 0 
    ? extraPayment / props.snapshot.surplus 
    : 0
  
  // Сумма возврата = доля * профицит
  const returnAmount = Math.round(shareInReturn * props.snapshot.surplus)
  
  return {
    code: applicant.code,
    seats: applicant.seats,
    paidAmount: totalPaid,
    expectedPayment,
    extraPayment,
    shareInReturn,
    returnAmount
  }
})

const closeModal = () => {
  emit('close')
  selectedApplicantCode.value = ''
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
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="closeModal">
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 scale-95 -translate-y-4"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 -translate-y-4"
      >
        <div v-if="isOpen" class="w-full max-w-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f1a] border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          <!-- Заголовок -->
          <div class="relative bg-gradient-to-r from-[#007AFF]/20 to-[#5E5CE6]/20 border-b border-white/10 p-8">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold text-white mb-2" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
                  Персональная калькуляция
                </h2>
                <p class="text-white/70 text-sm">Расчет возврата для заявителя</p>
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

          <!-- Контент -->
          <div class="p-8">
            <!-- Выбор заявителя -->
            <div class="mb-8">
              <label class="block text-white/80 font-semibold mb-3 text-sm uppercase tracking-wider">
                Код заявителя
              </label>
              <select
                v-model="selectedApplicantCode"
                class="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-[#007AFF] transition-colors font-mono text-lg"
              >
                <option value="" class="bg-[#1a1a1a] text-white/60">Выберите заявителя...</option>
                <option
                  v-for="applicant in snapshot.applicants"
                  :key="applicant.code"
                  :value="applicant.code"
                  class="bg-[#1a1a1a] text-white"
                >
                  {{ applicant.code }} ({{ applicant.seats }} {{ applicant.seats === 1 ? 'место' : 'мест' }})
                </option>
              </select>
            </div>

            <!-- Результаты расчета -->
            <div v-if="calculation" class="space-y-4">
              <!-- Информация о заявителе -->
              <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 class="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">Информация о заявителе</h3>
                <div class="grid grid-cols-2 gap-6">
                  <div>
                    <div class="text-white/60 text-xs mb-1">Код заявителя</div>
                    <div class="text-white font-bold font-mono text-xl">{{ calculation.code }}</div>
                  </div>
                  <div>
                    <div class="text-white/60 text-xs mb-1">Забронировано мест</div>
                    <div class="text-white font-bold text-xl">{{ calculation.seats }}</div>
                  </div>
                </div>
              </div>

              <!-- Расчет оплаты -->
              <div class="bg-gradient-to-br from-[#007AFF]/10 to-[#5E5CE6]/10 backdrop-blur-xl border border-[#007AFF]/20 rounded-2xl p-6">
                <h3 class="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  Расчет оплаты
                </h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between py-2">
                    <span class="text-white/70">Ожидаемая оплата:</span>
                    <span class="text-white font-semibold">{{ (calculation.expectedPayment / 100).toLocaleString('ru-RU') }} ₽</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-white/70">Фактически внесено:</span>
                    <span class="text-white font-bold text-lg">{{ (calculation.paidAmount / 100).toLocaleString('ru-RU') }} ₽</span>
                  </div>
                  <div class="border-t border-white/10 pt-3">
                    <div class="flex items-center justify-between">
                      <span class="text-[#007AFF] font-semibold">Экстра-взнос:</span>
                      <span class="text-[#007AFF] font-bold text-xl">{{ (calculation.extraPayment / 100).toLocaleString('ru-RU') }} ₽</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Расчет возврата -->
              <div v-if="snapshot.surplus > 0" class="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
                <h3 class="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                  </svg>
                  Расчет возврата
                </h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between py-2">
                    <span class="text-white/70">Общий профицит:</span>
                    <span class="text-white font-semibold">{{ (snapshot.surplus / 100).toLocaleString('ru-RU') }} ₽</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-white/70">Доля в возврате:</span>
                    <span class="text-white font-semibold">{{ (calculation.shareInReturn * 100).toFixed(3) }}%</span>
                  </div>
                  <div class="border-t border-green-500/20 pt-3">
                    <div class="flex items-center justify-between">
                      <span class="text-green-400 font-semibold">Сумма возврата:</span>
                      <span class="text-green-400 font-bold text-2xl">{{ (calculation.returnAmount / 100).toLocaleString('ru-RU') }} ₽</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Нет возврата -->
              <div v-else-if="snapshot.deficit > 0" class="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 text-center">
                <svg class="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div class="text-red-400 font-semibold mb-1">Возврат не предусмотрен</div>
                <div class="text-white/60 text-sm">Собранных средств недостаточно для проведения мероприятия</div>
              </div>

              <div v-else class="bg-[#007AFF]/10 backdrop-blur-xl border border-[#007AFF]/20 rounded-2xl p-6 text-center">
                <svg class="w-12 h-12 text-[#007AFF] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div class="text-[#007AFF] font-semibold mb-1">Возврат не требуется</div>
                <div class="text-white/60 text-sm">Собрана точная сумма</div>
              </div>
            </div>

            <!-- Пустое состояние -->
            <div v-else class="text-center py-12">
              <svg class="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              <p class="text-white/60">Выберите заявителя для расчета</p>
            </div>

            <!-- Кнопки -->
            <div class="mt-8 flex gap-3">
              <button
                @click="closeModal"
                class="flex-1 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Закрыть
              </button>
              <button
                v-if="calculation"
                class="flex-1 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#007AFF]/30 transition-all duration-300 hover:scale-105"
              >
                Направить заявку
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
</style>

