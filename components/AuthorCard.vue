<script setup lang="ts">
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

interface Props {
  author: Author
  variant?: 'default' | 'compact' | 'detailed'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

// Generate avatar initials
const avatarInitials = computed(() => {
  return props.author.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// Generate random gradient for avatar
const avatarGradient = computed(() => {
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-yellow-500 to-orange-600'
  ]
  const hash = props.author.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[hash % gradients.length]
})
</script>

<template>
  <div 
    v-if="variant === 'compact'"
    class="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-[#007AFF]/50 transition-all duration-300 cursor-pointer"
  >
    <div class="flex items-center gap-4">
      <!-- Avatar -->
      <div 
        v-if="author.avatar"
        class="w-12 h-12 rounded-full bg-cover bg-center flex-shrink-0"
        :style="{ backgroundImage: `url(${author.avatar})` }"
      ></div>
      <div 
        v-else
        class="w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold flex-shrink-0"
        :class="avatarGradient"
      >
        {{ avatarInitials }}
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <h3 class="text-white font-semibold truncate group-hover:text-[#007AFF] transition-colors">
          {{ author.name }}
        </h3>
        <p class="text-white/60 text-sm truncate">{{ author.title }}</p>
      </div>

      <!-- Stats -->
      <div class="text-right flex-shrink-0">
        <div class="text-white/90 font-semibold">{{ author.eventsCount }}</div>
        <div class="text-white/40 text-xs">мероприятий</div>
      </div>
    </div>
  </div>

  <div 
    v-else-if="variant === 'detailed'"
    class="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-[#007AFF]/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-[#007AFF]/20"
  >
    <!-- Header with gradient -->
    <div class="h-32 bg-gradient-to-br relative overflow-hidden" :class="avatarGradient">
      <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
    </div>

    <div class="p-6 -mt-16 relative">
      <!-- Avatar -->
      <div 
        v-if="author.avatar"
        class="w-24 h-24 rounded-2xl bg-cover bg-center border-4 border-[#0A0F1E] shadow-xl mb-4"
        :style="{ backgroundImage: `url(${author.avatar})` }"
      ></div>
      <div 
        v-else
        class="w-24 h-24 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-2xl border-4 border-[#0A0F1E] shadow-xl mb-4"
        :class="avatarGradient"
      >
        {{ avatarInitials }}
      </div>

      <!-- Name and Title -->
      <h3 class="text-2xl font-bold text-white mb-1 group-hover:text-[#007AFF] transition-colors">
        {{ author.name }}
      </h3>
      <p class="text-white/60 mb-4">{{ author.title }}</p>

      <!-- Bio -->
      <p v-if="author.bio" class="text-white/80 text-sm mb-4 line-clamp-3">
        {{ author.bio }}
      </p>

      <!-- Specializations -->
      <div v-if="author.specializations && author.specializations.length > 0" class="flex flex-wrap gap-2 mb-4">
        <span 
          v-for="spec in author.specializations.slice(0, 3)" 
          :key="spec"
          class="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full border border-white/20"
        >
          {{ spec }}
        </span>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div class="text-center p-3 bg-white/5 rounded-xl">
          <div class="text-2xl font-bold text-white mb-1">{{ author.eventsCount }}</div>
          <div class="text-white/40 text-xs">Мероприятий</div>
        </div>
        <div v-if="author.totalParticipants" class="text-center p-3 bg-white/5 rounded-xl">
          <div class="text-2xl font-bold text-white mb-1">{{ author.totalParticipants }}</div>
          <div class="text-white/40 text-xs">Участников</div>
        </div>
        <div v-if="author.rating" class="text-center p-3 bg-white/5 rounded-xl">
          <div class="flex items-center justify-center gap-1 mb-1">
            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span class="text-xl font-bold text-white">{{ author.rating.toFixed(1) }}</span>
          </div>
          <div class="text-white/40 text-xs">Рейтинг</div>
        </div>
      </div>

      <!-- Achievements -->
      <div v-if="author.achievements && author.achievements.length > 0" class="border-t border-white/10 pt-4">
        <h4 class="text-white/80 font-semibold text-sm mb-2">Достижения:</h4>
        <ul class="space-y-1">
          <li 
            v-for="(achievement, index) in author.achievements.slice(0, 3)" 
            :key="index"
            class="text-white/60 text-sm flex items-start gap-2"
          >
            <svg class="w-4 h-4 text-[#007AFF] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>{{ achievement }}</span>
          </li>
        </ul>
      </div>

      <!-- View Profile Button -->
      <button class="w-full mt-4 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-[#007AFF]/30 transition-all duration-300 hover:scale-105">
        Смотреть профиль
      </button>
    </div>
  </div>

  <!-- Default variant -->
  <div 
    v-else
    class="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#007AFF]/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-[#007AFF]/10"
  >
    <div class="flex items-start gap-4">
      <!-- Avatar -->
      <div 
        v-if="author.avatar"
        class="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0 shadow-lg"
        :style="{ backgroundImage: `url(${author.avatar})` }"
      ></div>
      <div 
        v-else
        class="w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg"
        :class="avatarGradient"
      >
        {{ avatarInitials }}
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <h3 class="text-xl font-bold text-white mb-1 group-hover:text-[#007AFF] transition-colors">
          {{ author.name }}
        </h3>
        <p class="text-white/60 mb-3">{{ author.title }}</p>

        <!-- Stats -->
        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-white/80">{{ author.eventsCount }} мероприятий</span>
          </div>
          <div v-if="author.totalParticipants" class="flex items-center gap-1">
            <svg class="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span class="text-white/80">{{ author.totalParticipants }} участников</span>
          </div>
          <div v-if="author.rating" class="flex items-center gap-1">
            <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span class="text-white/80 font-semibold">{{ author.rating.toFixed(1) }}</span>
          </div>
        </div>

        <!-- Specializations -->
        <div v-if="author.specializations && author.specializations.length > 0" class="flex flex-wrap gap-2 mt-3">
          <span 
            v-for="spec in author.specializations.slice(0, 3)" 
            :key="spec"
            class="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-lg border border-white/20"
          >
            {{ spec }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 3;
}
</style>

