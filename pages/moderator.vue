<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useEventsStore } from '~/stores/events'
import { useAuthStore } from '~/stores/auth'
import { getAuthorById, getAuthorShortName } from '~/data/authors'

const events = useEventsStore()
const auth = useAuthStore()
const isLoading = ref(true)
const isPublishing = ref<string | null>(null) // ID события, которое публикуется

// Фильтруем только черновики
const draftEvents = computed(() => events.list.filter(e => e.status === 'draft'))

// Проверка доступа
const hasAccess = computed(() => auth.isModerator)

onMounted(async () => {
  auth.loadUsers()
  await events.fetch()
  setTimeout(() => { isLoading.value = false }, 300)
  
  // Проверка доступа
  if (!hasAccess.value) {
    alert('❌ Доступ запрещен!\n\nЭта страница доступна только модераторам.')
    navigateTo('/')
  }
})

// Публикация события
const publishEvent = async (eventId: string) => {
  if (!confirm('Вы уверены, что хотите опубликовать это событие?\n\nПосле публикации событие станет доступно для всех пользователей и начнется прием заявок.')) {
    return
  }
  
  isPublishing.value = eventId
  
  try {
    const response = await fetch(`/api/events/${eventId}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    if (!response.ok || !result.success) {
      const errorMessage = result.message || result.statusMessage || 'Failed to publish event'
      throw new Error(errorMessage)
    }
    
    alert('✅ Событие успешно опубликовано!')
    
    // Обновляем список событий
    await events.reload()
  } catch (error: any) {
    console.error('❌ Failed to publish event:', error)
    alert(`❌ Ошибка публикации\n\n${error.message || 'Произошла ошибка при публикации события. Попробуйте еще раз.'}`)
  } finally {
    isPublishing.value = null
  }
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

// Форматирование суммы
const formatMoney = (amount: number) => {
  return (amount / 100).toLocaleString('ru-RU', { minimumFractionDigits: 0 })
}
</script>

<template>
  <section class="moderator-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Панель модератора</h1>
        <p class="page-subtitle">Публикация событий</p>
      </div>

      <!-- Загрузка -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка данных...</p>
      </div>

      <!-- Список черновиков -->
      <div v-else-if="draftEvents.length > 0" class="drafts-list">
        <div class="drafts-header">
          <h2>Черновики событий ({{ draftEvents.length }})</h2>
          <p class="drafts-subtitle">Выберите событие для публикации</p>
        </div>

        <div class="drafts-grid">
          <div 
            v-for="event in draftEvents" 
            :key="event.id" 
            class="draft-card"
          >
            <div class="draft-card-header">
              <h3 class="draft-title">{{ event.title }}</h3>
              <div class="draft-badge">📝 Черновик</div>
            </div>
            
            <div class="draft-card-body">
              <div class="draft-info-row">
                <span class="info-label">Автор:</span>
                <span class="info-value">{{ getDisplayAuthorName(event.author) }}</span>
              </div>
              
              <div class="draft-info-row">
                <span class="info-label">Место:</span>
                <span class="info-value">{{ event.location }}</span>
              </div>
              
              <div class="draft-info-row">
                <span class="info-label">Дата начала:</span>
                <span class="info-value">{{ formatDate(event.startAt) }}</span>
              </div>
              
              <div class="draft-info-row">
                <span class="info-label">Стоимость:</span>
                <span class="info-value">{{ formatMoney(event.priceTotal) }} ₽</span>
              </div>
              
              <div class="draft-info-row" v-if="event.producerName">
                <span class="info-label">Продюсер:</span>
                <span class="info-value">{{ event.producerName }}</span>
              </div>
              
              <div class="draft-info-row" v-if="event.createdAt">
                <span class="info-label">Создано:</span>
                <span class="info-value">{{ formatDate(event.createdAt) }}</span>
              </div>
            </div>
            
            <div class="draft-card-footer">
              <button
                class="moderate-btn"
                  @click="navigateTo(`/create-event?id=${event.id}`)"
              >
                🔍 Модерировать
              </button>
              <button 
                @click="publishEvent(event.id)"
                :disabled="isPublishing === event.id"
                class="publish-btn"
                :class="{ 'publishing': isPublishing === event.id }"
              >
                <span v-if="isPublishing === event.id">Публикация...</span>
                <span v-else>✅ Опубликовать</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Нет черновиков -->
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <h2>Нет черновиков</h2>
        <p>Все события опубликованы или черновики отсутствуют.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.moderator-page {
  min-height: 100vh;
  padding: 2rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

.loading-state {
  text-align: center;
  padding: 4rem 0;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.drafts-list {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.drafts-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.drafts-header h2 {
  font-size: 1.8rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.drafts-subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.drafts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.draft-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: #f9fafb;
  transition: all 0.3s ease;
}

.draft-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.draft-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.draft-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  margin-right: 1rem;
}

.draft-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.draft-card-body {
  margin-bottom: 1.5rem;
}

.draft-info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.draft-info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #6b7280;
}

.info-value {
  color: #1f2937;
  text-align: right;
}

.draft-card-footer {
  display: flex;
  gap: 1rem;
}

.moderate-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.25);
}

.moderate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(99, 102, 241, 0.35);
}

.moderate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.publish-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #10b981, #22c55e);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 20px rgba(16, 185, 129, 0.25);
}

.publish-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(16, 185, 129, 0.35);
}

.publish-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.publish-btn.publishing {
  background: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 1.8rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .drafts-grid {
    grid-template-columns: 1fr;
  }
  
  .page-title {
    font-size: 2rem;
  }
}
</style>

