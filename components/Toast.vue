<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  message: string
  show: boolean
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  duration: 3000
})

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(props.show)

watch(() => props.show, (newVal) => {
  if (newVal) {
    isVisible.value = true
    setTimeout(() => {
      isVisible.value = false
      setTimeout(() => emit('close'), 300)
    }, props.duration)
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div 
      v-if="isVisible"
      class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
    >
      <div class="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl shadow-green-600/50 border border-green-400/30 backdrop-blur-xl flex items-center gap-3">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-medium">{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>

