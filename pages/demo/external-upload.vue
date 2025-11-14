<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] bg-clip-text text-transparent">
          Демо: Внешний API загрузки мероприятий
        </h1>
        <p class="text-white/60 text-sm">
          Тестовая страница для проверки работы внешнего API создания и публикации мероприятий
        </p>
      </div>

      <!-- Форма регистрации для получения API ключа -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">Регистрация и получение API ключа</h2>
        
        <form @submit.prevent="registerClient" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Producer Code <span class="text-red-400">*</span>
            </label>
            <input 
              v-model="registerForm.producerCode"
              type="text" 
              required
              placeholder="PROD001"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Название клиентского сайта (опционально)
            </label>
            <input 
              v-model="registerForm.clientName"
              type="text" 
              placeholder="Мой сайт"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
            >
          </div>

          <button
            type="submit"
            :disabled="isRegistering"
            class="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isRegistering ? 'Регистрация...' : 'Получить API ключ' }}
          </button>
        </form>

        <!-- Отображение API ключа -->
        <div v-if="apiKey" class="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <p class="text-green-300 text-sm mb-2 font-semibold">✅ API ключ получен:</p>
          <code class="block bg-black/30 rounded px-3 py-2 text-green-200 text-sm break-all">{{ apiKey }}</code>
          <p class="text-green-300/70 text-xs mt-2">Сохраните этот ключ! Он будет использоваться для всех запросов к API.</p>
        </div>
      </div>

      <!-- Форма создания/обновления -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">Создание/обновление черновика</h2>
        
        <form @submit.prevent="submitEvent" class="space-y-4">
          <div v-if="!apiKey" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
            <p class="text-amber-300 text-sm">⚠️ Сначала получите API ключ через форму регистрации выше</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              ID мероприятия (для обновления)
            </label>
            <input 
              v-model="formData.id"
              type="text" 
              placeholder="Оставьте пустым для создания нового"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Producer Name <span class="text-red-400">*</span>
            </label>
            <input 
              v-model="formData.producerName"
              type="text" 
              required
              placeholder="прод1"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Название мероприятия <span class="text-red-400">*</span>
            </label>
            <input 
              v-model="formData.title"
              type="text" 
              required
              placeholder="Кулинарный интенсив"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Имя автора (authorName) <span class="text-red-400">*</span>
            </label>
            <input 
              v-model="formData.authorName"
              type="text" 
              required
              placeholder="Шеф Иванов"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Место проведения <span class="text-red-400">*</span>
            </label>
            <input 
              v-model="formData.location"
              type="text" 
              required
              placeholder="Москва, ул. Поварская, 12"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Описание <span class="text-red-400">*</span>
            </label>
            <textarea 
              v-model="formData.description"
              required
              rows="3"
              placeholder="Погружаемся в гастрономию с шефом Ивановым"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Количество участников <span class="text-red-400">*</span>
              </label>
              <input 
                v-model.number="formData.seatLimit"
                type="number" 
                required
                min="1"
                placeholder="12"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Цена за место (₽) <span class="text-red-400">*</span>
              </label>
              <input 
                v-model.number="formData.pricePerSeat"
                type="number" 
                required
                min="0"
                step="0.01"
                placeholder="7500"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Часовой пояс (IANA) <span class="text-red-400">*</span>
            </label>
            <select
              v-model="formData.timezone"
              required
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all appearance-none cursor-pointer select-arrow"
            >
              <option value="">Выберите часовой пояс</option>
              <option value="Europe/Moscow">Europe/Moscow (МСК)</option>
              <option value="Asia/Sakhalin">Asia/Sakhalin (Сахалин)</option>
              <option value="Asia/Vladivostok">Asia/Vladivostok (Владивосток)</option>
              <option value="Asia/Yekaterinburg">Asia/Yekaterinburg (Екатеринбург)</option>
              <option value="Asia/Krasnoyarsk">Asia/Krasnoyarsk (Красноярск)</option>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Создание на клиенте (t0) <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.createdAtClient"
                type="datetime-local" 
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Начало приема заявок (ti10) <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.startApplicationsAt"
                type="datetime-local" 
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Окончание приема заявок (ti20) <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.endApplicationsAt"
                type="datetime-local" 
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Начало оформления договоров (ti30) <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.startContractsAt"
                type="datetime-local" 
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Начало мероприятия (ti40) <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.startAt"
                type="datetime-local" 
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Окончание мероприятия (ti50) <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.endAt"
                type="datetime-local" 
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>
          </div>

          <div class="flex gap-4">
            <button
              type="submit"
              :disabled="isSubmitting || !apiKey"
              class="flex-1 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Отправка...' : (formData.id ? 'Обновить черновик' : 'Создать черновик') }}
            </button>
          </div>
        </form>
      </div>

      <!-- Форма публикации -->
      <div v-if="lastEventId && apiKey" class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">Публикация черновика</h2>
        
        <form @submit.prevent="publishEvent" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              ID мероприятия <span class="text-red-400">*</span>
            </label>
            <input 
              v-model="publishForm.id"
              type="text" 
              required
              :placeholder="lastEventId"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
            >
          </div>

          <button
            type="submit"
            :disabled="isPublishing"
            class="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isPublishing ? 'Публикация...' : 'Опубликовать мероприятие' }}
          </button>
        </form>
      </div>

      <!-- Результаты -->
      <div v-if="response" class="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 class="text-2xl font-semibold mb-4">Ответ сервера</h2>
        <pre class="bg-black/30 rounded-xl p-4 text-sm overflow-auto max-h-96">{{ JSON.stringify(response, null, 2) }}</pre>
      </div>

      <!-- Ошибки -->
      <div v-if="error" class="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 mt-6">
        <h2 class="text-xl font-semibold mb-4 text-red-400">Ошибки валидации</h2>
        <ul class="space-y-2">
          <li v-for="(errorMessage, index) in formattedErrors" :key="index" class="text-red-300 text-sm">
            {{ errorMessage }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const apiKey = ref<string>('')
const registerForm = ref({
  producerCode: 'PROD001',
  clientName: ''
})
const isRegistering = ref(false)

const formData = ref({
  id: '',
  title: 'Кулинарный интенсив',
  authorName: 'Шеф Иванов',
  location: 'Москва, ул. Поварская, 12',
  seatLimit: 12,
  pricePerSeat: 7500,
  description: 'Погружаемся в гастрономию с шефом Ивановым',
  timezone: 'Europe/Moscow',
  producerName: 'прод1',
  createdAtClient: '',
  startApplicationsAt: '',
  endApplicationsAt: '',
  startContractsAt: '',
  startAt: '',
  endAt: ''
})

const publishForm = ref({
  id: ''
})

const lastEventId = ref('')
const response = ref<any>(null)
const error = ref<any>(null)
const isSubmitting = ref(false)
const isPublishing = ref(false)

// Форматирование ошибок для отображения
const formattedErrors = computed(() => {
  if (!error.value) return []
  
  // Если есть массив errors, извлекаем сообщения
  if (error.value.errors && Array.isArray(error.value.errors)) {
    return error.value.errors.map((err: any) => err.message || err)
  }
  
  // Если есть простое сообщение
  if (error.value.message) {
    return [error.value.message]
  }
  
  // Если это строка
  if (typeof error.value === 'string') {
    return [error.value]
  }
  
  // В остальных случаях возвращаем общее сообщение
  return ['Произошла ошибка при обработке запроса']
})

// Установка значений по умолчанию для дат
onMounted(() => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const twoWeeks = new Date(now)
  twoWeeks.setDate(twoWeeks.getDate() + 14)

  const formatLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  formData.value.createdAtClient = formatLocal(now)
  formData.value.startApplicationsAt = formatLocal(tomorrow)
  formData.value.endApplicationsAt = formatLocal(nextWeek)
  formData.value.startContractsAt = formatLocal(nextWeek)
  formData.value.startAt = formatLocal(twoWeeks)
  formData.value.endAt = formatLocal(twoWeeks)
})

