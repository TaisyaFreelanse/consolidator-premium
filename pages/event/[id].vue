<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventsStore } from '~/stores/events'
import { useFavoritesStore } from '~/stores/favorites'

const route = useRoute()
const router = useRouter()
const events = useEventsStore()
const favorites = useFavoritesStore()
const mousePosition = ref({ x: 50, y: 50 })

const eventId = computed(() => route.params.id as string)
const event = computed(() => events.list.find(e => e.id === eventId.value))
const isFavorite = computed(() => favorites.ids.has(eventId.value))

const categoryLabels: Record<string, string> = {
  'master-class': 'Мастер-класс',
  'training': 'Тренинг',
  'excursion': 'Экскурсия',
  'gastro-show': 'Гастро-шоу',
  'lecture': 'Лекторий',
  'cruise': 'Круиз'
}

const handleMouseMove = (e: MouseEvent) => {
  const { clientX, clientY } = e
  const { innerWidth, innerHeight } = window
  
  mousePosition.value = {
    x: (clientX / innerWidth) * 100,
    y: (clientY / innerHeight) * 100
  }
}

onMounted(async () => {
  window.addEventListener('mousemove', handleMouseMove)
  await events.fetch()
  
  if (!event.value) {
    router.push('/catalog')
  }
})

const goToMonitoring = () => {
  router.push(`/monitoring?event=${eventId.value}`)
}

const toggleFavorite = () => {
  favorites.toggle(eventId.value)
}
</script>

