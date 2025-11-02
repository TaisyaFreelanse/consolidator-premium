<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const auth = useAuthStore()

// Режим: 'login' или 'register'
const mode = ref<'login' | 'register'>('login')

// Форма входа
const loginForm = ref({
  code: '',
  password: ''
})

// Форма регистрации
const registerForm = ref({
  name: '',
  password: '',
  passwordConfirm: ''
})

// Сообщение об ошибке/успехе
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Обработка входа
const handleLogin = () => {
  message.value = null
  
  if (!loginForm.value.code || !loginForm.value.password) {
    message.value = { type: 'error', text: 'Заполните все поля' }
    return
  }

  const result = auth.login(loginForm.value.code, loginForm.value.password)
  
  if (result.success) {
    message.value = { type: 'success', text: result.message }
    setTimeout(() => {
      emit('close')
      resetForms()
    }, 1500)
  } else {
    message.value = { type: 'error', text: result.message }
  }
}

// Обработка регистрации
const handleRegister = () => {
  message.value = null
  
  if (!registerForm.value.name || !registerForm.value.password || !registerForm.value.passwordConfirm) {
    message.value = { type: 'error', text: 'Заполните все поля' }
    return
  }

  if (registerForm.value.password !== registerForm.value.passwordConfirm) {
    message.value = { type: 'error', text: 'Пароли не совпадают' }
    return
  }

  const result = auth.register(registerForm.value.name, registerForm.value.password)
  
  if (result.success) {
    message.value = { type: 'success', text: result.message }
    setTimeout(() => {
      emit('close')
      resetForms()
    }, 3000) // Больше времени, чтобы запомнить код
  } else {
    message.value = { type: 'error', text: result.message }
  }
}

// Сброс форм
const resetForms = () => {
  loginForm.value = { code: '', password: '' }
  registerForm.value = { name: '', password: '', passwordConfirm: '' }
  message.value = null
}

// Переключение режима
const switchMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  message.value = null
}

// Закрытие модального окна
const closeModal = () => {
  emit('close')
  setTimeout(resetForms, 300)
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="closeModal"
    >
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-4"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-4"
      >
        <div 
          v-if="isOpen"
          class="relative w-full max-w-md bg-gradient-to-br from-[#1A1F3E] to-[#0A0F1E] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Декоративный фон -->
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute top-0 right-0 w-64 h-64 bg-[#007AFF]/10 rounded-full blur-3xl"></div>
            <div class="absolute bottom-0 left-0 w-64 h-64 bg-[#5E5CE6]/10 rounded-full blur-3xl"></div>
          </div>

          <!-- Контент -->
          <div class="relative z-10 p-8">
            <!-- Кнопка закрытия -->
            <button 
              @click="closeModal"
              class="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Заголовок -->
            <div class="mb-8 text-center">
              <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#007AFF] to-[#5E5CE6] rounded-2xl flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-white mb-2">
                {{ mode === 'login' ? 'Вход' : 'Регистрация' }}
              </h2>
              <p class="text-white/60 text-sm">
                {{ mode === 'login' ? 'Введите ваш код и пароль' : 'Создайте новый аккаунт' }}
              </p>
            </div>

            <!-- Сообщение -->
            <Transition
              enter-active-class="transition-all duration-300"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div 
                v-if="message" 
                :class="[
                  'mb-4 p-4 rounded-xl border',
                  message.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                ]"
              >
                <div class="flex items-start gap-2">
                  <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path v-if="message.type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm">{{ message.text }}</p>
                </div>
              </div>
            </Transition>

            <!-- Форма входа -->
            <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Код пользователя</label>
                <input 
                  v-model="loginForm.code"
                  type="text"
                  placeholder="Например: A1B2C3"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all uppercase"
                  maxlength="8"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Пароль</label>
                <input 
                  v-model="loginForm.password"
                  type="password"
                  placeholder="Введите пароль"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                >
              </div>

              <button 
                type="submit"
                class="w-full bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#007AFF]/30 transition-all duration-300 hover:scale-105"
              >
                Войти
              </button>
            </form>

            <!-- Форма регистрации -->
            <form v-else @submit.prevent="handleRegister" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Имя</label>
                <input 
                  v-model="registerForm.name"
                  type="text"
                  placeholder="Введите ваше имя"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Пароль</label>
                <input 
                  v-model="registerForm.password"
                  type="password"
                  placeholder="Минимум 4 символа"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Подтвердите пароль</label>
                <input 
                  v-model="registerForm.passwordConfirm"
                  type="password"
                  placeholder="Повторите пароль"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                >
              </div>

              <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p class="text-blue-400 text-sm">
                  <svg class="w-5 h-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  После регистрации вам будет присвоен уникальный код из 6-8 символов
                </p>
              </div>

              <button 
                type="submit"
                class="w-full bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#007AFF]/30 transition-all duration-300 hover:scale-105"
              >
                Зарегистрироваться
              </button>
            </form>

            <!-- Переключатель режима -->
            <div class="mt-6 text-center">
              <button 
                @click="switchMode"
                class="text-white/60 hover:text-white text-sm transition-colors"
              >
                {{ mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? ' }}
                <span class="text-[#007AFF] font-semibold">
                  {{ mode === 'login' ? 'Зарегистрироваться' : 'Войти' }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
/* Prevent body scroll when modal is open */
</style>

