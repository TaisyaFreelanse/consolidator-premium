<script setup lang="ts">
import { onMounted, ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventsStore } from '~/stores/events'
import { useFavoritesStore } from '~/stores/favorites'

const router = useRouter()
const events = useEventsStore()
const favorites = useFavoritesStore()
const isHovering = ref<string | null>(null)
const searchQuery = ref('')
const selectedFilter = ref('all')
const selectedCategory = ref<string | null>(null)
const isLoading = ref(true)
const mousePosition = ref({ x: 50, y: 50 })
const mouseRaw = ref({ x: 0, y: 0 })
const parallaxElements = ref<Array<{ id: number; offset: { x: number; y: number } }>>([])
const ripples = ref<Array<{ id: number; x: number; y: number; timestamp: number }>>([])
const scrollY = ref(0)

// Toast для уведомлений
const toastMessage = ref('')
const showToast = ref(false)

const categoryLabels: Record<string, string> = {
  'master-class': 'Мастер-классы',
  'training': 'Тренинги',
  'excursion': 'Экскурсии',
  'gastro-show': 'Гастро-шоу',
  'lecture': 'Лектории',
  'cruise': 'Круизы'
}

// Фильтрация событий
const filteredEvents = computed(() => {
  let result = events.list
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e => 
      e.title.toLowerCase().includes(query) ||
      e.author.toLowerCase().includes(query) ||
      e.location.toLowerCase().includes(query)
    )
  }
  
  if (selectedCategory.value) {
    result = result.filter(e => e.category === selectedCategory.value)
  }
  
  return result
})

// Уникальные категории из событий
const availableCategories = computed(() => {
  const categories = new Set(events.list.map(e => e.category).filter(Boolean))
  return Array.from(categories)
})

// Проверка, находится ли событие в избранном
const isFavorite = (eventId: string) => {
  return favorites.ids.has(eventId)
}

// Переключение избранного
const toggleFavorite = (eventId: string) => {
  favorites.toggle(eventId)
}

// Поделиться ссылкой на мониторинг (кнопка Y справа)
const shareEvent = async (eventId: string, eventTitle: string) => {
  if (!process.client) return
  
  const url = `${window.location.origin}/monitoring?event=${eventId}`
  
  try {
    // Попытка использовать Web Share API
    if (navigator.share) {
      await navigator.share({
        title: eventTitle,
        text: `Посмотрите мониторинг этого мероприятия`,
        url: url
      })
    } else {
      // Копирование в буфер обмена
      await navigator.clipboard.writeText(url)
      toastMessage.value = 'Ссылка скопирована!'
      showToast.value = true
    }
  } catch (err) {
    console.error('Share failed:', err)
    // Fallback: копирование в буфер
    try {
      await navigator.clipboard.writeText(url)
      toastMessage.value = 'Ссылка скопирована!'
      showToast.value = true
    } catch (e) {
      toastMessage.value = 'Ошибка копирования'
      showToast.value = true
    }
  }
}

// Переход на страницу мониторинга
const goToMonitoring = (eventId: string) => {
  router.push(`/monitoring?event=${eventId}`)
}

// Закрытие toast
const closeToast = () => {
  showToast.value = false
}

// Улучшенные анимации при движении мыши
const handleMouseMove = (e: MouseEvent) => {
  const { clientX, clientY } = e
  const { innerWidth, innerHeight } = window
  
  mouseRaw.value = { x: clientX, y: clientY }
  
  mousePosition.value = {
    x: (clientX / innerWidth) * 100,
    y: (clientY / innerHeight) * 100
  }
  
  // Усиленный параллакс эффект
  parallaxElements.value = parallaxElements.value.map((el, i) => ({
    ...el,
    offset: {
      x: ((clientX - innerWidth / 2) / innerWidth) * (15 + i * 3),
      y: ((clientY - innerHeight / 2) / innerHeight) * (15 + i * 3)
    }
  }))
}

// Создание ripple эффекта при клике
const handleClick = (e: MouseEvent) => {
  const newRipple = {
    id: Date.now(),
    x: e.clientX,
    y: e.clientY,
    timestamp: Date.now()
  }
  ripples.value.push(newRipple)
  
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== newRipple.id)
  }, 2000)
}

