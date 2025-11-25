<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <div class="text-6xl font-bold text-red-400 mb-4">
          {{ error.statusCode || 500 }}
        </div>
        <h1 class="text-2xl font-bold mb-2">
          {{ getErrorTitle() }}
        </h1>
        <p class="text-white/70">
          {{ getErrorMessage() }}
        </p>
      </div>
      
      <div class="space-y-4">
        <button 
          @click="handleError"
          class="w-full bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
        >
          {{ getActionText() }}
        </button>
        
        <NuxtLink 
          to="/"
          class="block w-full bg-white/10 text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/20 transition-colors"
        >
          На главную
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ErrorProps {
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
}

const props = defineProps<ErrorProps>()

const getErrorTitle = () => {
  const code = props.error.statusCode
  switch (code) {
    case 401:
      return 'Требуется авторизация'
    case 403:
      return 'Доступ запрещен'
    case 404:
      return 'Страница не найдена'
    case 500:
      return 'Ошибка сервера'
    default:
      return 'Произошла ошибка'
  }
}

const getErrorMessage = () => {
  const code = props.error.statusCode
  const message = props.error.statusMessage || props.error.message
  
  if (message && message !== getErrorTitle()) {
    return message
  }
  
  switch (code) {
    case 401:
      return 'Для доступа к этой странице необходимо войти в систему'
    case 403:
      return 'У вас недостаточно прав для просмотра этой страницы'
    case 404:
      return 'Запрашиваемая страница не существует или была перемещена'
    case 500:
      return 'На сервере произошла внутренняя ошибка. Попробуйте позже'
    default:
      return 'Что-то пошло не так. Попробуйте обновить страницу'
  }
}

const getActionText = () => {
  const code = props.error.statusCode
  switch (code) {
    case 401:
      return 'Войти в систему'
    case 403:
      return 'Войти в систему'
    default:
      return 'Обновить страницу'
  }
}

const handleError = () => {
  const code = props.error.statusCode
  
  if (code === 401 || code === 403) {
    // Перенаправляем на главную для авторизации
    navigateTo('/')
  } else {
    // Обновляем страницу
    window.location.reload()
  }
}

// Устанавливаем правильный статус код для SEO
useHead({
  title: `Ошибка ${props.error.statusCode || 500}`,
})
</script>
