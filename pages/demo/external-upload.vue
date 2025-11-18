<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white">
    <div class="container mx-auto px-4 pt-4 pb-8 max-w-[1200px]">
      <!-- Главное меню -->
      <DemoNavigation />
      
      <div class="mb-3"></div>

      <!-- Форма создания/обновления -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        
        <div v-if="selectedEventId && !canEditCurrentEvent" class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
          <div class="flex items-center gap-2 text-red-300 font-medium mb-1">
            <span>🔒</span>
            <span>Редактирование заблокировано</span>
          </div>
          <div class="text-red-200/70 text-sm">
            Данный Ивент успешно загружен на платформу, и время Ти-20 (окончание приема заявок) уже прошло. 
            Редактирование невозможно. Вы можете просмотреть данные, но не можете вносить изменения.
          </div>
        </div>
        
        <form @submit.prevent="saveEvent" class="space-y-3">
          <!-- ID мероприятия (только для чтения, показывается только если есть ID от сервера) -->
          <div>
            <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
              <label class="block text-sm font-medium text-white/80">
                Название мероприятия <span class="text-red-400">*</span>
              </label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="handleCreateClick"
                  class="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold py-1.5 px-4 rounded-xl text-sm hover:opacity-90 transition-opacity"
                >
                  ➕ Создать
                </button>
                <button
                  type="button"
                  @click="handleDeleteClick"
                  :disabled="!selectedEventId"
                  :class="[
                    'py-1.5 px-4 rounded-xl text-sm border transition-opacity',
                    selectedEventId
                      ? 'border-red-500/40 text-red-300 bg-red-500/10 hover:bg-red-500/20'
                      : 'border-white/10 text-white/40 cursor-not-allowed bg-white/5'
                  ]"
                >
                  🗑 Удалить
                </button>
              </div>
            </div>
            <textarea 
              v-model="formData.title"
              required
              rows="2"
              placeholder="Кулинарный интенсив"
              :disabled="!!(selectedEventId && !canEditCurrentEvent)"
              :class="[
                'w-full border rounded-xl px-4 py-3 placeholder-white/30 outline-none transition-all break-words',
                selectedEventId && !canEditCurrentEvent
                  ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                  : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20'
              ]"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">
                Имя автора (authorName) <span class="text-red-400">*</span>
              </label>
              <input 
                v-model="formData.authorName"
                type="text" 
                required
                placeholder="Шеф Иванов"
                :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                :class="[
                  'w-full border rounded-xl px-4 py-2.5 placeholder-white/30 outline-none transition-all',
                  selectedEventId && !canEditCurrentEvent
                    ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20'
                ]"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">
                ID мероприятия на платформе
              </label>
              <input 
                :value="formData.id || ''"
                type="text" 
                readonly
                placeholder="Будет присвоен после загрузки"
                class="w-full border rounded-xl px-4 py-2.5 bg-white/5 border-white/10 text-white/70 placeholder-white/30 cursor-not-allowed font-mono text-sm"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-1">
              Место проведения <span class="text-red-400">*</span>
            </label>
            <textarea 
              v-model="formData.location"
              required
              rows="1"
              placeholder="Москва, ул. Поварская, 12"
              :disabled="!!(selectedEventId && !canEditCurrentEvent)"
              :class="[
                'w-full border rounded-xl px-4 py-2 placeholder-white/30 outline-none transition-all break-words',
                selectedEventId && !canEditCurrentEvent
                  ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                  : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20'
              ]"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-1">
              Описание <span class="text-red-400">*</span>
            </label>
            <textarea 
              v-model="formData.description"
              required
              rows="2"
              placeholder="Погружаемся в гастрономию с шефом Ивановым"
              :disabled="!!(selectedEventId && !canEditCurrentEvent)"
              :class="[
                'w-full border rounded-xl px-4 py-2 placeholder-white/30 outline-none transition-all',
                selectedEventId && !canEditCurrentEvent
                  ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                  : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20'
              ]"
            ></textarea>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
            <label class="block text-sm font-medium text-white/80 mb-1">
                Количество участников <span class="text-red-400">*</span>
              </label>
              <input 
                v-model.number="formData.seatLimit"
                type="number" 
                required
                min="1"
                placeholder="12"
                :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                :class="[
                  'w-full border rounded-xl px-4 py-3 placeholder-white/30 outline-none transition-all',
                  selectedEventId && !canEditCurrentEvent
                    ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20'
                ]"
              >
            </div>

            <div>
            <label class="block text-sm font-medium text-white/80 mb-1">
                Цена за место (₽) <span class="text-red-400">*</span>
              </label>
              <input 
                v-model.number="formData.pricePerSeat"
                type="number" 
                required
                min="0"
                step="0.01"
                placeholder="7500"
                :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                :class="[
                  'w-full border rounded-xl px-4 py-3 placeholder-white/30 outline-none transition-all',
                  selectedEventId && !canEditCurrentEvent
                    ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20'
                ]"
              >
            </div>

            <div>
            <label class="block text-sm font-medium text-white/80 mb-1">
                Совокупная стоимость
              </label>
              <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-blue-300 font-semibold">
                {{ formatPrice(totalPrice) }} ₽
              </div>
              <p class="text-xs text-white/50 mt-1">{{ formData.seatLimit || 0 }} × {{ formData.pricePerSeat || 0 }} ₽</p>
            </div>
          </div>


          <!-- ti10, ti20, ti30 в одной строке (6 полей) -->
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-white/80 mb-1">
                Начало приема заявок (ti10) <span class="text-red-400">*</span>
              </label>
              <div class="grid grid-cols-2 gap-1">
                <input 
                  v-model="formData.startApplicationsAtDate"
                  type="date" 
                  required
                  :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                  :class="[
                    'border rounded-lg px-2 py-1.5 text-xs outline-none transition-all',
                    selectedEventId && !canEditCurrentEvent
                      ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20'
                  ]"
                >
                <input 
                  v-model="formData.startApplicationsAtTime"
                  type="time" 
                  required
                  step="60"
                  :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                  :class="[
                    'border rounded-lg px-2 py-1.5 text-xs outline-none transition-all',
                    selectedEventId && !canEditCurrentEvent
                      ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20'
                  ]"
                >
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-white/80 mb-1">
                Окончание приема заявок (ti20) <span class="text-red-400">*</span>
              </label>
              <div class="grid grid-cols-2 gap-1">
                <input 
                  v-model="formData.endApplicationsAtDate"
                  type="date" 
                  required
                  :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                  :class="[
                    'border rounded-lg px-2 py-1.5 text-xs outline-none transition-all',
                    selectedEventId && !canEditCurrentEvent
                      ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20'
                  ]"
                >
                <input 
                  v-model="formData.endApplicationsAtTime"
                  type="time" 
                  required
                  step="60"
                  :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                  :class="[
                    'border rounded-lg px-2 py-1.5 text-xs outline-none transition-all',
                    selectedEventId && !canEditCurrentEvent
                      ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20'
                  ]"
                >
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-white/80 mb-1">
                Начало оформления договоров (ti30) <span class="text-red-400">*</span>
              </label>
              <div class="grid grid-cols-2 gap-1">
                <input 
                  v-model="formData.startContractsAtDate"
                  type="date" 
                  required
                  :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                  :class="[
                    'border rounded-lg px-2 py-1.5 text-xs outline-none transition-all',
                    selectedEventId && !canEditCurrentEvent
                      ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20'
                  ]"
                >
                <input 
                  v-model="formData.startContractsAtTime"
                  type="time" 
                  required
                  step="60"
                  :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                  :class="[
                    'border rounded-lg px-2 py-1.5 text-xs outline-none transition-all',
                    selectedEventId && !canEditCurrentEvent
                      ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20'
                  ]"
                >
              </div>
            </div>
          </div>

          <!-- ti40 и ti50 в одной строке -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Начало мероприятия (ti40) <span class="text-red-400">*</span>
              </label>
              <div class="grid grid-cols-2 gap-2">
                <input 
                  v-model="formData.startAtDate"
                  type="date" 
                  required
                  :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                  :class="[
                    'border rounded-xl px-3 py-2 text-sm outline-none transition-all',
                    selectedEventId && !canEditCurrentEvent
                      ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20'
                  ]"
                >
              <input 
                  v-model="formData.startAtTime"
                  type="time" 
                required
                  step="60"
                  :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                  :class="[
                    'border rounded-xl px-3 py-2 text-sm outline-none transition-all',
                    selectedEventId && !canEditCurrentEvent
                      ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20'
                  ]"
              >
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Окончание мероприятия (ti50) <span class="text-red-400">*</span>
              </label>
              <div class="grid grid-cols-2 gap-2">
              <input 
                  v-model="formData.endAtDate"
                  type="date" 
                  required
                  :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                  :class="[
                    'border rounded-xl px-3 py-2 text-sm outline-none transition-all',
                    selectedEventId && !canEditCurrentEvent
                      ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20'
                  ]"
                >
                <input 
                  v-model="formData.endAtTime"
                  type="time" 
                  required
                  step="60"
                  :disabled="!!(selectedEventId && !canEditCurrentEvent)"
                  :class="[
                    'border rounded-xl px-3 py-2 text-sm outline-none transition-all',
                    selectedEventId && !canEditCurrentEvent
                      ? 'bg-white/10 border-white/20 text-white/70 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20'
                  ]"
                >
              </div>
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="flex gap-4 items-end">
            <button
              type="button"
              @click="handleSaveClick"
              :disabled="!!(selectedEventId && !canEditCurrentEvent)"
              :class="[
                'text-white font-semibold py-3 px-6 rounded-xl transition-opacity',
                selectedEventId && !canEditCurrentEvent
                  ? 'bg-gray-500/30 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90'
              ]"
            >
              {{ selectedEventId && !canEditCurrentEvent ? '🔒 Редактирование заблокировано' : '💾 Сохранить' }}
            </button>
            <div class="flex-1">
              <label class="block text-sm font-medium text-white/80 mb-2">
                Дата/время актуальной версии — обновляется автоматически при сохранении
              </label>
              <div class="grid grid-cols-2 gap-2 max-w-xs">
                <input 
                  :value="formData.createdAtClientDate"
                  type="date" 
                  readonly
                  class="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white/70 cursor-not-allowed text-sm"
                >
                <input 
                  :value="formData.createdAtClientTime"
                  type="time" 
                  readonly
                  step="60"
                  class="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white/70 cursor-not-allowed text-sm"
                >
              </div>
            </div>
          </div>
        </form>

        <!-- Карточка выбранного Ивента -->
        <div v-if="currentEvent" class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          
          <div class="space-y-4">
            <!-- Название -->
            <div>
              <div class="text-xs text-white/50 mb-1">Редактируется</div>
              <div class="text-lg font-semibold text-white break-words">{{ currentEvent.title }}</div>
            </div>
            
            <!-- Дата создания/редактирования на демо-сайте -->
            <div>
              <div class="text-xs text-white/50 mb-1">Дата/время создания/редактирования на демо-сайте</div>
              <div class="text-white/90">{{ formatEventDate(currentEvent.createdAt) }}</div>
            </div>
            
            <!-- Статус на платформе -->
            <div class="pt-4 border-t border-white/10">
              <div class="text-xs text-white/50 mb-2">Статус на платформе</div>
              <div v-if="currentEvent.uploadStatus === 'upload_success'" class="flex items-center gap-2 text-green-400 mb-2">
                <span>✅</span>
                <span>Успешно загружен</span>
                <span v-if="currentEvent.lastUploadAttempt" class="text-green-300/70 text-xs">
                  ({{ formatEventDate(currentEvent.lastUploadAttempt) }})
                </span>
              </div>
              <div v-else-if="currentEvent.uploadStatus === 'upload_failed'" class="flex items-center gap-2 text-red-400 mb-2">
                <span>❌</span>
                <span>В загрузке отказано - обнаружена ошибка</span>
              </div>
              <div v-else class="flex items-center gap-2 text-gray-400 mb-2">
                <span>⏸️</span>
                <span>Не загружен</span>
              </div>
              
              <!-- Ошибки загрузки -->
              <div v-if="currentEvent.uploadStatus === 'upload_failed' && currentEvent.uploadError" class="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div class="text-xs text-red-300 font-medium mb-2">Ошибки, обнаруженные платформой:</div>
                <div v-if="getErrorCount(currentEvent.uploadError) === 1" class="text-xs text-red-200/80 break-words">
                  {{ getFirstError(currentEvent.uploadError) }}
                </div>
                <div v-else>
                  <div class="text-xs text-red-200/80 mb-2">
                    Обнаружено {{ getErrorCount(currentEvent.uploadError) }} ошибок:
                  </div>
                  <ul class="list-disc pl-4 space-y-1">
                    <li v-for="(err, idx) in getErrorArray(currentEvent.uploadError)" :key="idx" class="text-xs text-red-200/80 break-words">
                      {{ err }}
                    </li>
                  </ul>
                </div>
              </div>
              
              <div v-if="currentEvent.serverId" class="mt-2 text-xs text-white/50">
                ID на платформе: <span class="font-mono text-white/70">{{ currentEvent.serverId }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Информация о загрузке на платформу -->
        <div class="border-t border-white/10 pt-4">
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
            <div class="flex items-start gap-3">
              <span class="text-blue-400 text-xl">ℹ️</span>
              <div class="flex-1">
                <div class="text-blue-200/70 text-sm">
                  Для загрузки Ивента на платформу, обновления статуса и публикации перейдите на страницу 
                  <NuxtLink to="/demo/platform-interaction" class="text-blue-400 hover:text-blue-300 underline font-medium">Загрузить на платформу</NuxtLink>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Диалог сохранения нового Ивента -->
      <Teleport to="body">
            <div 
              v-if="showSaveDialog"
              class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              @click.self="showSaveDialog = false"
            >
              <div class="bg-[#1A1F2E] border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4">
                <h3 class="text-xl font-semibold mb-4 text-white">Сохранить новый Ивент</h3>
                
                <div class="mb-4">
                  <label class="block text-sm font-medium text-white/80 mb-2">
                    Название Ивента <span class="text-red-400">*</span>
                  </label>
                  <input 
                    v-model="eventSaveName"
                    type="text" 
                    placeholder="Введите название Ивента"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                    @keyup.enter="confirmSaveEvent"
                    autofocus
                  >
                </div>
                
                <div class="flex gap-3">
                  <button
                    @click="confirmSaveEvent"
                    class="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Сохранить
                  </button>
                  <button
                    @click="showSaveDialog = false; eventSaveName = ''"
                    class="px-6 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-opacity"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </Teleport>

      <!-- Результаты -->
      <div v-if="response" class="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 class="text-2xl font-semibold mb-4">Ответ сервера</h2>
        <pre class="bg-black/30 rounded-xl p-4 text-sm overflow-auto max-h-96">{{ JSON.stringify(response, null, 2) }}</pre>
      </div>

      <!-- Ошибки -->
      <div v-if="error" class="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 mt-6">
        <h2 class="text-xl font-semibold mb-4 text-red-400">Ошибки валидации</h2>
        <ul class="space-y-2">
          <li v-for="(errorMessage, index) in formattedErrors" :key="index" class="text-red-300 text-sm">
            {{ errorMessage }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { DateTime } from 'luxon'

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBaseUrl

// API Key management
const apiKey = ref<string>('')
const copied = ref(false)

// Управление эскизами (пред-черновики на клиенте)
const EVENTS_STORAGE_KEY = 'external_events_list'

// Интерфейс для сохраненного Ивента
interface SavedEvent {
  id: string // Уникальный идентификатор
  title: string // Название для отображения в списке
  data: any // Данные формы
  createdAt: string // Дата создания/обновления
  uploadStatus?: 'not_uploaded' | 'upload_success' | 'upload_failed' // Статус загрузки на платформу
  lastUploadAttempt?: string // Дата/время последней попытки загрузки
  serverId?: string // ID на сервере (если успешно загружен)
  uploadError?: string // Код/сообщение об ошибке (если неуспешно)
  isPublished?: boolean // Флаг публикации
  publishedAt?: string // Дата/время публикации
}

// Форма создания события (с раздельными полями даты и времени)
const formData = ref({
  id: '',
  title: '',
  authorName: '',
  location: '',
  seatLimit: 12,
  pricePerSeat: 7500,
  description: '',
  timezone: 'Europe/Moscow',
  // Раздельные поля для даты и времени
  createdAtClientDate: '',
  createdAtClientTime: '',
  startApplicationsAtDate: '',
  startApplicationsAtTime: '',
  endApplicationsAtDate: '',
  endApplicationsAtTime: '',
  startContractsAtDate: '',
  startContractsAtTime: '',
  startAtDate: '',
  startAtTime: '',
  endAtDate: '',
  endAtTime: ''
})

// Функция для разделения datetime-local на date и time
const splitDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return { date: '', time: '' }
  const [date, time] = dateTimeStr.split('T')
  return { date: date || '', time: (time || '').substring(0, 5) || '' }
}

// Функция для объединения date и time в datetime-local формат
const combineDateTime = (date: string, time: string): string => {
  if (!date || !time) return ''
  return `${date}T${time}`
}

// Функция для обновления даты создания на клиенте
const updateCreatedAtClient = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  
  formData.value.createdAtClientDate = `${year}-${month}-${day}`
  formData.value.createdAtClientTime = `${hours}:${minutes}`
}

