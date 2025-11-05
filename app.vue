<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useEventsStore } from '~/stores/events'
import { useFavoritesStore } from '~/stores/favorites'
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
  // Миграция происходит автоматически в utils/migrateLocalStorage.ts
  // Даём ей время завершиться
  await new Promise(resolve => setTimeout(resolve, 150))
  
  const auth = useAuthStore()
  const events = useEventsStore()
  const favorites = useFavoritesStore()
  
  // Загружаем пользователей (включая продюсеров)
  auth.loadUsers()
  
  // Загружаем события (включая кастомные из localStorage)
  events.fetch()
  
  // Загружаем избранное
  favorites.load()
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
