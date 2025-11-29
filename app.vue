<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useEventsStore } from '~/stores/events'
import '~/utils/debugLocalStorage'
import '~/utils/migrateLocalStorage'

const isAuthModalOpen = ref(false)
const isMenuOpen = ref(false)

const openAuthModal = () => {
  isAuthModalOpen.value = true
}

const closeAuthModal = () => {
  isAuthModalOpen.value = false
}

const handleMenuToggle = (state: boolean) => {
  isMenuOpen.value = state
}

// Инициализация stores при загрузке приложения
onMounted(async () => {
  const auth = useAuthStore()
  const events = useEventsStore()
  
  // Загружаем пользователей СИНХРОННО
  // Это должно быть первым, чтобы currentUser был восстановлен до загрузки других данных
  auth.loadUsers()
  
  // Миграция происходит автоматически в utils/migrateLocalStorage.ts
  // Даём ей время завершиться
  await new Promise(resolve => setTimeout(resolve, 150))
  
  // Загружаем события (включая кастомные из localStorage)
  events.fetch()
})
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Новая навигация -->
    <Header 
      @open-auth="openAuthModal" 
      @menu-toggle="handleMenuToggle"
    />

    <!-- Контент -->
    <main>
      <NuxtPage />
    </main>

    <!-- Нижнее меню (скрывается когда открыто гамбургер-меню) -->
    <FooterNav :class="{ 'hidden': isMenuOpen }" />

    <!-- Модальное окно авторизации -->
    <AuthModal :is-open="isAuthModalOpen" @close="closeAuthModal" />
  </div>
</template>
