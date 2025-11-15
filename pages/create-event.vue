<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import type { ControlPointCode, EventStatus } from '~/types'
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
const eventProducerCode = ref<string>('')
const isPublished = ref(false)
const isPublishing = ref(false)

// Roles & permissions
const isModerator = computed(() => auth.isModerator)
const isModeratorReview = computed(() => isModerator.value && editMode.value)
const currentProducerName = computed(() => (auth.isProducer && auth.currentUser) ? auth.currentUser.name : '')
const currentProducerCode = computed(() => (auth.isProducer && auth.currentUser) ? auth.currentUser.code : '')
const isProducerOwner = computed(() => {
  if (!editMode.value) {
    return auth.isProducer
  }
  if (!auth.isProducer || !auth.currentUser) {
    return false
  }
  if (eventProducerCode.value) {
    return auth.currentUser.code === eventProducerCode.value
  }
  if (eventProducerName.value) {
    return auth.currentUser.name === eventProducerName.value
  }
  // Если информация о владельце отсутствует (устаревшие данные), разрешаем первому продюсеру.
  return true
})
const isFormReadOnly = computed(() => {
  // Модератор может редактировать черновики (но не опубликованные события)
  if (isModerator.value && editMode.value) {
    // Модератор может редактировать только черновики, не опубликованные события
    return isPublished.value
  }
  // Для продюсеров: только владелец может редактировать свои черновики
  if (!editMode.value) return false
  if (isPublished.value) return true
  return !isProducerOwner.value
})

const toLocalInputValue = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const tzOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

// Form data (без креативного блока)
const formData = ref({
  title: '',
  author: '', // ID автора из справочника
  location: '',
  startAt: '',
  endAt: '', // ti50
  seatLimit: '',
  pricePerSeat: '',
  description: '',
  // controlPlan удалён - все точки обязательны для каждого события
  startApplicationsAt: '', // ti10
  endApplicationsAt: '', // ti20
  startContractsAt: '' // ti30
})

const existingImage = ref<string>('')
const existingCategory = ref<string | null>(null)
const existingActivities = ref<string[]>([])

// Timestamps
const createdAt = ref<string>('')
const updatedAt = ref<string>('')

