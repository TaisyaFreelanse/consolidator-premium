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
  login: '',
  password: ''
})

// Форма регистрации
const registerForm = ref({
  name: '',
  password: '',
  passwordConfirm: ''
})

// Показать/скрыть пароль
const showPassword = ref(true)
const showPasswordConfirm = ref(true)

// Сообщение об ошибке/успехе
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Обработка входа
const handleLogin = () => {
  message.value = null
  
  if (!loginForm.value.login || !loginForm.value.password) {
    message.value = { type: 'error', text: 'Заполните все поля' }
    return
  }

  const result = auth.login(loginForm.value.login, loginForm.value.password)
  
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
    }, 5000) // 5 секунд, чтобы запомнить/записать код
  } else {
    message.value = { type: 'error', text: result.message }
  }
}

// Сброс форм
const resetForms = () => {
  loginForm.value = { login: '', password: '' }
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
                {{ mode === 'login' ? 'Введите логин и пароль' : 'Создайте новый аккаунт' }}
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
                  <p class="text-sm whitespace-pre-line">{{ message.text }}</p>
                </div>
              </div>
            </Transition>

            <!-- Форма входа -->
            <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Логин</label>
                <input 
                  v-model="loginForm.login"
                  type="text"
                  placeholder="Введите ваш логин"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Пароль</label>
                <div class="relative">
                  <input 
                    v-model="loginForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Введите пароль"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                  >
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white/70 transition-colors"
                  >
                    <svg v-if="showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
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
                <label class="block text-sm font-medium text-white/80 mb-2">Логин / Email</label>
                <input 
                  v-model="registerForm.name"
                  type="text"
                  placeholder="Придумайте логин или введите email"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Пароль</label>
                <div class="relative">
                  <input 
                    v-model="registerForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Минимум 4 символа"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                  >
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white/70 transition-colors"
                  >
                    <svg v-if="showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Подтвердите пароль</label>
                <div class="relative">
                  <input 
                    v-model="registerForm.passwordConfirm"
                    :type="showPasswordConfirm ? 'text' : 'password'"
                    placeholder="Повторите пароль"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                  >
                  <button
                    type="button"
                    @click="showPasswordConfirm = !showPasswordConfirm"
                    class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white/70 transition-colors"
                  >
                    <svg v-if="showPasswordConfirm" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p class="text-blue-400 text-sm">
                  <svg class="w-5 h-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  После регистрации вам будет присвоен уникальный анонимный код для участия в мероприятиях
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

