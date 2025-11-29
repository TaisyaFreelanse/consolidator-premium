<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsStore } from '~/stores/events'
import { useFavoritesStore } from '~/stores/favorites'
import { useAuthStore } from '~/stores/auth'
import Toast from '~/components/Toast.vue'
import { getAuthorById, getAuthorShortName } from '~/data/authors'

const router = useRouter()
const events = useEventsStore()
const favorites = useFavoritesStore()
const auth = useAuthStore()
const isLoading = ref(true)
const searchQuery = ref('')

// Toast для уведомлений
const toastMessage = ref('')
const showToast = ref(false)

// Фильтрация событий (только по текстовому поиску)
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
  
  return result
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

// Редактирование событий удалено - события создаются только на сторонних сайтах

// Проверка, прошла ли Ti20 для события
const isTi20Passed = (event: any): boolean => {
  if (!event.endApplicationsAt) {
    return false
  }
  const ti20Date = new Date(event.endApplicationsAt)
  if (Number.isNaN(ti20Date.getTime())) {
    return false
  }
  return new Date() >= ti20Date
}

// Удаление события (только для модераторов)
const deleteEvent = async (eventId: string, eventTitle: string) => {
  if (!auth.isModerator) {
    toastMessage.value = 'Недостаточно прав для удаления события'
    showToast.value = true
    return
  }

  // Находим событие для проверки Ti20
  const event = events.list.find(e => e.id === eventId)
  const ti20Passed = event ? isTi20Passed(event) : false

  // Базовое подтверждение
  let confirmed = confirm(`⚠️ ВНИМАНИЕ!\n\nВы действительно хотите ПОЛНОСТЬЮ УДАЛИТЬ событие "${eventTitle}"?\n\nЭто действие:\n• Удалит событие навсегда\n• Удалит все заявки и платежи\n• Удалит всю историю\n• НЕ МОЖЕТ БЫТЬ ОТМЕНЕНО\n\nПродолжить?`)
  
  if (!confirmed) return

  // Дополнительное подтверждение, если Ti20 прошло
  if (ti20Passed) {
    confirmed = confirm(`🚨 ОСОБОЕ ПОДТВЕРЖДЕНИЕ!\n\nДля события "${eventTitle}" уже наступило время Ti20 (окончание приема заявок).\n\nУдаление такого события может повлиять на:\n• Участников, которые уже подали заявки\n• Платежи, которые уже были внесены\n• Итоги мероприятия\n\nВы ТОЧНО уверены, что хотите удалить это событие?`)
    
    if (!confirmed) return
  }

  try {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete event')
    }

    toastMessage.value = `✅ Событие "${eventTitle}" полностью удалено`
    showToast.value = true
    
    // Обновляем список событий
    await events.fetch()
    
  } catch (error: any) {
    console.error('Error deleting event:', error)
    toastMessage.value = `❌ Ошибка удаления: ${error.message}`
    showToast.value = true
  }
}

// Проверка, является ли ивент кастомным (созданным пользователем)
const isCustomEvent = (eventId: string) => {
  return eventId.startsWith('event-')
}

// Форматирование даты
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', { 
    day: '2-digit', 
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Получить отображаемое имя автора
const getDisplayAuthorName = (authorId: string | null | undefined) => {
  // Если authorId не передан или пустой, возвращаем пустую строку
  if (!authorId) {
    return 'Не указан'
  }
  
  // Пытаемся найти автора в справочнике по ID
  const author = getAuthorById(authorId)
  if (author) {
    return getAuthorShortName(author)
  }
  
  // Если не найден в справочнике, значит это строка из внешнего API (например, "Шеф Иванов")
  // Возвращаем как есть
  return authorId
}

// Форматирование суммы
const formatMoney = (amount: number) => {
  return (amount / 100).toLocaleString('ru-RU', { minimumFractionDigits: 0 })
}