// Текущий выбранный Ивент для редактирования
const selectedEventId = ref<string | null>(null)

// Получение списка всех сохраненных Ивентов
const getSavedEvents = (): SavedEvent[] => {
  try {
    const saved = localStorage.getItem(EVENTS_STORAGE_KEY)
    if (!saved) return []
    
    // Проверяем, это старый формат (один эскиз) или новый (массив)
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) {
      // Убеждаемся, что у всех Ивентов есть статус
      return parsed.map((event: SavedEvent) => ({
        ...event,
        uploadStatus: event.uploadStatus || 'not_uploaded'
      }))
    } else if (parsed && typeof parsed === 'object') {
      // Миграция со старого формата - преобразуем в массив
      const migrated: SavedEvent[] = [{
        id: `event-${Date.now()}`,
        title: parsed.title || 'Сохраненный Ивент',
        data: parsed,
        createdAt: new Date().toISOString()
      }]
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
    return []
  } catch {
    return []
  }
}

// Список сохраненных Ивентов
const savedEvents = ref<SavedEvent[]>([])

// Загрузка списка Ивентов
const loadEventsList = () => {
  savedEvents.value = getSavedEvents()
}

// Сохранение списка Ивентов
const saveEventsList = (events: SavedEvent[]) => {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
  loadEventsList()
}