// Обработка скролла
const handleScroll = () => {
  scrollY.value = window.scrollY
}

// 3D Tilt эффект для карточек
const handleCardMouseMove = (e: MouseEvent, cardId: string) => {
  const card = e.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  const rotateX = ((y - centerY) / centerY) * 5
  const rotateY = ((x - centerX) / centerX) * 5
  
  card.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
}

const handleCardMouseLeave = (e: MouseEvent) => {
  const card = e.currentTarget as HTMLElement
  card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
}

onMounted(async () => {
  // Инициализация параллакс элементов
  parallaxElements.value = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    offset: { x: 0, y: 0 }
  }))
  
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('click', handleClick)
  window.addEventListener('scroll', handleScroll)
  
  await events.fetch()
  setTimeout(() => {
    isLoading.value = false
  }, 600)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('click', handleClick)
  window.removeEventListener('scroll', handleScroll)
})

function share(id: string) {
  navigator.clipboard?.writeText(location.origin + '/monitoring?event=' + id)
}

// Увеличенное количество световых частиц
const gentleParticles = ref(Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 8 + 2,
  duration: Math.random() * 30 + 15,
  delay: Math.random() * 10,
  color: ['rgba(0, 122, 255, 0.1)', 'rgba(94, 92, 230, 0.1)', 'rgba(88, 86, 214, 0.1)', 'rgba(255, 255, 255, 0.06)'][Math.floor(Math.random() * 4)]
})))
</script>

