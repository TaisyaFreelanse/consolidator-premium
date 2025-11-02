
<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useEventsStore } from '~/stores/events'
import { useMonitoringStore } from '~/stores/monitoring'

const route = useRoute()
const events = useEventsStore()
const mon = useMonitoringStore()
const mousePosition = ref({ x: 50, y: 50 })
const parallaxElements = ref<Array<{ id: number; offset: { x: number; y: number } }>>([])
const isLoading = ref(true)
const showCalculation = ref(false)

onMounted(async () => { 
  // Инициализация параллакс элементов
  parallaxElements.value = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    offset: { x: 0, y: 0 }
  }))
  
  window.addEventListener('mousemove', handleMouseMove)
  
  await events.fetch()
  await mon.fetch()
  
  setTimeout(() => {
    isLoading.value = false
  }, 600)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})

const eventId = computed(() => (route.query.event as string) || (events.list[0]?.id ?? ''))
const ev = computed(() => events.list.find(e => e.id === eventId.value))
const snap = computed(() => mon.byEvent(eventId.value))
const remain = computed(() => {
  if (!snap.value?.deadlineNext) return ''
  const t = new Date(snap.value.deadlineNext).getTime() - Date.now()
  if (t <= 0) return '00:00:00'
  const h = Math.floor(t/3.6e6); const m = Math.floor((t%3.6e6)/6e4); const s = Math.floor((t%6e4)/1000)
  const pad = (n:number)=> String(n).padStart(2,'0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
})

const handleMouseMove = (e: MouseEvent) => {
  const { clientX, clientY } = e
  const { innerWidth, innerHeight } = window
  
  mousePosition.value = {
    x: (clientX / innerWidth) * 100,
    y: (clientY / innerHeight) * 100
  }
  
  // Параллакс эффект
  parallaxElements.value = parallaxElements.value.map((el, i) => ({
    ...el,
    offset: {
      x: ((clientX - innerWidth / 2) / innerWidth) * (15 + i * 3),
      y: ((clientY - innerHeight / 2) / innerHeight) * (15 + i * 3)
    }
  }))
}

// Мягкие световые частицы
const gentleParticles = ref(Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 6 + 2,
  duration: Math.random() * 30 + 20,
  delay: Math.random() * 10,
  color: ['rgba(0, 122, 255, 0.1)', 'rgba(94, 92, 230, 0.1)', 'rgba(88, 86, 214, 0.1)', 'rgba(255, 255, 255, 0.06)'][Math.floor(Math.random() * 4)]
})))

