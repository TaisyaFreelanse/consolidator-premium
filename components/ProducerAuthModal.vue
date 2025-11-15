<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  authorized: [producerName: string]
}>()

const auth = useAuthStore()
const producerLogin = ref('')
const producerPassword = ref('')
const showPassword = ref(false)
const errorMessage = ref('')

// Проверка доступа продюсера
const checkProducerAccess = () => {
  errorMessage.value = ''
  
  if (!producerLogin.value || !producerPassword.value) {
    errorMessage.value = 'Заполните все поля'
    return
  }
  
  // Ищем продюсера в списке пользователей
  const producer = auth.users.find(
    u => u.name === producerLogin.value && u.role === 'producer'
  )
  
  if (!producer) {
    errorMessage.value = 'Продюсер с таким логином не найден'
    return
  }
  
  if (producer.password !== producerPassword.value) {
    errorMessage.value = 'Неверный пароль'
    return
  }
  
  // Доступ подтвержден
  emit('authorized', producer.name)
  resetForm()
}

// Сброс формы
const resetForm = () => {
  producerLogin.value = ''
  producerPassword.value = ''
  errorMessage.value = ''
  showPassword.value = false
}

// Закрытие модального окна
const closeModal = () => {
  emit('close')
  setTimeout(resetForm, 300)
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
          class="relative w-full max-w-[520px] bg-gradient-to-br from-[#1A1F3E] to-[#0A0F1E] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Декоративный фон -->
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute top-0 right-0 w-64 h-64 bg-[#ff9500]/10 rounded-full blur-3xl"></div>
            <div class="absolute bottom-0 left-0 w-64 h-64 bg-[#ff6b00]/10 rounded-full blur-3xl"></div>
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
              <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#ff9500] to-[#ff6b00] rounded-2xl flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-white mb-2">
                Доступ для продюсеров
              </h2>
              <p class="text-white/60 text-sm">
                Создавать мероприятия могут только продюсеры
              </p>
            </div>

            <!-- Сообщение об ошибке -->
            <Transition
              enter-active-class="transition-all duration-300"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div 
                v-if="errorMessage" 
                class="mb-4 p-4 rounded-xl border bg-red-500/10 border-red-500/30 text-red-400"
              >
                <div class="flex items-start gap-2">
                  <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm">{{ errorMessage }}</p>
                </div>
              </div>
            </Transition>

            <!-- Форма -->
            <form @submit.prevent="checkProducerAccess" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Логин продюсера</label>
                <input 
                  v-model="producerLogin"
                  type="text"
                  placeholder="прод1 или прод2"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#ff9500] focus:ring-2 focus:ring-[#ff9500]/20 outline-none transition-all"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Пароль</label>
                <div class="relative">
                  <input 
                    v-model="producerPassword"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Введите пароль"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:border-[#ff9500] focus:ring-2 focus:ring-[#ff9500]/20 outline-none transition-all"
                  >
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white/70 transition-colors"
                  >
                    <svg v-if="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p class="text-blue-400 text-sm">
                  <svg class="w-5 h-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Для тестирования доступны 2 продюсера: <br>
                  <strong>прод1</strong> / <strong>прод2</strong>
                </p>
              </div>

              <button 
                type="submit"
                class="w-full bg-gradient-to-r from-[#ff9500] to-[#ff6b00] text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#ff9500]/30 transition-all duration-300 hover:scale-105"
              >
                Войти как продюсер
              </button>
            </form>

            <!-- Отмена -->
            <div class="mt-6 text-center">
              <button 
                @click="closeModal"
                class="text-white/60 hover:text-white text-sm transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
</style>


