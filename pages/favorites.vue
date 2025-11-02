<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsStore } from '~/stores/events'
import { useMonitoringStore } from '~/stores/monitoring'
import { useFavoritesStore } from '~/stores/favorites'
import EventStatus from '~/components/EventStatus.vue'
import Toast from '~/components/Toast.vue'

const router = useRouter()
const events = useEventsStore()
const monitoring = useMonitoringStore()
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

// Снимок мониторинга для текущего события
const currentSnapshot = computed(() => {
  if (!currentEvent.value) return null
  return monitoring.byEvent(currentEvent.value.id)
})

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
    toastMessage.value = 'Удалено из избранного'
    showToast.value = true
    
    if (favList.value.length === 0) {
      // Если больше нет избранных, перейти в каталог
      setTimeout(() => {
        navigateTo('/catalog')
      }, 500)
    } else if (currentIndex.value >= favList.value.length) {
      currentIndex.value = favList.value.length - 1
    }
  }
}

// Переход на страницу мониторинга
const goToMonitoring = () => {
  if (currentEvent.value) {
    router.push(`/monitoring?event=${currentEvent.value.id}`)
  }
}

onMounted(async () => {
  await events.fetch()
  await monitoring.fetch()
  
  setTimeout(() => {
    isLoading.value = false
  }, 300)
})
</script>

<template>
  <section class="favorites-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Избранные мероприятия</h1>
        <p class="page-subtitle">Ваша персональная подборка</p>
      </div>

      <!-- Загрузка -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка избранного...</p>
      </div>

      <!-- Пустое избранное -->
      <div v-else-if="favList.length === 0" class="empty-state">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
        <p>У вас пока нет избранных мероприятий</p>
        <button @click="navigateTo('/catalog')" class="goto-catalog-btn">
          Перейти в каталог
        </button>
      </div>

      <!-- Список избранных -->
      <div v-else class="favorites-content">
        
        <!-- Навигация между мероприятиями -->
        <div v-if="favList.length > 1" class="navigation-bar">
          <button @click="goToPrevious" class="nav-btn">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Предыдущее
          </button>
          <span class="counter">{{ currentIndex + 1 }} / {{ favList.length }}</span>
          <button @click="goToNext" class="nav-btn">
            Следующее
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Текущее мероприятие -->
        <div v-if="currentEvent" class="current-event">
          
          <!-- Виджет статуса -->
          <div class="event-status-full">
            <EventStatus :event="currentEvent" :snapshot="currentSnapshot" />
          </div>

          <!-- Действия -->
          <div class="event-actions">
            <button @click="removeFromFavorites" class="action-btn remove-btn">
              <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Убрать из избранного
            </button>

            <button @click="goToMonitoring" class="action-btn primary-btn">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Открыть мониторинг
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast уведомления -->
    <Toast :message="toastMessage" :show="showToast" @close="showToast = false" />
  </section>
</template>

<style scoped>
/* Основной контейнер */
.favorites-page {
  min-height: 100vh;
  background: #f5f5f7;
  padding: 80px 0 40px;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header страницы */
.page-header {
  margin-bottom: 32px;
  text-align: center;
}

.page-title {
  font-size: 36px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  font-weight: 500;
}

/* Загрузка */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Пустое состояние */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-state .icon {
  width: 80px;
  height: 80px;
  color: #ccc;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 18px;
  color: #666;
  margin: 0 0 24px 0;
}

.goto-catalog-btn {
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid #007AFF;
  border-radius: 8px;
  background: #007AFF;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.goto-catalog-btn:hover {
  background: #005fcb;
  border-color: #005fcb;
}

/* Контент избранного */
.favorites-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Навигация */
.navigation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px 20px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 600;
  border: 2px solid #007AFF;
  border-radius: 8px;
  background: #fff;
  color: #007AFF;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #007AFF;
  color: #fff;
}

.nav-btn .icon {
  width: 16px;
  height: 16px;
}

.counter {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

/* Текущее мероприятие */
.current-event {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.event-status-full {
  /* EventStatus компонент сам содержит стили */
}

/* Действия */
.event-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.remove-btn {
  border-color: #ff3b30;
  background: #fff;
  color: #ff3b30;
}

.remove-btn:hover {
  background: #ff3b30;
  color: #fff;
}

.primary-btn {
  border-color: #007AFF;
  background: #007AFF;
  color: #fff;
}

.primary-btn:hover {
  background: #005fcb;
  border-color: #005fcb;
}

/* Responsive */
@media (max-width: 768px) {
  .favorites-page {
    padding: 70px 0 100px;
  }

  .page-title {
    font-size: 28px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .navigation-bar {
    flex-direction: column;
    gap: 12px;
  }

  .nav-btn {
    width: 100%;
    justify-content: center;
  }

  .counter {
    order: -1;
  }

  .event-actions {
    grid-template-columns: 1fr;
  }
}
</style>
