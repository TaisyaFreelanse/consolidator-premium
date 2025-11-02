
<script setup lang="ts">
import type { MonitoringSnapshot } from '~/types'
defineProps<{ data: MonitoringSnapshot }>()
const columns = [
  { key: 'code', label: 'Код заявителя', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2' },
  { key: 'seats', label: 'Количество мест', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { key: 'paidAmount', label: 'Внесенная сумма, ₽', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
]
</script>

<template>
  <div class="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
    <!-- Заголовок таблицы -->
    <div class="flex items-center justify-between p-8 border-b border-white/10">
      <div>
        <h3 class="text-2xl font-bold text-white mb-1" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
          Список заявителей
        </h3>
        <p class="text-white/60 text-sm">Детальная информация о всех участниках</p>
      </div>
      <div class="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3">
        <svg class="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <div>
          <div class="text-xs text-white/60 uppercase tracking-wider font-medium">Всего</div>
          <div class="text-xl font-bold text-white">{{ data.applicants.length }}</div>
        </div>
      </div>
    </div>

    <!-- Таблица -->
    <div class="overflow-x-auto">
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
          <tr v-for="(row, index) in data.applicants" :key="row.code" 
              class="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
              :class="{ 'bg-white/[0.02]': index % 2 === 0 }">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-[#007AFF]/20 to-[#5E5CE6]/20 rounded-xl flex items-center justify-center border border-[#007AFF]/30">
                  <span class="text-[#007AFF] font-bold text-sm">{{ row.code.slice(0, 2).toUpperCase() }}</span>
                </div>
                <span class="font-mono text-white font-medium">{{ row.code }}</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <span class="text-white font-semibold text-sm">{{ row.seats }}</span>
                </div>
                <span class="text-white/60 text-xs">{{ row.seats === 1 ? 'место' : 'мест' }}</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="font-semibold text-green-400">{{ (row.paidAmount/100).toLocaleString('ru-RU') }} ₽</span>
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