// Форматирование даты приема заявок (с годом и временем для юридической значимости)
const formatShortDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  // Всегда перезагружаем события при входе на страницу каталога
  // Это гарантирует, что новые/отредактированные события будут видны
  await events.reload()
  
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

      <!-- Поиск -->
      <div class="search-bar">
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
          :class="['event-card', { 'draft-card': event.status === 'draft' }]"
          @click="event.status === 'draft' ? $event.stopPropagation() : goToMonitoring(event.id)"
        >
          <!-- Пометка черновика -->
          <div v-if="event.status === 'draft'" class="draft-badge">
            📝 Черновик
          </div>
          
          <!-- Кнопки в углах -->
          <div class="corner-buttons">
            
            <!-- Кнопка избранного -->
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

            <!-- Кнопка удаления (для модераторов) -->
            <button
              v-if="auth.isModerator"
              @click.stop="deleteEvent(event.id, event.title)"
              class="delete-corner-btn"
              title="Полностью удалить событие"
            >
              <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          
          <!-- ИНФОРМАЦИЯ "ОТ АВТОРА" (базовая, без статистики сбора) -->
          <div class="event-info">
            <h3 class="event-title">{{ event.title }}</h3>
            
            <div class="event-meta">
              <div class="meta-row">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span class="meta-label">Начало:</span>
                <span class="meta-value">{{ formatDate(event.startAt) }}</span>
              </div>
              
              <div class="meta-row">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="meta-label">Место:</span>
                <span class="meta-value">{{ event.location }}</span>
              </div>
              
              <div class="meta-row">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span class="meta-label">Автор:</span>
                <span class="meta-value">{{ getDisplayAuthorName(event.author) }}</span>
              </div>
              
              <div v-if="event.siteAlias" class="meta-row">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h7a2 2 0 002-2v-1a2 2 0 012-2h2.945M10 7l2-2 2 2M10 17l2 2 2-2"/>
                </svg>
                <span class="meta-label">Источник:</span>
                <span class="meta-value">{{ event.siteAlias }}</span>
              </div>
              
              <div v-if="event.createdAt" class="meta-row">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="meta-label">Создано:</span>
                <span class="meta-value">{{ formatDate(event.createdAt) }}</span>
              </div>

              <div v-if="event.updatedAt && event.updatedAt !== event.createdAt" class="meta-row">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="meta-label">Обновлено:</span>
                <span class="meta-value">{{ formatDate(event.updatedAt) }}</span>
              </div>

              <div class="meta-row">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <span class="meta-label">Цена:</span>
                <span class="meta-value">{{ formatMoney(event.pricePerSeat || event.priceTotal) }} ₽</span>
              </div>
            </div>

            <div v-if="event.description" class="event-description">
              {{ event.description }}
            </div>

            <!-- ЦЕЛЕВЫЕ ПОКАЗАТЕЛИ (от автора) -->
            <div class="target-stats">
              <!-- Прием заявок - 2 строки -->
              <template v-if="event.startApplicationsAt && event.endApplicationsAt">
                <div class="target-row applications-start">
                  <svg class="target-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span class="target-label">Прием заявок начало —</span>
                  <span class="target-value">{{ formatShortDate(event.startApplicationsAt) }}</span>
                </div>
                
                <div class="target-row applications-end">
                  <span class="target-label-indent">окончание —</span>
                  <span class="target-value">{{ formatShortDate(event.endApplicationsAt) }}</span>
                </div>
              </template>
              
              <div v-else class="target-row applications">
                <svg class="target-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span class="target-label">Прием заявок:</span>
                <span class="target-value">Уточняется</span>
              </div>

              <div class="target-row">
                <svg class="target-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <span class="target-label">Мест:</span>
                <span class="target-value">{{ event.seatLimit || 20 }}</span>
              </div>

              <div class="target-row">
                <svg class="target-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                </svg>
                <span class="target-label">Цена за место:</span>
                <span class="target-value">{{ formatMoney(event.pricePerSeat || (event.priceTotal / (event.seatLimit || 20))) }} ₽</span>
              </div>

              <div class="target-row total">
                <svg class="target-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="target-label">Складочный сбор:</span>
                <span class="target-value">{{ formatMoney(event.priceTotal) }} ₽</span>
              </div>
            </div>
          </div>

          <!-- Подсказка о клике -->
          <div class="click-hint">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Нажмите для мониторинга хода сбора</span>
          </div>
        </div>
      </div>

      <!-- Нет результатов -->
      <div v-else class="no-results">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>Мероприятия не найдены</p>
        <button @click="searchQuery = ''" class="reset-btn">
          Очистить поиск
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

