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
const favorites = useFavoritesStore()
const isLoading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)

// Toast для уведомлений
const toastMessage = ref('')
const showToast = ref(false)

const categoryLabels: Record<string, string> = {
  'master-class': 'Мастер-классы',
  'training': 'Тренинги',
  'excursion': 'Экскурсии',
  'gastro-show': 'Гастро-шоу',
  'lecture': 'Лектории',
  'cruise': 'Круизы'
}

// Фильтрация событий
const filteredEvents = computed(() => {
  let result = events.list
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e => 
      e.title.toLowerCase().includes(query) ||
      e.author.toLowerCase().includes(query) ||
      e.location.toLowerCase().includes(query)
    )
  }
  
  if (selectedCategory.value) {
    result = result.filter(e => e.category === selectedCategory.value)
  }
  
  return result
})

// Уникальные категории из событий
const availableCategories = computed(() => {
  const categories = new Set(events.list.map(e => e.category).filter(Boolean))
  return Array.from(categories)
})

// Проверка, находится ли событие в избранном
const isFavorite = (eventId: string) => {
  return favorites.ids.has(eventId)
}

// Переключение избранного
const toggleFavorite = (eventId: string) => {
  favorites.toggle(eventId)
  toastMessage.value = isFavorite(eventId) ? 'Добавлено в избранное' : 'Удалено из избранного'
  showToast.value = true
}

// Переход к мониторингу
const goToMonitoring = (eventId: string) => {
  router.push(`/monitoring?event=${eventId}`)
}

// Получить снимок мониторинга для события
const getSnapshot = (eventId: string) => {
  return monitoring.byEvent(eventId)
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
  <section class="catalog-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Каталог мероприятий</h1>
        <p class="page-subtitle">Консолидатор: честная информация о ходе сбора</p>
      </div>

      <!-- Фильтры и поиск -->
      <div class="filters-bar">
        <div class="search-box">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Поиск по названию, автору, месту..." 
            class="search-input"
          />
        </div>

        <!-- Фильтр по категориям -->
        <div v-if="availableCategories.length > 0" class="category-filter">
          <button 
            @click="selectedCategory = null" 
            :class="['category-btn', { active: selectedCategory === null }]"
          >
            Все
          </button>
          <button 
            v-for="cat in availableCategories" 
            :key="cat" 
            @click="selectedCategory = cat === selectedCategory ? null : cat"
            :class="['category-btn', { active: selectedCategory === cat }]"
          >
            {{ categoryLabels[cat] || cat }}
          </button>
        </div>
      </div>

      <!-- Загрузка -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка мероприятий...</p>
      </div>

      <!-- Список мероприятий -->
      <div v-else-if="filteredEvents.length > 0" class="events-grid">
        <div 
          v-for="event in filteredEvents" 
          :key="event.id" 
          class="event-card"
          @click="goToMonitoring(event.id)"
        >
          <!-- Кнопка избранного в углу -->
          <button 
            @click.stop="toggleFavorite(event.id)" 
            :class="['favorite-corner-btn', { active: isFavorite(event.id) }]"
            :title="isFavorite(event.id) ? 'Убрать из избранного' : 'Добавить в избранное'"
          >
            <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
              <path v-if="isFavorite(event.id)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              <path v-else d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          
          <!-- КОМПАКТНЫЙ СТАТУС (без извещений) -->
          <div class="event-status-compact">
            <EventStatus :event="event" :snapshot="getSnapshot(event.id)" :compact="true" />
          </div>

          <!-- Подсказка о клике -->
          <div class="click-hint">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <span>Нажмите для просмотра мониторинга</span>
          </div>
        </div>
      </div>

      <!-- Нет результатов -->
      <div v-else class="no-results">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>Мероприятия не найдены</p>
        <button @click="() => { searchQuery = ''; selectedCategory = null; }" class="reset-btn">
          Сбросить фильтры
        </button>
      </div>
    </div>

    <!-- Toast уведомления -->
    <Toast :message="toastMessage" :show="showToast" @close="showToast = false" />
  </section>
</template>

<style scoped>
/* Основной контейнер */
.catalog-page {
  min-height: 100vh;
  background: #f5f5f7;
  padding: 80px 0 40px;
}

.container {
  max-width: 1400px;
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

/* Фильтры */
.filters-bar {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.search-box {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #999;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.category-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  background: #fff;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn:hover {
  border-color: #007AFF;
  color: #007AFF;
}

.category-btn.active {
  background: #007AFF;
  border-color: #007AFF;
  color: #fff;
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

/* Сетка мероприятий */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

/* Карточка мероприятия */
.event-card {
  position: relative;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
}

.event-card:hover {
  border-color: #007AFF;
  box-shadow: 0 12px 32px rgba(0, 122, 255, 0.15);
  transform: translateY(-6px);
}

.event-status-compact {
  /* EventStatus компонент сам содержит стили */
}

/* Кнопка избранного в углу */
.favorite-corner-btn {
  position: absolute;
  bottom: 72px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 2px solid #ffc107;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  color: #f57f17;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.favorite-corner-btn:hover {
  background: #fff9c4;
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(255, 193, 7, 0.3);
}

.favorite-corner-btn.active {
  background: #ffc107;
  border-color: #ffc107;
  color: #fff;
  box-shadow: 0 6px 16px rgba(255, 193, 7, 0.4);
}

.favorite-corner-btn .icon {
  width: 24px;
  height: 24px;
}

/* Подсказка о клике */
.click-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.event-card:hover .click-hint {
  background: linear-gradient(135deg, #005fcb 0%, #4745b5 100%);
}

.click-hint .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  animation: pulse-icon 2s infinite;
}

@keyframes pulse-icon {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* Нет результатов */
.no-results {
  text-align: center;
  padding: 60px 20px;
}

.no-results .icon {
  width: 64px;
  height: 64px;
  color: #ccc;
  margin-bottom: 16px;
}

.no-results p {
  font-size: 18px;
  color: #666;
  margin: 0 0 20px 0;
}

.reset-btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid #007AFF;
  border-radius: 8px;
  background: #fff;
  color: #007AFF;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #007AFF;
  color: #fff;
}

/* Responsive */
@media (max-width: 1200px) {
  .events-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .catalog-page {
    padding: 70px 0 100px;
  }

  .page-title {
    font-size: 28px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .events-grid {
    grid-template-columns: 1fr;
  }

  .favorite-corner-btn {
    width: 44px;
    height: 44px;
    bottom: 66px;
    right: 12px;
  }

  .favorite-corner-btn .icon {
    width: 22px;
    height: 22px;
  }

  .click-hint {
    padding: 14px 16px;
    font-size: 13px;
  }

  .click-hint .icon {
    width: 18px;
    height: 18px;
  }
}
</style>
