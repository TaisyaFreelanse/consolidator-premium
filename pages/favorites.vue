<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsStore } from '~/stores/events'
import { useFavoritesStore } from '~/stores/favorites'
import type { EventItem } from '~/types'

const router = useRouter()
const events = useEventsStore()
const fav = useFavoritesStore()
const isLoading = ref(true)
const currentIndex = ref(0)

// Toast для уведомлений
const toastMessage = ref('')
const showToast = ref(false)

// Получаем избранные события
const favList = computed(() => events.list.filter(e => fav.ids.has(e.id)))

// Текущее выбранное мероприятие
const currentEvent = computed(() => favList.value[currentIndex.value])

// Навигация между избранными
const goToPrevious = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    currentIndex.value = favList.value.length - 1
  }
}

const goToNext = () => {
  if (currentIndex.value < favList.value.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
  }
}

// Удалить из избранного
const removeFromFavorites = () => {
  if (currentEvent.value) {
    fav.toggle(currentEvent.value.id)
    if (favList.value.length === 0) {
      // Если больше нет избранных, перейти в каталог
      navigateTo('/catalog')
    } else if (currentIndex.value >= favList.value.length) {
      currentIndex.value = favList.value.length - 1
    }
  }
}

// Поделиться ссылкой на мониторинг (кнопка справа)
const shareEvent = async () => {
  if (!currentEvent.value || !process.client) return
  
  const url = `${window.location.origin}/monitoring?event=${currentEvent.value.id}`
  
  try {
    // Попытка использовать Web Share API
    if (navigator.share) {
      await navigator.share({
        title: currentEvent.value.title,
        text: `Посмотрите мониторинг этого мероприятия`,
        url: url
      })
    } else {
      // Копирование в буфер обмена
      await navigator.clipboard.writeText(url)
      toastMessage.value = 'Ссылка скопирована!'
      showToast.value = true
    }
  } catch (err) {
    console.error('Share failed:', err)
    // Fallback: копирование в буфер
    try {
      await navigator.clipboard.writeText(url)
      toastMessage.value = 'Ссылка скопирована!'
      showToast.value = true
    } catch (e) {
      toastMessage.value = 'Ошибка копирования'
      showToast.value = true
    }
  }
}

// Переход на страницу мониторинга
const goToMonitoring = () => {
  if (currentEvent.value) {
    router.push(`/monitoring?event=${currentEvent.value.id}`)
  }
}

// Закрытие toast
const closeToast = () => {
  showToast.value = false
}

// Подсчет собранных средств (mock данные)
const collectedAmount = computed(() => {
  if (!currentEvent.value) return 0
  // Для демонстрации: случайная сумма от 40% до 80% от цели
  return Math.floor(currentEvent.value.priceTotal * (0.4 + Math.random() * 0.4))
})

const progressPercent = computed(() => {
  if (!currentEvent.value) return 0
  return Math.min((collectedAmount.value / currentEvent.value.priceTotal) * 100, 100)
})

const remainingAmount = computed(() => {
  if (!currentEvent.value) return 0
  return Math.max(currentEvent.value.priceTotal - collectedAmount.value, 0)
})

// Обратный отсчет до следующей контрольной точки (mock)
const timeRemaining = ref('5 дней 14 часов 23 минуты')

