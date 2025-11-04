<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useEventsStore } from '~/stores/events'
import { useMonitoringStore } from '~/stores/monitoring'
import { useAuthStore } from '~/stores/auth'
import EventStatus from '~/components/EventStatus.vue'
import MonitoringTable from '~/components/MonitoringTable.vue'
import AuthModal from '~/components/AuthModal.vue'

const route = useRoute()
const events = useEventsStore()
const mon = useMonitoringStore()
const auth = useAuthStore()
const isLoading = ref(true)
const showAuthModal = ref(false)

onMounted(async () => { 
  auth.loadUsers()
  await events.fetch()
  await mon.fetch()
  
  setTimeout(() => {
    isLoading.value = false
  }, 300)
})

const eventId = computed(() => (route.query.event as string) || (events.list[0]?.id ?? ''))
const ev = computed(() => events.list.find(e => e.id === eventId.value))
const snap = computed(() => mon.byEvent(eventId.value))

// Селектор мероприятий
const switchEvent = (id: string) => {
  navigateTo(`/monitoring?event=${id}`)
}

// Форматирование суммы
const formatMoney = (amount: number) => {
  return (amount / 100).toLocaleString('ru-RU', { minimumFractionDigits: 0 })
}

// Проверка участия пользователя
const userApplication = computed(() => {
  if (!auth.isAuthenticated || !snap.value) return null
  return snap.value.applicants.find(a => a.code === auth.userCode)
})

