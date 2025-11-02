<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useEventsStore } from '~/stores/events'
import { useMonitoringStore } from '~/stores/monitoring'
import EventStatus from '~/components/EventStatus.vue'
import MonitoringTable from '~/components/MonitoringTable.vue'

const route = useRoute()
const events = useEventsStore()
const mon = useMonitoringStore()
const isLoading = ref(true)

onMounted(async () => { 
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
  gap: 24px;
}

/* Секция статуса */
.status-section {
  /* EventStatus компонент сам содержит стили */
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
