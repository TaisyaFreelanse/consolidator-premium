<template>
  <nav class="bg-white/5 border-b border-white/10 mb-4 rounded-xl overflow-hidden" aria-label="Основная навигация демо-страниц">
    <div class="flex items-center justify-around flex-wrap">
      <NuxtLink
        to="/demo/select"
        class="flex-1 px-2 py-3 text-center text-xs text-white/80 hover:bg-white/10 transition-colors border-r border-white/10 last:border-r-0"
        :class="{ 'bg-white/10 font-semibold text-white border-b-2 border-[#007AFF]': $route.path === '/demo/select' }"
        aria-label="Выбрать файлы"
      >
        <span class="hidden md:inline">📋 Выбрать ивент</span>
        <span class="md:hidden">📋</span>
      </NuxtLink>
      <NuxtLink
        to="/demo/external-upload"
        class="flex-1 px-2 py-3 text-center text-xs text-white/80 hover:bg-white/10 transition-colors border-r border-white/10 last:border-r-0"
        :class="{ 'bg-white/10 font-semibold text-white border-b-2 border-[#007AFF]': $route.path === '/demo/external-upload' }"
        aria-label="Редактировать или создать файл"
      >
        <span class="hidden md:inline">✏️ Редакт/Созд</span>
        <span class="md:hidden">✏️</span>
      </NuxtLink>
      <NuxtLink
        to="/demo/platform-interaction"
        class="flex-1 px-2 py-3 text-center text-xs text-white/80 hover:bg-white/10 transition-colors border-r border-white/10 last:border-r-0"
        :class="{ 'bg-white/10 font-semibold text-white border-b-2 border-[#007AFF]': $route.path === '/demo/platform-interaction' }"
        aria-label="Загрузить на платформу"
      >
        <span class="hidden md:inline">🔗 Загрузить на платформу</span>
        <span class="md:hidden">🔗</span>
      </NuxtLink>
      <NuxtLink
        to="/demo/api-register"
        class="flex-1 px-2 py-3 text-center text-xs text-white/80 hover:bg-white/10 transition-colors border-r border-white/10 last:border-r-0"
        :class="{ 'bg-white/10 font-semibold text-white border-b-2 border-[#007AFF]': $route.path === '/demo/api-register' }"
        aria-label="Регистрация API-ключа"
      >
        <span class="hidden md:inline">🔑 API-ключ</span>
        <span class="md:hidden">🔑</span>
      </NuxtLink>
      <NuxtLink
        to="/demo/platform-report"
        class="flex-1 px-2 py-3 text-center text-xs text-white/80 hover:bg-white/10 transition-colors border-r border-white/10 last:border-r-0"
        :class="{ 'bg-white/10 font-semibold text-white border-b-2 border-[#007AFF]': $route.path === '/demo/platform-report' }"
        aria-label="Отчет платформы"
      >
        <span class="hidden md:inline">📊 Отчет платформы</span>
        <span class="md:hidden">📊</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
// Главное меню навигации - постоянно видимое на всех страницах
</script>

