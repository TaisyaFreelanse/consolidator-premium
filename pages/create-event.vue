<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { EventCategory, ControlPointCode } from '~/types'

const router = useRouter()
const route = useRoute()

// Edit mode
const editMode = ref(false)
const eventId = ref<string>('')

// Form data
const formData = ref({
  title: '',
  author: '',
  location: '',
  startAt: '',
  endAt: '', // ti50
  priceTotal: '',
  seatLimit: '',
  category: '' as EventCategory | '',
  description: '',
  activities: [''],
  image: '',
  controlPlan: [] as ControlPointCode[],
  startApplicationsAt: '', // ti10
  endApplicationsAt: '', // ti20
  startContractsAt: '', // ti30
  authorInfo: {
    name: '',
    title: '',
    achievements: ['']
  }
})

// Timestamps
const createdAt = ref<string>('')
const updatedAt = ref<string>('')

// Categories
const categories: { value: EventCategory; label: string }[] = [
  { value: 'master-class', label: 'Мастер-класс' },
  { value: 'training', label: 'Тренинг' },
  { value: 'excursion', label: 'Экскурсия' },
  { value: 'gastro-show', label: 'Гастро-шоу' },
  { value: 'lecture', label: 'Лекция' },
  { value: 'cruise', label: 'Круиз' }
]

// Control points
const availableControlPoints: { code: ControlPointCode; label: string }[] = [
  { code: 't0', label: 't0 - Запись мероприятия в каталог (публикация)' },
  { code: 'ti10', label: 'ti10 - Начало приема заявок' },
  { code: 'ti20', label: 'ti20 - Окончание приема заявок' },
  { code: 'ti30', label: 'ti30 - Начало оформления договоров' },
  { code: 'ti40', label: 'ti40 - Начало проведения мероприятия' },
  { code: 'ti50', label: 'ti50 - Окончание проведения мероприятия' },
  { code: 't999', label: 't999 - Удаление мероприятия из каталога' }
]

// Image preview
const imagePreview = ref<string>('')
const imageInput = ref<HTMLInputElement | null>(null)

// Add activity
const addActivity = () => {
  formData.value.activities.push('')
}

// Remove activity
const removeActivity = (index: number) => {
  formData.value.activities.splice(index, 1)
}

// Add achievement
const addAchievement = () => {
  formData.value.authorInfo.achievements.push('')
}

// Remove achievement
const removeAchievement = (index: number) => {
  formData.value.authorInfo.achievements.splice(index, 1)
}

// Handle image upload
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
      formData.value.image = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// Toggle control point
const toggleControlPoint = (code: ControlPointCode) => {
  const index = formData.value.controlPlan.indexOf(code)
  if (index > -1) {
    formData.value.controlPlan.splice(index, 1)
  } else {
    formData.value.controlPlan.push(code)
  }
}

// Validation messages
const validationErrors = ref<string[]>([])

// Date validation
const validateDates = (): boolean => {
  validationErrors.value = []
  
  const dates = {
    ti10: formData.value.startApplicationsAt ? new Date(formData.value.startApplicationsAt).getTime() : null,
    ti20: formData.value.endApplicationsAt ? new Date(formData.value.endApplicationsAt).getTime() : null,
    ti30: formData.value.startContractsAt ? new Date(formData.value.startContractsAt).getTime() : null,
    ti40: formData.value.startAt ? new Date(formData.value.startAt).getTime() : null,
    ti50: formData.value.endAt ? new Date(formData.value.endAt).getTime() : null
  }
  
  // ti40 обязательно
  if (!dates.ti40) {
    validationErrors.value.push('Дата начала мероприятия (ti40) обязательна')
    return false
  }
  
  // Проверка последовательности дат
  if (dates.ti10 && dates.ti20 && dates.ti10 >= dates.ti20) {
    validationErrors.value.push('Начало приема заявок (ti10) должно быть раньше окончания (ti20)')
  }
  
  if (dates.ti20 && dates.ti30 && dates.ti20 >= dates.ti30) {
    validationErrors.value.push('Окончание приема заявок (ti20) должно быть раньше начала оформления договоров (ti30)')
  }
  
  if (dates.ti30 && dates.ti40 && dates.ti30 >= dates.ti40) {
    validationErrors.value.push('Начало оформления договоров (ti30) должно быть раньше начала мероприятия (ti40)')
  }
  
  if (dates.ti40 && dates.ti50 && dates.ti40 >= dates.ti50) {
    validationErrors.value.push('Начало мероприятия (ti40) должно быть раньше окончания (ti50)')
  }
  
  // Также проверяем, что ti10 < ti40 (если есть ti10 но нет промежуточных)
  if (dates.ti10 && dates.ti40 && dates.ti10 >= dates.ti40) {
    validationErrors.value.push('Начало приема заявок (ti10) должно быть раньше начала мероприятия (ti40)')
  }
  
  return validationErrors.value.length === 0
}

