<template>
  <div class="relative">
    <button
      @click="menuOpen = !menuOpen"
      class="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
      title="Меню"
    >
      ⋮
    </button>
    <div
      v-if="menuOpen"
      @click.outside="menuOpen = false"
      class="absolute right-0 mt-2 w-64 bg-[#0f1428] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20"
    >
      <NuxtLink
        to="/demo/select"
        class="block px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors"
        @click="menuOpen = false"
        :class="{ 'bg-white/10 font-semibold': $route.path === '/demo/select' }"
      >
        📋 Выбрать
      </NuxtLink>
      <NuxtLink
        to="/demo/external-upload"
        class="block px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors"
        @click="menuOpen = false"
        :class="{ 'bg-white/10 font-semibold': $route.path === '/demo/external-upload' }"
      >
        ✏️ Редактировать / Создать
      </NuxtLink>
      <NuxtLink
        to="/demo/platform-interaction"
        class="block px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors"
        @click="menuOpen = false"
        :class="{ 'bg-white/10 font-semibold': $route.path === '/demo/platform-interaction' }"
      >
        🔗 Взаимодействовать с платформой
      </NuxtLink>
      <NuxtLink
        to="/demo/api-register"
        class="block px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors"
        @click="menuOpen = false"
        :class="{ 'bg-white/10 font-semibold': $route.path === '/demo/api-register' }"
      >
        🔑 Получить API-ключ
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const menuOpen = ref(false)
</script>

