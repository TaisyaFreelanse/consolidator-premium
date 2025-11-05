<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const mobileMenuOpen = ref(false)
const auth = useAuthStore()

const emit = defineEmits<{
  openAuth: []
  menuToggle: [state: boolean]
}>()

// Отслеживание изменения состояния меню
const toggleMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  emit('menuToggle', mobileMenuOpen.value)
}

// Закрытие меню при переходе по ссылке
const closeMenu = () => {
  if (mobileMenuOpen.value) {
    mobileMenuOpen.value = false
    emit('menuToggle', false)
  }
}

onMounted(() => {
  auth.loadUsers()
})

const navigation = [
  { name: 'Каталог', href: '/catalog', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { name: 'Избранное', href: '/favorites', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { name: 'Мониторинг', href: '/monitoring', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
]

const isActive = (href: string) => {
  return route.path === href || route.path.startsWith(href)
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/10">
    <nav class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- Логотип -->
        <NuxtLink to="/catalog" class="flex items-center gap-3 group">
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div class="relative w-12 h-12 bg-gradient-to-br from-[#007AFF] to-[#5E5CE6] rounded-xl flex items-center justify-center">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
          </div>
          <div>
            <h1 class="text-xl font-bold text-white tracking-tight" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
              Консолидатор
            </h1>
            <p class="text-xs text-white/60">Краудфандинг мероприятий</p>
          </div>
        </NuxtLink>

        <!-- Десктоп навигация - только Гамбургер меню -->
        <button
          @click="toggleMenu"
          class="hidden md:flex items-center gap-2 text-white/70 hover:text-white px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          <span class="text-sm font-medium">Меню</span>
        </button>

        <div class="hidden md:flex items-center gap-3">
          <!-- Кнопка создания мероприятия -->
          <NuxtLink to="/create-event" class="flex items-center gap-2 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#007AFF]/30 transition-all duration-300 hover:scale-105">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Создать мероприятие
          </NuxtLink>

          <!-- Иконка пользователя / Гостя -->
          <button 
            v-if="!auth.isAuthenticated"
            @click="$emit('openAuth')"
            class="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div class="relative">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF]/30 to-[#5E5CE6]/30 flex items-center justify-center border border-white/20">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-500 rounded-full border-2 border-[#0A0F1E]" title="Гость"></div>
            </div>
            <span class="text-sm text-white/70 group-hover:text-white transition-colors">Гость</span>
          </button>

          <!-- Залогиненный пользователь -->
          <div 
            v-else
            class="flex items-center gap-2 bg-gradient-to-r from-[#007AFF]/10 to-[#5E5CE6]/10 border border-[#007AFF]/30 px-4 py-2.5 rounded-xl"
          >
            <div class="relative">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5E5CE6] flex items-center justify-center border border-white/20">
                <span class="text-white text-xs font-bold">{{ auth.currentUser?.name?.slice(0, 2).toUpperCase() || 'US' }}</span>
              </div>
              <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A0F1E]" title="Авторизован"></div>
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-white/90 font-semibold">{{ auth.currentUser?.name }} · {{ auth.currentUser?.code }}</span>
              <button 
                @click="auth.logout()"
                class="text-xs text-white/50 hover:text-red-400 transition-colors text-left"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>

        <!-- Мобильное меню кнопка -->
        <button
          @click="toggleMenu"
          class="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Десктопное выпадающее меню -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div v-if="mobileMenuOpen" class="hidden md:block mt-4 pt-4 border-t border-white/10">
          <div class="flex flex-col gap-2">
            <NuxtLink
              v-for="item in navigation"
              :key="item.name"
              :to="item.href"
              @click="closeMenu"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300',
                isActive(item.href)
                  ? 'bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"/>
              </svg>
              {{ item.name }}
            </NuxtLink>
          </div>
        </div>
      </Transition>

      <!-- Мобильное меню -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div v-if="mobileMenuOpen" class="md:hidden mt-4 pt-4 border-t border-white/10">
          <div class="flex flex-col gap-2">
            <NuxtLink
              v-for="item in navigation"
              :key="item.name"
              :to="item.href"
              @click="closeMenu"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300',
                isActive(item.href)
                  ? 'bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"/>
              </svg>
              {{ item.name }}
            </NuxtLink>
            
            <!-- Создание мероприятия -->
            <NuxtLink to="/create-event" @click="closeMenu" class="flex items-center justify-center gap-2 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white px-4 py-3 rounded-xl font-semibold text-sm mt-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Создать мероприятие
            </NuxtLink>

            <!-- Пользователь (мобильная версия) -->
            <button 
              v-if="!auth.isAuthenticated"
              @click="() => { $emit('openAuth'); closeMenu(); }" 
              class="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-xl mt-2 hover:bg-white/10 transition-all w-full"
            >
              <div class="relative">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF]/30 to-[#5E5CE6]/30 flex items-center justify-center border border-white/20">
                  <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-500 rounded-full border-2 border-[#0A0F1E]"></div>
              </div>
              <div class="text-left">
                <div class="text-white font-medium">Гость</div>
                <div class="text-white/50 text-xs">Войти в кабинет</div>
              </div>
            </button>

            <!-- Залогиненный пользователь (мобильная версия) -->
            <div 
              v-else
              class="flex items-center justify-between gap-3 bg-gradient-to-r from-[#007AFF]/10 to-[#5E5CE6]/10 border border-[#007AFF]/30 px-4 py-3 rounded-xl mt-2"
            >
              <div class="flex items-center gap-3">
                <div class="relative">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5E5CE6] flex items-center justify-center border border-white/20">
                    <span class="text-white text-sm font-bold">{{ auth.currentUser?.name?.slice(0, 2).toUpperCase() || 'US' }}</span>
                  </div>
                  <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A0F1E]"></div>
                </div>
                <div class="text-left">
                  <div class="text-white font-medium">{{ auth.currentUser?.name }}</div>
                  <div class="text-white/70 text-xs font-mono">{{ auth.currentUser?.code }}</div>
                </div>
              </div>
              <button 
                @click="() => { auth.logout(); closeMenu(); }"
                class="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-all"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </nav>
  </header>

  <!-- Отступ для фиксированного хедера -->
  <div class="h-20"></div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
</style>

