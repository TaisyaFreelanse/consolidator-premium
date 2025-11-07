<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventsStore } from '~/stores/events'
import { useMonitoringStore } from '~/stores/monitoring'
import { useAuthStore } from '~/stores/auth'
import EventStatus from '~/components/EventStatus.vue'
import MonitoringTable from '~/components/MonitoringTable.vue'
import AuthModal from '~/components/AuthModal.vue'
import PaymentModal from '~/components/PaymentModal.vue'
import { getAuthorById, getAuthorShortName } from '~/data/authors'

const route = useRoute()
const events = useEventsStore()
const mon = useMonitoringStore()
const auth = useAuthStore()
const isLoading = ref(true)
const showAuthModal = ref(false)
const showPaymentModal = ref(false)
const paymentMode = ref<'application' | 'additional'>('application')
const paymentAmount = ref(0) // в рублях
const snap = ref<any>(null) // Данные мониторинга

onMounted(async () => { 
  auth.loadUsers()
  await events.fetch()
  await mon.fetch()
  
  // Загружаем данные мониторинга для текущего события
  await loadMonitoringData()
  
  setTimeout(() => {
    isLoading.value = false
  }, 300)
})

// Загрузка данных мониторинга
const loadMonitoringData = async () => {
  if (eventId.value) {
    snap.value = await mon.fetchByEvent(eventId.value)
  }
}

const eventId = computed(() => (route.query.event as string) || (events.list[0]?.id ?? ''))
const ev = computed(() => events.list.find(e => e.id === eventId.value))

// Следим за изменением eventId и перезагружаем данные
watch(eventId, async (newId) => {
  if (newId) {
    isLoading.value = true
    snap.value = await mon.fetchByEvent(newId, true) // Принудительная перезагрузка
    isLoading.value = false
  }
})

// Селектор мероприятий
const switchEvent = (id: string) => {
  navigateTo(`/monitoring?event=${id}`)
}

// Форматирование суммы
const formatMoney = (amount: number) => {
  return (amount / 100).toLocaleString('ru-RU', { minimumFractionDigits: 0 })
}

// Маскировка номера карты для логов
const maskCardNumber = (cardNumber: string) => {
  const cleaned = cardNumber.replace(/\D/g, '')
  if (cleaned.length < 4) return '****'
  return '**** **** **** ' + cleaned.slice(-4)
}

// Получить отображаемое имя автора
const getDisplayAuthorName = (authorId: string) => {
  const author = getAuthorById(authorId)
  if (author) {
    return getAuthorShortName(author)
  }
  return authorId // Fallback для старых событий
}

// Нормализация activities (всегда массив)
const normalizedActivities = computed(() => {
  if (!ev.value?.activities) return []
  
  // Если это массив - возвращаем как есть
  if (Array.isArray(ev.value.activities)) {
    return ev.value.activities
  }
  
  // Если это строка - пытаемся распарсить JSON
  if (typeof ev.value.activities === 'string') {
    try {
      const parsed = JSON.parse(ev.value.activities)
      return Array.isArray(parsed) ? parsed : [ev.value.activities]
    } catch {
      // Если не JSON - возвращаем как массив с одним элементом
      return [ev.value.activities]
    }
  }
  
  return []
})

// Проверка участия пользователя
const userApplication = computed(() => {
  if (!auth.isAuthenticated || !snap.value || !snap.value.applicants) return null
  return snap.value.applicants.find((a: any) => a.code === auth.userCode)
})

// Позиция пользователя в рейтинге (отсортированном по убыванию взноса)
const userRanking = computed(() => {
  if (!userApplication.value || !snap.value || !snap.value.applicants) return null
  const sorted = [...snap.value.applicants].sort((a: any, b: any) => b.paidAmount - a.paidAmount)
  const position = sorted.findIndex((a: any) => a.code === auth.userCode) + 1
  return {
    position,
    total: snap.value.applicants.length,
    currentBid: userApplication.value.paidAmount
  }
})