<template>
  <section class="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f1a]">
    
    <!-- Футуристический фон -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div 
        class="absolute w-[1000px] h-[1000px] rounded-full blur-3xl transition-all duration-700 ease-out"
        :style="{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, rgba(0, 122, 255, 0.2), rgba(94, 92, 230, 0.15), transparent 60%)`,
          opacity: 0.5
        }"
      ></div>
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] opacity-30"></div>
    </div>

    <!-- Контент -->
    <div v-if="event" class="relative z-10 max-w-7xl mx-auto px-6 py-12">
      
      <!-- Кнопка назад -->
      <button
        @click="router.back()"
        class="mb-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
      >
        <svg class="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        <span class="font-medium">Назад к каталогу</span>
      </button>

      <!-- Главная карточка с фото -->
      <div class="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl mb-8">
        <!-- Фото мероприятия -->
        <div class="relative h-96 overflow-hidden">
          <div 
            v-if="event.image" 
            class="absolute inset-0 bg-cover bg-center"
            :style="{ backgroundImage: `url(${event.image})` }"
          ></div>
          <div 
            v-else
            class="absolute inset-0 bg-gradient-to-br from-[#007AFF]/20 to-[#5E5CE6]/20"
          ></div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          
          <!-- Информация поверх фото -->
          <div class="absolute bottom-0 left-0 right-0 p-10">
            <div class="flex items-start justify-between gap-6">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-4">
                  <span v-if="event.category" class="px-4 py-2 bg-[#007AFF]/30 backdrop-blur-xl border border-[#007AFF]/50 rounded-xl text-sm font-semibold text-white">
                    {{ categoryLabels[event.category] || event.category }}
                  </span>
                  <span class="px-4 py-2 bg-green-500/30 backdrop-blur-xl border border-green-500/50 rounded-xl text-sm font-semibold text-green-300">
                    Активно
                  </span>
                </div>
                <h1 class="text-5xl font-bold text-white mb-4 leading-tight" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
                  {{ event.title }}
                </h1>
                <p v-if="event.description" class="text-xl text-white/90 mb-6 max-w-3xl">
                  {{ event.description }}
                </p>
                <div class="flex flex-wrap items-center gap-6 text-white/90">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <span class="font-medium">{{ event.author }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span class="font-medium">{{ event.location }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="font-medium">{{ new Date(event.startAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Кнопки действий -->
              <div class="flex flex-col gap-3">
                <button
                  @click="toggleFavorite"
                  :class="[
                    'px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center gap-2',
                    isFavorite
                      ? 'bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white shadow-lg shadow-[#007AFF]/30'
                      : 'bg-white/20 backdrop-blur-xl border border-white/30 text-white hover:bg-white/30'
                  ]"
                >
                  <svg class="w-5 h-5" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  {{ isFavorite ? 'В избранном' : 'В избранное' }}
                </button>
                
                <button
                  @click="goToMonitoring"
                  class="bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#007AFF]/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  Мониторинг
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Детальная информация -->
        <div class="p-10">
          <!-- Основные параметры -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div class="text-white/60 text-sm mb-2 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Цена за место
              </div>
              <div class="text-3xl font-bold text-white">{{ (event.pricePerSeat! / 100).toLocaleString('ru-RU') }} ₽</div>
            </div>

            <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div class="text-white/60 text-sm mb-2 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Участников (до)
              </div>
              <div class="text-3xl font-bold text-white">{{ event.seatLimit || '∞' }}</div>
            </div>

            <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div class="text-white/60 text-sm mb-2 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Цена складочная
              </div>
              <div class="text-3xl font-bold text-white">{{ (event.priceTotal / 100).toLocaleString('ru-RU') }} ₽</div>
            </div>

            <div class="bg-gradient-to-br from-[#007AFF]/20 to-[#5E5CE6]/20 backdrop-blur-xl border border-[#007AFF]/30 rounded-2xl p-6">
              <div class="text-white/80 text-sm mb-2 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Начало мероприятия
              </div>
              <div class="text-2xl font-bold text-white">{{ new Date(event.startAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) }}</div>
            </div>
          </div>

          <!-- Даты приема заявок -->
          <div v-if="event.startApplicationsAt && event.endApplicationsAt" class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-10">
            <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Прием заявок
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div class="text-white/60 text-sm mb-2">Начало приема заявок</div>
                <div class="text-white font-semibold text-lg">{{ new Date(event.startApplicationsAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</div>
              </div>
              <div>
                <div class="text-white/60 text-sm mb-2">Окончание приема заявок</div>
                <div class="text-white font-semibold text-lg">{{ new Date(event.endApplicationsAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</div>
              </div>
            </div>
          </div>

          <!-- Программа мероприятия -->
          <div v-if="event.activities && event.activities.length > 0" class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-10">
            <h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <svg class="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Программа мероприятия
            </h3>
            <div class="space-y-3">
              <div
                v-for="(activity, index) in event.activities"
                :key="index"
                class="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div class="w-8 h-8 bg-gradient-to-br from-[#007AFF] to-[#5E5CE6] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-bold text-sm">{{ index + 1 }}</span>
                </div>
                <p class="text-white/90 leading-relaxed">{{ activity }}</p>
              </div>
            </div>
          </div>

          <!-- Информация об авторе -->
          <div v-if="event.authorInfo" class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
            <h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <svg class="w-6 h-6 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Об авторе
            </h3>
            <div class="flex items-start gap-6">
              <div class="w-20 h-20 bg-gradient-to-br from-[#007AFF] to-[#5E5CE6] rounded-2xl flex items-center justify-center flex-shrink-0">
                <span class="text-white font-bold text-3xl">{{ event.authorInfo.name.charAt(0) }}</span>
              </div>
              <div class="flex-1">
                <h4 class="text-xl font-bold text-white mb-2">{{ event.authorInfo.name }}</h4>
                <p class="text-white/70 mb-4">{{ event.authorInfo.title }}</p>
                <div v-if="event.authorInfo.achievements && event.authorInfo.achievements.length > 0" class="space-y-2">
                  <div
                    v-for="(achievement, index) in event.authorInfo.achievements"
                    :key="index"
                    class="flex items-center gap-2 text-white/80"
                  >
                    <svg class="w-4 h-4 text-[#007AFF]" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>{{ achievement }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Кнопка направить заявку -->
          <div class="mt-10 text-center">
            <button class="bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white px-12 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-[#007AFF]/40 transition-all duration-300 hover:scale-105 inline-flex items-center gap-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Направить заявку
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Загрузка или ошибка -->
    <div v-else class="relative z-10 flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-6xl mb-6 opacity-30">📋</div>
        <h2 class="text-2xl font-bold text-white mb-4">Мероприятие не найдено</h2>
        <button
          @click="router.push('/catalog')"
          class="bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#007AFF]/30 transition-all duration-300"
        >
          Вернуться в каталог
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
</style>