// Функция для загрузки API ключа из localStorage
const loadApiKey = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('external_api_key')
    if (stored) {
      apiKey.value = stored
    }
  }
}

// Функция для сброса формы к начальным значениям
const resetForm = () => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const twoWeeks = new Date(now)
  twoWeeks.setDate(twoWeeks.getDate() + 14)

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // Полностью очищаем форму и устанавливаем значения по умолчанию
  formData.value = {
    id: '',
    title: '',
    authorName: '',
    location: '',
    seatLimit: '' as any,
    pricePerSeat: '' as any,
    description: '',
    timezone: 'Europe/Moscow',
    // createdAtClient НЕ заполняется автоматически - только при сохранении
    createdAtClientDate: '',
    createdAtClientTime: '',
    startApplicationsAtDate: formatDate(tomorrow),
    startApplicationsAtTime: formatTime(tomorrow),
    endApplicationsAtDate: formatDate(nextWeek),
    endApplicationsAtTime: formatTime(nextWeek),
    startContractsAtDate: formatDate(nextWeek),
    startContractsAtTime: formatTime(nextWeek),
    startAtDate: formatDate(twoWeeks),
    startAtTime: formatTime(twoWeeks),
    endAtDate: formatDate(twoWeeks),
    endAtTime: formatTime(twoWeeks)
  }
}

// Загрузка API ключа и списка Ивентов при монтировании
onMounted(() => {
  loadApiKey()
  
  // Загружаем список Ивентов
  loadEventsList()
  
  // Восстанавливаем последний выбранный Ивент при переходе с платформы
  if (typeof window !== 'undefined') {
    const lastId = localStorage.getItem('last_selected_event_id')
    if (lastId) {
      // Проверяем, существует ли такой Ивент в локальном списке
      const exists = savedEvents.value.some(e => e.id === lastId)
      if (exists) {
        // Автоматически загружаем Ивент для редактирования
        loadEventForEditing(lastId)
      } else {
        // Если Ивент не найден, очищаем запись
        localStorage.removeItem('last_selected_event_id')
        resetForm()
      }
    } else {
      // Если нет сохраненного Ивента, форма остается пустой
      resetForm()
    }
  } else {
    resetForm()
  }
})


