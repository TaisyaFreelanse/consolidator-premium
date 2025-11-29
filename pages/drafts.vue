<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsStore } from '~/stores/events'
import { useAuthStore } from '~/stores/auth'
import Toast from '~/components/Toast.vue'
import { getAuthorById, getAuthorShortName } from '~/data/authors'

const router = useRouter()
const events = useEventsStore()
const auth = useAuthStore()
const isLoading = ref(true)
const isPublishing = ref<string | null>(null)
const isDeleting = ref<string | null>(null)

// Toast для уведомлений
const toastMessage = ref('')
const showToast = ref(false)

// Фильтруем только черновики
const draftEvents = computed(() => events.list.filter(e => e.status === 'draft'))

// Переход к мониторингу
const goToMonitoring = (eventId: string) => {
  router.push(`/monitoring?event=${eventId}`)
}

// Публикация события
const publishEvent = async (eventId: string, eventTitle: string) => {
  if (!auth.isModerator) {
    toastMessage.value = 'Недостаточно прав для публикации события'
    showToast.value = true
    return
  }

  if (!confirm(`Вы уверены, что хотите опубликовать событие "${eventTitle}"?\n\nПосле публикации событие станет доступно для всех пользователей и начнется прием заявок.`)) {
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
    
    toastMessage.value = `✅ Событие "${eventTitle}" успешно опубликовано!`
    showToast.value = true
    
    // Обновляем список событий
    await events.fetch()
  } catch (error: any) {
    console.error('❌ Failed to publish event:', error)
    toastMessage.value = `❌ Ошибка публикации: ${error.message || 'Произошла ошибка при публикации события. Попробуйте еще раз.'}`
    showToast.value = true
  } finally {
    isPublishing.value = null
  }
}

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

// Удаление события
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
  let confirmed = confirm(`⚠️ ВНИМАНИЕ!\n\nВы действительно хотите ПОЛНОСТЬЮ УДАЛИТЬ событие "${eventTitle}"?\n\nЭто действие:\n• Удалит событие навсегда\n• Удалит все платежи\n• Удалит всю историю\n• НЕ МОЖЕТ БЫТЬ ОТМЕНЕНО\n\nПродолжить?`)
  
  if (!confirmed) return

  // Дополнительное подтверждение, если Ti20 прошло
  if (ti20Passed) {
    confirmed = confirm(`🚨 ОСОБОЕ ПОДТВЕРЖДЕНИЕ!\n\nДля события "${eventTitle}" уже наступило время Ti20 (окончание приема заявок).\n\nУдаление такого события может повлиять на:\n• Платежи, которые уже были внесены\n• Итоги мероприятия\n• Историю статусов события\n\nВы ТОЧНО уверены, что хотите удалить это событие?`)
    
    if (!confirmed) return
  }

  isDeleting.value = eventId

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
  } finally {
    isDeleting.value = null
  }
}