// Позиция пользователя в рейтинге (отсортированном по убыванию взноса)
const userRanking = computed(() => {
  if (!userApplication.value || !snap.value) return null
  const sorted = [...snap.value.applicants].sort((a, b) => b.paidAmount - a.paidAmount)
  const position = sorted.findIndex(a => a.code === auth.userCode) + 1
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
  
  // TODO: Открыть форму подачи заявки с полями:
  // - Количество мест (по умолчанию 1)
  // - Сумма взноса (минимум = pricePerSeat)
  // - Подтверждение оплаты
  alert(`Форма подачи заявки\n\nВаш код: ${auth.userCode}\n\nВ MVP вы укажете:\n• Количество мест\n• Сумму взноса (мин. ${formatMoney(ev.value?.pricePerSeat || 0)} ₽)\n\n⚠️ Заявка действительна только после оплаты!`)
}

// Увеличить ставку (доплатить)
const increaseBid = () => {
  if (!userRanking.value) return
  
  // TODO: Открыть форму доплаты с полями:
  // - Текущая ставка
  // - Дополнительная сумма
  // - Новая ставка
  // - Подтверждение оплаты
  alert(`Увеличение ставки\n\nВаш код: ${auth.userCode}\nТекущая ставка: ${formatMoney(userRanking.value.currentBid)} ₽\nВаша позиция: ${userRanking.value.position} из ${userRanking.value.total}\n\nВы можете доплатить, чтобы подняться в рейтинге`)
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
            {{ event.title }} - {{ event.author }}
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

        <!-- КНОПКА ПОДАЧИ ЗАЯВКИ / ДОПЛАТЫ -->
        <div class="application-section" :class="{ 'has-application': userApplication }">
          
          <!-- НЕ АВТОРИЗОВАН -->
          <div v-if="!auth.isAuthenticated" class="auth-required">
            <svg class="icon-lock" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <h3 class="auth-title">Для подачи заявки требуется авторизация</h3>
            <p class="auth-text">Войдите или зарегистрируйтесь, чтобы подать заявку с оплатой</p>
            <button class="auth-btn" @click="openAuthModal">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
              </svg>
              Войти / Зарегистрироваться
            </button>
          </div>

          <!-- УЖЕ УЧАСТНИК - ПОКАЗЫВАЕМ СТАТУС И КНОПКУ ДОПЛАТЫ -->
          <div v-else-if="userApplication" class="user-status-block">
            <div class="status-header">
              <svg class="icon-check" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <span class="status-text">Вы участвуете в этом мероприятии!</span>
            </div>

            <div class="user-stats">
              <div class="stat-card">
                <div class="stat-label">Ваш код:</div>
                <div class="stat-value">{{ auth.userCode }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Ваша ставка:</div>
                <div class="stat-value">{{ formatMoney(userRanking?.currentBid || 0) }} ₽</div>
              </div>
              <div class="stat-card highlight">
                <div class="stat-label">Позиция в рейтинге:</div>
                <div class="stat-value">{{ userRanking?.position }} из {{ userRanking?.total }}</div>
              </div>
            </div>

            <button class="increase-bid-btn" @click="increaseBid">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/>
              </svg>
              <span>Увеличить ставку (доплатить)</span>
            </button>
            <p class="increase-hint">
              💡 Доплатите, чтобы подняться в рейтинге и гарантировать участие
            </p>
          </div>

          <!-- АВТОРИЗОВАН, НО ЕЩЕ НЕ УЧАСТНИК -->
          <div v-else class="apply-block">
            <button class="apply-btn" @click="submitApplication">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span class="btn-text">Подать заявку с оплатой</span>
              <svg class="icon-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </button>
            <p class="apply-hint">
              Минимальный взнос: {{ formatMoney(ev.pricePerSeat || (ev.priceTotal / (ev.seatLimit || 20))) }} ₽
              <br>⚠️ Заявка действительна только после оплаты
              <br>При переборе участников побеждают те, кто внес больше средств
            </p>
          </div>
        </div>

        <!-- Таблица участников -->
        <div v-if="snap && snap.applicants.length > 0" class="participants-section">
          <div class="section-header">
            <h2 class="section-title">Зарегистрированные участники</h2>
            <span class="participants-count">{{ snap.applicants.length }} чел.</span>
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

          <div v-if="ev.activities && ev.activities.length > 0" class="activities-list">
            <h3 class="subsection-title">Программа:</h3>
            <ul class="activities">
              <li v-for="(activity, index) in ev.activities" :key="index" class="activity-item">
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

/* Секция подачи заявки */
.application-section {
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
  box-shadow: 0 8px 24px rgba(52, 199, 89, 0.3);
}

.application-section.has-application {
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
}

/* Требуется авторизация */
.auth-required {
  padding: 12px 0;
}

.icon-lock {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 auto 12px;
}

.auth-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
}

.auth-text {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 20px 0;
}

.auth-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid #fff;
  border-radius: 8px;
  background: #fff;
  color: #34c759;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}

.auth-btn .icon {
  width: 20px;
  height: 20px;
}

/* Статус участника */
.user-status-block {
  padding: 8px 0;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.icon-check {
  width: 32px;
  height: 32px;
  color: #fff;
}

.status-text {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.stat-card.highlight {
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.increase-bid-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 700;
  border: 2px solid #fff;
  border-radius: 8px;
  background: #fff;
  color: #007AFF;
  cursor: pointer;
  transition: all 0.3s;
}

.increase-bid-btn:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.increase-bid-btn .icon {
  width: 22px;
  height: 22px;
}

.increase-hint {
  margin: 16px 0 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
}

/* Блок подачи заявки */
.apply-block {
  padding: 10px 0;
}

.apply-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 32px;
  font-size: 20px;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  background: #fff;
  color: #34c759;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.apply-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  background: #f8f8f8;
}

.apply-btn:active {
  transform: translateY(-1px);
}

.apply-btn .icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.apply-btn .icon-arrow {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  animation: arrow-bounce 2s infinite;
}

@keyframes arrow-bounce {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(5px);
  }
}

.btn-text {
  flex: 1;
}

.apply-hint {
  margin: 16px 0 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
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

  .application-section {
    padding: 20px;
  }

  .icon-lock {
    width: 48px;
    height: 48px;
  }

  .auth-title {
    font-size: 18px;
  }

  .auth-text {
    font-size: 14px;
  }

  .status-text {
    font-size: 18px;
  }

  .user-stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .increase-bid-btn {
    font-size: 16px;
    padding: 14px 24px;
  }

  .apply-btn {
    font-size: 18px;
    padding: 18px 24px;
    flex-direction: column;
    gap: 8px;
  }

  .apply-btn .icon {
    width: 20px;
    height: 20px;
  }

  .apply-btn .icon-arrow {
    display: none;
  }

  .apply-hint {
    font-size: 13px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .participants-count {
    align-self: flex-start;
  }
}
</style>
