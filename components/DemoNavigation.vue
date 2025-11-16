<template>
  <nav class="bg-white/5 border-b border-white/10 mb-6 rounded-xl overflow-hidden">
    <div class="flex items-center justify-around">
      <NuxtLink
        to="/demo/select"
        class="flex-1 px-4 py-3 text-center text-sm text-white/80 hover:bg-white/10 transition-colors border-r border-white/10 last:border-r-0"
        :class="{ 'bg-white/10 font-semibold text-white border-b-2 border-[#007AFF]': $route.path === '/demo/select' }"
      >
        📋 Выбрать
      </NuxtLink>
      <NuxtLink
        to="/demo/external-upload"
        class="flex-1 px-4 py-3 text-center text-sm text-white/80 hover:bg-white/10 transition-colors border-r border-white/10 last:border-r-0"
        :class="{ 'bg-white/10 font-semibold text-white border-b-2 border-[#007AFF]': $route.path === '/demo/external-upload' }"
      >
        ✏️ Редактировать / Создать
      </NuxtLink>
      <NuxtLink
        to="/demo/platform-interaction"
        class="flex-1 px-4 py-3 text-center text-sm text-white/80 hover:bg-white/10 transition-colors border-r border-white/10 last:border-r-0"
        :class="{ 'bg-white/10 font-semibold text-white border-b-2 border-[#007AFF]': $route.path === '/demo/platform-interaction' }"
      >
        🔗 Взаимодействовать с платформой
      </NuxtLink>
      <NuxtLink
        to="/demo/api-register"
        class="flex-1 px-4 py-3 text-center text-sm text-white/80 hover:bg-white/10 transition-colors border-r border-white/10 last:border-r-0"
        :class="{ 'bg-white/10 font-semibold text-white border-b-2 border-[#007AFF]': $route.path === '/demo/api-register' }"
      >
        🔑 Получить API-ключ
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
// Главное меню навигации - постоянно видимое на всех страницах
</script>