// Получить отображаемое имя автора
const getDisplayAuthorName = (authorId: string | null | undefined) => {
  if (!authorId) {
    return 'Не указан'
  }
  
  const author = getAuthorById(authorId)
  if (author) {
    return getAuthorShortName(author)
  }
  
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

onMounted(async () => {
  auth.loadUsers()
  await events.fetch()
  
  setTimeout(() => {
    isLoading.value = false
  }, 300)
})
</script>

<template>
  <section class="drafts-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Черновики</h1>
        <p class="page-subtitle">События, ожидающие публикации</p>
      </div>

      <!-- Проверка прав доступа -->
      <div v-if="!auth.isModerator" class="access-denied">
        <svg class="access-denied-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2>Только для модератора</h2>
        <p>Доступ к черновикам ограничен модераторами платформы</p>
      </div>

      <!-- Загрузка -->
      <div v-else-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка черновиков...</p>
      </div>

      <!-- Пустое состояние -->
      <div v-else-if="draftEvents.length === 0" class="empty-state">
        <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2>Черновиков нет</h2>
        <p>Все события опубликованы или еще не созданы</p>
      </div>

      <!-- Список черновиков -->
      <div v-else class="drafts-grid">
        <div 
          v-for="event in draftEvents" 
          :key="event.id" 
          class="draft-card"
        >
          <!-- Заголовок карточки -->
          <div class="draft-card-header">
            <h3 class="draft-card-title">{{ event.title }}</h3>
            <div class="draft-badge">Черновик</div>
          </div>

          <!-- Информация о событии -->
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
              <span class="info-label">Начало:</span>
              <span class="info-value">{{ formatDate(event.startAt) }}</span>
            </div>
            <div class="draft-info-row">
              <span class="info-label">Мест:</span>
              <span class="info-value">{{ event.seatLimit }}</span>
            </div>
            <div class="draft-info-row">
              <span class="info-label">Цена за место:</span>
              <span class="info-value">{{ formatMoney(event.pricePerSeat || event.priceTotal / event.seatLimit) }} ₽</span>
            </div>
            <div class="draft-info-row">
              <span class="info-label">Целевая сумма:</span>
              <span class="info-value">{{ formatMoney(event.priceTotal) }} ₽</span>
            </div>
            <div v-if="event.siteAlias" class="draft-info-row">
              <span class="info-label">Источник:</span>
              <span class="info-value">{{ event.siteAlias }}</span>
            </div>
            <div class="draft-info-row">
              <span class="info-label">Создано:</span>
              <span class="info-value">{{ event.createdAt ? formatDate(event.createdAt) : '—' }}</span>
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="draft-card-footer">
            <button
              @click="publishEvent(event.id, event.title)"
              :disabled="isPublishing === event.id || isDeleting === event.id || !auth.isModerator"
              class="publish-btn"
              :class="{ 'publishing': isPublishing === event.id }"
            >
              <span v-if="isPublishing === event.id">Публикация...</span>
              <span v-else>✅ Опубликовать</span>
            </button>
            <button
              @click="deleteEvent(event.id, event.title)"
              :disabled="isPublishing === event.id || isDeleting === event.id || !auth.isModerator"
              class="delete-btn"
              :class="{ 'deleting': isDeleting === event.id }"
            >
              <span v-if="isDeleting === event.id">Удаление...</span>
              <span v-else>🗑️ Удалить</span>
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
.drafts-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #0A0F1E, #1A1F3E, #0A0F1E);
  padding: 2rem 1rem;
  color: white;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(to right, #007AFF, #5E5CE6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: rgba(255, 255, 255, 0.3);
  margin: 0 auto 1rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.empty-state p {
  color: rgba(255, 255, 255, 0.5);
}

.access-denied {
  text-align: center;
  padding: 4rem 2rem;
}

.access-denied-icon {
  width: 80px;
  height: 80px;
  color: rgba(255, 59, 48, 0.5);
  margin: 0 auto 1rem;
}

.access-denied h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.access-denied p {
  color: rgba(255, 255, 255, 0.5);
}

.drafts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.draft-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s;
}

.draft-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.draft-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.draft-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  flex: 1;
  line-height: 1.4;
}

.draft-badge {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.draft-card-body {
  margin-bottom: 1.5rem;
}

.draft-info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.draft-info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.info-value {
  color: white;
  font-weight: 500;
  text-align: right;
}

.draft-card-footer {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.publish-btn,
.delete-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.publish-btn {
  background: linear-gradient(to right, #007AFF, #5E5CE6);
  color: white;
}

.publish-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
}

.publish-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.publish-btn.publishing {
  background: linear-gradient(to right, #5E5CE6, #007AFF);
  animation: pulse 1.5s ease-in-out infinite;
}

.delete-btn {
  background: rgba(255, 59, 48, 0.2);
  color: #ff3b30;
  border: 1px solid rgba(255, 59, 48, 0.3);
}

.delete-btn:hover:not(:disabled) {
  background: rgba(255, 59, 48, 0.3);
  border-color: rgba(255, 59, 48, 0.5);
  transform: translateY(-1px);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn.deleting {
  background: rgba(255, 59, 48, 0.3);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 768px) {
  .drafts-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 2rem;
  }

  .draft-card-footer {
    flex-direction: column;
  }

  .publish-btn,
  .delete-btn {
    width: 100%;
  }
}
</style>

