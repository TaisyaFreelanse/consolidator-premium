
<script setup lang="ts">
import type { ControlPointCode } from '~/types'
defineProps<{ plan: ControlPointCode[], current?: ControlPointCode }>()
const labels: Record<ControlPointCode,string> = {
  t0:'0', ti10:'ti₁₀', ti20:'ti₂₀', ti30:'ti₃₀', ti40:'ti₄₀', ti50:'ti₅₀', t999:'999'
}
</script>
<template>
  <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
    <div class="text-white/70 text-sm font-medium mb-4 uppercase tracking-wider">Контрольные точки</div>
    <div class="flex items-center gap-2 overflow-x-auto pb-2">
      <template v-for="(p, index) in plan" :key="p">
        <div class="flex items-center gap-2">
          <div :class="[
            'relative h-12 min-w-16 px-4 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-500',
            current===p 
              ? 'bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white shadow-lg shadow-[#007AFF]/30 scale-110' 
              : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/15'
          ]">
            <span class="relative z-10">{{ labels[p] }}</span>
            <div v-if="current===p" class="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
          </div>
          <div v-if="p!==plan[plan.length-1]" class="flex-shrink-0 w-8 h-0.5 rounded-full"
               :class="index < plan.indexOf(current || 't0') ? 'bg-gradient-to-r from-[#007AFF] to-[#5E5CE6]' : 'bg-white/20'">
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Горизонтальный скроллбар для контрольных точек */
::-webkit-scrollbar {
  height: 6px;
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