onMounted(async () => {
  if (!events.loaded) {
    await events.fetch()
  }
  
  setTimeout(() => {
    isLoading.value = false
  }, 600)
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F3E] to-[#0A0F1E] text-white pb-24">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-white/60">Загрузка...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="favList.length === 0" class="flex flex-col items-center justify-center min-h-screen px-4">
      <svg class="w-32 h-32 text-white/20 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <h2 class="text-2xl font-bold text-white mb-2">Избранное пусто</h2>
      <p class="text-white/60 mb-6 text-center">Добавьте мероприятия в избранное из каталога</p>
      <NuxtLink to="/catalog" class="bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg hover:shadow-[#007AFF]/30 transition-all duration-300 hover:scale-105">
        Перейти в каталог
      </NuxtLink>
    </div>

    <!-- Main Content -->
    <div v-else class="container mx-auto px-4 py-8 max-w-5xl">
      <!-- Top Action Buttons -->
      <div 
        v-motion
        :initial="{ opacity: 0, y: -20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 600 } }"
        class="flex items-center justify-between mb-6 gap-4"
      >
        <NuxtLink 
          to="/catalog"
          class="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          К каталогу
        </NuxtLink>

        <div class="flex items-center gap-3">
          <!-- Y - Заполнить (по ТЗ это кнопка сохранения/запоминания) -->
          <button 
            class="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl flex items-center justify-center font-bold text-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 hover:scale-110"
            title="Заполнить (сохранить)"
          >
            Y
          </button>

          <!-- Направить заявку → на мониторинг -->
          <button
            @click="goToMonitoring"
            class="flex items-center gap-2 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#007AFF]/30 transition-all duration-300 hover:scale-105"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Направить заявку
          </button>

          <!-- Поделиться (копирует ссылку на мониторинг) -->
          <button 
            @click="shareEvent"
            class="flex items-center justify-center bg-white/5 border border-white/10 text-white p-2.5 rounded-xl hover:bg-white/10 hover:scale-110 hover:shadow-lg hover:shadow-white/20 transition-all active:scale-95"
            title="Поделиться ссылкой на мониторинг"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Header -->
      <div 
        v-motion
        :initial="{ opacity: 0, y: -20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 600, delay: 100 } }"
        class="mb-6"
      >
        <h1 class="text-3xl font-bold text-white mb-2">Мои мероприятия</h1>
        <p class="text-white/60">
          {{ currentIndex + 1 }} из {{ favList.length }}
          <span v-if="favList.length > 1" class="ml-2 text-sm">(используйте стрелки для навигации)</span>
        </p>
      </div>

      <!-- Event Card with Navigation -->
      <div class="relative">
        <!-- Previous Button -->
        <button 
          v-if="favList.length > 1"
          @click="goToPrevious"
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl hover:bg-white/20 transition-all hover:scale-110 hidden lg:flex items-center justify-center"
        >
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Next Button -->
        <button 
          v-if="favList.length > 1"
          @click="goToNext"
          class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl hover:bg-white/20 transition-all hover:scale-110 hidden lg:flex items-center justify-center"
        >
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- Event Details Card -->
        <div 
          v-if="currentEvent"
          v-motion
          :initial="{ opacity: 0, scale: 0.95 }"
          :enter="{ opacity: 1, scale: 1, transition: { duration: 600, delay: 200 } }"
          class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          <!-- Event Image -->
          <div class="relative h-80 overflow-hidden">
            <div 
              v-if="currentEvent.image"
              class="absolute inset-0 bg-cover bg-center"
              :style="{ backgroundImage: `url(${currentEvent.image})` }"
            ></div>
            <div 
              v-else
              class="absolute inset-0 bg-gradient-to-br from-[#007AFF]/20 to-[#5E5CE6]/20"
            ></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            <!-- Event Title Overlay -->
            <div class="absolute bottom-0 left-0 right-0 p-8">
              <h2 class="text-3xl font-bold text-white mb-3">{{ currentEvent.title }}</h2>
              <div class="flex flex-wrap items-center gap-4 text-white/90">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{{ currentEvent.author }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                  <span>{{ currentEvent.location }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Event Info Section -->
          <div class="p-8">
            <!-- Basic Info Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div class="text-white/60 text-sm mb-1">Дата начала</div>
                <div class="text-white font-semibold">
                  {{ new Date(currentEvent.startAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) }}
                </div>
                <div class="text-white/80 text-sm">
                  {{ new Date(currentEvent.startAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }}
                </div>
            </div>

              <div class="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div class="text-white/60 text-sm mb-1">Цена складочная</div>
                <div class="text-white font-bold text-xl">
                  {{ (currentEvent.priceTotal / 100).toLocaleString('ru-RU') }} ₽
                </div>
              </div>

              <div class="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div class="text-white/60 text-sm mb-1">Участников</div>
                <div class="text-white font-semibold text-xl">
                  {{ currentEvent.seatLimit || 'Не ограничено' }}
                </div>
              </div>

              <div class="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div class="text-white/60 text-sm mb-1">Цена за место</div>
                <div class="text-white font-semibold text-xl">
                  {{ currentEvent.pricePerSeat ? (currentEvent.pricePerSeat / 100).toLocaleString('ru-RU') : '—' }} ₽
                </div>
              </div>
            </div>

            <!-- Извещения (Notifications) -->
            <div class="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
              <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Извещения
              </h3>

              <!-- Извещение-1 -->
              <div class="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                <div class="text-sm text-white/60 mb-1">Текст «Извещение-1»</div>
                <div class="text-white/90">
                  <span v-if="remainingAmount > 0">
                    Собрано недостаточно средств, проводим расчеты с заявителями
                  </span>
                  <span v-else>
                    Собрано достаточно средств, мероприятие состоится, проводим расчеты с заявителями
                </span>
                </div>
              </div>

              <!-- Ближайшее регламентное событие -->
              <div class="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                <div class="text-sm text-white/60 mb-1">Ближайшее регламентное событие</div>
                <div class="text-white/90">Мероприятие не состоится</div>
              </div>

              <!-- Countdown Timer -->
              <div class="bg-black/20 border border-[#007AFF]/30 rounded-xl p-4 text-center">
                <div class="text-sm text-white/60 mb-2">Таймер обратного отсчёта до следующей контрольной точки</div>
                <div class="text-2xl font-bold text-white">{{ timeRemaining }}</div>
                <div class="text-sm text-white/60 mt-1">После точки ти50 показывает нули</div>
              </div>
            </div>

            <!-- Сколько собрали? (Progress) -->
            <div class="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
              <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Сколько собрали?
              </h3>

              <!-- Progress Bar -->
              <div class="mb-4">
                <div class="flex justify-between text-sm text-white/80 mb-2">
                  <span>Собрано</span>
                  <span>{{ progressPercent.toFixed(1) }}%</span>
                </div>
                <div class="h-4 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 rounded-full"
                    :style="{ width: `${progressPercent}%` }"
                  ></div>
                </div>
              </div>

              <!-- Amounts -->
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div class="text-sm text-white/60 mb-1">Цена каталожная</div>
                  <div class="text-2xl font-bold text-white">
                    {{ (currentEvent.priceTotal / 100).toLocaleString('ru-RU') }}
                  </div>
                </div>
                <div class="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div class="text-sm text-white/60 mb-1">Мой предел</div>
                  <div class="text-2xl font-bold text-[#007AFF]">
                    {{ (collectedAmount / 100).toLocaleString('ru-RU') }}
                  </div>
                </div>
              </div>

              <!-- Price Info -->
              <div class="mt-4 text-center text-sm text-white/60">
                <p>Цена, указанная в заявке клиента</p>
                <p class="mt-1">Если заявка не подана, цифры нет, поле окрашено серым цветом</p>
              </div>
            </div>

            <!-- Go to Monitoring Button -->
            <div class="mt-6">
              <NuxtLink 
                to="/monitoring"
                class="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Перейти на страницу «Мониторинг»
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Mobile Navigation Buttons -->
        <div v-if="favList.length > 1" class="flex lg:hidden items-center justify-center gap-4 mt-6">
          <button 
            @click="goToPrevious"
            class="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-xl hover:bg-white/20 transition-all"
          >
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="text-white/60">{{ currentIndex + 1 }} / {{ favList.length }}</span>
          <button 
            @click="goToNext"
            class="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-xl hover:bg-white/20 transition-all"
          >
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast уведомление -->
  <Toast :message="toastMessage" :show="showToast" @close="closeToast" />
</template>

<style scoped>
/* Custom animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