/* Поиск */
.search-bar {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.search-box {
  position: relative;
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
  display: flex;
  flex-direction: column;
}

.event-card:hover {
  border-color: #007AFF;
  box-shadow: 0 12px 32px rgba(0, 122, 255, 0.15);
  transform: translateY(-6px);
}

/* Черновик - блокированная карточка */
.draft-card {
  opacity: 0.7;
  border-color: #ffa500 !important;
  cursor: not-allowed;
}

.draft-card:hover {
  transform: none;
  box-shadow: none;
}

.draft-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
}

/* Информация о мероприятии "от автора" */
.event-info {
  padding: 92px 24px 16px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.event-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 20px 0;
  line-height: 1.3;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.meta-row .icon {
  width: 18px;
  height: 18px;
  color: #007AFF;
  flex-shrink: 0;
}

.meta-label {
  color: #666;
  font-weight: 500;
  min-width: 70px;
}

.meta-value {
  color: #1a1a1a;
  font-weight: 600;
}

.event-description {
  font-size: 14px;
  line-height: 1.5;
  color: #666;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Целевые показатели (от автора) */
.target-stats {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  margin-bottom: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.target-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.target-row.applications,
.target-row.applications-start {
  padding-bottom: 10px;
  margin-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.target-row.applications-start {
  margin-bottom: 4px;
  padding-bottom: 0;
  border-bottom: none;
}

.target-row.applications-end {
  padding-bottom: 10px;
  margin-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
  gap: 0;
}

.target-row.applications .target-label,
.target-row.applications-start .target-label {
  color: #1a1a1a;
  font-weight: 600;
}

.target-label-indent {
  color: #666;
  font-weight: 500;
  padding-left: 26px; /* Отступ для выравнивания под "Прием заявок" */
}

.target-row.total {
  margin-top: 4px;
  padding-top: 10px;
  border-top: 2px solid #007AFF;
  font-size: 15px;
}

.target-icon {
  width: 18px;
  height: 18px;
  color: #007AFF;
  flex-shrink: 0;
}

.target-row.total .target-icon {
  color: #2e7d32;
}

.target-label {
  color: #666;
  font-weight: 500;
  min-width: 110px;
}

.target-row.total .target-label {
  font-weight: 700;
  color: #1a1a1a;
}

.target-value {
  color: #1a1a1a;
  font-weight: 700;
  margin-left: auto;
}

.target-row.total .target-value {
  color: #2e7d32;
  font-size: 16px;
}

/* Кнопка избранного в углу */
/* Контейнер для кнопок в углу */
.corner-buttons {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  gap: 8px;
}

/* Кнопка избранного */
.favorite-corner-btn {
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

/* Кнопка удаления */
.delete-corner-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 2px solid #ff3b30;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  color: #ff3b30;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.delete-corner-btn:hover {
  background: #ffe8e7;
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(255, 59, 48, 0.3);
}

.delete-corner-btn .icon {
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

  .event-title {
    font-size: 20px;
  }

  .event-info {
    padding: 84px 20px 16px 20px;
  }

  .corner-buttons {
    top: 12px;
    right: 12px;
    gap: 6px;
  }

  .favorite-corner-btn {
    width: 44px;
    height: 44px;
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
