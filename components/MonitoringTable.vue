
<script setup lang="ts">
import { computed } from 'vue'
import type { MonitoringSnapshot, EventItem } from '~/types'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const props = defineProps<{ 
  data: MonitoringSnapshot
  seatLimit?: number
  event?: EventItem // Добавляем event для расчета всех чисел
}>()
const emit = defineEmits<{ openPersonalCalc: [] }>()

type SnapshotApplicant = MonitoringSnapshot['applicants'][number]
type LastPaymentInfo = {
  date: string
  time: string
  full: string
}

const getLastPaymentTimestamp = (applicant: SnapshotApplicant): number | null => {
  const payments = applicant.payments ?? []
  if (!payments.length) return null
  const lastPayment = payments[payments.length - 1]
  const timestamp = new Date(lastPayment.createdAt).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

const columns = [
  { key: 'rank', label: 'Место', icon: 'M12 8l1.176 3.618h3.804l-3.078 2.239 1.176 3.618L12 15.236l-3.078 2.237 1.176-3.618-3.078-2.239h3.804L12 8z' },
  { key: 'code', label: 'Код заявителя', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2' },
  { key: 'lastPayment', label: 'Последний платёж', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'paidAmount', label: 'Внесенная сумма, ₽', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c1.11 0 2.08-.402 2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
]

// Проверка, является ли заявитель текущим пользователем (по логину)
const isCurrentUser = (applicant: SnapshotApplicant): boolean => {
  if (!auth.isAuthenticated || !auth.currentUser) {
    console.log('isCurrentUser: not authenticated', { 
      isAuthenticated: auth.isAuthenticated, 
      currentUser: auth.currentUser 
    })
    return false
  }
  // Сравниваем по логину (name пользователя = login заявителя)
  const isMatch = applicant.login === auth.currentUser.name
  console.log('isCurrentUser check:', { 
    applicantLogin: applicant.login, 
    currentUserName: auth.currentUser.name, 
    isMatch 
  })
  return isMatch
}

const sortedApplicants = computed(() => {
  return [...props.data.applicants].sort((a, b) => {
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

const seatLimit = computed(() => Math.max(props.seatLimit ?? 0, 0))

const isWithinLimit = (index: number) => {
  if (!seatLimit.value) return true
  return index < seatLimit.value
}

// Получить отображаемый код/логин заявителя
const getApplicantDisplayCode = (applicant: SnapshotApplicant): string => {
  // СТРОГАЯ проверка: если пользователь НЕ авторизован - ВСЕМ показываем ТОЛЬКО код
  const isAuth = auth.isAuthenticated && auth.currentUser && auth.currentUser.name
  if (!isAuth) {
    // Для неавторизованных - всегда код, даже если есть login
    return applicant.code
  }
  // Если авторизован и это текущий пользователь - показываем его логин
  if (isCurrentUser(applicant) && applicant.login) {
    return applicant.login
  }
  // Для остальных авторизованных - показываем секретный код
  return applicant.code
}

const enrichedApplicants = computed(() => {
  // Явная зависимость от auth для реактивности
  const isAuth = auth.isAuthenticated
  const currentUserName = auth.currentUser?.name
  
  const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
  const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
  const fullFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return sortedApplicants.value.map(applicant => {
    const payments = applicant.payments ?? []
    if (!payments.length) {
      return {
        ...applicant,
        lastPayment: null as LastPaymentInfo | null,
        displayCode: getApplicantDisplayCode(applicant)
      }
    }

    const lastPaymentRecord = payments[payments.length - 1]
    const paymentDate = new Date(lastPaymentRecord.createdAt)
    if (Number.isNaN(paymentDate.getTime())) {
      return {
        ...applicant,
        lastPayment: null as LastPaymentInfo | null,
        displayCode: getApplicantDisplayCode(applicant)
      }
    }

    return {
      ...applicant,
      lastPayment: {
        date: dateFormatter.format(paymentDate),
        time: timeFormatter.format(paymentDate),
        full: fullFormatter.format(paymentDate)
      } as LastPaymentInfo,
      displayCode: getApplicantDisplayCode(applicant)
    }
  })
})

// Форматирование суммы
const formatMoney = (amount: number) => {
  return (amount / 100).toLocaleString('ru-RU', { minimumFractionDigits: 0 })
}
</script>

<template>
  <div class="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
    <!-- Таблица -->
    <div class="table-container overflow-x-auto">
      <table class="w-full text-sm" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
        <thead>
          <tr class="bg-white/5 border-b border-white/10">
            <th v-for="col in columns" :key="col.key" class="text-left px-6 py-4 font-semibold text-white/80 text-xs uppercase tracking-wider">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="col.icon"/>
                </svg>
                {{ col.label }}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in enrichedApplicants" :key="row.code" 
              class="border-b border-white/5 transition-all duration-300"
              :class="{ 
                'bg-white/[0.02]': index % 2 === 0 && !isCurrentUser(row) && isWithinLimit(index),
                'current-user-row': isCurrentUser(row),
                'overflow-row': !isWithinLimit(index),
                'hover:bg-white/5': !isCurrentUser(row)
              }">
            <td class="px-6 py-4">
              <div :class="['rank-chip', isWithinLimit(index) ? 'in-limit' : 'out-limit']">
                <span class="rank-number">#{{ index + 1 }}</span>
                <span v-if="seatLimit && seatLimit === index + 1" class="rank-threshold">граница</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <span class="font-mono font-medium"
                      :class="isCurrentUser(row) ? 'text-[#34c759]' : 'text-white'">
                  {{ row.displayCode }}
                </span>
                <span v-if="isCurrentUser(row)" class="text-xs bg-[#34c759]/20 text-[#34c759] px-2 py-0.5 rounded-full font-semibold">
                  ВЫ
                </span>
              </div>
            </td>
            <td class="px-6 py-4">
              <div v-if="row.lastPayment" class="flex flex-col leading-tight" :title="row.lastPayment.full">
                <span class="text-white font-semibold">{{ row.lastPayment.date }}</span>
                <span class="text-white/60 text-xs">в {{ row.lastPayment.time }}</span>
              </div>
              <span v-else class="text-white/30 text-sm italic">Нет оплат</span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                  <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="font-semibold text-green-400">{{ (row.paidAmount/100).toLocaleString('ru-RU') }} ₽</span>
                </div>
                <div v-if="isCurrentUser(row)" class="action-buttons">
                  <button
                    @click="emit('openPersonalCalc')"
                    class="inline-flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 rounded-xl px-3 py-2 transition-all text-blue-400 hover:text-blue-300"
                    title="Персональная калькуляция"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="text-sm font-medium">Перс.результ</span>
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Футер таблицы (если список пустой) -->
    <div v-if="data.applicants.length === 0" class="p-12 text-center">
      <div class="text-6xl mb-4 opacity-30">📋</div>
      <h4 class="text-xl font-semibold text-white mb-2">Заявителей пока нет</h4>
      <p class="text-white/60">Данные появятся, когда первые участники внесут оплату</p>
    </div>
  </div>
</template>

<style scoped>
/* Выделение строки текущего пользователя */
.current-user-row {
  background: linear-gradient(90deg, rgba(52, 199, 89, 0.15) 0%, rgba(48, 209, 88, 0.08) 100%) !important;
  box-shadow:
    inset 4px 0 0 rgba(52, 199, 89, 0.6),
    0 0 20px rgba(52, 199, 89, 0.2),
    inset 0 0 30px rgba(52, 199, 89, 0.05);
}

.current-user-row:hover {
  background: linear-gradient(90deg, rgba(52, 199, 89, 0.2) 0%, rgba(48, 209, 88, 0.12) 100%) !important;
  box-shadow:
    inset 4px 0 0 rgba(52, 199, 89, 0.75),
    0 0 25px rgba(52, 199, 89, 0.3),
    inset 0 0 35px rgba(52, 199, 89, 0.08);
}

/* Ряд вне лимита мест */
.overflow-row {
  background: linear-gradient(90deg, rgba(255, 95, 109, 0.1) 0%, rgba(255, 195, 113, 0.05) 100%) !important;
}

.overflow-row:hover {
  background: linear-gradient(90deg, rgba(255, 95, 109, 0.16) 0%, rgba(255, 195, 113, 0.1) 100%) !important;
  box-shadow: inset 0 0 25px rgba(255, 95, 109, 0.12);
}

.table-container {
  padding: 32px;
}

@media (max-width: 768px) {
  .table-container {
    padding: 20px;
  }
}

.action-buttons {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
}

/* Ранги */
.rank-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.02em;
  transition: all 0.2s ease;
}

.rank-chip.in-limit {
  background: rgba(0, 122, 255, 0.12);
  color: #0a84ff;
  border: 1px solid rgba(0, 122, 255, 0.25);
}

.rank-chip.out-limit {
  background: rgba(255, 59, 48, 0.12);
  color: #ff3b30;
  border: 1px solid rgba(255, 59, 48, 0.25);
}

.rank-number {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.rank-threshold {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.7;
}

/* Горизонтальный скроллбар для таблицы */
::-webkit-scrollbar {
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to right, rgba(0, 122, 255, 0.4), rgba(94, 92, 230, 0.4));
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to right, rgba(0, 122, 255, 0.6), rgba(94, 92, 230, 0.6));
}
</style>
