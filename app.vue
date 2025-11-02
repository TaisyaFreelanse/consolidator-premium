<script setup lang="ts">
import { ref } from 'vue'

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
