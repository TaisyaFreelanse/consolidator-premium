<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { EventCategory, ControlPointCode, EventStatus } from '~/types'
import AuthModal from '~/components/AuthModal.vue'
import DateTimeField from '~/components/DateTimeField.vue'
import { useEventsStore } from '~/stores/events'
import { useAuthStore } from '~/stores/auth'
import { AUTHORS, getAuthorById, getAuthorFullName } from '~/data/authors'

const router = useRouter()
const route = useRoute()
const eventsStore = useEventsStore()
const auth = useAuthStore()

// Edit mode
const editMode = ref(false)
const eventId = ref<string>('')

// Authentication modals
const showAuthModal = ref(false)

// Event status
const eventStatus = ref<EventStatus>('draft')
const eventProducerName = ref<string>('')
const isPublished = ref(false)
const isPublishing = ref(false)

// Roles & permissions
const isModeratorRoute = computed(() => route.query.mode === 'moderate')
const isModeratorReview = computed(() => isModeratorRoute.value && auth.isModerator)
const isFormReadOnly = computed(() => isModeratorRoute.value || (editMode.value && isPublished.value && !auth.isProducer))
const currentProducerName = computed(() => (auth.isProducer && auth.currentUser) ? auth.currentUser.name : '')

// Form data
const formData = ref({
  title: '',
  author: '', // ID автора из справочника
  location: '',
  startAt: '',
  endAt: '', // ti50
  priceTotal: '',
  seatLimit: '',
  category: '' as EventCategory | '',
  description: '',
  activities: [''],
  image: '',
  // controlPlan удалён - все точки обязательны для каждого события
  startApplicationsAt: '', // ti10
  endApplicationsAt: '', // ti20
  startContractsAt: '' // ti30
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

// Image preview
const imagePreview = ref<string>('')
const imageInput = ref<HTMLInputElement | null>(null)

type TimeOffsetPreset = { label: string; minutes: number }

const eventStartPresets: TimeOffsetPreset[] = [
  { label: '-1 ч', minutes: -60 },
  { label: '-15 мин', minutes: -15 },
  { label: '+15 мин', minutes: 15 },
  { label: '+1 ч', minutes: 60 }
]

const eventEndPresets: TimeOffsetPreset[] = [
  { label: '+15 мин', minutes: 15 },
  { label: '+30 мин', minutes: 30 },
  { label: '+1 ч', minutes: 60 },
  { label: '+1 д', minutes: 1440 }
]

const applicationsStartPresets: TimeOffsetPreset[] = [
  { label: '-1 д', minutes: -1440 },
  { label: '-6 ч', minutes: -360 },
  { label: '-1 ч', minutes: -60 },
  { label: '+1 ч', minutes: 60 }
]

const applicationsEndPresets: TimeOffsetPreset[] = [
  { label: '+1 ч', minutes: 60 },
  { label: '+6 ч', minutes: 360 },
  { label: '+12 ч', minutes: 720 },
  { label: '+1 д', minutes: 1440 }
]

const contractsStartPresets: TimeOffsetPreset[] = [
  { label: '+30 мин', minutes: 30 },
  { label: '+2 ч', minutes: 120 },
  { label: '+6 ч', minutes: 360 },
  { label: '+1 д', minutes: 1440 }
]

// Add activity
const addActivity = () => {
  if (isFormReadOnly.value) return
  formData.value.activities.push('')
}

// Remove activity
const removeActivity = (index: number) => {
  if (isFormReadOnly.value) return
  formData.value.activities.splice(index, 1)
}

// Handle image upload
const handleImageUpload = (event: Event) => {
  if (isFormReadOnly.value) return
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

// Полный набор контрольных точек - обязателен для ВСЕХ событий
const FULL_CONTROL_PLAN: ControlPointCode[] = ['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999']

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
const loadEvent = async () => {
  const id = route.query.id as string
  if (!id) return
  
  editMode.value = true
  eventId.value = id
  
  try {
    // Сначала пытаемся загрузить из API (БД)
    const response = await fetch(`/api/events/${id}`)
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        const event = result.data
        formData.value = {
          title: event.title || '',
          author: event.author || '', // ID автора из справочника
          location: event.location || '',
          startAt: event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : '',
          endAt: event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : '',
          priceTotal: event.priceTotal ? (event.priceTotal / 100).toString() : '',
          seatLimit: event.seatLimit?.toString() || '',
          category: event.category || '',
          description: event.description || '',
          activities: event.activities?.length > 0 ? event.activities : [''],
          image: event.image || '',
          startApplicationsAt: event.startApplicationsAt ? new Date(event.startApplicationsAt).toISOString().slice(0, 16) : '',
          endApplicationsAt: event.endApplicationsAt ? new Date(event.endApplicationsAt).toISOString().slice(0, 16) : '',
          startContractsAt: event.startContractsAt ? new Date(event.startContractsAt).toISOString().slice(0, 16) : ''
        }
        
        imagePreview.value = event.image || ''
        createdAt.value = event.createdAt || ''
        eventStatus.value = event.status || 'draft'
        eventProducerName.value = event.producerName || ''
        isPublished.value = event.status === 'published'
        
        // Если событие опубликовано, показываем предупреждение
        if (isPublished.value) {
          alert('⚠️ Внимание!\n\nЭто мероприятие уже опубликовано.\nРедактирование опубликованных мероприятий запрещено (защита от манипуляций).\n\nВы можете просмотреть информацию, но не можете сохранить изменения.')
        }
        return
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to load event from API, trying localStorage:', error)
  }
  
  // Fallback: Load from localStorage (для старых событий)
  if (process.client) {
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
        startApplicationsAt: event.startApplicationsAt ? new Date(event.startApplicationsAt).toISOString().slice(0, 16) : '',
        endApplicationsAt: event.endApplicationsAt ? new Date(event.endApplicationsAt).toISOString().slice(0, 16) : '',
        startContractsAt: event.startContractsAt ? new Date(event.startContractsAt).toISOString().slice(0, 16) : ''
      }
      
      imagePreview.value = event.image || ''
      createdAt.value = event.createdAt || ''
      eventStatus.value = event.status || 'draft'
      eventProducerName.value = event.producerName || ''
      isPublished.value = event.status === 'published'
      
      if (isPublished.value) {
        alert('⚠️ Внимание!\n\nЭто мероприятие уже опубликовано.\nРедактирование опубликованных мероприятий запрещено (защита от манипуляций).\n\nВы можете просмотреть информацию, но не можете сохранить изменения.')
      }
    }
  }
}

// Сохранение события
const saveEvent = async (status: EventStatus) => {
  // Очищаем предыдущие ошибки
  validationErrors.value = []
  
  // Валидация обязательных полей
  if (!formData.value.title.trim()) {
    validationErrors.value.push('Название мероприятия обязательно')
  }
  if (!formData.value.author) {
    validationErrors.value.push('Выберите автора из списка')
  }
  if (!formData.value.location.trim()) {
    validationErrors.value.push('Место проведения обязательно')
  }
  if (!formData.value.startAt) {
    validationErrors.value.push('Дата начала мероприятия обязательна')
  }
  if (!formData.value.priceTotal || parseFloat(formData.value.priceTotal) <= 0) {
    validationErrors.value.push('Общая стоимость должна быть больше 0')
  }
  if (!formData.value.seatLimit || parseInt(formData.value.seatLimit) <= 0) {
    validationErrors.value.push('Количество участников должно быть больше 0')
  }
  if (!formData.value.category) {
    validationErrors.value.push('Выберите категорию')
  }
  
  // Validate dates
  if (!validateDates()) {
    // Ошибки дат уже добавлены в validationErrors
  }
  
  // Если есть ошибки, показываем их
  if (validationErrors.value.length > 0) {
    // Прокручиваем к первой ошибке
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  
  // Проверка: если редактируем опубликованное событие
  if (editMode.value && isPublished.value) {
    alert('❌ Редактирование опубликованных мероприятий запрещено!\n\nЗащита от манипуляций.')
    return
  }

  if (isFormReadOnly.value) {
    alert('ℹ️ Режим просмотра для модератора.\n\nРедактирование данных недоступно в этом режиме.')
    return
  }

  // Convert price to kopeks
  const priceInKopeks = Math.round(parseFloat(formData.value.priceTotal) * 100)

  const resolvedProducerName = editMode.value
    ? (eventProducerName.value || currentProducerName.value || null)
    : (currentProducerName.value || null)

  // Create event object for API
  const eventData = {
    id: editMode.value ? eventId.value : undefined, // Для создания не передаем id
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
    controlPlan: FULL_CONTROL_PLAN, // Все точки обязательны для каждого события
    startApplicationsAt: formData.value.startApplicationsAt ? new Date(formData.value.startApplicationsAt).toISOString() : undefined,
    endApplicationsAt: formData.value.endApplicationsAt ? new Date(formData.value.endApplicationsAt).toISOString() : undefined,
    startContractsAt: formData.value.startContractsAt ? new Date(formData.value.startContractsAt).toISOString() : undefined,
    status,
    producerName: resolvedProducerName || undefined
  }

  console.log('💾 Saving event to server:', {
    id: eventData.id,
    title: eventData.title,
    status: eventData.status,
    producerName: eventData.producerName
  })

  try {
    // Отправляем на сервер
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      const errorMessage = result.message || result.statusMessage || 'Failed to save event'
      throw new Error(errorMessage)
    }

    console.log('✅ Event saved to database:', result.data.id)

    // Обновляем store для синхронизации
    await eventsStore.reload()
    console.log('🔄 Store reloaded')

    // Show success message
    const statusText = status === 'draft' ? 'сохранено как черновик' : 'опубликовано'
    alert(editMode.value ? `Мероприятие успешно обновлено (${statusText})!` : `Мероприятие успешно создано (${statusText})!`)

    // Redirect to catalog
    router.push('/catalog')
  } catch (error: any) {
    console.error('❌ Failed to save event:', error)
    alert(`❌ Ошибка сохранения мероприятия\n\n${error.message || 'Произошла ошибка при сохранении. Попробуйте еще раз.'}`)
  }
}

// Submit form - проверка доступа продюсера
const submitForm = async (status: EventStatus = 'draft') => {
  if (isFormReadOnly.value) {
    alert('ℹ️ Режим просмотра для модератора.\n\nИспользуйте кнопку «Опубликовать», чтобы подтвердить черновик.')
    return
  }

  auth.loadUsers()

  if (!auth.isAuthenticated) {
    showAuthModal.value = true
    alert('🔒 Создание мероприятий доступно только авторизованным продюсерам.\n\nПожалуйста, войдите или зарегистрируйтесь и повторите попытку.')
    return
  }

  if (!auth.isProducer) {
    showAuthModal.value = true
    alert('❌ Доступ запрещен!\n\nСоздание мероприятий доступно только продюсерам.\n\nВойдите под учетной записью продюсера (producer1/prod1pass).')
    return
  }

  if (!currentProducerName.value) {
    alert('❌ Не удалось определить учетную запись продюсера. Попробуйте выйти и войти снова.')
    return
  }

  await saveEvent(status)
}

const closeAuthModal = () => {
  showAuthModal.value = false
}

const publishAsModerator = async () => {
  if (!isModeratorReview.value) return
  if (!eventId.value) {
    alert('❌ Не удалось определить идентификатор мероприятия. Попробуйте открыть черновик заново.')
    return
  }

  if (isPublishing.value) return

  if (eventStatus.value === 'published') {
    alert('ℹ️ Мероприятие уже опубликовано.')
    return
  }

  try {
    isPublishing.value = true

    const response = await fetch(`/api/events/${eventId.value}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      const errorMessage = result.message || result.statusMessage || 'Failed to publish event'
      throw new Error(errorMessage)
    }

    alert(`✅ Мероприятие «${result.data.title}» опубликовано`)
    await eventsStore.reload()
    router.push('/moderator')
  } catch (error: any) {
    console.error('❌ Failed to publish event:', error)
    alert(`❌ Ошибка публикации\n\n${error.message || 'Не удалось опубликовать мероприятие. Попробуйте еще раз.'}`)
  } finally {
    isPublishing.value = false
  }
}

// Load event on mount if editing
onMounted(async () => {
  // Загружаем пользователей для проверки авторизации
  auth.loadUsers()

  await loadEvent()

  if (isModeratorRoute.value && !auth.isModerator) {
    showAuthModal.value = true
  }
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
              <h3 class="text-red-400 font-semibold mb-2">Ошибки заполнения формы:</h3>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="(error, index) in validationErrors" :key="index" class="text-red-300 text-sm">
                  {{ error }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <form @submit.prevent>
          <div 
            v-if="isModeratorRoute" 
            class="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3"
          >
            <svg class="w-6 h-6 text-blue-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="text-blue-300 font-semibold mb-1">
                Режим модератора
              </h3>
              <p class="text-white/80 text-sm" v-if="isModeratorReview">
                Поля заблокированы для защиты данных. Ознакомьтесь с информацией и используйте кнопку «Опубликовать» ниже, чтобы подтвердить черновик.
              </p>
              <p class="text-white/80 text-sm" v-else>
                Чтобы опубликовать мероприятие, войдите под учетной записью модератора (moderator / modpass).
              </p>
            </div>
          </div>

          <fieldset 
            :disabled="isFormReadOnly" 
            :class="['space-y-6', isFormReadOnly ? 'opacity-90' : '']"
          >
            <!-- Image Upload -->
            <div>
            <label class="block text-sm font-medium text-white/80 mb-2">
              Фотография мероприятия
            </label>
            <div 
                class="relative border-2 border-dashed border-white/20 rounded-2xl overflow-hidden transition-colors"
                :class="[
                  imagePreview ? 'h-64' : 'h-48',
                  isFormReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-[#007AFF]/50'
                ]"
                @click="!isFormReadOnly && imageInput?.click()"
              >
                <input 
                  ref="imageInput"
                  type="file" 
                  accept="image/*" 
                  class="hidden" 
                  :disabled="isFormReadOnly"
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
              <div class="md:col-span-2">
              <label class="block text-sm font-medium text-white/80 mb-2">
                Название мероприятия <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.title"
                type="text" 
                required
                placeholder="Введите название"
                :disabled="isFormReadOnly"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                :class="{ 'opacity-70 cursor-not-allowed': isFormReadOnly }"
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
                  :class="{ 'opacity-70 cursor-not-allowed': isFormReadOnly }"
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
                  :class="{ 'opacity-70 cursor-not-allowed': isFormReadOnly }"
                >
                  <option value="" disabled>Выберите категорию</option>
                  <option v-for="cat in categories" :key="cat.value" :value="cat.value" class="bg-[#1A1F3E]">
                    {{ cat.label }}
                  </option>
                </select>
              </div>

              <DateTimeField
                v-model="formData.startAt"
                label="Начало мероприятия (ti40)"
                :required="true"
                :disabled="isFormReadOnly"
                :offset-presets="eventStartPresets"
                :error="validationErrors.find(e => e.includes('Начало мероприятия')) || ''"
              />
              
              <DateTimeField
                v-model="formData.endAt"
                label="Окончание мероприятия (ti50)"
                :disabled="isFormReadOnly"
                :offset-presets="eventEndPresets"
                :copy-from-value="formData.startAt"
                copy-from-label="началом мероприятия"
              />

              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">
                  Общая стоимость (₽) <span class="text-red-400">*</span>
                </label>
                <input 
                  v-model="formData.priceTotal"
                  type="number" 
                  required
                  min="0"
                  step="1"
                  placeholder="0"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                  :class="{
                    'border-red-500': validationErrors.some(e => e.includes('стоимость') || e.includes('цена')),
                    'opacity-70 cursor-not-allowed': isFormReadOnly
                  }"
                >
                <p v-if="validationErrors.some(e => e.includes('стоимость') || e.includes('цена'))" class="text-red-400 text-sm mt-1">
                  {{ validationErrors.find(e => e.includes('стоимость') || e.includes('цена')) }}
                </p>
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
                :class="{ 'opacity-70 cursor-not-allowed': isFormReadOnly }"
              >
            </div>

            <DateTimeField
              v-model="formData.startApplicationsAt"
              label="Начало приема заявок (ti10)"
              :disabled="isFormReadOnly"
              :offset-presets="applicationsStartPresets"
              :copy-from-value="formData.startAt"
              copy-from-label="началом мероприятия"
              :error="validationErrors.find(e => e.includes('приема заявок (ti10)')) || ''"
            />

            <DateTimeField
              v-model="formData.endApplicationsAt"
              label="Окончание приема заявок (ti20)"
              :disabled="isFormReadOnly"
              :offset-presets="applicationsEndPresets"
              :copy-from-value="formData.startApplicationsAt"
              copy-from-label="началом приема заявок"
              :error="validationErrors.find(e => e.includes('ti20')) || ''"
            />
            
            <DateTimeField
              v-model="formData.startContractsAt"
              label="Начало оформления договоров (ti30)"
              :disabled="isFormReadOnly"
              :offset-presets="contractsStartPresets"
              :copy-from-value="formData.endApplicationsAt || formData.startApplicationsAt"
              copy-from-label="окончанием приема заявок"
              :error="validationErrors.find(e => e.includes('ti30')) || ''"
            />
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
              :class="{ 'opacity-70 cursor-not-allowed': isFormReadOnly }"
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
                  :class="{ 'opacity-70 cursor-not-allowed': isFormReadOnly }"
                >
                <button 
                  v-if="!isFormReadOnly && formData.activities.length > 1"
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
                v-if="!isFormReadOnly"
                type="button"
                @click="addActivity"
                class="w-full bg-white/5 border border-white/10 border-dashed rounded-xl px-4 py-3 text-white/60 hover:text-white hover:border-[#007AFF]/50 transition-all"
              >
                + Добавить активность
              </button>
            </div>
          </div>

          <!-- Author Information -->
          <div class="border-t border-white/10 pt-6">
            <h3 class="text-xl font-semibold mb-4">Автор мероприятия</h3>
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Выберите автора из списка <span class="text-red-400">*</span>
              </label>
              <select 
                v-model="formData.author"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                :class="{ 'opacity-70 cursor-not-allowed': isFormReadOnly }"
              >
                <option value="" disabled class="bg-[#1a1f2e] text-white/50">Выберите автора...</option>
                <option 
                  v-for="author in AUTHORS" 
                  :key="author.id" 
                  :value="author.id"
                  class="bg-[#1a1f2e] text-white"
                >
                  {{ getAuthorFullName(author) }} — {{ author.title }}
                </option>
              </select>
              <p 
                v-if="validationErrors.includes('Выберите автора из списка')"
                class="text-red-400 text-sm mt-2"
              >
                Выберите автора из списка
              </p>
              
              <!-- Preview selected author -->
              <div v-if="formData.author" class="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div class="text-sm text-white/60 mb-1">Выбранный автор:</div>
                <div class="text-white font-semibold">{{ getAuthorFullName(getAuthorById(formData.author)!) }}</div>
                <div class="text-white/70 text-sm mt-1">{{ getAuthorById(formData.author)?.title }}</div>
              </div>
            </div>
          </div>

          <!-- Event Info (for edit mode) -->
          <div v-if="editMode && createdAt" class="border-t border-white/10 pt-6 space-y-4">
            <!-- Статус и продюсер -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div class="bg-white/5 rounded-xl p-4">
                <div class="text-white/60 mb-1">Статус:</div>
                <div class="flex items-center gap-2">
                  <span v-if="eventStatus === 'draft'" class="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg font-semibold">
                    📝 Черновик
                  </span>
                  <span v-else class="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg font-semibold">
                    ✅ Опубликовано
                  </span>
                </div>
              </div>
              <div class="bg-white/5 rounded-xl p-4">
                <div class="text-white/60 mb-1">Продюсер:</div>
                <div class="text-white font-semibold">{{ eventProducerName || '—' }}</div>
              </div>
            </div>
            
            <!-- Даты -->
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

          <!-- Предупреждение для опубликованных -->
          <div v-if="editMode && isPublished" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <svg class="w-6 h-6 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div class="text-red-400 font-semibold mb-1">Редактирование запрещено</div>
              <div class="text-red-300 text-sm">Это мероприятие опубликовано. Редактирование запрещено для защиты от манипуляций.</div>
            </div>
          </div>

          </fieldset>

          <!-- Submit Buttons -->
          <div v-if="isModeratorRoute" class="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              @click="publishAsModerator"
              :disabled="isPublishing || eventStatus !== 'draft' || !auth.isModerator"
              class="flex-1 bg-gradient-to-r from-[#34c759] to-[#30d158] text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:shadow-lg hover:shadow-[#34c759]/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {{ isPublishing ? 'Публикуем…' : '✅ Опубликовать' }}
            </button>

            <NuxtLink
              to="/moderator"
              class="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-medium hover:bg-white/10 transition-all text-center"
            >
              Вернуться к модерации
            </NuxtLink>
          </div>

          <div v-else class="flex flex-col sm:flex-row gap-4 pt-6">
            <button 
              v-if="!isPublished"
              type="button"
              @click="submitForm('draft')"
              :disabled="!isFormValid || isFormReadOnly"
              class="flex-1 bg-white/5 border border-white/10 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📝 {{ editMode ? 'Сохранить черновик' : 'Создать черновик' }}
            </button>
            
            <button 
              v-if="!isPublished"
              type="button"
              @click="submitForm('published')"
              :disabled="!isFormValid || isFormReadOnly"
              class="flex-1 bg-gradient-to-r from-[#34c759] to-[#30d158] text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:shadow-lg hover:shadow-[#34c759]/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              ✅ Опубликовать
            </button>
            
            <NuxtLink 
              to="/catalog"
              class="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-medium hover:bg-white/10 transition-all text-center"
            >
              {{ isPublished ? 'Закрыть' : 'Отмена' }}
            </NuxtLink>
          </div>
        </form>

        <!-- /Form container -->
      </div>

      <!-- /Page container -->
    </div>
 
    <!-- Producer Auth Modal -->
    <AuthModal 
      :is-open="showAuthModal" 
      @close="closeAuthModal"
    />
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