// Сохранение API ключа
const saveApiKey = (key: string) => {
  apiKey.value = key
  localStorage.setItem('external_api_key', key)
}

// Очистка API ключа
const clearApiKey = () => {
  apiKey.value = ''
  localStorage.removeItem('external_api_key')
  response.value = null
  error.value = null
}

// Копирование API ключа
const copyApiKey = async () => {
  if (apiKey.value) {
    try {
      await navigator.clipboard.writeText(apiKey.value)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
}


// Состояние для диалога сохранения Ивента
const showSaveDialog = ref(false)
const eventSaveName = ref('')

// Текущий выбранный Ивент
const currentEvent = computed(() => {
  if (!selectedEventId.value) return null
  return savedEvents.value.find(e => e.id === selectedEventId.value)
})

// Computed свойство для отслеживания несохраненных изменений
const hasUnsavedChangesComputed = computed(() => {
  return hasUnsavedChanges()
})

// Обработчик создания нового Ивента
// ВАЖНО: Эта функция НЕ сохраняет текущие данные перед очисткой формы
// Она просто очищает форму без записи, чтобы пользователь мог начать создавать новый Ивент
const handleNewEventClick = () => {
  // Сбрасываем выбранный Ивент
  selectedEventId.value = null
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('last_selected_event_id')
  }
  
  // Полностью очищаем форму и устанавливаем значения по умолчанию
  // БЕЗ сохранения текущих данных
  resetForm()
  
  // Очищаем сообщения об ошибках и ответах
  error.value = null
  response.value = null
}

// Обработчик кнопки "Создать"
const handleCreateClick = () => {
  // Если есть несохраненные изменения, спрашиваем подтверждение
  if (hasUnsavedChanges()) {
    if (!confirm('У вас есть несохраненные изменения. Создание нового Ивента удалит все текущие данные. Продолжить?')) {
      return
    }
  }
  handleNewEventClick()
}

const handleDeleteClick = () => {
  if (!selectedEventId.value) {
    alert('Сначала выберите Ивент для удаления')
    return
  }
  deleteEvent(selectedEventId.value)
}

// Обработчик кнопки "Сохранить"
const handleSaveClick = () => {
  if (!selectedEventId.value) {
    // Если нет выбранного Ивента, показываем диалог сохранения нового
    if (!formData.value.title?.trim()) {
      error.value = { message: 'Пожалуйста, введите название Ивента' }
      return
    }
    showSaveDialog.value = true
    eventSaveName.value = formData.value.title
  } else {
    // Если есть выбранный Ивент, сохраняем изменения
    // Если перед этим не была нажата кнопка "Создать", спрашиваем подтверждение
    if (hasUnsavedChanges()) {
      if (!confirm('Вы уверены, что хотите сохранить изменения? Предыдущие данные будут перезаписаны.')) {
        return
      }
    }
    updateCurrentEvent()
  }
}

// Функции для работы с ошибками в карточке выбранного Ивента
const getErrorArray = (uploadError: string | string[] | undefined): string[] => {
  if (!uploadError) return []
  if (Array.isArray(uploadError)) return uploadError
  return [uploadError]
}

const getErrorCount = (uploadError: string | string[] | undefined): number => {
  return getErrorArray(uploadError).length
}

const getFirstError = (uploadError: string | string[] | undefined): string => {
  const errors = getErrorArray(uploadError)
  return errors[0] || 'Неизвестная ошибка'
}

// Сохранение текущего Ивента
const saveEvent = () => {
  // Если есть выбранный Ивент - обновляем его, иначе просим название
  if (selectedEventId.value) {
    updateCurrentEvent()
  } else {
    showSaveDialog.value = true
    eventSaveName.value = formData.value.title || 'Новый Ивент'
  }
}

// Подтверждение сохранения с названием
const confirmSaveEvent = () => {
  if (!eventSaveName.value.trim()) {
    error.value = { message: 'Пожалуйста, введите название Ивента' }
    return
  }
  
  try {
    updateCreatedAtClient()
    const draftData = { ...formData.value }
    
    const events = getSavedEvents()
    const newEvent: SavedEvent = {
      id: `event-${Date.now()}`,
      title: eventSaveName.value.trim(),
      data: draftData,
      createdAt: new Date().toISOString(),
      uploadStatus: 'not_uploaded'
    }
    
    events.push(newEvent)
    saveEventsList(events)
    selectedEventId.value = newEvent.id
    localStorage.setItem('last_selected_event_id', newEvent.id)
    
    showSaveDialog.value = false
    eventSaveName.value = ''
    
    // Локальное сохранение: не заполняем область "Ответ сервера"
  } catch (err: any) {
    error.value = { message: 'Ошибка при сохранении Ивента: ' + (err.message || 'Неизвестная ошибка') }
  }
}

// Проверка наличия несохраненных изменений
const hasUnsavedChanges = (): boolean => {
  if (!selectedEventId.value) {
    // Если нет выбранного Ивента, но форма заполнена - есть несохраненные изменения
    return !!(formData.value.title || formData.value.authorName || formData.value.location)
  }
  
  try {
    const event = savedEvents.value.find(e => e.id === selectedEventId.value)
    if (!event) return true
    
    // Сравниваем текущие данные формы с сохраненными данными
    const savedData = event.data
    const currentData = formData.value
    
    // Сравниваем основные поля
    if (savedData.title !== currentData.title) return true
    if (savedData.authorName !== currentData.authorName) return true
    if (savedData.location !== currentData.location) return true
    if (savedData.seatLimit !== currentData.seatLimit) return true
    if (savedData.pricePerSeat !== currentData.pricePerSeat) return true
    if (savedData.description !== currentData.description) return true
    if (savedData.timezone !== currentData.timezone) return true
    
    // Сравниваем даты и времена
    const dateTimeFields = [
      'createdAtClient', 'startApplicationsAt', 'endApplicationsAt', 
      'startContractsAt', 'startAt', 'endAt'
    ]
    
    for (const field of dateTimeFields) {
      const savedDate = (savedData as any)[`${field}Date`]
      const savedTime = (savedData as any)[`${field}Time`]
      const currentDate = (currentData as any)[`${field}Date`]
      const currentTime = (currentData as any)[`${field}Time`]
      
      if (savedDate !== currentDate || savedTime !== currentTime) {
        return true
      }
    }
    
    return false
  } catch (err) {
    console.error('Error checking unsaved changes:', err)
    return true // В случае ошибки считаем, что есть изменения
  }
}

// Обновление текущего Ивента
const updateCurrentEvent = () => {
  if (!selectedEventId.value) return
  
  // Проверяем возможность редактирования
  if (!canEditCurrentEvent.value) {
    error.value = { message: 'Редактирование заблокировано. Время Ти-20 (окончание приема заявок) прошло.' }
    return
  }
  
  try {
    updateCreatedAtClient()
    const draftData = { ...formData.value }
    
    const events = getSavedEvents()
    const index = events.findIndex(e => e.id === selectedEventId.value)
    
    if (index >= 0) {
      events[index].data = draftData
      events[index].title = formData.value.title || events[index].title // Обновляем название из формы
      events[index].createdAt = new Date().toISOString()
      
      // Сохраняем serverId, если он есть в форме
      if (formData.value.id) {
        events[index].serverId = formData.value.id
      }
      
      saveEventsList(events)
      
      // Локальное обновление: не заполняем область "Ответ сервера"
    }
  } catch (err: any) {
    error.value = { message: 'Ошибка при обновлении Ивента: ' + (err.message || 'Неизвестная ошибка') }
  }
}

// Загрузка Ивента для редактирования
const loadEventForEditing = (eventId: string) => {
  try {
    const event = savedEvents.value.find(e => e.id === eventId)
    if (!event) {
      error.value = { message: 'Ивент не найден' }
      return
    }
    
    let draftData = { ...event.data }
    
    // Конвертируем старый формат (datetime-local) в новый (date + time) если нужно
    if (draftData.createdAtClient && !draftData.createdAtClientDate) {
      const { date, time } = splitDateTime(draftData.createdAtClient)
      draftData.createdAtClientDate = date
      draftData.createdAtClientTime = time
      delete draftData.createdAtClient
    }
    
    // То же самое для других полей
    const dateTimeFields = ['startApplicationsAt', 'endApplicationsAt', 'startContractsAt', 'startAt', 'endAt']
    dateTimeFields.forEach(field => {
      if (draftData[field] && !draftData[`${field}Date`]) {
        const { date, time } = splitDateTime(draftData[field])
        draftData[`${field}Date`] = date
        draftData[`${field}Time`] = time
        delete draftData[field]
      }
    })
    
    formData.value = { ...formData.value, ...draftData }
    
    // Восстанавливаем serverId, если он есть
    if (event.serverId && !formData.value.id) {
      formData.value.id = event.serverId
    }
    
    selectedEventId.value = eventId
    localStorage.setItem('last_selected_event_id', eventId)
    
    // НЕ устанавливаем response.value, так как это локальная операция, не ответ сервера
    // Очищаем предыдущие сообщения от сервера при переключении между эскизами
    response.value = null
    error.value = null
  } catch (err: any) {
    error.value = { message: 'Ошибка при загрузке Ивента: ' + (err.message || 'Неизвестная ошибка') }
  }
}

// Удаление Ивента
const deleteEvent = (eventId: string) => {
  const event = savedEvents.value.find(e => e.id === eventId)
  const eventName = event?.title || 'Ивент'
  
  if (!confirm(`Вы уверены, что хотите удалить Ивент "${eventName}"?`)) {
    return
  }
  
  try {
    const events = getSavedEvents().filter(e => e.id !== eventId)
    saveEventsList(events)
    
    // Если удаляли текущий Ивент - очищаем форму
    if (selectedEventId.value === eventId) {
      selectedEventId.value = null
      localStorage.removeItem('last_selected_event_id')
      // Сбрасываем форму на значения по умолчанию (используем единую функцию)
      resetForm()
    }
    
    response.value = { success: true, message: `Ивент "${eventName}" удален` }
    setTimeout(() => {
      if (response.value?.message?.includes('удален')) {
        response.value = null
      }
    }, 2000)
  } catch (err: any) {
    error.value = { message: 'Ошибка при удалении Ивента: ' + (err.message || 'Неизвестная ошибка') }
  }
}

// Форматирование даты для отображения
const formatEventDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

// Проверка возможности редактирования Ивента
const canEditEvent = (event: SavedEvent): boolean => {
  // Если Ивент не загружен на платформу - можно редактировать
  if (event.uploadStatus !== 'upload_success') {
    return true
  }
  
  // Если загружен на платформу, проверяем время Ти-20
  if (!event.data || !event.data.endApplicationsAtDate || !event.data.endApplicationsAtTime) {
    // Если нет данных о Ти-20, разрешаем редактирование
    return true
  }
  
  try {
    // Создаем дату Ти-20 из данных Ивента
    const endApplicationsDate = event.data.endApplicationsAtDate
    const endApplicationsTime = event.data.endApplicationsAtTime
    const timezone = event.data.timezone || 'Europe/Moscow'
    
    // Валидируем и парсим время
    const timeParts = endApplicationsTime.split(':')
    if (timeParts.length < 2) {
      // Некорректный формат времени, разрешаем редактирование
      return true
    }
    
    const hours = Number.parseInt(timeParts[0], 10)
    const minutes = Number.parseInt(timeParts[1], 10)
    
    // Валидация часов и минут
    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      // Некорректные значения времени, разрешаем редактирование
      return true
    }
    
    // Парсим дату на компоненты
    const dateParts = endApplicationsDate.split('-')
    if (dateParts.length !== 3) {
      // Некорректный формат даты, разрешаем редактирование
      return true
    }
    
    const year = Number.parseInt(dateParts[0], 10)
    const month = Number.parseInt(dateParts[1], 10)
    const day = Number.parseInt(dateParts[2], 10)
    
    // Валидация компонентов даты
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
      // Некорректные значения даты, разрешаем редактирование
      return true
    }
    
    // Создаем DateTime объект из компонентов даты и времени, интерпретируя их как время в указанной временной зоне
    const eventDateTime = DateTime.fromObject(
      {
        year: year,
        month: month,
        day: day,
        hour: hours,
        minute: minutes,
        second: 0
      },
      { zone: timezone }
    )
    
    // Проверяем валидность даты
    if (!eventDateTime.isValid) {
      // Некорректная дата, разрешаем редактирование
      return true
    }
    
    // Конвертируем в UTC timestamp (миллисекунды с Unix эпохи)
    const endDateUtcTimestamp = eventDateTime.toMillis()
    
    // Проверяем, прошло ли время Ти-20 (сравниваем в UTC)
    const nowUtc = Date.now()
    return nowUtc < endDateUtcTimestamp
  } catch {
    // В случае ошибки разрешаем редактирование
    return true
  }
}