const progressPercent = computed(() => {
  if (!snap.value || !ev.value) return 0
  return Math.min(100, Math.round((snap.value.collected / ev.value.priceTotal) * 100))
})
</script>
<template>
  <section class="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f1a]">
    
    <!-- Футуристический интерактивный фон -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      
      <!-- Интерактивный световой эффект, следующий за мышью -->
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

      <!-- Световые орбы с параллаксом -->
      <div 
        class="absolute top-1/5 left-1/6 w-[700px] h-[700px] rounded-full blur-3xl transition-transform duration-700"
        :style="{
          background: 'radial-gradient(circle, rgba(0, 122, 255, 0.15), transparent 70%)',
          transform: `translate(${parallaxElements[0]?.offset.x || 0}px, ${parallaxElements[0]?.offset.y || 0}px)`,
          animation: 'pulse 8s ease-in-out infinite'
        }"
      ></div>
      
      <div 
        class="absolute bottom-1/4 right-1/5 w-[600px] h-[600px] rounded-full blur-3xl transition-transform duration-700"
        :style="{
          background: 'radial-gradient(circle, rgba(94, 92, 230, 0.12), transparent 70%)',
          transform: `translate(${parallaxElements[1]?.offset.x || 0}px, ${parallaxElements[1]?.offset.y || 0}px)`,
          animation: 'pulse 10s ease-in-out infinite 2s'
        }"
      ></div>
      
      <!-- Плавающие световые частицы -->
      <div 
        v-for="particle in gentleParticles" 
        :key="particle.id"
        class="absolute rounded-full blur-sm transition-transform duration-1000"
        :style="{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          background: particle.color,
          animation: `gentleFloat ${particle.duration}s ease-in-out infinite ${particle.delay}s`,
          transform: `translate(${(parallaxElements[particle.id % parallaxElements.length]?.offset.x || 0) * 0.3}px, ${(parallaxElements[particle.id % parallaxElements.length]?.offset.y || 0) * 0.3}px)`
        }"
      ></div>
      
      <!-- Минималистичная декоративная сетка -->
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] opacity-30"></div>
      
      <!-- Мягкие световые линии -->
      <svg class="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path class="animate-wave-slow" d="M0,300 Q360,200 720,300 T1440,300" stroke="rgba(0, 122, 255, 0.4)" fill="none" stroke-width="2" />
        <path class="animate-wave-medium" d="M0,600 Q360,500 720,600 T1440,600" stroke="rgba(94, 92, 230, 0.4)" fill="none" stroke-width="2" />
        <path class="animate-wave-fast" d="M0,450 Q360,350 720,450 T1440,450" stroke="rgba(88, 86, 214, 0.4)" fill="none" stroke-width="2" />
      </svg>
    </div>

    <!-- Основной контент -->
    <div class="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-16">
      
      <!-- Заголовок в футуристическом стиле -->
      <motion.div
        class="text-center mb-16 lg:mb-20"
        v-motion="{
          initial: { opacity: 0, y: 30 },
          enter: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] } }
        }"
      >
        <motion.h1
          class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light mb-6 leading-tight tracking-tight"
          v-motion="{
            initial: { opacity: 0, scale: 0.95 },
            enter: { 
              opacity: 1, 
              scale: 1,
              transition: { duration: 1.2, delay: 0.2, ease: [0.23, 1, 0.32, 1] }
            }
          }"
          style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;"
        >
          <span class="block text-white/90 font-normal">Реальное</span>
          <motion.span
            class="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] via-[#5E5CE6] to-[#AF52DE] font-semibold"
            v-motion="{
              initial: { opacity: 0, x: -20 },
              enter: { opacity: 1, x: 0, transition: { duration: 1, delay: 0.5 } }
            }"
            style="background-size: 200% 100%; animation: gentleShimmer 6s ease-in-out infinite;"
          >
            Мониторинг
          </motion.span>
        </motion.h1>
        
        <motion.p
          class="text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-normal leading-relaxed mt-8"
          v-motion="{
            initial: { opacity: 0 },
            enter: { opacity: 1, transition: { duration: 0.8, delay: 0.8 } }
          }"
          style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;"
        >
          Отслеживайте прогресс вашего мероприятия в реальном времени с подробной аналитикой
        </motion.p>
      </motion.div>

      <!-- Загрузка -->
      <div v-if="isLoading" class="space-y-6">
        <div class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 animate-pulse">
          <div class="h-48 bg-gradient-to-br from-[#007AFF]/10 to-[#5E5CE6]/10 rounded-2xl mb-6"></div>
          <div class="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
          <div class="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>

      <!-- Контент мониторинга -->
      <motion.section 
        v-else-if="ev && snap" 
        class="space-y-6"
        v-motion="{
          initial: { opacity: 0, y: 20 },
          enter: { opacity: 1, y: 0, transition: { duration: 0.8 } }
        }"
      >
        <!-- Карточка мероприятия с фото -->
        <div class="group bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_8px_32px_rgba(0,122,255,0.4)] hover:border-white/30 transition-all duration-500">
          <!-- Фото мероприятия -->
          <div class="h-64 relative overflow-hidden">
            <div 
              v-if="ev.image" 
              class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              :style="{ backgroundImage: `url(${ev.image})` }"
            ></div>
            <div 
              v-else
              class="absolute inset-0 bg-gradient-to-br from-[#007AFF]/20 to-[#5E5CE6]/20"
            ></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            <!-- Информация поверх фото -->
            <div class="absolute bottom-0 left-0 right-0 p-8">
              <h2 class="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
                {{ ev.title }}
              </h2>
              <div class="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  {{ ev.author }}
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {{ ev.location }}
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ new Date(ev.startAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </div>
            </div>
            
            <!-- Таймер до следующей точки -->
            <div class="absolute top-6 right-6 bg-black/40 backdrop-blur-xl border border-white/30 rounded-2xl px-6 py-4">
              <div class="text-white/80 text-xs mb-1 font-medium uppercase tracking-wider">До следующей точки</div>
              <div class="text-3xl font-bold text-white tabular-nums tracking-tight">{{ remain }}</div>
            </div>
          </div>

          <div class="p-8">
            <!-- Прогресс бар -->
            <div class="mb-8">
              <div class="flex items-center justify-between mb-3">
                <span class="text-white/70 text-sm font-medium">Прогресс сбора</span>
                <span class="text-white font-semibold text-lg">{{ progressPercent }}%</span>
              </div>
              <div class="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  class="absolute inset-y-0 left-0 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] rounded-full transition-all duration-1000 ease-out"
                  :style="{ width: `${progressPercent}%` }"
                >
                  <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>

            <!-- Извещения -->
            <div class="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Блок извещений -->
              <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Извещения
                </h3>
                <div class="space-y-3">
                  <div v-if="snap.deficit > 0" class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div class="flex items-start gap-3">
                      <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                      </svg>
                      <div>
                        <div class="text-red-400 font-semibold text-sm">Собрано недостаточно средств</div>
                        <div class="text-white/70 text-xs mt-1">Проводим расчеты с заявителями</div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else-if="snap.surplus > 0" class="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div class="flex items-start gap-3">
                      <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      <div>
                        <div class="text-green-400 font-semibold text-sm">Цель сбора достигнута</div>
                        <div class="text-white/70 text-xs mt-1">Излишек будет пропорционально возвращен</div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="p-4 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-xl">
                    <div class="flex items-start gap-3">
                      <svg class="w-5 h-5 text-[#007AFF] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      <div>
                        <div class="text-[#007AFF] font-semibold text-sm">Сбор средств завершен успешно</div>
                        <div class="text-white/70 text-xs mt-1">Собрана точная сумма</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ближайшее регламентное событие -->
              <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Ближайшее регламентное событие
                </h3>
                <div v-if="snap.deadlineNext" class="space-y-3">
                  <div class="p-4 bg-gradient-to-br from-[#007AFF]/20 to-[#5E5CE6]/20 border border-[#007AFF]/30 rounded-xl">
                    <div class="text-white/70 text-xs mb-2 uppercase tracking-wider">Следующая контрольная точка</div>
                    <div class="text-white font-bold text-lg">{{ new Date(snap.deadlineNext).toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</div>
                    <div class="mt-3 flex items-center gap-2 text-white/90 text-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Осталось: {{ remain }}
                    </div>
                  </div>
                </div>
                <div v-else class="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                  <div class="text-white/60 text-sm">Мероприятие не состоится</div>
                </div>
              </div>
            </div>

            <!-- Контрольные точки -->
            <div class="mb-8">
              <ControlPointsBar :plan="ev.controlPlan" :current="snap.nowPoint" />
            </div>

            <!-- Статистика -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="relative group/card bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-[#007AFF]/20 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div class="text-white/60 text-sm font-medium">Внесено</div>
                </div>
                <div class="text-3xl font-bold text-white">{{ (snap.collected/100).toLocaleString('ru-RU') }} ₽</div>
              </div>

              <div class="relative group/card bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 hover:bg-red-500/15 hover:border-red-500/30 transition-all duration-300">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                    </svg>
                  </div>
                  <div class="text-red-400/80 text-sm font-medium">Дефицит</div>
                </div>
                <div class="text-3xl font-bold text-red-400">{{ (snap.deficit/100).toLocaleString('ru-RU') }} ₽</div>
              </div>

              <div class="relative group/card bg-green-500/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 hover:bg-green-500/15 hover:border-green-500/30 transition-all duration-300">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                  </div>
                  <div class="text-green-400/80 text-sm font-medium">Профицит</div>
                </div>
                <div class="text-3xl font-bold text-green-400">{{ (snap.surplus/100).toLocaleString('ru-RU') }} ₽</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Кнопка персональной калькуляции -->
        <div class="mb-6 flex justify-center">
          <button
            @click="showCalculation = true"
            class="bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-[#007AFF]/40 transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            Персональная калькуляция
          </button>
        </div>

        <!-- Таблица заявителей -->
        <MonitoringTable :data="snap" />

        <!-- Модальное окно калькуляции -->
        <PersonalCalculation
          v-if="ev"
          :event="ev"
          :snapshot="snap"
          :is-open="showCalculation"
          @close="showCalculation = false"
        />
      </motion.section>

      <!-- Пустое состояние -->
      <motion.section 
        v-else 
        class="text-center py-20"
        v-motion="{
          initial: { opacity: 0, scale: 0.95 },
          enter: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
        }"
      >
        <div class="text-8xl mb-6 opacity-30">📊</div>
        <h3 class="text-3xl font-semibold text-white mb-4" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
          Данные не найдены
        </h3>
        <p class="text-white/60 font-normal text-lg mb-8" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
          Убедитесь, что в каталоге есть хотя бы одно мероприятие
        </p>
        <button
          class="bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white px-8 py-4 rounded-2xl font-medium text-lg hover:shadow-lg hover:shadow-[#007AFF]/30 transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
          @click="$router.push('/catalog')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          Перейти в каталог
        </button>
      </motion.section>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* Футуристические анимации */
@keyframes gentleFloat {
  0%, 100% {
    transform: translate(0, 0);
    opacity: 0.4;
  }
  33% {
    transform: translate(10px, -15px);
    opacity: 0.6;
  }
  66% {
    transform: translate(-8px, -20px);
    opacity: 0.3;
  }
}

@keyframes gentleShimmer {
  0%, 100% {
    background-position: 0% center;
  }
  50% {
    background-position: 100% center;
  }
}

/* Пульсация световых орбов */
@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* Анимации волн */
.animate-wave-slow {
  animation: wave-slow 20s ease-in-out infinite;
}

.animate-wave-medium {
  animation: wave-medium 15s ease-in-out infinite;
}

.animate-wave-fast {
  animation: wave-fast 10s ease-in-out infinite;
}

@keyframes wave-slow {
  0%, 100% {
    d: path('M0,300 Q360,200 720,300 T1440,300');
  }
  50% {
    d: path('M0,300 Q360,400 720,300 T1440,300');
  }
}

@keyframes wave-medium {
  0%, 100% {
    d: path('M0,600 Q360,500 720,600 T1440,600');
  }
  50% {
    d: path('M0,600 Q360,700 720,600 T1440,600');
  }
}

@keyframes wave-fast {
  0%, 100% {
    d: path('M0,450 Q360,350 720,450 T1440,450');
  }
  50% {
    d: path('M0,450 Q360,550 720,450 T1440,450');
  }
}

/* Минималистичный скроллбар */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, rgba(0, 122, 255, 0.4), rgba(94, 92, 230, 0.4));
  border-radius: 10px;
  border: 2px solid rgba(0, 0, 0, 0.3);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, rgba(0, 122, 255, 0.6), rgba(94, 92, 230, 0.6));
}

/* Плавные переходы */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