const parseMoneyInput = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0
  const normalized = String(value).replace(',', '.')
  const parsed = parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const seatLimitNumber = computed(() => {
  const parsed = parseInt(formData.value.seatLimit, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const pricePerSeatNumber = computed(() => {
  const parsed = parseMoneyInput(formData.value.pricePerSeat)
  return parsed > 0 ? parsed : 0
})

const totalAmountRub = computed(() => {
  if (!seatLimitNumber.value || !pricePerSeatNumber.value) return 0
  return Math.round(seatLimitNumber.value * pricePerSeatNumber.value * 100) / 100
})

const formattedTotalAmount = computed(() => {
  const value = totalAmountRub.value
  if (!value) return '0'
  const hasFraction = Math.abs(value - Math.trunc(value)) > 1e-6
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0
  })
})

// Безопасное отображение имени автора (поддерживает как ID из справочника, так и строку из внешнего API)
const displayAuthorName = computed(() => {
  if (!formData.value.author) return ''
  const author = getAuthorById(formData.value.author)
  return author ? getAuthorFullName(author) : formData.value.author
})

// Безопасное получение title автора
const displayAuthorTitle = computed(() => {
  if (!formData.value.author) return ''
  const author = getAuthorById(formData.value.author)
  return author?.title || ''
})

// Полный набор контрольных точек - обязателен для ВСЕХ событий
const FULL_CONTROL_PLAN: ControlPointCode[] = ['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999']

// Validation messages
const validationErrors = ref<string[]>([])
const fieldErrors = reactive({
  title: '',
  author: '',
  location: '',
  startAt: '',
  endAt: '',
  pricePerSeat: '',
  seatLimit: '',
  startApplicationsAt: '',
  endApplicationsAt: '',
  startContractsAt: ''
})
type FieldKey = keyof typeof fieldErrors

const resetFieldErrors = () => {
  (Object.keys(fieldErrors) as FieldKey[]).forEach((key) => {
    fieldErrors[key] = ''
  })
}

// Date validation
const validateDates = (): string[] => {
  const errors: string[] = []

  const dates = {
    ti10: formData.value.startApplicationsAt ? new Date(formData.value.startApplicationsAt).getTime() : null,
    ti20: formData.value.endApplicationsAt ? new Date(formData.value.endApplicationsAt).getTime() : null,
    ti30: formData.value.startContractsAt ? new Date(formData.value.startContractsAt).getTime() : null,
    ti40: formData.value.startAt ? new Date(formData.value.startAt).getTime() : null,
    ti50: formData.value.endAt ? new Date(formData.value.endAt).getTime() : null
  }

  if (!dates.ti40) {
    errors.push('Дата начала мероприятия (ti40) обязательна')
    return errors
  }

  if (dates.ti10 && dates.ti20 && dates.ti10 >= dates.ti20) {
    errors.push('Начало приема заявок (ti10) должно быть раньше окончания (ti20)')
  }

  if (dates.ti20 && dates.ti30 && dates.ti20 >= dates.ti30) {
    errors.push('Окончание приема заявок (ti20) должно быть раньше начала оформления договоров (ti30)')
  }

  if (dates.ti30 && dates.ti40 && dates.ti30 >= dates.ti40) {
    errors.push('Начало оформления договоров (ti30) должно быть раньше начала мероприятия (ti40)')
  }

  if (dates.ti40 && dates.ti50 && dates.ti40 >= dates.ti50) {
    errors.push('Начало мероприятия (ti40) должно быть раньше окончания (ti50)')
  }

  if (dates.ti10 && dates.ti40 && dates.ti10 >= dates.ti40) {
    errors.push('Начало приема заявок (ti10) должно быть раньше начала мероприятия (ti40)')
  }

  return errors
}

// Basic validation
const isFormValid = computed(() => {
  return (
    formData.value.title.trim() !== '' &&
    formData.value.author.trim() !== '' &&
    formData.value.location.trim() !== '' &&
    formData.value.startAt !== '' &&
    formData.value.startApplicationsAt !== '' &&
    formData.value.endApplicationsAt !== '' &&
    formData.value.startContractsAt !== '' &&
    formData.value.pricePerSeat !== '' &&
    formData.value.seatLimit !== ''
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
        existingImage.value = event.image || ''
        existingCategory.value = event.category || null
        existingActivities.value = Array.isArray(event.activities) ? [...event.activities] : []

        const seatLimitStr = event.seatLimit?.toString() || ''
        const pricePerSeatRub = event.pricePerSeat != null
          ? Number(event.pricePerSeat) / 100
          : event.seatLimit
            ? Number(event.priceTotal || 0) / 100 / event.seatLimit
            : 0
        const pricePerSeatStr = pricePerSeatRub
          ? Number(pricePerSeatRub.toFixed(2)).toString()
          : ''

        formData.value = {
          title: event.title || '',
          author: event.author || '', // ID автора из справочника
          location: event.location || '',
          startAt: toLocalInputValue(event.startAt),
          endAt: toLocalInputValue(event.endAt),
          seatLimit: seatLimitStr,
          pricePerSeat: pricePerSeatStr,
          description: event.description || '',
          startApplicationsAt: toLocalInputValue(event.startApplicationsAt),
          endApplicationsAt: toLocalInputValue(event.endApplicationsAt),
          startContractsAt: toLocalInputValue(event.startContractsAt)
        }
        
        createdAt.value = event.createdAt || ''
        updatedAt.value = event.updatedAt || ''
        eventStatus.value = event.status || 'draft'
        eventProducerName.value = event.producerName || ''
        eventProducerCode.value = event.producerCode || ''
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
      existingImage.value = event.image || ''
      existingCategory.value = event.category || null
      existingActivities.value = Array.isArray(event.activities) ? [...event.activities] : []

      const seatLimitStr = event.seatLimit?.toString() || ''
      const rawPriceTotal = Number(event.priceTotal || 0)
      const pricePerSeatRub = event.pricePerSeat != null
        ? Number(event.pricePerSeat) / 100
        : event.seatLimit
          ? rawPriceTotal / 100 / event.seatLimit
          : 0
      const pricePerSeatStr = pricePerSeatRub
        ? Number(pricePerSeatRub.toFixed(2)).toString()
        : ''

      formData.value = {
        title: event.title || '',
        author: event.author || '',
        location: event.location || '',
        startAt: toLocalInputValue(event.startAt),
        endAt: toLocalInputValue(event.endAt),
        seatLimit: seatLimitStr,
        pricePerSeat: pricePerSeatStr,
        description: event.description || '',
        startApplicationsAt: toLocalInputValue(event.startApplicationsAt),
        endApplicationsAt: toLocalInputValue(event.endApplicationsAt),
        startContractsAt: toLocalInputValue(event.startContractsAt)
      }
      
      createdAt.value = event.createdAt || ''
      updatedAt.value = event.updatedAt || ''
      eventStatus.value = event.status || 'draft'
      eventProducerName.value = event.producerName || ''
      eventProducerCode.value = event.producerCode || ''
      isPublished.value = event.status === 'published'
      
      if (isPublished.value) {
        alert('⚠️ Внимание!\n\nЭто мероприятие уже опубликовано.\nРедактирование опубликованных мероприятий запрещено (защита от манипуляций).\n\nВы можете просмотреть информацию, но не можете сохранить изменения.')
      }
    }
  }
}

// Сохранение события
const addValidationError = (field: FieldKey | null, message: string, mirrorFields: FieldKey[] = []) => {
  if (!validationErrors.value.includes(message)) {
    validationErrors.value.push(message)
  }
  if (field) {
    fieldErrors[field] = message
  }
  mirrorFields.forEach((mirrorField) => {
    fieldErrors[mirrorField] = message
  })
}

const saveEvent = async (status: EventStatus) => {
  validationErrors.value = []
  resetFieldErrors()

  if (!formData.value.title.trim()) {
    addValidationError('title', 'Название мероприятия обязательно')
  }
  if (!formData.value.author) {
    addValidationError('author', 'Выберите автора из списка')
  }
  if (!formData.value.location.trim()) {
    addValidationError('location', 'Место проведения обязательно')
  }
  const seatLimitParsed = parseInt(formData.value.seatLimit, 10)
  const pricePerSeatParsed = parseMoneyInput(formData.value.pricePerSeat)
  if (!formData.value.seatLimit || !Number.isFinite(seatLimitParsed) || seatLimitParsed <= 0) {
    addValidationError('seatLimit', 'Количество участников должно быть больше 0')
  }
  if (!formData.value.pricePerSeat || pricePerSeatParsed <= 0) {
    addValidationError('pricePerSeat', 'Цена за место должна быть больше 0')
  }
  if (!formData.value.startApplicationsAt) {
    addValidationError('startApplicationsAt', 'Укажите дату начала приема заявок (ti10)')
  }
  if (!formData.value.endApplicationsAt) {
    addValidationError('endApplicationsAt', 'Укажите дату окончания приема заявок (ti20)')
  }
  if (!formData.value.startContractsAt) {
    addValidationError('startContractsAt', 'Укажите дату начала оформления договоров (ti30)')
  }

  const dateErrors = validateDates()
  dateErrors.forEach((error) => {
    if (!validationErrors.value.includes(error)) {
      validationErrors.value.push(error)
    }

    if (error.includes('ti10') && error.includes('ti20')) {
      fieldErrors.startApplicationsAt = error
      fieldErrors.endApplicationsAt = error
    } else if (error.includes('ti20') && error.includes('ti30')) {
      fieldErrors.endApplicationsAt = error
      fieldErrors.startContractsAt = error
    } else if (error.includes('ti30') && error.includes('ti40')) {
      fieldErrors.startContractsAt = error
      fieldErrors.startAt = error
    } else if (error.includes('ti40') && error.includes('ti50')) {
      fieldErrors.startAt = error
      fieldErrors.endAt = error
    } else if (error.includes('ti10') && error.includes('ti40')) {
      fieldErrors.startApplicationsAt = error
      fieldErrors.startAt = error
    } else if (error.includes('ti40') && error.includes('обязательна')) {
      fieldErrors.startAt = error
    }
  })

  if (!formData.value.startAt) {
    addValidationError('startAt', 'Дата начала мероприятия (ti40) обязательна')
  }

  if (validationErrors.value.length > 0) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  
  // Проверка: если редактируем опубликованное событие
  if (editMode.value && isPublished.value) {
    alert('❌ Редактирование опубликованных мероприятий запрещено!\n\nЗащита от манипуляций.')
    return
  }

  if (isFormReadOnly.value) {
    alert('ℹ️ Редактирование недоступно.\n\nЭто опубликованное мероприятие или у вас нет прав на редактирование.')
    return
  }

  const seatLimitValue = Number.isFinite(seatLimitParsed) ? seatLimitParsed : 0
  const pricePerSeatInKopeks = Math.round(pricePerSeatParsed * 100)
  const priceTotalInKopeks = pricePerSeatInKopeks * seatLimitValue

  const resolvedProducerName = editMode.value
    ? (eventProducerName.value || currentProducerName.value || null)
    : (currentProducerName.value || null)
  const resolvedProducerCode = editMode.value
    ? (eventProducerCode.value || currentProducerCode.value || null)
    : (currentProducerCode.value || null)

  // Create event object for API
  const eventData = {
    id: editMode.value ? eventId.value : undefined, // Для создания не передаем id
    title: formData.value.title,
    author: formData.value.author,
    location: formData.value.location,
    startAt: new Date(formData.value.startAt).toISOString(),
    endAt: formData.value.endAt ? new Date(formData.value.endAt).toISOString() : undefined,
    seatLimit: seatLimitValue,
    priceTotal: priceTotalInKopeks,
    pricePerSeat: pricePerSeatInKopeks,
    image: existingImage.value || '/mock/placeholder.jpg',
    category: existingCategory.value || undefined,
    description: formData.value.description || undefined,
    activities: existingActivities.value,
    controlPlan: FULL_CONTROL_PLAN, // Все точки обязательны для каждого события
    startApplicationsAt: formData.value.startApplicationsAt ? new Date(formData.value.startApplicationsAt).toISOString() : undefined,
    endApplicationsAt: formData.value.endApplicationsAt ? new Date(formData.value.endApplicationsAt).toISOString() : undefined,
    startContractsAt: formData.value.startContractsAt ? new Date(formData.value.startContractsAt).toISOString() : undefined,
    status,
    producerName: resolvedProducerName || undefined,
    producerCode: resolvedProducerCode || undefined
  }

  console.log('💾 Saving event to server:', {
    id: eventData.id,
    title: eventData.title,
    status: eventData.status,
    producerName: eventData.producerName,
    producerCode: eventData.producerCode,
    seatLimit: eventData.seatLimit,
    pricePerSeat: eventData.pricePerSeat,
    priceTotal: eventData.priceTotal
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

// Submit form - проверка доступа продюсера или модератора
const submitForm = async (status: EventStatus = 'draft') => {
  if (isFormReadOnly.value) {
    alert('ℹ️ Редактирование недоступно.\n\nЭто опубликованное мероприятие или у вас нет прав на редактирование.')
    return
  }

  auth.loadUsers()

  if (!auth.isAuthenticated) {
    showAuthModal.value = true
    alert('🔒 Создание мероприятий доступно только авторизованным пользователям.\n\nПожалуйста, войдите или зарегистрируйтесь и повторите попытку.')
    return
  }

  // Модератор может редактировать и публиковать черновики всех продюсеров
  if (!auth.isProducer && !auth.isModerator) {
    showAuthModal.value = true
    alert('❌ Доступ запрещен!\n\nСоздание мероприятий доступно только продюсерам или модераторам.\n\nВойдите под учетной записью продюсера (прод1/пар1) или модератора (мод1/пар0).')
    return
  }

  // Для продюсеров: проверяем владельца черновика
  // Модератор может редактировать любые черновики
  if (editMode.value && auth.isProducer && !isProducerOwner.value) {
    alert('❌ Вы не являетесь автором этого черновика.\n\nРедактирование доступно только продюсеру, который создал мероприятие.')
    return
  }

  if (status === 'published' && !auth.isModerator) {
    alert('⚠️ Публикация доступна только модератору.\n\nСохраните мероприятие как черновик и дождитесь модерации.')
    return
  }

  // Для продюсеров: проверяем наличие producerCode
  // Для модераторов: используем producerCode из события (если редактируем) или оставляем пустым
  if (auth.isProducer && (!currentProducerName.value || !currentProducerCode.value)) {
    alert('❌ Не удалось определить учетную запись продюсера. Попробуйте выйти и войти снова.')
    return
  }

  await saveEvent(status)
}

const closeAuthModal = () => {
  showAuthModal.value = false
}

const publishAsModerator = async () => {
  if (!auth.isModerator) return
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

    alert(`✅ Мероприятие «${result.data.title}» сохранено и опубликовано`)
    await eventsStore.reload()
    router.push('/catalog')
  } catch (error: any) {
    console.error('❌ Failed to publish event:', error)
    alert(`❌ Ошибка сохранения\n\n${error.message || 'Не удалось завершить модерацию. Попробуйте еще раз.'}`)
  } finally {
    isPublishing.value = false
  }
}

// Load event on mount if editing
onMounted(async () => {
  // Загружаем пользователей для проверки авторизации
  auth.loadUsers()

  await loadEvent()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F3E] to-[#0A0F1E] text-white py-12">
    <div class="container mx-auto px-4 max-w-[800px]">
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

        <div 
          v-if="editMode && !isModeratorReview && !isProducerOwner" 
          class="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"
        >
          <svg class="w-6 h-6 text-amber-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-amber-300 font-semibold mb-1">
              Черновик защищён владельцем
            </h3>
            <p class="text-white/80 text-sm">
              Изменения может вносить только продюсер, создавший мероприятие. Вы можете просмотреть данные, но сохранение недоступно.
            </p>
          </div>
        </div>

        <form @submit.prevent @keydown.enter.prevent>
        <div 
          v-if="isModerator && editMode" 
          class="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3"
        >
            <svg class="w-6 h-6 text-blue-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="text-blue-300 font-semibold mb-1">
                Режим модератора
              </h3>
              <p class="text-white/80 text-sm">
                Вы можете редактировать и публиковать черновики всех продюсеров. После публикации редактирование будет заблокировано.
              </p>
            </div>
          </div>

          <fieldset 
            :disabled="isFormReadOnly" 
            :class="['space-y-6', isFormReadOnly ? 'opacity-90' : '']"
          >
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
                  :class="[
                    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all',
                    isFormReadOnly ? 'opacity-70 cursor-not-allowed' : '',
                    fieldErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-400/40' : ''
                  ]"
                >
                <p v-if="fieldErrors.title" class="text-red-400 text-sm mt-1">{{ fieldErrors.title }}</p>
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
                  :class="[
                    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all',
                    isFormReadOnly ? 'opacity-70 cursor-not-allowed' : '',
                    fieldErrors.location ? 'border-red-500 focus:border-red-500 focus:ring-red-400/40' : ''
                  ]"
                >
                <p v-if="fieldErrors.location" class="text-red-400 text-sm mt-1">{{ fieldErrors.location }}</p>
              </div>

              <div class="md:col-span-2">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DateTimeField
                    v-model="formData.startAt"
                    label="Начало мероприятия (ti40)"
                    :required="true"
                    :disabled="isFormReadOnly"
                    :error="fieldErrors.startAt"
                    :show-quick-actions="false"
                    :show-now-button="false"
                  />
                  
                  <DateTimeField
                    v-model="formData.endAt"
                    label="Окончание мероприятия (ti50)"
                    :disabled="isFormReadOnly"
                    :error="fieldErrors.endAt"
                    :show-quick-actions="false"
                    :show-now-button="false"
                  />
                </div>
              </div>

              <div class="md:col-span-2">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
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
                      :class="[
                        'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all',
                        isFormReadOnly ? 'opacity-70 cursor-not-allowed' : '',
                        fieldErrors.seatLimit ? 'border-red-500 focus:border-red-500 focus:ring-red-400/40' : ''
                      ]"
                    >
                    <p v-if="fieldErrors.seatLimit" class="text-red-400 text-sm mt-1">{{ fieldErrors.seatLimit }}</p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">
                      Цена за место (₽) <span class="text-red-400">*</span>
                    </label>
                    <input 
                      v-model="formData.pricePerSeat"
                      type="number" 
                      required
                      min="0"
                      step="0.01"
                      placeholder="0"
                      :class="[
                        'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all',
                        isFormReadOnly ? 'opacity-70 cursor-not-allowed' : '',
                        fieldErrors.pricePerSeat ? 'border-red-500 focus:border-red-500 focus:ring-red-400/40' : ''
                      ]"
                    >
                    <p v-if="fieldErrors.pricePerSeat" class="text-red-400 text-sm mt-1">
                      {{ fieldErrors.pricePerSeat }}
                    </p>
                  </div>

                  <div class="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex flex-col justify-center gap-1">
                    <span class="text-xs uppercase tracking-wider text-white/50">Складочный сбор</span>
                    <span class="text-2xl font-semibold text-white">{{ formattedTotalAmount }} ₽</span>
                    <span class="text-xs text-white/40">= цена места × количество участников</span>
                  </div>
                </div>
              </div>

              <DateTimeField
                v-model="formData.startApplicationsAt"
                label="Начало приема заявок (ti10)"
                :disabled="isFormReadOnly"
                :error="fieldErrors.startApplicationsAt"
                :show-quick-actions="false"
                :show-now-button="false"
              />

              <DateTimeField
                v-model="formData.endApplicationsAt"
                label="Окончание приема заявок (ti20)"
                :disabled="isFormReadOnly"
                :error="fieldErrors.endApplicationsAt"
                :show-quick-actions="false"
                :show-now-button="false"
              />
              
              <DateTimeField
                v-model="formData.startContractsAt"
                label="Начало оформления договоров (ti30)"
                :disabled="isFormReadOnly"
                :error="fieldErrors.startContractsAt"
                :show-quick-actions="false"
                :show-now-button="false"
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

          <!-- Author Information -->
          <div class="border-t border-white/10 pt-6">
            <h3 class="text-xl font-semibold mb-4">Автор мероприятия</h3>
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Выберите автора из списка <span class="text-red-400">*</span>
              </label>
              <select 
                v-model="formData.author"
                :class="[
                  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all',
                  isFormReadOnly ? 'opacity-70 cursor-not-allowed' : '',
                  fieldErrors.author ? 'border-red-500 focus:border-red-500 focus:ring-red-400/40' : ''
                ]"
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
              <p v-if="fieldErrors.author" class="text-red-400 text-sm mt-2">
                {{ fieldErrors.author }}
              </p>
              
              <!-- Preview selected author -->
              <div v-if="formData.author" class="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div class="text-sm text-white/60 mb-1">Выбранный автор:</div>
                <div class="text-white font-semibold">{{ displayAuthorName }}</div>
                <div v-if="displayAuthorTitle" class="text-white/70 text-sm mt-1">{{ displayAuthorTitle }}</div>
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
          <div class="flex flex-col sm:flex-row gap-4 pt-6">
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
              v-if="!isPublished && auth.isModerator"
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