// Basic validation
const isFormValid = computed(() => {
  return (
    formData.value.title.trim() !== '' &&
    formData.value.author.trim() !== '' &&
    formData.value.location.trim() !== '' &&
    formData.value.startAt !== '' &&
    formData.value.priceTotal !== '' &&
    formData.value.seatLimit !== '' &&
    formData.value.category !== ''
  )
})

// Load event for editing
const loadEvent = () => {
  const id = route.query.id as string
  if (!id) return
  
  editMode.value = true
  eventId.value = id
  
  // Load from localStorage
  const existingEvents = JSON.parse(localStorage.getItem('customEvents') || '[]')
  const event = existingEvents.find((e: any) => e.id === id)
  
  if (event) {
    formData.value = {
      title: event.title || '',
      author: event.author || '',
      location: event.location || '',
      startAt: event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : '',
      endAt: event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : '',
      priceTotal: event.priceTotal ? (event.priceTotal / 100).toString() : '',
      seatLimit: event.seatLimit?.toString() || '',
      category: event.category || '',
      description: event.description || '',
      activities: event.activities?.length > 0 ? event.activities : [''],
      image: event.image || '',
      controlPlan: event.controlPlan || [],
      startApplicationsAt: event.startApplicationsAt ? new Date(event.startApplicationsAt).toISOString().slice(0, 16) : '',
      endApplicationsAt: event.endApplicationsAt ? new Date(event.endApplicationsAt).toISOString().slice(0, 16) : '',
      startContractsAt: event.startContractsAt ? new Date(event.startContractsAt).toISOString().slice(0, 16) : '',
      authorInfo: {
        name: event.authorInfo?.name || '',
        title: event.authorInfo?.title || '',
        achievements: event.authorInfo?.achievements?.length > 0 ? event.authorInfo.achievements : ['']
      }
    }
    
    imagePreview.value = event.image || ''
    createdAt.value = event.createdAt || ''
  }
}

// Submit form
const submitForm = () => {
  if (!isFormValid.value) {
    alert('Пожалуйста, заполните все обязательные поля')
    return
  }
  
  // Validate dates
  if (!validateDates()) {
    return
  }

  // Convert price to kopeks
  const priceInKopeks = Math.round(parseFloat(formData.value.priceTotal) * 100)
  
  const now = new Date().toISOString()

  // Create event object
  const eventData = {
    id: editMode.value ? eventId.value : `event-${Date.now()}`,
    title: formData.value.title,
    author: formData.value.author,
    location: formData.value.location,
    startAt: new Date(formData.value.startAt).toISOString(),
    endAt: formData.value.endAt ? new Date(formData.value.endAt).toISOString() : undefined,
    seatLimit: parseInt(formData.value.seatLimit),
    priceTotal: priceInKopeks,
    pricePerSeat: Math.round(priceInKopeks / parseInt(formData.value.seatLimit)),
    image: formData.value.image || '/mock/placeholder.jpg',
    category: formData.value.category,
    description: formData.value.description || undefined,
    activities: formData.value.activities.filter(a => a.trim() !== ''),
    controlPlan: formData.value.controlPlan.length > 0 ? formData.value.controlPlan : ['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999'],
    startApplicationsAt: formData.value.startApplicationsAt ? new Date(formData.value.startApplicationsAt).toISOString() : undefined,
    endApplicationsAt: formData.value.endApplicationsAt ? new Date(formData.value.endApplicationsAt).toISOString() : undefined,
    startContractsAt: formData.value.startContractsAt ? new Date(formData.value.startContractsAt).toISOString() : undefined,
    authorInfo: {
      name: formData.value.authorInfo.name || formData.value.author,
      title: formData.value.authorInfo.title || 'Организатор',
      achievements: formData.value.authorInfo.achievements.filter(a => a.trim() !== '')
    },
    createdAt: editMode.value ? createdAt.value : now,
    updatedAt: now
  }

  // Save to localStorage
  const existingEvents = JSON.parse(localStorage.getItem('customEvents') || '[]')
  
  if (editMode.value) {
    // Update existing event
    const index = existingEvents.findIndex((e: any) => e.id === eventId.value)
    if (index > -1) {
      existingEvents[index] = eventData
    }
  } else {
    // Add new event
    existingEvents.push(eventData)
  }
  
  localStorage.setItem('customEvents', JSON.stringify(existingEvents))

  // Show success message
  alert(editMode.value ? 'Мероприятие успешно обновлено!' : 'Мероприятие успешно создано!')

  // Redirect to catalog
  router.push('/catalog')
}

