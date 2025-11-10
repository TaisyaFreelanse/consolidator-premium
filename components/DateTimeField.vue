<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface OffsetPreset {
  label: string
  minutes: number
}

const props = withDefaults(defineProps<{
  modelValue: string
  label: string
  required?: boolean
  disabled?: boolean
  copyFromLabel?: string
  copyFromValue?: string
  offsetPresets?: OffsetPreset[]
  helpText?: string
  error?: string
  showNowButton?: boolean
  showQuickActions?: boolean
}>(), {
  modelValue: '',
  required: false,
  disabled: false,
  copyFromLabel: '',
  copyFromValue: '',
  offsetPresets: () => [],
  helpText: '',
  error: '',
  showNowButton: true,
  showQuickActions: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const baseInputClasses =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all'

const dateValue = ref<string>('')
const timeValue = ref<string>('')

const hasValue = computed(() => !!dateValue.value && !!timeValue.value)

const toLocalInput = (value: string): { date: string; time: string } | null => {
  if (!value) {
    return null
  }

  if (value.includes('T')) {
    const [datePart, timePartRaw] = value.split('T')
    if (!datePart || !timePartRaw) return null
    const timePart = timePartRaw.slice(0, 5)
    return { date: datePart, time: timePart }
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const shifted = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000)
  const iso = shifted.toISOString()
  return {
    date: iso.slice(0, 10),
    time: iso.slice(11, 16)
  }
}

const combineDateTime = (date: string, time: string) => {
  if (!date || !time) return ''
  return `${date}T${time}`
}

const parseToDate = (value: string): Date | null => {
  const payload = toLocalInput(value)
  if (!payload) return null
  const [year, month, day] = payload.date.split('-').map(Number)
  const [hours, minutes] = payload.time.split(':').map(Number)
  if ([year, month, day, hours, minutes].some((part) => Number.isNaN(part))) {
    return null
  }
  return new Date(year, month - 1, day, hours, minutes)
}

const updateModel = () => {
  const combined = combineDateTime(dateValue.value, timeValue.value)
  if (combined === props.modelValue) return
  emit('update:modelValue', combined)
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) {
      dateValue.value = ''
      timeValue.value = ''
      return
    }

    const payload = toLocalInput(newVal)
    if (!payload) return

    if (payload.date !== dateValue.value) {
      dateValue.value = payload.date
    }
    if (payload.time !== timeValue.value) {
      timeValue.value = payload.time
    }
  },
  { immediate: true }
)

watch([dateValue, timeValue], updateModel)

const setDate = (date: Date) => {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  const iso = shifted.toISOString()
  dateValue.value = iso.slice(0, 10)
  timeValue.value = iso.slice(11, 16)
}

const ensureBaseDate = (): Date => {
  const existing = hasValue.value ? parseToDate(combineDateTime(dateValue.value, timeValue.value)) : null
  if (existing) return existing

  const copy = props.copyFromValue ? parseToDate(props.copyFromValue) : null
  if (copy) return copy

  return new Date()
}

const applyOffset = (minutes: number) => {
  if (props.disabled) return
  const base = ensureBaseDate()
  base.setMinutes(base.getMinutes() + minutes)
  setDate(base)
}

const copyFrom = () => {
  if (props.disabled || !props.copyFromValue) return
  const source = parseToDate(props.copyFromValue)
  if (!source) return
  setDate(source)
}

const setNow = () => {
  if (props.disabled) return
  setDate(new Date())
}
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-white/80">
      {{ label }}
      <span v-if="required" class="text-red-400">*</span>
    </label>

    <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3">
      <input
        v-model="dateValue"
        type="date"
        :disabled="disabled"
        :class="[baseInputClasses, disabled ? 'opacity-70 cursor-not-allowed' : '']"
      />

      <div class="flex gap-2 items-stretch">
        <input
          v-model="timeValue"
          type="time"
          step="60"
          :disabled="disabled"
          :class="[baseInputClasses, 'min-w-[140px]', disabled ? 'opacity-70 cursor-not-allowed' : '']"
        />
      </div>
    </div>

    <div v-if="!disabled && showQuickActions" class="flex flex-wrap gap-2 text-sm">
      <button
        v-if="showNowButton"
        type="button"
        class="px-3 py-1.5 bg-white/5 border border-white/10 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
        @click="setNow"
      >
        Сейчас
      </button>
      <button
        v-if="copyFromValue"
        type="button"
        class="px-3 py-1.5 bg-white/5 border border-white/10 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
        @click="copyFrom"
      >
        Скопировать {{ copyFromLabel || 'значение' }}
      </button>
      <button
        v-for="preset in offsetPresets"
        :key="preset.label"
        type="button"
        class="px-3 py-1.5 bg-white/5 border border-white/10 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
        @click="applyOffset(preset.minutes)"
      >
        {{ preset.label }}
      </button>
      <button
        v-if="!offsetPresets.length"
        type="button"
        class="px-3 py-1.5 bg-white/5 border border-white/10 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
        @click="applyOffset(15)"
      >
        +15 мин
      </button>
    </div>

    <p v-if="helpText" class="text-xs text-white/50">
      {{ helpText }}
    </p>

    <p v-if="error" class="text-red-400 text-sm">
      {{ error }}
    </p>
  </div>
</template>

