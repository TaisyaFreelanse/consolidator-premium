<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navigation = [
  { 
    name: 'Авторы', 
    href: '/authors', 
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' 
  },
  { 
    name: 'Избранное', 
    href: '/favorites', 
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    iconFilled: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'
  },
  { 
    name: 'Каталог', 
    href: '/catalog', 
    icon: 'M4 6h16M4 12h16M4 18h16' 
  }
]

const isActive = (href: string) => {
  return route.path === href || route.path.startsWith(href + '/')
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-t border-white/10">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-around py-3">
        <!-- Навигационные ссылки с эффектом "светится для выделения" -->
        <NuxtLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            'relative flex flex-col items-center justify-center gap-1.5 py-3 px-6 rounded-2xl transition-all duration-300 min-w-[100px]',
            isActive(item.href)
              ? 'text-white scale-105'
              : 'text-white/50 hover:text-white/80 hover:scale-102'
          ]"
        >
          <!-- Светящийся фон для активного элемента (эффект "светится для выделения") -->
          <div 
            v-if="isActive(item.href)"
            class="absolute inset-0 bg-gradient-to-r from-[#007AFF]/30 to-[#5E5CE6]/30 rounded-2xl blur-sm animate-pulse-subtle"
          ></div>
          
          <!-- Дополнительное внешнее свечение для выделения -->
          <div 
            v-if="isActive(item.href)"
            class="absolute inset-0 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] rounded-2xl opacity-20 scale-110 blur-xl animate-glow"
          ></div>

          <!-- Icon with enhanced active state -->
          <div 
            :class="[
              'relative transition-all duration-300 z-10',
              isActive(item.href) ? 'scale-110' : 'scale-100'
            ]"
          >
            <!-- Яркое свечение вокруг иконки активного элемента -->
            <div 
              v-if="isActive(item.href)"
              class="absolute inset-0 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] rounded-full blur-md opacity-60 scale-150 animate-pulse-slow"
            ></div>
            
            <!-- Icon SVG -->
            <svg 
              class="w-7 h-7 relative z-10" 
              :fill="isActive(item.href) && item.name === 'Избранное' ? 'currentColor' : 'none'" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              :stroke-width="isActive(item.href) ? 2.5 : 2"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                :d="isActive(item.href) && item.iconFilled ? item.iconFilled : item.icon"
              />
            </svg>
          </div>

          <!-- Label -->
          <span 
            :class="[
              'text-xs transition-all duration-300 z-10 relative',
              isActive(item.href) ? 'font-bold text-shadow-glow' : 'font-medium'
            ]"
          >
            {{ item.name }}
          </span>

          <!-- Подчеркивание для активного элемента -->
          <div 
            v-if="isActive(item.href)"
            class="absolute bottom-1 w-12 h-0.5 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] rounded-full shadow-lg shadow-[#007AFF]/50"
          ></div>
        </NuxtLink>
      </div>
    </div>

    <!-- Safe area for iOS devices -->
    <div class="h-safe-area-inset-bottom bg-black/60"></div>
  </nav>
</template>

<style scoped>
/* Safe area for iOS devices */
.h-safe-area-inset-bottom {
  height: env(safe-area-inset-bottom);
}

@supports (padding: max(0px)) {
  nav {
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}

/* Анимация свечения для выделения активного элемента */
@keyframes glow {
  0%, 100% {
    opacity: 0.2;
    transform: scale(1.1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.15);
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes pulse-subtle {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

.animate-pulse-subtle {
  animation: pulse-subtle 4s ease-in-out infinite;
}

.text-shadow-glow {
  text-shadow: 0 0 10px rgba(0, 122, 255, 0.5);
}

.scale-102 {
  transform: scale(1.02);
}
</style>