// Открыть модальное окно авторизации
const openAuthModal = () => {
  showAuthModal.value = true
}

// Закрыть модальное окно авторизации
const closeAuthModal = () => {
  showAuthModal.value = false
}

// Подать заявку (с оплатой)
const submitApplication = () => {
  if (!auth.isAuthenticated) {
    openAuthModal()
    return
  }
  
  // Открыть модальное окно оплаты
  const pricePerSeat = ev.value?.pricePerSeat || (ev.value ? ev.value.priceTotal / (ev.value.seatLimit || 20) : 0)
  paymentAmount.value = Math.round(pricePerSeat / 100) // конвертируем копейки в рубли
  paymentMode.value = 'application'
  showPaymentModal.value = true
}

// Проверка: можно ли еще подавать заявки (до ti20)
const canSubmitApplications = computed(() => {
  if (!ev.value) return true
  const ti20 = ev.value.endApplicationsAt
  if (!ti20) return true
  return new Date() < new Date(ti20)
})

// Увеличить ставку (доплатить)
const increaseBid = () => {
  // Проверка 1: Завершился ли прием заявок?
  if (!canSubmitApplications.value) {
    alert('❌ Прием заявок завершен\n\nДополнительная оплата больше недоступна.')
    return
  }
  
  // Проверка 2: Авторизован ли пользователь и подал ли он заявку?
  if (!auth.isAuthenticated) {
    alert('❌ Доплатить может только лицо, ранее подавшее заявку на мероприятие.\n\nДля подачи заявки:\n1. Авторизуйтесь\n2. Нажмите кнопку "Подать заявку"')
    return
  }
  
  if (!userApplication.value) {
    alert('❌ Доплатить может только лицо, ранее подавшее заявку на мероприятие.\n\nДля подачи заявки нажмите кнопку "Подать заявку"')
    return
  }
  
  // Проверка 3: Есть ли данные о рейтинге?
  if (!userRanking.value) return
  
  // Всё ок - открываем модальное окно оплаты (25% от текущей ставки, округленно)
  const additionalAmount = Math.round((userRanking.value.currentBid / 100) * 0.25)
  paymentAmount.value = additionalAmount
  paymentMode.value = 'additional'
  showPaymentModal.value = true
}

// Закрыть модальное окно оплаты
const closePaymentModal = () => {
  showPaymentModal.value = false
}

