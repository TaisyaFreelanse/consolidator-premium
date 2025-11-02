<script setup lang="ts">
import { ref } from 'vue'

interface Author {
  id: string
  name: string
  title: string
  avatar?: string
  eventsCount: number
  totalParticipants?: number
  rating?: number
  specializations?: string[]
  bio?: string
  achievements?: string[]
}

// Mock authors data
const authors = ref<Author[]>([
  {
    id: 'author-1',
    name: 'Елена Волкова',
    title: 'Шеф-повар ресторана "Белуга"',
    eventsCount: 12,
    totalParticipants: 245,
    rating: 4.9,
    specializations: ['Итальянская кухня', 'Французская кухня', 'Молекулярная кухня'],
    bio: 'Шеф-повар с 15-летним опытом, основательница школы кулинарного искусства "Вкус". Обладательница звезды Мишлен.',
    achievements: [
      'Звезда Мишлен 2020',
      'Лучший шеф-повар года по версии Forbes',
      'Автор 3 кулинарных книг'
    ]
  },
  {
    id: 'author-2',
    name: 'Дмитрий Соколов',
    title: 'Бизнес-тренер',
    eventsCount: 28,
    totalParticipants: 890,
    rating: 4.8,
    specializations: ['Управление проектами', 'Лидерство', 'Agile'],
    bio: 'Сертифицированный бизнес-тренер, эксперт в области управления проектами и командой. Более 10 лет опыта в IT-компаниях.',
    achievements: [
      'PMP сертификация',
      'CSM (Certified Scrum Master)',
      'Более 500 обученных специалистов'
    ]
  },
  {
    id: 'author-3',
    name: 'Мария Петрова',
    title: 'Искусствовед, экскурсовод',
    eventsCount: 45,
    totalParticipants: 1200,
    rating: 4.95,
    specializations: ['Русское искусство', 'Архитектура', 'История Санкт-Петербурга'],
    bio: 'Кандидат искусствоведения, аккредитованный гид по Санкт-Петербургу и пригородам. Провела более 1000 экскурсий.',
    achievements: [
      'Кандидат искусствоведения',
      'Аккредитованный гид ЮНЕСКО',
      'Автор научных статей'
    ]
  },
  {
    id: 'author-4',
    name: 'Андрей Макаров',
    title: 'Фотограф, режиссер',
    eventsCount: 8,
    totalParticipants: 156,
    rating: 4.7,
    specializations: ['Портретная фотография', 'Репортажная съемка', 'Видеопродакшн'],
    bio: 'Профессиональный фотограф с 12-летним опытом, работал с крупнейшими изданиями России.',
    achievements: [
      'Лауреат World Press Photo',
      'Работал с Vogue, GQ, Esquire',
      'Персональная выставка в МАММ'
    ]
  },
  {
    id: 'author-5',
    name: 'Ольга Смирнова',
    title: 'Психолог, коуч',
    eventsCount: 22,
    totalParticipants: 340,
    rating: 4.85,
    specializations: ['Психология личности', 'Коучинг', 'НЛП'],
    bio: 'Психолог-практик, сертифицированный коуч ICF. Специализируется на работе с руководителями и предпринимателями.',
    achievements: [
      'ICF ACC сертификация',
      'Сертифицированный НЛП-практик',
      'Более 1000 часов коучинга'
    ]
  },
  {
    id: 'author-6',
    name: 'Сергей Иванов',
    title: 'Сомелье',
    eventsCount: 15,
    totalParticipants: 285,
    rating: 4.9,
    specializations: ['Французские вина', 'Итальянские вина', 'Винный этикет'],
    bio: 'Сертифицированный сомелье с международным дипломом WSET Level 3. Проводит дегустации и мастер-классы по винной культуре.',
    achievements: [
      'WSET Level 3 сертификат',
      'Судья международных винных конкурсов',
      'Автор курса "Винная культура"'
    ]
  }
])

// View mode
const viewMode = ref<'default' | 'compact' | 'detailed'>('default')
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F3E] to-[#0A0F1E] text-white py-12">
    <div class="container mx-auto px-4 max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] bg-clip-text text-transparent mb-2">
          Авторы мероприятий
        </h1>
        <p class="text-white/60">Познакомьтесь с нашими экспертами и организаторами</p>
      </div>

      <!-- View mode selector -->
      <div class="flex flex-wrap gap-3 justify-center mb-8">
        <button
          @click="viewMode = 'default'"
          :class="[
            'px-6 py-3 rounded-xl font-medium transition-all duration-300',
            viewMode === 'default'
              ? 'bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white shadow-lg shadow-[#007AFF]/30'
              : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
          ]"
        >
          Стандартный вид
        </button>
        <button
          @click="viewMode = 'compact'"
          :class="[
            'px-6 py-3 rounded-xl font-medium transition-all duration-300',
            viewMode === 'compact'
              ? 'bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white shadow-lg shadow-[#007AFF]/30'
              : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
          ]"
        >
          Компактный вид
        </button>
        <button
          @click="viewMode = 'detailed'"
          :class="[
            'px-6 py-3 rounded-xl font-medium transition-all duration-300',
            viewMode === 'detailed'
              ? 'bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white shadow-lg shadow-[#007AFF]/30'
              : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
          ]"
        >
          Детальный вид
        </button>
      </div>

      <!-- Authors Grid -->
      <div 
        :class="[
          'grid gap-6',
          viewMode === 'compact' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        ]"
      >
        <AuthorCard
          v-for="author in authors"
          :key="author.id"
          :author="author"
          :variant="viewMode"
        />
      </div>

      <!-- Empty State (if no authors) -->
      <div 
        v-if="authors.length === 0"
        class="text-center py-16"
      >
        <svg class="w-24 h-24 mx-auto mb-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="text-xl font-semibold text-white/60 mb-2">Авторов пока нет</h3>
        <p class="text-white/40">Скоро здесь появятся эксперты и организаторы</p>
      </div>

      <!-- Stats Section -->
      <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
          <div class="text-4xl font-bold text-white mb-2">{{ authors.length }}</div>
          <div class="text-white/60">Авторов на платформе</div>
        </div>
        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
          <div class="text-4xl font-bold text-white mb-2">
            {{ authors.reduce((sum, a) => sum + a.eventsCount, 0) }}
          </div>
          <div class="text-white/60">Всего мероприятий</div>
        </div>
        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
          <div class="text-4xl font-bold text-white mb-2">
            {{ authors.reduce((sum, a) => sum + (a.totalParticipants || 0), 0).toLocaleString('ru-RU') }}
          </div>
          <div class="text-white/60">Участников обучено</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

