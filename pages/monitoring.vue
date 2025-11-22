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
import PersonalCalculation from '~/components/PersonalCalculation.vue'
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
const showPersonalCalc = ref(false)

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

// Фильтруем только опубликованные события для мониторинга
const publishedEvents = computed(() => events.list.filter(e => e.status === 'published'))
const eventId = computed(() => (route.query.event as string) || (publishedEvents.value[0]?.id ?? ''))
const ev = computed(() => publishedEvents.value.find(e => e.id === eventId.value))

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
const isModeratorUser = computed(() => auth.isModerator)

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

const formatDateTime = (date: Date) => {
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const copyCurrentEventLink = async (): Promise<boolean> => {
  if (!process.client) return false
  if (!navigator?.clipboard?.writeText) return false
  try {
    await navigator.clipboard.writeText(window.location.href)
    return true
  } catch (error) {
    console.warn('Не удалось скопировать ссылку на событие:', error)
    return false
  }
}

// Подать заявку (с оплатой)
const submitApplication = async () => {
  if (!ev.value) return

  if (isModeratorUser.value) {
    alert('❌ Модератор не может подавать заявки или оплачивать участие.\n\nВойдите под учетной записью участника или продюсера.')
    return
  }

  if (!hasApplicationsStarted.value) {
    const startMessage = applicationsStartDate.value
      ? `Прием заявок начнется ${formatDateTime(applicationsStartDate.value)}.`
      : 'Прием заявок еще не открыт.'

    const copied = await copyCurrentEventLink()

    let message = `⏳ Прием заявок еще не начался.

${startMessage}`

    if (!auth.isAuthenticated) {
      message += `

Создайте личный кабинет продюсера или участника, чтобы вернуться и подать заявку.`
    }

    message += copied
      ? `

🔗 Ссылка на это мероприятие скопирована в буфер обмена.`
      : `

Сохраните ссылку на мероприятие, чтобы быстро вернуться позже.`

    alert(message)
    return
  }

  if (!canSubmitApplications.value) {
    alert('❌ Прием заявок завершен\n\nПопробуйте выбрать другое мероприятие.')
    return
  }

  if (!auth.isAuthenticated) {
    openAuthModal()
    return
  }

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

const applicationsStartDate = computed(() => {
  if (!ev.value?.startApplicationsAt) return null
  return new Date(ev.value.startApplicationsAt)
})

const hasApplicationsStarted = computed(() => {
  if (!applicationsStartDate.value) return true
  return Date.now() >= applicationsStartDate.value.getTime()
})

const applicationWindowOpen = computed(() => hasApplicationsStarted.value && canSubmitApplications.value)
const applicationsFinished = computed(() => hasApplicationsStarted.value && !canSubmitApplications.value)

// Увеличить ставку (доплатить)
const increaseBid = () => {
  if (!hasApplicationsStarted.value) {
    alert('⏳ Дополнительные оплаты будут доступны после начала приема заявок.')
    return
  }

  if (isModeratorUser.value) {
    alert('❌ Модератор не может совершать оплаты.\n\nИспользуйте аккаунт участника, который подал заявку.')
    return
  }

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
  
  // Всё ок - открываем модальное окно оплаты без предустановленной суммы
  paymentAmount.value = 0
  paymentMode.value = 'additional'
  showPaymentModal.value = true
}

// Закрыть модальное окно оплаты
const closePaymentModal = () => {
  showPaymentModal.value = false
}

const openPersonalCalculation = () => {
  if (!snap.value) return
  if (isModeratorUser.value) {
    alert('ℹ️ Персональная калькуляция доступна только участникам.\n\nВойдите под кодом участника, чтобы просмотреть расчёт.')
    return
  }
  showPersonalCalc.value = true
}

const closePersonalCalculation = () => {
  showPersonalCalc.value = false
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
    
    // ВАЖНО: Используем ТОЛЬКО логин (name), а не код
    const userLogin = auth.currentUser?.name
    if (!userLogin) {
      throw new Error('Логин пользователя не найден. Пожалуйста, войдите в систему заново.')
    }
    
    const requestBody = {
      eventId: ev.value.id,
      userId: userLogin, // Используем ТОЛЬКО логин (name), никогда не используем код
      cardNumber: cleanedCardNumber,
      expiry: paymentData.expiry,
      cvc: paymentData.cvc,
      amount: paymentData.amount
    }
    
    console.log('💳 Creating payment with userId (login):', userLogin, 'NOT code:', auth.userCode)
    
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
      <div v-if="publishedEvents.length > 1" class="event-selector">
        <label class="selector-label">Выберите мероприятие:</label>
        <select :value="eventId" @change="(e) => switchEvent((e.target as HTMLSelectElement).value)" class="selector-dropdown">
          <option v-for="event in publishedEvents" :key="event.id" :value="event.id">
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
            :title="
              isModeratorUser
                ? 'Модератор не может подавать заявки'
                : !applicationWindowOpen
                  ? 'Прием заявок еще не начался или уже завершен'
                  : auth.isAuthenticated
                    ? 'Подать заявку с оплатой'
                    : 'Требуется авторизация'
            "
            :disabled="!applicationWindowOpen || isModeratorUser"
            :class="{ 'is-disabled': !applicationWindowOpen || isModeratorUser }"
          >
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span class="btn-text">Подать заявку</span>
          </button>
          <p class="application-hint">
            <template v-if="!applicationWindowOpen">
              ⏳ Прием заявок откроется {{ applicationsStartDate ? formatDateTime(applicationsStartDate) : 'позже' }}
            </template>
            <template v-else>
              {{ auth.isAuthenticated 
                ? `Минимальный взнос: ${formatMoney(ev.pricePerSeat || (ev.priceTotal / (ev.seatLimit || 20)))} ₽` 
                : '🔒 Войдите или зарегистрируйтесь для подачи заявки' 
              }}
            </template>
          </p>
        </div>


        <!-- Таблица участников -->
        <div v-if="snap && snap.applicants.length > 0" class="participants-section">
          <MonitoringTable
            :data="snap"
            :seat-limit="ev.seatLimit || 0"
            :event="ev"
            :can-submit-applications="canSubmitApplications"
            @open-personal-calc="openPersonalCalculation"
            @request-additional-payment="increaseBid"
          />

          <div class="table-note">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>
              Один участник = одно место. При переборе побеждают те, кто внес больше средств. Мероприятие состоится только при достижении целевой суммы. После подведения итогов излишне собранные деньги возвращаются участникам.
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

    <PersonalCalculation
      v-if="ev && snap"
      :event="ev"
      :snapshot="snap"
      :is-open="showPersonalCalc"
      :current-user-code="auth.userCode || undefined"
      :current-user-login="auth.currentUser?.name || undefined"
      @close="closePersonalCalculation"
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.submit-application-btn.is-disabled,
.submit-application-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.submit-application-btn.is-disabled:hover,
.submit-application-btn:disabled:hover {
  transform: none;
  box-shadow: none;
}

.submit-application-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(79, 70, 229, 0.35);
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

.personal-calc-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  margin-left: 16px;
  background: linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 6px 14px rgba(10, 132, 255, 0.25);
}

.personal-calc-btn .icon {
  width: 18px;
  height: 18px;
}

.personal-calc-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(10, 132, 255, 0.35);
}

.personal-calc-btn:active {
  transform: translateY(0);
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
  background: linear-gradient(135deg, rgba(17, 21, 39, 0.95) 0%, rgba(32, 41, 71, 0.9) 100%);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 24px 48px rgba(8, 12, 24, 0.45);
  backdrop-filter: blur(18px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title {
  font-size: 22px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
}

.participants-section .section-title {
  color: #f8fafc;
}

.participants-count {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.9) 0%, rgba(94, 92, 230, 0.9) 100%);
  color: #f8fafc;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 10px 25px rgba(14, 165, 233, 0.25);
}

.table-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  padding: 16px 18px;
  background: rgba(15, 118, 110, 0.1);
  border: 1px solid rgba(94, 234, 212, 0.25);
  border-radius: 16px;
  font-size: 14px;
  color: rgba(226, 232, 240, 0.8);
  line-height: 1.5;
}

.table-note .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #22d3ee;
  margin-top: 2px;
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

}
</style>