// Load event on mount if editing
onMounted(() => {
  loadEvent()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F3E] to-[#0A0F1E] text-white py-12">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink 
          to="/catalog" 
          class="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться к каталогу
        </NuxtLink>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] bg-clip-text text-transparent">
          {{ editMode ? 'Редактировать мероприятие' : 'Создать мероприятие' }}
        </h1>
        <p class="text-white/60 mt-2">
          {{ editMode ? 'Внесите изменения в информацию о мероприятии' : 'Заполните информацию о вашем мероприятии' }}
        </p>
      </div>

      <!-- Form -->
      <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <!-- Validation Errors -->
        <div v-if="validationErrors.length > 0" class="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <svg class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <h3 class="text-red-400 font-semibold mb-2">Ошибки в датах:</h3>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="(error, index) in validationErrors" :key="index" class="text-red-300 text-sm">
                  {{ error }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <form @submit.prevent="submitForm" class="space-y-6">
          <!-- Image Upload -->
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Фотография мероприятия
            </label>
            <div 
              class="relative border-2 border-dashed border-white/20 rounded-2xl overflow-hidden cursor-pointer hover:border-[#007AFF]/50 transition-colors"
              :class="imagePreview ? 'h-64' : 'h-48'"
              @click="imageInput?.click()"
            >
              <input 
                ref="imageInput"
                type="file" 
                accept="image/*" 
                class="hidden" 
                @change="handleImageUpload"
              >
              <div v-if="!imagePreview" class="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                <svg class="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Нажмите, чтобы загрузить фото</p>
              </div>
              <div v-else class="absolute inset-0">
                <img :src="imagePreview" alt="Preview" class="w-full h-full object-cover">
              </div>
            </div>
          </div>

          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Название мероприятия <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.title"
                type="text" 
                required
                placeholder="Введите название"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Автор/Организатор <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.author"
                type="text" 
                required
                placeholder="Имя автора"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Место проведения <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.location"
                type="text" 
                required
                placeholder="Адрес или название места"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Категория <span class="text-red-400">*</span>
              </label>
              <select 
                v-model="formData.category"
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
                <option value="" disabled>Выберите категорию</option>
                <option v-for="cat in categories" :key="cat.value" :value="cat.value" class="bg-[#1A1F3E]">
                  {{ cat.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Начало мероприятия (ti40) <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.startAt"
                type="datetime-local" 
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Окончание мероприятия (ti50)
              </label>
              <input 
                v-model="formData.endAt"
                type="datetime-local"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Общая стоимость (₽) <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.priceTotal"
                type="number" 
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Количество участников <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.seatLimit"
                type="number" 
                required
                min="1"
                placeholder="10"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Начало приема заявок (ti10)
              </label>
              <input 
                v-model="formData.startApplicationsAt"
                type="datetime-local"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Окончание приема заявок (ti20)
              </label>
              <input 
                v-model="formData.endApplicationsAt"
                type="datetime-local"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Начало оформления договоров (ti30)
              </label>
              <input 
                v-model="formData.startContractsAt"
                type="datetime-local"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Описание мероприятия
            </label>
            <textarea 
              v-model="formData.description"
              rows="4"
              placeholder="Расскажите о вашем мероприятии..."
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all resize-none"
            ></textarea>
          </div>

          <!-- Activities -->
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Программа мероприятия
            </label>
            <div class="space-y-2">
              <div v-for="(activity, index) in formData.activities" :key="index" class="flex gap-2">
                <input 
                  v-model="formData.activities[index]"
                  type="text" 
                  placeholder="Описание активности"
                  class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                >
                <button 
                  v-if="formData.activities.length > 1"
                  type="button"
                  @click="removeActivity(index)"
                  class="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button 
                type="button"
                @click="addActivity"
                class="w-full bg-white/5 border border-white/10 border-dashed rounded-xl px-4 py-3 text-white/60 hover:text-white hover:border-[#007AFF]/50 transition-all"
              >
                + Добавить активность
              </button>
            </div>
          </div>

          <!-- Control Points -->
          <div>
            <label class="block text-sm font-medium text-white/80 mb-3">
              Контрольные точки
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label 
                v-for="point in availableControlPoints" 
                :key="point.code"
                class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 cursor-pointer hover:border-[#007AFF]/50 transition-all"
              >
                <input 
                  type="checkbox"
                  :checked="formData.controlPlan.includes(point.code)"
                  @change="toggleControlPoint(point.code)"
                  class="w-5 h-5 rounded border-white/20 bg-white/5 text-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
                >
                <span class="text-white/80">{{ point.label }}</span>
              </label>
            </div>
          </div>

          <!-- Author Information -->
          <div class="border-t border-white/10 pt-6">
            <h3 class="text-xl font-semibold mb-4">Информация об авторе</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">
                  Имя автора
                </label>
                <input 
                  v-model="formData.authorInfo.name"
                  type="text" 
                  placeholder="Будет использовано имя организатора"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">
                  Должность/Титул
                </label>
                <input 
                  v-model="formData.authorInfo.title"
                  type="text" 
                  placeholder="Например: Шеф-повар, Тренер"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                >
              </div>
            </div>

            <!-- Achievements -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Достижения автора
              </label>
              <div class="space-y-2">
                <div v-for="(achievement, index) in formData.authorInfo.achievements" :key="index" class="flex gap-2">
                  <input 
                    v-model="formData.authorInfo.achievements[index]"
                    type="text" 
                    placeholder="Описание достижения"
                    class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                  >
                  <button 
                    v-if="formData.authorInfo.achievements.length > 1"
                    type="button"
                    @click="removeAchievement(index)"
                    class="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <button 
                  type="button"
                  @click="addAchievement"
                  class="w-full bg-white/5 border border-white/10 border-dashed rounded-xl px-4 py-3 text-white/60 hover:text-white hover:border-[#007AFF]/50 transition-all"
                >
                  + Добавить достижение
                </button>
              </div>
            </div>
          </div>

          <!-- Timestamps Info (for edit mode) -->
          <div v-if="editMode && createdAt" class="border-t border-white/10 pt-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div class="bg-white/5 rounded-xl p-4">
                <div class="text-white/60 mb-1">Создано:</div>
                <div class="text-white font-mono">{{ new Date(createdAt).toLocaleString('ru-RU') }}</div>
              </div>
              <div class="bg-white/5 rounded-xl p-4">
                <div class="text-white/60 mb-1">Последнее изменение:</div>
                <div class="text-white font-mono">{{ updatedAt ? new Date(updatedAt).toLocaleString('ru-RU') : '—' }}</div>
              </div>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="flex gap-4 pt-6">
            <button 
              type="submit"
              :disabled="!isFormValid"
              class="flex-1 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:shadow-lg hover:shadow-[#007AFF]/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {{ editMode ? 'Сохранить изменения' : 'Создать мероприятие' }}
            </button>
            <NuxtLink 
              to="/catalog"
              class="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-medium hover:bg-white/10 transition-all"
            >
              Отмена
            </NuxtLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 122, 255, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 122, 255, 0.7);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 122, 255, 0.5) rgba(255, 255, 255, 0.05);
}
</style>