// Computed для проверки возможности редактирования текущего Ивента
const canEditCurrentEvent = computed(() => {
  if (!currentEvent.value) return true
  return canEditEvent(currentEvent.value)
})

const response = ref<any>(null)
const error = ref<any>(null)

// Вычисление общей стоимости мероприятия
const totalPrice = computed(() => {
  const seats = formData.value.seatLimit || 0
  const price = formData.value.pricePerSeat || 0
  return seats * price
})

// Форматирование цены
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

// Получение всех IANA timezones сгруппированных по регионам
const getAllTimezones = () => {
  // Пытаемся использовать Intl.supportedValuesOf если доступно (ES2022)
  let timezones: string[] = []
  
  try {
    if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
      timezones = Intl.supportedValuesOf('timeZone')
    } else {
      // Fallback: полный список основных IANA timezones
      timezones = [
        // Africa
        'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers', 'Africa/Asmara',
        'Africa/Bamako', 'Africa/Bangui', 'Africa/Banjul', 'Africa/Bissau', 'Africa/Blantyre',
        'Africa/Brazzaville', 'Africa/Bujumbura', 'Africa/Cairo', 'Africa/Casablanca', 'Africa/Ceuta',
        'Africa/Conakry', 'Africa/Dakar', 'Africa/Dar_es_Salaam', 'Africa/Djibouti', 'Africa/Douala',
        'Africa/El_Aaiun', 'Africa/Freetown', 'Africa/Gaborone', 'Africa/Harare', 'Africa/Johannesburg',
        'Africa/Juba', 'Africa/Kampala', 'Africa/Khartoum', 'Africa/Kigali', 'Africa/Kinshasa',
        'Africa/Lagos', 'Africa/Libreville', 'Africa/Lome', 'Africa/Luanda', 'Africa/Lubumbashi',
        'Africa/Lusaka', 'Africa/Malabo', 'Africa/Maputo', 'Africa/Maseru', 'Africa/Mbabane',
        'Africa/Mogadishu', 'Africa/Monrovia', 'Africa/Nairobi', 'Africa/Ndjamena', 'Africa/Niamey',
        'Africa/Nouakchott', 'Africa/Ouagadougou', 'Africa/Porto-Novo', 'Africa/Sao_Tome', 'Africa/Tripoli',
        'Africa/Tunis', 'Africa/Windhoek',
        // America
        'America/Adak', 'America/Anchorage', 'America/Anguilla', 'America/Antigua', 'America/Araguaina',
        'America/Argentina/Buenos_Aires', 'America/Argentina/Catamarca', 'America/Argentina/Cordoba',
        'America/Argentina/Jujuy', 'America/Argentina/La_Rioja', 'America/Argentina/Mendoza',
        'America/Argentina/Rio_Gallegos', 'America/Argentina/Salta', 'America/Argentina/San_Juan',
        'America/Argentina/San_Luis', 'America/Argentina/Tucuman', 'America/Argentina/Ushuaia',
        'America/Aruba', 'America/Asuncion', 'America/Atikokan', 'America/Bahia', 'America/Bahia_Banderas',
        'America/Barbados', 'America/Belem', 'America/Belize', 'America/Blanc-Sablon', 'America/Boa_Vista',
        'America/Bogota', 'America/Boise', 'America/Cambridge_Bay', 'America/Campo_Grande', 'America/Cancun',
        'America/Caracas', 'America/Cayenne', 'America/Cayman', 'America/Chicago', 'America/Chihuahua',
        'America/Costa_Rica', 'America/Creston', 'America/Cuiaba', 'America/Curacao', 'America/Danmarkshavn',
        'America/Dawson', 'America/Dawson_Creek', 'America/Denver', 'America/Detroit', 'America/Dominica',
        'America/Edmonton', 'America/Eirunepe', 'America/El_Salvador', 'America/Fort_Nelson', 'America/Fortaleza',
        'America/Glace_Bay', 'America/Godthab', 'America/Goose_Bay', 'America/Grand_Turk', 'America/Grenada',
        'America/Guadeloupe', 'America/Guatemala', 'America/Guayaquil', 'America/Guyana', 'America/Halifax',
        'America/Havana', 'America/Hermosillo', 'America/Indiana/Indianapolis', 'America/Indiana/Knox',
        'America/Indiana/Marengo', 'America/Indiana/Petersburg', 'America/Indiana/Tell_City',
        'America/Indiana/Vevay', 'America/Indiana/Vincennes', 'America/Indiana/Winamac', 'America/Inuvik',
        'America/Iqaluit', 'America/Jamaica', 'America/Juneau', 'America/Kentucky/Louisville',
        'America/Kentucky/Monticello', 'America/Kralendijk', 'America/La_Paz', 'America/Lima',
        'America/Los_Angeles', 'America/Lower_Princes', 'America/Maceio', 'America/Managua',
        'America/Manaus', 'America/Marigot', 'America/Martinique', 'America/Matamoros', 'America/Mazatlan',
        'America/Menominee', 'America/Merida', 'America/Metlakatla', 'America/Mexico_City', 'America/Miquelon',
        'America/Moncton', 'America/Monterrey', 'America/Montevideo', 'America/Montserrat', 'America/Nassau',
        'America/New_York', 'America/Nipigon', 'America/Nome', 'America/Noronha', 'America/North_Dakota/Beulah',
        'America/North_Dakota/Center', 'America/North_Dakota/New_Salem', 'America/Nuuk', 'America/Ojinaga',
        'America/Panama', 'America/Pangnirtung', 'America/Paramaribo', 'America/Phoenix', 'America/Port-au-Prince',
        'America/Port_of_Spain', 'America/Porto_Velho', 'America/Puerto_Rico', 'America/Punta_Arenas',
        'America/Rainy_River', 'America/Rankin_Inlet', 'America/Recife', 'America/Regina', 'America/Resolute',
        'America/Rio_Branco', 'America/Santarem', 'America/Santiago', 'America/Santo_Domingo', 'America/Sao_Paulo',
        'America/Scoresbysund', 'America/Sitka', 'America/St_Barthelemy', 'America/St_Johns', 'America/St_Kitts',
        'America/St_Lucia', 'America/St_Thomas', 'America/St_Vincent', 'America/Swift_Current', 'America/Tegucigalpa',
        'America/Thule', 'America/Thunder_Bay', 'America/Tijuana', 'America/Toronto', 'America/Tortola',
        'America/Vancouver', 'America/Whitehorse', 'America/Winnipeg', 'America/Yakutat', 'America/Yellowknife',
        // Antarctica
        'Antarctica/Casey', 'Antarctica/Davis', 'Antarctica/DumontDUrville', 'Antarctica/Macquarie',
        'Antarctica/Mawson', 'Antarctica/McMurdo', 'Antarctica/Palmer', 'Antarctica/Rothera', 'Antarctica/Syowa',
        'Antarctica/Troll', 'Antarctica/Vostok',
        // Arctic
        'Arctic/Longyearbyen',
        // Asia
        'Asia/Aden', 'Asia/Almaty', 'Asia/Amman', 'Asia/Anadyr', 'Asia/Aqtau', 'Asia/Aqtobe', 'Asia/Ashgabat',
        'Asia/Atyrau', 'Asia/Baghdad', 'Asia/Bahrain', 'Asia/Baku', 'Asia/Bangkok', 'Asia/Barnaul', 'Asia/Beirut',
        'Asia/Bishkek', 'Asia/Brunei', 'Asia/Chita', 'Asia/Choibalsan', 'Asia/Colombo', 'Asia/Damascus',
        'Asia/Dhaka', 'Asia/Dili', 'Asia/Dubai', 'Asia/Dushanbe', 'Asia/Famagusta', 'Asia/Gaza', 'Asia/Hebron',
        'Asia/Ho_Chi_Minh', 'Asia/Hong_Kong', 'Asia/Hovd', 'Asia/Irkutsk', 'Asia/Jakarta', 'Asia/Jayapura',
        'Asia/Jerusalem', 'Asia/Kabul', 'Asia/Kamchatka', 'Asia/Karachi', 'Asia/Kathmandu', 'Asia/Khandyga',
        'Asia/Kolkata', 'Asia/Krasnoyarsk', 'Asia/Kuala_Lumpur', 'Asia/Kuching', 'Asia/Kuwait', 'Asia/Macau',
        'Asia/Magadan', 'Asia/Makassar', 'Asia/Manila', 'Asia/Muscat', 'Asia/Nicosia', 'Asia/Novokuznetsk',
        'Asia/Novosibirsk', 'Asia/Omsk', 'Asia/Oral', 'Asia/Phnom_Penh', 'Asia/Pontianak', 'Asia/Pyongyang',
        'Asia/Qatar', 'Asia/Qostanay', 'Asia/Qyzylorda', 'Asia/Riyadh', 'Asia/Sakhalin', 'Asia/Samarkand',
        'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Srednekolymsk', 'Asia/Taipei', 'Asia/Tashkent',
        'Asia/Tbilisi', 'Asia/Tehran', 'Asia/Thimphu', 'Asia/Tokyo', 'Asia/Tomsk', 'Asia/Ulaanbaatar',
        'Asia/Urumqi', 'Asia/Ust-Nera', 'Asia/Vientiane', 'Asia/Vladivostok', 'Asia/Yakutsk', 'Asia/Yangon',
        'Asia/Yekaterinburg', 'Asia/Yerevan',
        // Atlantic
        'Atlantic/Azores', 'Atlantic/Bermuda', 'Atlantic/Canary', 'Atlantic/Cape_Verde', 'Atlantic/Faroe',
        'Atlantic/Madeira', 'Atlantic/Reykjavik', 'Atlantic/South_Georgia', 'Atlantic/St_Helena',
        'Atlantic/Stanley',
        // Australia
        'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Broken_Hill', 'Australia/Currie',
        'Australia/Darwin', 'Australia/Eucla', 'Australia/Hobart', 'Australia/Lindeman', 'Australia/Lord_Howe',
        'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
        // Europe
        'Europe/Amsterdam', 'Europe/Andorra', 'Europe/Astrakhan', 'Europe/Athens', 'Europe/Belgrade',
        'Europe/Berlin', 'Europe/Bratislava', 'Europe/Brussels', 'Europe/Bucharest', 'Europe/Budapest',
        'Europe/Busingen', 'Europe/Chisinau', 'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Gibraltar',
        'Europe/Guernsey', 'Europe/Helsinki', 'Europe/Isle_of_Man', 'Europe/Istanbul', 'Europe/Jersey',
        'Europe/Kaliningrad', 'Europe/Kiev', 'Europe/Kirov', 'Europe/Lisbon', 'Europe/Ljubljana',
        'Europe/London', 'Europe/Luxembourg', 'Europe/Madrid', 'Europe/Malta', 'Europe/Mariehamn',
        'Europe/Minsk', 'Europe/Monaco', 'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris', 'Europe/Podgorica',
        'Europe/Prague', 'Europe/Riga', 'Europe/Rome', 'Europe/Samara', 'Europe/San_Marino', 'Europe/Sarajevo',
        'Europe/Saratov', 'Europe/Simferopol', 'Europe/Skopje', 'Europe/Sofia', 'Europe/Stockholm',
        'Europe/Tallinn', 'Europe/Tirane', 'Europe/Ulyanovsk', 'Europe/Uzhgorod', 'Europe/Vaduz',
        'Europe/Vatican', 'Europe/Vienna', 'Europe/Vilnius', 'Europe/Volgograd', 'Europe/Warsaw',
        'Europe/Zagreb', 'Europe/Zaporozhye', 'Europe/Zurich',
        // Indian
        'Indian/Antananarivo', 'Indian/Chagos', 'Indian/Christmas', 'Indian/Cocos', 'Indian/Comoro',
        'Indian/Kerguelen', 'Indian/Mahe', 'Indian/Maldives', 'Indian/Mauritius', 'Indian/Mayotte',
        'Indian/Reunion',
        // Pacific
        'Pacific/Apia', 'Pacific/Auckland', 'Pacific/Bougainville', 'Pacific/Chatham', 'Pacific/Chuuk',
        'Pacific/Easter', 'Pacific/Efate', 'Pacific/Fakaofo', 'Pacific/Fiji', 'Pacific/Funafuti',
        'Pacific/Galapagos', 'Pacific/Gambier', 'Pacific/Guadalcanal', 'Pacific/Guam', 'Pacific/Honolulu',
        'Pacific/Kiritimati', 'Pacific/Kosrae', 'Pacific/Kwajalein', 'Pacific/Majuro', 'Pacific/Marquesas',
        'Pacific/Midway', 'Pacific/Nauru', 'Pacific/Niue', 'Pacific/Norfolk', 'Pacific/Noumea',
        'Pacific/Pago_Pago', 'Pacific/Palau', 'Pacific/Pitcairn', 'Pacific/Pohnpei', 'Pacific/Port_Moresby',
        'Pacific/Rarotonga', 'Pacific/Saipan', 'Pacific/Tahiti', 'Pacific/Tarawa', 'Pacific/Tongatapu',
        'Pacific/Wake', 'Pacific/Wallis',
        // UTC
        'UTC', 'GMT', 'Etc/GMT', 'Etc/GMT+1', 'Etc/GMT+2', 'Etc/GMT+3', 'Etc/GMT+4', 'Etc/GMT+5',
        'Etc/GMT+6', 'Etc/GMT+7', 'Etc/GMT+8', 'Etc/GMT+9', 'Etc/GMT+10', 'Etc/GMT+11', 'Etc/GMT+12',
        'Etc/GMT-1', 'Etc/GMT-2', 'Etc/GMT-3', 'Etc/GMT-4', 'Etc/GMT-5', 'Etc/GMT-6', 'Etc/GMT-7',
        'Etc/GMT-8', 'Etc/GMT-9', 'Etc/GMT-10', 'Etc/GMT-11', 'Etc/GMT-12', 'Etc/GMT-13', 'Etc/GMT-14'
      ]
    }
  } catch (e) {
    console.warn('Could not get timezones:', e)
    // Минимальный fallback список
    timezones = [
      'Europe/Moscow', 'Asia/Sakhalin', 'Asia/Vladivostok', 'Asia/Yekaterinburg', 'Asia/Krasnoyarsk',
      'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo', 'Asia/Shanghai',
      'Australia/Sydney', 'Asia/Kolkata', 'Europe/Paris', 'America/Chicago', 'Asia/Dubai'
    ]
  }
  
  // Группировка по регионам
  const groups: Record<string, { label: string; timezones: Array<{ value: string; display: string }> }> = {
    europe: { label: 'Europe', timezones: [] },
    asia: { label: 'Asia', timezones: [] },
    america: { label: 'America', timezones: [] },
    africa: { label: 'Africa', timezones: [] },
    pacific: { label: 'Pacific', timezones: [] },
    australia: { label: 'Australia', timezones: [] },
    atlantic: { label: 'Atlantic', timezones: [] },
    indian: { label: 'Indian Ocean', timezones: [] },
    antarctica: { label: 'Antarctica', timezones: [] },
    arctic: { label: 'Arctic', timezones: [] },
    etc: { label: 'Other (UTC/GMT)', timezones: [] }
  }
  
  // Функция для форматирования timezone
  const formatTimezoneDisplay = (tz: string): string => {
    const tzParts = tz.split('/')
    // Берем последнюю часть (локацию) и заменяем подчеркивания на пробелы
    const location = tzParts[tzParts.length - 1].replace(/_/g, ' ')
    
    // Пытаемся получить смещение для отображения
    try {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: tz,
        timeZoneName: 'short'
      })
      const formatParts = formatter.formatToParts(now)
      const tzName = formatParts.find(p => p.type === 'timeZoneName')?.value
      if (tzName) {
        return `${location} (${tzName})`
      }
    } catch {
      // Если не удалось получить смещение, просто показываем локацию
    }
    
    return location
  }
  
  // Распределение timezones по группам
  timezones.forEach(tz => {
    const parts = tz.split('/')
    const region = parts[0].toLowerCase()
    
    if (region.startsWith('europe')) {
      groups.europe.timezones.push({ value: tz, display: formatTimezoneDisplay(tz) })
    } else if (region.startsWith('asia')) {
      groups.asia.timezones.push({ value: tz, display: formatTimezoneDisplay(tz) })
    } else if (region.startsWith('america')) {
      groups.america.timezones.push({ value: tz, display: formatTimezoneDisplay(tz) })
    } else if (region.startsWith('africa')) {
      groups.africa.timezones.push({ value: tz, display: formatTimezoneDisplay(tz) })
    } else if (region.startsWith('pacific')) {
      groups.pacific.timezones.push({ value: tz, display: formatTimezoneDisplay(tz) })
    } else if (region.startsWith('australia')) {
      groups.australia.timezones.push({ value: tz, display: formatTimezoneDisplay(tz) })
    } else if (region.startsWith('atlantic')) {
      groups.atlantic.timezones.push({ value: tz, display: formatTimezoneDisplay(tz) })
    } else if (region.startsWith('indian')) {
      groups.indian.timezones.push({ value: tz, display: formatTimezoneDisplay(tz) })
    } else if (region.startsWith('antarctica')) {
      groups.antarctica.timezones.push({ value: tz, display: formatTimezoneDisplay(tz) })
    } else if (region.startsWith('arctic')) {
      groups.arctic.timezones.push({ value: tz, display: formatTimezoneDisplay(tz) })
    } else {
      groups.etc.timezones.push({ value: tz, display: formatTimezoneDisplay(tz) })
    }
  })
  
  // Сортировка внутри групп
  Object.values(groups).forEach(group => {
    group.timezones.sort((a, b) => a.value.localeCompare(b.value))
  })
  
  // Фильтруем пустые группы и возвращаем массив
  return Object.values(groups).filter(group => group.timezones.length > 0)
}

