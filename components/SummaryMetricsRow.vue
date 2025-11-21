<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  totalApplicants?: number | null
  seatLimit?: number | string | null
  collected?: number | null
  required?: number | null
  moneyStatusType?: 'surplus' | 'deficit' | 'balanced'
  moneyStatusAmount?: number | null
  refundToOverlimit?: number | null
  surplusToDistribute?: number | null
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light'
})

const normalizeNumber = (value?: number | string | null): number | null => {
  if (value === null || value === undefined) return null
  const num = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(num)) return null
  return Number(num)
}

const applicantsCount = computed(() => Math.max(props.totalApplicants ?? 0, 0))
const seatLimitValue = computed(() => {
  const normalized = normalizeNumber(props.seatLimit)
  if (normalized === null) return null
  return Math.max(normalized, 0)
})

const overflowCount = computed(() => {
  if (!seatLimitValue.value) return 0
  return Math.max(applicantsCount.value - seatLimitValue.value, 0)
})

const freeSeats = computed(() => {
  if (!seatLimitValue.value) return 0
  return Math.max(seatLimitValue.value - applicantsCount.value, 0)
})

const capacityLabel = computed(() => {
  if (!seatLimitValue.value) {
    return 'Свободно мест'
  }
  return overflowCount.value > 0 ? 'Получат отказ' : 'Свободно мест'
})

const capacityValue = computed(() => {
  if (!seatLimitValue.value) return '—'
  if (overflowCount.value > 0) {
    return overflowCount.value.toString()
  }
  return freeSeats.value.toString()
})

const monetaryValue = (amount?: number | string | null): string => {
  const normalized = normalizeNumber(amount)
  if (normalized === null) return '—'
  if (normalized === 0) return '0'
  return (normalized / 100).toLocaleString('ru-RU', { minimumFractionDigits: 0 })
}

const countValue = (value?: number | null): string => {
  if (value === null || value === undefined) return '—'
  return value.toString()
}

const moneyStatusLabel = computed(() => {
  if (props.moneyStatusType === 'surplus') return 'Профицит'
  if (props.moneyStatusType === 'deficit') return 'Дефицит'
  return 'Баланс'
})

const moneyStatusAmountValue = computed(() => {
  if (props.moneyStatusType === 'balanced') return '0'
  return monetaryValue(props.moneyStatusAmount)
})

// Функция для разбивки заголовка на 2 строки
const splitLabel = (label: string): [string, string] => {
  const splits: Record<string, [string, string]> = {
    'Заявителей': ['Заявителей', ''],
    'Лимит мест': ['Лимит', 'мест'],
    'Свободно мест': ['Свободно', 'мест'],
    'Получат отказ': ['Получат', 'отказ'],
    'Оплачено': ['Оплачено', ''],
    'Целевая сумма': ['Целевая', 'сумма'],
    'Профицит': ['Профицит', ''],
    'Дефицит': ['Дефицит', ''],
    'Баланс': ['Баланс', ''],
    'Возврат непринятым': ['Возврат', 'непринятым'],
    'Профицит к распределению': ['Профицит к', 'распределению']
  }
  return splits[label] || [label, '']
}

const metrics = computed(() => [
  {
    label: 'Заявителей',
    labelLines: splitLabel('Заявителей'),
    value: countValue(applicantsCount.value)
  },
  {
    label: 'Лимит мест',
    labelLines: splitLabel('Лимит мест'),
    value: seatLimitValue.value ? countValue(seatLimitValue.value) : '—'
  },
  {
    label: capacityLabel.value,
    labelLines: splitLabel(capacityLabel.value),
    value: capacityValue.value
  },
  {
    label: 'Оплачено',
    labelLines: splitLabel('Оплачено'),
    value: monetaryValue(props.collected)
  },
  {
    label: 'Целевая сумма',
    labelLines: splitLabel('Целевая сумма'),
    value: monetaryValue(props.required)
  },
  {
    label: moneyStatusLabel.value,
    labelLines: splitLabel(moneyStatusLabel.value),
    value: moneyStatusAmountValue.value
  },
  {
    label: 'Возврат непринятым',
    labelLines: splitLabel('Возврат непринятым'),
    value: monetaryValue(props.refundToOverlimit)
  },
  {
    label: 'Профицит к распределению',
    labelLines: splitLabel('Профицит к распределению'),
    value: monetaryValue(props.surplusToDistribute)
  }
])
</script>

<template>
  <div :class="['summary-metrics-row', theme]">
    <div v-for="metric in metrics" :key="metric.label" class="metric-card">
      <div class="metric-label">
        <div v-if="metric.labelLines[0]" class="label-line">{{ metric.labelLines[0] }}</div>
        <div v-if="metric.labelLines[1]" class="label-line">{{ metric.labelLines[1] }}</div>
        <div v-if="!metric.labelLines[1]" class="label-line-empty"></div>
      </div>
      <div class="metric-value">
        {{ metric.value }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-metrics-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 768px) {
  .summary-metrics-row {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .summary-metrics-row {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
}

.metric-card {
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 80px;
}

.summary-metrics-row.light .metric-card {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.summary-metrics-row.dark .metric-card {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

.metric-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
  min-height: 32px;
}

.label-line {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.2;
  opacity: 0.7;
}

.label-line-empty {
  height: 11px;
}

.summary-metrics-row.light .label-line {
  color: #475569;
}

.summary-metrics-row.dark .label-line {
  color: rgba(255, 255, 255, 0.7);
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.2;
  margin-top: auto;
}

.summary-metrics-row.light .metric-value {
  color: #111827;
}

.summary-metrics-row.dark .metric-value {
  color: #f8fafc;
}
</style>

