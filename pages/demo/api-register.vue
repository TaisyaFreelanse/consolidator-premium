<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white">
    <div class="container mx-auto px-4 py-8 max-w-[800px]">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold mb-1 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] bg-clip-text text-transparent">
              Получить API-ключ
            </h1>
            <p class="text-white/60 text-sm">Зарегистрируйтесь и получите уникальный API ключ для работы с внешним API</p>
          </div>
          <!-- Навигация -->
          <DemoNavigation />
        </div>
      </div>

      <!-- Форма регистрации -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">Регистрация и получение API ключа</h2>
        <p class="text-white/60 text-sm mb-4">
          Зарегистрируйтесь и получите уникальный API ключ для работы с API. Producer Name будет автоматически привязан к вашему ключу.
        </p>
        
        <form @submit.prevent="register" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Producer Name <span class="text-red-400">*</span>
            </label>
            <input 
              v-model="registerForm.producerCode"
              type="text" 
              required
              placeholder="прод1"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
            >
            <p class="text-xs text-white/50 mt-1">Отображаемое имя продюсера (будет привязано к API ключу)</p>
          </div>

          <button
            type="submit"
            :disabled="isRegistering"
            class="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isRegistering ? 'Регистрация...' : 'Зарегистрироваться и получить API ключ' }}
          </button>
        </form>

        <!-- Сообщение о прогрессе регистрации -->
        <div v-if="registerProgressMessage && isRegistering" class="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-blue-300 text-sm">{{ registerProgressMessage }}</p>
          </div>
        </div>

        <div v-if="registerResponse" class="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <p class="text-green-300 text-sm font-medium mb-2">Регистрация успешна!</p>
          <p class="text-green-200/70 text-xs mb-2">Ваш API ключ (сохранен автоматически):</p>
          <pre class="text-green-200 text-xs font-mono break-all bg-black/30 p-2 rounded mb-4">{{ registerResponse.data?.apiKey || registerResponse.apiKey }}</pre>
          
          <NuxtLink
            to="/demo/external-upload"
            class="inline-block w-full bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity text-center"
          >
            Перейти к созданию событий
          </NuxtLink>
        </div>

        <div v-if="registerError" class="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <p class="text-red-300 text-sm font-medium mb-2">Ошибка регистрации</p>
          <ul class="space-y-1">
            <li v-for="(errorMessage, index) in formattedRegisterErrors" :key="index" class="text-red-300 text-xs">
              {{ errorMessage }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl

// Форма регистрации
const registerForm = ref({
  producerCode: '' // Внутренне используем producerCode для соответствия API
})

const isRegistering = ref(false)
const registerResponse = ref<any>(null)
const registerError = ref<any>(null)
const registerProgressMessage = ref<string>('')
const registerStartTime = ref<number | null>(null)
let registerProgressInterval: NodeJS.Timeout | null = null

const formattedRegisterErrors = computed(() => {
  if (!registerError.value) return []
  
  if (registerError.value.errors && Array.isArray(registerError.value.errors)) {
    return registerError.value.errors.map((err: any) => err.message || err)
  }
  
  if (registerError.value.message) {
    return [registerError.value.message]
  }
  
  if (typeof registerError.value === 'string') {
    return [registerError.value]
  }
  
  return ['Произошла ошибка при регистрации']
})

// Сохранение API ключа
const saveApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('external_api_key', key)
  }
}

const register = async () => {
  isRegistering.value = true
  registerError.value = null
  registerResponse.value = null
  registerProgressMessage.value = 'Начало регистрации...'
  registerStartTime.value = Date.now()

  // Очищаем предыдущий интервал, если он есть
  if (registerProgressInterval) {
    clearInterval(registerProgressInterval)
    registerProgressInterval = null
  }

  // Функция для обновления сообщения о прогрессе
  const updateProgressMessage = () => {
    if (registerStartTime.value) {
      const elapsedSeconds = Math.floor((Date.now() - registerStartTime.value) / 1000)
      const minutes = Math.floor(elapsedSeconds / 60)
      const seconds = elapsedSeconds % 60
      
      if (minutes > 0) {
        registerProgressMessage.value = `Регистрация выполняется уже ${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'} ${seconds > 0 ? `и ${seconds} ${seconds === 1 ? 'секунду' : seconds < 5 ? 'секунды' : 'секунд'}` : ''}. Пожалуйста, подождите...`
      } else {
        registerProgressMessage.value = `Регистрация выполняется уже ${elapsedSeconds} ${elapsedSeconds === 1 ? 'секунду' : elapsedSeconds < 5 ? 'секунды' : 'секунд'}. Пожалуйста, подождите...`
      }
    }
  }

  // Обновляем сообщение сразу
  updateProgressMessage()

  // Устанавливаем интервал для обновления сообщения каждые 5 секунд
  registerProgressInterval = setInterval(updateProgressMessage, 5000)

  try {
    const res = await fetch(`${apiBaseUrl}/api/external/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerForm.value)
    })

    const data = await res.json()
    
    if (res.ok && data.success) {
      registerResponse.value = data
      if (data.data?.apiKey) {
        saveApiKey(data.data.apiKey)
      }
      registerProgressMessage.value = 'Регистрация успешно завершена!'
    } else {
      registerError.value = data
      registerProgressMessage.value = ''
    }
  } catch (err: any) {
    registerError.value = { message: err.message || 'Неизвестная ошибка' }
    registerProgressMessage.value = ''
  } finally {
    isRegistering.value = false
    registerStartTime.value = null
    
    // Очищаем интервал
    if (registerProgressInterval) {
      clearInterval(registerProgressInterval)
      registerProgressInterval = null
    }
    
    // Очищаем сообщение через 3 секунды после завершения
    setTimeout(() => {
      registerProgressMessage.value = ''
    }, 3000)
  }
}

// Очистка интервала при размонтировании компонента
onUnmounted(() => {
  if (registerProgressInterval) {
    clearInterval(registerProgressInterval)
    registerProgressInterval = null
  }
})
</script>