const timezoneGroups = ref(getAllTimezones())

// Форматирование ошибок для отображения
const formattedErrors = computed(() => {
  if (!error.value) return []
  
  if (error.value.errors && Array.isArray(error.value.errors)) {
    return error.value.errors.map((err: any) => err.message || err)
  }
  
  if (error.value.message) {
    return [error.value.message]
  }
  
  if (typeof error.value === 'string') {
    return [error.value]
  }
  
  return ['Произошла ошибка при обработке запроса']
})

// Преобразование локальной даты и времени в ISO строку с учетом timezone
const toISOString = (date: string, time: string, timezone: string): string => {
  if (!date || !time) return ''
  
  const [year, month, day] = date.split('-').map(Number)
  const timeParts = time.split(':')
  const hours = Number.parseInt(timeParts[0] || '0', 10)
  const minutes = Number.parseInt(timeParts[1] || '0', 10)
  const seconds = Number.parseInt(timeParts[2] || '0', 10)
  
  // Используем luxon для правильной работы с timezone
  try {
    const dt = DateTime.fromObject(
      {
        year,
        month,
        day,
        hour: hours,
        minute: minutes,
        second: seconds
      },
      { zone: timezone }
    )
    
    if (!dt.isValid) {
      console.warn('Invalid date/time:', { date, time, timezone, error: dt.invalidReason })
      // Fallback на простой парсинг
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      return new Date(dateStr).toISOString()
    }
    
    return dt.toISO() || ''
  } catch (error) {
    console.error('Error converting date/time with timezone:', error)
    // Fallback на простой парсинг
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    return new Date(dateStr).toISOString()
  }
}