// Обработка оплаты
const handlePayment = async (paymentData: any) => {
  if (!ev.value) return
  
  const isProcessing = ref(false)
  
  if (isProcessing.value) return
  isProcessing.value = true
  
  try {
    // Очищаем номер карты от пробелов
    const cleanedCardNumber = paymentData.cardNumber.replace(/\s/g, '')
    
    const requestBody = {
      eventId: ev.value.id,
      userId: auth.userCode,
      cardNumber: cleanedCardNumber,
      expiry: paymentData.expiry,
      cvc: paymentData.cvc,
      amount: paymentData.amount
    }
    
    console.log('💳 Processing payment...', {
      ...requestBody,
      cardNumber: maskCardNumber(cleanedCardNumber) // Маскируем для логов
    })
    
    // Отправляем запрос на создание заявки с оплатой
    const response = await fetch('/api/applications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    const result = await response.json()
    
    if (!response.ok || !result.success) {
      // Если есть детальные ошибки валидации, показываем их
      const errorMessage = result.message || result.statusMessage || 'Payment failed'
      const errorDetails = result.data ? (Array.isArray(result.data) ? result.data.join(', ') : JSON.stringify(result.data)) : ''
      throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage)
    }
    
    console.log('✅ Payment successful:', result)
    
    // Показываем успешное сообщение
    alert(`✅ ${paymentMode.value === 'application' ? 'Заявка принята!' : 'Дополнительная оплата выполнена!'}\n\nСумма: ${result.data.amount} ${result.data.currency}\nID транзакции: ${result.data.providerTxnId}\nВаш код: ${auth.userCode}`)
    
    // Инвалидируем кэш мониторинга и перезагружаем данные
    mon.invalidate(ev.value.id)
    await loadMonitoringData()
    
    closePaymentModal()
  } catch (error: any) {
    console.error('❌ Payment failed:', error)
    alert(`❌ Ошибка оплаты\n\n${error.message || 'Произошла ошибка при обработке платежа. Попробуйте еще раз.'}`)
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <section class="monitoring-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Мониторинг сбора средств</h1>
        <p class="page-subtitle">Консолидатор: честная информация о ходе сбора</p>
      </div>

      <!-- Селектор мероприятия -->
      <div v-if="events.list.length > 1" class="event-selector">
        <label class="selector-label">Выберите мероприятие:</label>
        <select :value="eventId" @change="(e) => switchEvent((e.target as HTMLSelectElement).value)" class="selector-dropdown">
          <option v-for="event in events.list" :key="event.id" :value="event.id">
            {{ event.title }} - {{ getDisplayAuthorName(event.author) }}
          </option>
        </select>
      </div>

      <!-- Загрузка -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка данных...</p>
      </div>

      <!-- Контент мониторинга -->
      <div v-else-if="ev" class="monitoring-content">
        
        <!-- ГЛАВНЫЙ ВИДЖЕТ СТАТУСА (единый для каталога и мониторинга) -->
        <div class="status-section">
          <EventStatus :event="ev" :snapshot="snap || undefined" />
        </div>

        <!-- ПРЕДУПРЕЖДЕНИЕ ДЛЯ ЛОКАЛЬНЫХ СОБЫТИЙ (только для старых событий из localStorage) -->
        <div v-if="ev.id.startsWith('event-')" class="local-event-warning">
          <svg class="warning-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <div class="warning-content">
            <h3 class="warning-title">Локальное событие</h3>
            <p class="warning-text">
              Это событие существует только на вашем устройстве и не синхронизировано с сервером. 
              Данные мониторинга недоступны до публикации события.
            </p>
          </div>
        </div>

        <!-- КОМПАКТНАЯ КНОПКА ПОДАЧИ ЗАЯВКИ -->
        <div v-if="!userApplication" class="application-button-section">
          <button 
            class="submit-application-btn" 
            @click="submitApplication"
            :title="auth.isAuthenticated ? 'Подать заявку с оплатой' : 'Требуется авторизация'"
          >
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span class="btn-text">Подать заявку</span>
          </button>
          <p class="application-hint">
            {{ auth.isAuthenticated 
              ? `Минимальный взнос: ${formatMoney(ev.pricePerSeat || (ev.priceTotal / (ev.seatLimit || 20)))} ₽` 
              : '🔒 Войдите или зарегистрируйтесь для подачи заявки' 
            }}
          </p>
        </div>

        <!-- СТАТУС УЧАСТНИКА (если уже участвует) -->
        <div v-else class="user-status-compact">
          <div class="status-badge">
            <svg class="icon-check" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Вы участвуете</span>
          </div>
          <div class="user-mini-stats">
            <div class="mini-stat">
              <span class="mini-label">Код:</span>
              <span class="mini-value">{{ auth.userCode }}</span>
            </div>
            <div class="mini-stat">
              <span class="mini-label">Ставка:</span>
              <span class="mini-value">{{ formatMoney(userRanking?.currentBid || 0) }} ₽</span>
            </div>
            <div class="mini-stat highlight">
              <span class="mini-label">Позиция:</span>
              <span class="mini-value">{{ userRanking?.position }} / {{ userRanking?.total }}</span>
            </div>
          </div>
        </div>

        <!-- Таблица участников -->
        <div v-if="snap && snap.applicants.length > 0" class="participants-section">
          <div class="section-header">
            <div class="header-left">
              <h2 class="section-title">Зарегистрированные участники</h2>
              <span class="participants-count">{{ snap.applicants.length }} чел.</span>
            </div>
            
            <!-- КНОПКА ДОПОЛНИТЕЛЬНОЙ ОПЛАТЫ (видна всегда) -->
            <button 
              class="additional-payment-btn"
              :class="{ 'disabled': !canSubmitApplications }"
              :disabled="!canSubmitApplications"
              @click="increaseBid"
              :title="canSubmitApplications ? 'Увеличить ставку' : 'Прием заявок завершен'"
            >
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/>
              </svg>
              <span>{{ canSubmitApplications ? 'Дополнительная оплата' : 'Прием завершен' }}</span>
            </button>
          </div>

          <MonitoringTable :data="snap" />

          <div class="table-note">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>
              Один участник = одно место. 
              При переборе участников побеждают те, кто внес больше средств.
            </span>
          </div>
        </div>

        <!-- Нет участников -->
        <div v-else class="no-participants">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <p>Пока нет зарегистрированных участников</p>
          <p class="hint">Станьте первым!</p>
        </div>

        <!-- Описание мероприятия (ВТОРИЧНО - показываем в конце) -->
        <div v-if="ev.description || (ev.activities && ev.activities.length > 0)" class="description-section">
          <h2 class="section-title">О мероприятии</h2>
          
          <div v-if="ev.description" class="description-text">
            <p>{{ ev.description }}</p>
          </div>

          <div v-if="normalizedActivities.length > 0" class="activities-list">
            <h3 class="subsection-title">Программа:</h3>
            <ul class="activities">
              <li v-for="(activity, index) in normalizedActivities" :key="index" class="activity-item">
                {{ activity }}
              </li>
            </ul>
          </div>

          <div v-if="ev.authorInfo" class="author-info">
            <h3 class="subsection-title">Автор мероприятия:</h3>
            <div class="author-card">
              <div class="author-name">{{ ev.authorInfo.name }}</div>
              <div class="author-title">{{ ev.authorInfo.title }}</div>
              <ul v-if="ev.authorInfo.achievements" class="achievements">
                <li v-for="(achievement, idx) in ev.authorInfo.achievements" :key="idx">
                  {{ achievement }}
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      <!-- Нет данных -->
      <div v-else class="no-data">
        <p>Данные о мероприятии не найдены</p>
      </div>
    </div>

    <!-- Модальное окно авторизации -->
    <AuthModal :is-open="showAuthModal" @close="closeAuthModal" />
    
    <!-- Модальное окно оплаты -->
    <PaymentModal 
      :is-open="showPaymentModal" 
      :initial-amount="paymentAmount"
      :event-title="ev?.title"
      :mode="paymentMode"
      @close="closePaymentModal"
      @submit="handlePayment"
    />
  </section>
</template>

<style scoped>
/* Основной контейнер */
.monitoring-page {
  min-height: 100vh;
  background: #f5f5f7;
  padding: 80px 0 40px;
}

.container {
  max-width: 1200px;
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

/* Селектор мероприятия */
.event-selector {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.selector-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #444;
  margin-bottom: 8px;
}

.selector-dropdown {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #007AFF;
  border-radius: 8px;
  background: #fff;
  color: #1a1a1a;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.selector-dropdown:hover {
  border-color: #005fcb;
}

.selector-dropdown:focus {
  outline: none;
  border-color: #005fcb;
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

/* Контент мониторинга */
.monitoring-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Секция статуса */
.status-section {
  /* EventStatus компонент сам содержит стили */
}

/* КОМПАКТНАЯ КНОПКА ПОДАЧИ ЗАЯВКИ */
.application-button-section {
  text-align: center;
  padding: 16px 0;
}

.submit-application-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
  border: none;
  border-radius: 14px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 6px 20px rgba(52, 199, 89, 0.4);
}

.submit-application-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(52, 199, 89, 0.5);
}

.submit-application-btn .icon {
  width: 24px;
  height: 24px;
}

.application-hint {
  margin: 12px 0 0 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* КОМПАКТНЫЙ СТАТУС УЧАСТНИКА */
.user-status-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  backdrop-filter: blur(8px);
}

.status-badge .icon-check {
  width: 20px;
  height: 20px;
}

.user-mini-stats {
  display: flex;
  gap: 16px;
  flex: 1;
  justify-content: flex-end;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.mini-stat.highlight {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(8px);
}

.mini-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mini-value {
  font-size: 16px;
  color: #fff;
  font-weight: 700;
}

/* Секция участников */
.participants-section {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.participants-count {
  display: inline-block;
  padding: 6px 16px;
  background: #007AFF;
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
}

/* КНОПКА ДОПОЛНИТЕЛЬНОЙ ОПЛАТЫ */
.additional-payment-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
}

.additional-payment-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 149, 0, 0.4);
}

.additional-payment-btn:disabled,
.additional-payment-btn.disabled {
  background: linear-gradient(135deg, #999 0%, #777 100%);
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.additional-payment-btn .icon {
  width: 18px;
  height: 18px;
}

.table-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  padding: 14px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.table-note .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #007AFF;
  margin-top: 2px;
}

/* Секция описания (вторична) */
.description-section {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
}

.description-text {
  margin-bottom: 24px;
}

.description-text p {
  font-size: 16px;
  line-height: 1.6;
  color: #444;
  margin: 0;
}

.subsection-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 16px 0;
}

.activities-list {
  margin-bottom: 24px;
}

.activities {
  list-style: none;
  padding: 0;
  margin: 0;
}

.activity-item {
  position: relative;
  padding-left: 24px;
  margin-bottom: 12px;
  font-size: 15px;
  line-height: 1.5;
  color: #444;
}

.activity-item::before {
  content: '•';
  position: absolute;
  left: 8px;
  color: #007AFF;
  font-weight: 700;
}

/* Информация об авторе */
.author-info {
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.author-card {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.author-name {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.author-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.achievements {
  list-style: none;
  padding: 0;
  margin: 12px 0 0 0;
}

.achievements li {
  position: relative;
  padding-left: 20px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #444;
}

.achievements li::before {
  content: '🏆';
  position: absolute;
  left: 0;
}

/* Нет участников */
.no-participants {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.no-participants .icon {
  width: 64px;
  height: 64px;
  color: #ccc;
  margin: 0 auto 16px;
}

.no-participants p {
  font-size: 18px;
  color: #666;
  margin: 0 0 8px 0;
}

.no-participants .hint {
  font-size: 14px;
  color: #999;
}

/* Нет данных */
.no-data {
  text-align: center;
  padding: 60px 20px;
  font-size: 18px;
  color: #666;
}

/* Предупреждение для локальных событий */
.local-event-warning {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 59, 48, 0.15) 100%);
  border: 2px solid rgba(255, 149, 0, 0.4);
  border-radius: 12px;
  margin-bottom: 16px;
}

.warning-icon {
  width: 32px;
  height: 32px;
  color: #ff9500;
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.warning-text {
  font-size: 14px;
  line-height: 1.5;
  color: #444;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .monitoring-page {
    padding: 70px 0 100px;
  }

  .page-title {
    font-size: 28px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .submit-application-btn {
    font-size: 16px;
    padding: 14px 24px;
  }

  .submit-application-btn .icon {
    width: 20px;
    height: 20px;
  }

  .application-hint {
    font-size: 13px;
  }

  .user-status-compact {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }

  .status-badge {
    align-self: center;
  }

  .user-mini-stats {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .mini-stat {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  .mini-stat.highlight {
    background: rgba(255, 255, 255, 0.2);
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    flex-wrap: wrap;
  }

  .additional-payment-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