<template>
  <section class="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f1a]">
    
    <!-- Футуристический интерактивный фон -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      
      <!-- Интерактивный световой эффект, следующий за мышью (увеличен) -->
      <div 
        class="absolute w-[1000px] h-[1000px] rounded-full blur-3xl transition-all duration-700 ease-out"
        :style="{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, rgba(0, 122, 255, 0.2), rgba(94, 92, 230, 0.15), transparent 60%)`,
          opacity: 0.5
        }"
      ></div>

      <!-- Дополнительный световой cursor trail -->
      <div 
        class="absolute w-[500px] h-[500px] rounded-full blur-2xl transition-all duration-500 ease-out"
        :style="{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, rgba(255, 255, 255, 0.05), transparent 70%)`,
          opacity: 0.8
        }"
      ></div>

      <!-- Ripple эффекты при клике -->
      <div 
        v-for="ripple in ripples" 
        :key="ripple.id"
        class="absolute w-0 h-0 rounded-full pointer-events-none"
        :style="{
          left: `${ripple.x}px`,
          top: `${ripple.y}px`,
          transform: 'translate(-50%, -50%)',
          animation: 'rippleExpand 2s ease-out forwards',
          border: '2px solid rgba(0, 122, 255, 0.3)',
        }"
      ></div>

      <!-- Множественные световые орбы с улучшенным параллаксом -->
      <div 
        class="absolute top-1/5 left-1/6 w-[700px] h-[700px] rounded-full blur-3xl transition-transform duration-700"
        :style="{
          background: 'radial-gradient(circle, rgba(0, 122, 255, 0.15), transparent 70%)',
          transform: `translate(${parallaxElements[0]?.offset.x || 0}px, ${parallaxElements[0]?.offset.y || 0}px) scale(${1 + scrollY * 0.0001})`,
          animation: 'pulse 8s ease-in-out infinite'
        }"
      ></div>
      
      <div 
        class="absolute bottom-1/4 right-1/5 w-[600px] h-[600px] rounded-full blur-3xl transition-transform duration-700"
        :style="{
          background: 'radial-gradient(circle, rgba(94, 92, 230, 0.12), transparent 70%)',
          transform: `translate(${parallaxElements[1]?.offset.x || 0}px, ${parallaxElements[1]?.offset.y || 0}px) scale(${1 + scrollY * 0.0001})`,
          animation: 'pulse 10s ease-in-out infinite 2s'
        }"
      ></div>
      
      <div 
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl transition-transform duration-700"
        :style="{
          background: 'radial-gradient(circle, rgba(88, 86, 214, 0.1), transparent 70%)',
          transform: `translate(${(parallaxElements[2]?.offset.x || 0) * 0.5}px, ${(parallaxElements[2]?.offset.y || 0) * 0.5}px)`,
          animation: 'pulse 12s ease-in-out infinite 4s'
        }"
      ></div>

      <!-- Дополнительные орбы для глубины -->
      <div 
        class="absolute top-1/3 right-1/3 w-[450px] h-[450px] rounded-full blur-3xl transition-transform duration-700"
        :style="{
          background: 'radial-gradient(circle, rgba(175, 82, 222, 0.08), transparent 70%)',
          transform: `translate(${parallaxElements[3]?.offset.x || 0}px, ${parallaxElements[3]?.offset.y || 0}px)`,
          animation: 'pulse 9s ease-in-out infinite 1s'
        }"
      ></div>
      
      <!-- Плавающие световые частицы -->
      <div 
        v-for="particle in gentleParticles" 
        :key="particle.id"
        class="absolute rounded-full blur-sm transition-transform duration-1000"
        :style="{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          background: particle.color,
          animation: `gentleFloat ${particle.duration}s ease-in-out infinite ${particle.delay}s`,
          transform: `translate(${(parallaxElements[particle.id % parallaxElements.length]?.offset.x || 0) * 0.3}px, ${(parallaxElements[particle.id % parallaxElements.length]?.offset.y || 0) * 0.3}px)`
        }"
      ></div>
      
      <!-- Минималистичная декоративная сетка -->
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] opacity-30"></div>
      
      <!-- Анимированные волны сверху -->
      <svg class="absolute top-0 left-0 w-full h-[300px] opacity-20" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path 
          class="wave-top" 
          fill="url(#gradient-top)" 
          d="M0,160L48,144C96,128,192,96,288,90.7C384,85,480,107,576,128C672,149,768,171,864,165.3C960,160,1056,128,1152,122.7C1248,117,1344,139,1392,149.3L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
        />
        <defs>
          <linearGradient id="gradient-top" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgba(0,122,255,0.2);stop-opacity:1" />
            <stop offset="50%" style="stop-color:rgba(94,92,230,0.2);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(175,82,222,0.2);stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Анимированные волны снизу -->
      <svg class="absolute bottom-0 left-0 w-full h-[300px] opacity-15" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path 
          class="wave-bottom" 
          fill="url(#gradient-bottom)" 
          d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,133.3C672,117,768,107,864,112C960,117,1056,139,1152,149.3C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
        <defs>
          <linearGradient id="gradient-bottom" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgba(175,82,222,0.2);stop-opacity:1" />
            <stop offset="50%" style="stop-color:rgba(94,92,230,0.2);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(0,122,255,0.2);stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>
      
      <!-- Мягкие световые линии (улучшенные) -->
      <svg class="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path class="animate-wave-slow" d="M0,300 Q360,200 720,300 T1440,300" stroke="rgba(0, 122, 255, 0.4)" fill="none" stroke-width="2" />
        <path class="animate-wave-medium" d="M0,600 Q360,500 720,600 T1440,600" stroke="rgba(94, 92, 230, 0.4)" fill="none" stroke-width="2" />
        <path class="animate-wave-fast" d="M0,450 Q360,350 720,450 T1440,450" stroke="rgba(88, 86, 214, 0.4)" fill="none" stroke-width="2" />
      </svg>
    </div>

    <!-- Основной контент -->
    <div class="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-16">
      
      <!-- Заголовок в футуристическом стиле -->
      <motion.div
        class="text-center mb-16 lg:mb-20"
        v-motion="{
          initial: { opacity: 0, y: 30 },
          enter: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] } }
        }"
      >
        <motion.h1
          class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light mb-6 leading-tight tracking-tight"
          v-motion="{
            initial: { opacity: 0, scale: 0.95 },
            enter: { 
              opacity: 1, 
              scale: 1,
              transition: { duration: 1.2, delay: 0.2, ease: [0.23, 1, 0.32, 1] }
            }
          }"
          style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;"
        >
          <span class="block text-white/90 font-normal">Наши</span>
          <motion.span
            class="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] via-[#5E5CE6] to-[#AF52DE] font-semibold"
            v-motion="{
              initial: { opacity: 0, x: -20 },
              enter: { opacity: 1, x: 0, transition: { duration: 1, delay: 0.5 } }
            }"
            style="background-size: 200% 100%; animation: gentleShimmer 6s ease-in-out infinite;"
          >
            Мероприятия
          </motion.span>
        </motion.h1>
        
        <motion.p
          class="text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-normal leading-relaxed mt-8"
          v-motion="{
            initial: { opacity: 0 },
            enter: { opacity: 1, transition: { duration: 0.8, delay: 0.8 } }
          }"
          style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;"
        >
          Откройте для себя уникальную коллекцию событий, созданных с особой заботой и вниманием к деталям
        </motion.p>
      </motion.div>

      <!-- Футуристическая панель поиска -->
      <motion.div
        class="max-w-4xl mx-auto mb-12"
        v-motion="{
          initial: { opacity: 0, y: 20 },
          enter: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 1 } }
        }"
      >
        <!-- Поисковая строка с glassmorphism -->
        <div class="relative mb-8">
          <div class="absolute inset-0 bg-gradient-to-r from-[#007AFF]/20 via-[#5E5CE6]/20 to-[#AF52DE]/20 rounded-3xl blur-xl"></div>
          <div class="relative flex items-center bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl hover:shadow-[0_8px_32px_rgba(0,122,255,0.2)] hover:border-white/30 transition-all duration-500">
            <svg class="w-6 h-6 text-white/70 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Найти мероприятие..."
              class="flex-1 bg-transparent text-white placeholder-white/50 focus:outline-none text-base font-normal"
              style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="ml-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Фильтры по категориям -->
        <div class="flex flex-wrap gap-3 justify-center mb-6">
          <button
            @click="selectedCategory = null"
            :class="[
              'px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-500',
              !selectedCategory
                ? 'bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white shadow-lg shadow-[#007AFF]/30 scale-105'
                : 'bg-white/10 backdrop-blur-xl text-white/70 border border-white/20 hover:bg-white/15 hover:border-white/30 hover:scale-105'
            ]"
            style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;"
          >
            Все категории
          </button>
          <button
            v-for="category in availableCategories"
            :key="category"
            @click="selectedCategory = category"
            :class="[
              'px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-500',
              selectedCategory === category
                ? 'bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white shadow-lg shadow-[#007AFF]/30 scale-105'
                : 'bg-white/10 backdrop-blur-xl text-white/70 border border-white/20 hover:bg-white/15 hover:border-white/30 hover:scale-105'
            ]"
            style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;"
          >
            {{ categoryLabels[category] || category }}
          </button>
        </div>

        <!-- Счетчик результатов -->
        <motion.div
          class="text-center text-white/60 text-sm font-normal"
          v-motion="{
            initial: { opacity: 0 },
            enter: { opacity: 1, transition: { duration: 0.6, delay: 1.2 } }
          }"
          style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;"
        >
          Найдено <span class="text-[#007AFF] font-semibold">{{ filteredEvents.length }}</span> мероприятий
        </motion.div>
      </motion.div>

      <!-- Карточки событий (загрузка) -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <div
          v-for="i in 6"
          :key="i"
          class="h-[500px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl animate-pulse"
        >
          <div class="h-56 bg-gradient-to-br from-[#007AFF]/10 to-[#5E5CE6]/10 rounded-t-3xl"></div>
          <div class="p-6 space-y-4">
            <div class="h-5 bg-white/10 rounded w-3/4"></div>
            <div class="h-4 bg-white/10 rounded w-1/2"></div>
            <div class="h-4 bg-white/10 rounded w-2/3"></div>
          </div>
        </div>
      </div>

      <motion.div
        v-else-if="filteredEvents.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        v-motion="{
          initial: { opacity: 0 },
          enter: { opacity: 1, transition: { duration: 0.8, staggerChildren: 0.08 } }
        }"
      >
        <!-- Футуристические карточки с glassmorphism и 3D tilt -->
        <div
          v-for="(event, index) in filteredEvents"
          :key="event.id"
          :class="[
            'group relative transform-gpu transition-all duration-300 min-h-[480px] h-auto',
            'bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl',
            'shadow-2xl hover:shadow-[0_8px_32px_rgba(0,122,255,0.4)] hover:border-white/30',
            'overflow-hidden flex flex-col',
            'card-3d',
            isHovering === event.id ? 'z-20' : 'z-10'
          ]"
          @mouseenter="isHovering = event.id"
          @mouseleave="isHovering = null; handleCardMouseLeave($event)"
          @mousemove="handleCardMouseMove($event, event.id)"
        >
          <!-- Верхняя часть карточки с фотографией или градиентом -->
          <div class="h-48 relative overflow-hidden">
            <!-- Фоновое изображение или градиент -->
            <div 
              v-if="event.image" 
              class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              :style="{ backgroundImage: `url(${event.image})` }"
            ></div>
            <div 
              v-else
              class="absolute inset-0 bg-gradient-to-br from-[#007AFF]/20 to-[#5E5CE6]/20"
            ></div>
            
            <!-- Бейдж избранного, если событие в избранном -->
            <div 
              v-if="isFavorite(event.id)"
              class="absolute top-4 left-4 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] px-3 py-1.5 rounded-full shadow-lg z-10"
            >
              <span class="text-sm font-semibold text-white flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                В избранном
              </span>
            </div>
            <div v-if="event.category" class="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 z-10">
              <span class="text-sm font-medium text-white">{{ categoryLabels[event.category] || event.category }}</span>
            </div>
            <!-- Градиентный оверлей для лучшей читаемости -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>

          <!-- Контент карточки с минималистичной типографикой -->
          <div class="flex-1 p-6 flex flex-col">
            <!-- Кнопки Y сверху (по ТЗ) -->
            <div class="flex gap-2 mb-4">
              <!-- Y - Заполнить (Запомнить/В избранное) -->
              <button
                @click="toggleFavorite(event.id)"
                :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 hover:scale-110',
                  isFavorite(event.id)
                    ? 'bg-gradient-to-br from-[#007AFF] to-[#5E5CE6] text-white shadow-lg shadow-[#007AFF]/30'
                    : 'bg-white/10 backdrop-blur-xl border border-white/30 text-white/70 hover:bg-white/20'
                ]"
                :title="isFavorite(event.id) ? 'В избранном' : 'Запомнить'"
              >
                Y
              </button>

              <!-- Направить заявку (центральная кнопка) → на мониторинг -->
              <button
                @click="goToMonitoring(event.id)"
                class="flex-1 bg-gradient-to-r from-[#007AFF]/20 to-[#5E5CE6]/20 backdrop-blur-xl border border-[#007AFF]/30 text-white py-3 px-4 rounded-xl font-medium text-sm hover:from-[#007AFF]/30 hover:to-[#5E5CE6]/30 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
              >
                Направить заявку
              </button>

              <!-- Y - Поделиться (копирует ссылку на мониторинг) -->
              <button
                @click="shareEvent(event.id, event.title)"
                class="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/30 text-white/70 rounded-xl flex items-center justify-center font-bold text-lg hover:bg-white/20 hover:scale-110 hover:shadow-lg hover:shadow-white/20 transition-all duration-300 active:scale-95"
                title="Поделиться ссылкой на мониторинг"
              >
                Y
              </button>
            </div>

            <!-- Заголовок и автор -->
            <div class="mb-4">
              <NuxtLink :to="`/event/${event.id}`" class="group/title">
                <h3 class="text-xl font-semibold text-white mb-2 leading-tight line-clamp-2 group-hover/title:text-[#007AFF] transition-colors" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
                  {{ event.title }}
                </h3>
              </NuxtLink>
              <p class="text-white/60 text-sm flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                {{ event.author }} - {{ event.location }}
              </p>
            </div>

            <!-- Детали мероприятия -->
            <div class="space-y-3 mb-6 flex-1">
              <div class="flex items-center justify-between text-sm">
                <span class="text-white/50 font-medium">Старт:</span>
                <span class="text-white/90">{{ new Date(event.startAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-white/50 font-medium">Цель:</span>
                <span class="text-white/90 font-semibold">{{ (event.priceTotal / 100).toLocaleString('ru-RU') }} ₽</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-white/50 font-medium">Мест до:</span>
                <span class="text-white/90">{{ event.seatLimit || 'Не ограничено' }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-white/50 font-medium">Статус:</span>
                <span class="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                  Активно
                </span>
              </div>
            </div>

          </div>

          <!-- Эффект при наведении -->
          <div
            class="absolute inset-0 bg-gradient-to-br from-[#007AFF]/10 to-[#5E5CE6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"
          ></div>
        </div>
      </motion.div>

      <!-- Минималистичное пустое состояние -->
      <motion.div
        v-else
        class="text-center py-20"
        v-motion="{
          initial: { opacity: 0, scale: 0.95 },
          enter: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
        }"
      >
        <div class="text-7xl mb-6 opacity-30">🔍</div>
        <h3 class="text-2xl font-semibold text-white mb-3" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">Ничего не найдено</h3>
        <p class="text-white/60 font-normal" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">Попробуйте изменить параметры поиска</p>
      </motion.div>
    </div>
  </section>

  <!-- Toast уведомление -->
  <Toast :message="toastMessage" :show="showToast" @close="closeToast" />
</template>

<style scoped>
/* Подключение шрифта Inter */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* Футуристические анимации */
@keyframes gentleFloat {
  0%, 100% {
    transform: translate(0, 0);
    opacity: 0.4;
  }
  33% {
    transform: translate(10px, -15px);
    opacity: 0.6;
  }
  66% {
    transform: translate(-8px, -20px);
    opacity: 0.3;
  }
}

@keyframes gentleShimmer {
  0%, 100% {
    background-position: 0% center;
  }
  50% {
    background-position: 100% center;
  }
}

@keyframes favoritePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Ripple эффект при клике */
@keyframes rippleExpand {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 600px;
    height: 600px;
    opacity: 0;
  }
}

/* Пульсация световых орбов */
@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* Анимации волн */
@keyframes wave-slow {
  0%, 100% {
    d: path('M0,300 Q360,200 720,300 T1440,300');
  }
  50% {
    d: path('M0,300 Q360,400 720,300 T1440,300');
  }
}

@keyframes wave-medium {
  0%, 100% {
    d: path('M0,600 Q360,500 720,600 T1440,600');
  }
  50% {
    d: path('M0,600 Q360,700 720,600 T1440,600');
  }
}

@keyframes wave-fast {
  0%, 100% {
    d: path('M0,450 Q360,350 720,450 T1440,450');
  }
  50% {
    d: path('M0,450 Q360,550 720,450 T1440,450');
  }
}

.animate-wave-slow {
  animation: wave-slow 20s ease-in-out infinite;
}

.animate-wave-medium {
  animation: wave-medium 15s ease-in-out infinite;
}

.animate-wave-fast {
  animation: wave-fast 10s ease-in-out infinite;
}

/* Анимация волн сверху и снизу */
.wave-top {
  animation: wave-top 15s ease-in-out infinite;
  transform-origin: center;
}

.wave-bottom {
  animation: wave-bottom 18s ease-in-out infinite;
  transform-origin: center;
}

@keyframes wave-top {
  0%, 100% {
    transform: translateX(0) scaleY(1);
  }
  50% {
    transform: translateX(-20px) scaleY(1.1);
  }
}

@keyframes wave-bottom {
  0%, 100% {
    transform: translateX(0) scaleY(1);
  }
  50% {
    transform: translateX(20px) scaleY(1.1);
  }
}

/* 3D карточки */
.card-3d {
  transform-style: preserve-3d;
  transition: transform 0.3s ease-out;
}

.card-3d:hover {
  transform: translateY(-8px) translateZ(20px);
}

.animate-favorite-pulse {
  animation: favoritePulse 0.6s ease-in-out;
}

/* Утилиты для обрезки текста */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Минималистичный скроллбар */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, rgba(0, 122, 255, 0.4), rgba(94, 92, 230, 0.4));
  border-radius: 10px;
  border: 2px solid rgba(0, 0, 0, 0.3);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, rgba(0, 122, 255, 0.6), rgba(94, 92, 230, 0.6));
}

/* Плавные переходы */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>