// Получение заголовков с API ключом
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (apiKey.value) {
    headers['Authorization'] = `Bearer ${apiKey.value}`
  }
  
  return headers
}

</script>

<style scoped>
/* Стили для выпадающего списка часовых поясов */
/* Убираем белые пробелы и отступы в выпадающем списке */
select {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* Стили для option элементов - темный фон без белых пробелов */
select option {
  background-color: #1A1F2E !important;
  color: #ffffff !important;
  padding: 8px 12px !important;
  border: none !important;
  margin: 0 !important;
}

/* Стили для optgroup (группы часовых поясов) */
select optgroup {
  background-color: #0A0F1E !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  padding: 8px 12px !important;
  border: none !important;
  margin: 0 !important;
}

/* Hover эффект для option */
select option:hover,
select option:focus {
  background-color: #007AFF !important;
  color: #ffffff !important;
}

/* Выбранный option */
select option:checked {
  background-color: #007AFF !important;
  color: #ffffff !important;
}

/* Для выпадающего списка в разных браузерах */
select::-ms-expand {
  display: none;
}

/* Для Firefox */
select {
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
}

/* Стили для select-arrow (уже существующий класс) */
.select-arrow {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  padding-right: 40px;
}

/* Дополнительные стили для устранения белых пробелов */
select option:not(:first-child) {
  margin-top: 0 !important;
}

select optgroup option {
  padding-left: 24px !important;
}
</style>