// Преобразование локальной даты в ISO строку с учетом timezone
const toISOString = (localDateTime: string, timezone: string): string => {
  if (!localDateTime) return ''
  
  // Создаем дату из локального формата (YYYY-MM-DDTHH:mm)
  const [datePart, timePart] = localDateTime.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  
  // Создаем строку в формате ISO с указанием timezone
  // Используем временную зону для создания правильной даты
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
  
  // Для упрощения используем локальное время и добавляем смещение
  // В реальном приложении нужно использовать библиотеку для работы с timezone
  const date = new Date(dateStr)
  return date.toISOString()
}

const registerClient = async () => {
  isRegistering.value = true
  error.value = null
  response.value = null

  try {
    const res = await fetch('/api/external/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerForm.value)
    })

    const data = await res.json()
    
    if (res.ok && data.success) {
      apiKey.value = data.data.apiKey
      response.value = data
    } else {
      error.value = data
    }
  } catch (err: any) {
    error.value = { message: err.message || 'Неизвестная ошибка' }
  } finally {
    isRegistering.value = false
  }
}

const submitEvent = async () => {
  if (!apiKey.value) {
    error.value = { message: 'Сначала получите API ключ через форму регистрации' }
    return
  }

  isSubmitting.value = true
  error.value = null
  response.value = null

  try {
    // Преобразуем даты в ISO формат
    const payload = {
      ...formData.value,
      id: formData.value.id || undefined,
      createdAtClient: toISOString(formData.value.createdAtClient, formData.value.timezone),
      startApplicationsAt: toISOString(formData.value.startApplicationsAt, formData.value.timezone),
      endApplicationsAt: toISOString(formData.value.endApplicationsAt, formData.value.timezone),
      startContractsAt: toISOString(formData.value.startContractsAt, formData.value.timezone),
      startAt: toISOString(formData.value.startAt, formData.value.timezone),
      endAt: toISOString(formData.value.endAt, formData.value.timezone)
    }

    const res = await fetch('/api/external/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.value}`
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    
    if (res.ok && data.success) {
      response.value = data
      lastEventId.value = data.data.id
      publishForm.value.id = data.data.id
    } else {
      error.value = data
    }
  } catch (err: any) {
    error.value = { message: err.message || 'Неизвестная ошибка' }
  } finally {
    isSubmitting.value = false
  }
}

const publishEvent = async () => {
  if (!apiKey.value) {
    error.value = { message: 'Сначала получите API ключ через форму регистрации' }
    return
  }

  isPublishing.value = true
  error.value = null
  response.value = null

  try {
    const res = await fetch('/api/external/events/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.value}`
      },
      body: JSON.stringify(publishForm.value)
    })

    const data = await res.json()
    
    if (res.ok && data.success) {
      response.value = data
    } else {
      error.value = data
    }
  } catch (err: any) {
    error.value = { message: err.message || 'Неизвестная ошибка' }
  } finally {
    isPublishing.value = false
  }
}
</script>

<style scoped>
/* Стили для выпадающего списка часовых поясов */
select {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* Кастомная стрелка для select */
select.select-arrow {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

/* Стили для опций - применяются в большинстве современных браузеров */
select option {
  background-color: #1A1F2E !important;
  color: #ffffff !important;
  padding: 0.75rem 1rem !important;
}

/* Выделенная опция */
select option:checked,
select option:focus {
  background-color: #007AFF !important;
  color: #ffffff !important;
}

/* При наведении (для браузеров, которые это поддерживают) */
select option:hover {
  background-color: rgba(0, 122, 255, 0.3) !important;
}

/* Для Firefox */
@-moz-document url-prefix() {
  select option {
    background-color: #1A1F2E !important;
    color: #ffffff !important;
  }
}
</style>

<style>
/* Глобальные стили для выпадающего списка (для системных стилей браузера) */
select option {
  background-color: #1A1F2E !important;
  color: #ffffff !important;
}
</style>

