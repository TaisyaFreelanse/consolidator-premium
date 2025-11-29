<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#1A1F2E] to-[#0A0F1E] text-white">
    <div class="container mx-auto px-4 py-8 max-w-[1400px]">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold mb-1 bg-gradient-to-r from-[#007AFF] to-[#5E5CE6] bg-clip-text text-transparent">
              Список сайтов, имеющих доступ к API
            </h1>
          </div>
          <button
            @click="showAddForm = true"
            class="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            ➕ Добавить сайт
          </button>
        </div>
      </div>

      <!-- Таблица сайтов -->
      <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        
        <div v-if="loading" class="p-8 text-center">
          <div class="inline-flex items-center gap-2 text-white/60">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Загрузка...
          </div>
        </div>

        <div v-else-if="sites.length === 0" class="p-8 text-center text-white/60">
          Нет сайтов в белом списке
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-white/5">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-medium text-white/80 w-16">№</th>
                <th class="px-6 py-4 text-left text-sm font-medium text-white/80">Имя сайта</th>
                <th class="px-6 py-4 text-left text-sm font-medium text-white/80">Модерация</th>
                <th class="px-6 py-4 text-left text-sm font-medium text-white/80">Создан</th>
                <th class="px-6 py-4 text-left text-sm font-medium text-white/80"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              <tr v-for="(site, index) in sites" :key="site.id" class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-4">
                  <div class="text-white/60 text-sm font-medium">{{ index + 1 }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="font-mono text-sm text-white">{{ site.siteName }}</div>
                </td>
                <td class="px-6 py-4">
                  <span v-if="site.requiresModeration" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                    Требуется
                  </span>
                  <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                    Не требуется
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-white/60 text-sm">{{ formatDate(site.createdAt) }}</div>
                </td>
                <td class="px-6 py-4">
                  <button
                    @click="editSite(site)"
                    class="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    Редактировать
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Модальное окно добавления сайта -->
      <div v-if="showAddForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeAddForm">
        <div class="bg-[#1A1F2E] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
          <h3 class="text-xl font-semibold mb-4">Добавить сайт в белый список</h3>
          
          <form @submit.prevent="addSite" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Имя сайта (доменное имя) <span class="text-red-400">*</span>
              </label>
              <input
                v-model="addForm.siteName"
                type="text"
                required
                placeholder="example.com"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
              <p class="text-xs text-white/50 mt-1">Доменное имя сайта (например: example.com или localhost:3000)</p>
            </div>

            <div class="flex items-center">
              <input
                v-model="addForm.requiresModeration"
                type="checkbox"
                id="requiresModeration"
                class="w-4 h-4 text-[#007AFF] bg-white/5 border-white/10 rounded focus:ring-[#007AFF] focus:ring-2"
              >
              <label for="requiresModeration" class="ml-2 text-sm text-white/80">
                Требует модерации событий
              </label>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="closeAddForm"
                class="flex-1 bg-white/10 text-white font-semibold py-3 px-4 rounded-xl hover:bg-white/20 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {{ isSubmitting ? 'Добавление...' : 'Добавить' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Модальное окно редактирования сайта -->
      <div v-if="showEditForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeEditForm">
        <div class="bg-[#1A1F2E] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
          <h3 class="text-xl font-semibold mb-4">Редактировать сайт</h3>
          
          <form @submit.prevent="updateSite" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Имя сайта (доменное имя) <span class="text-red-400">*</span>
              </label>
              <input
                v-model="editForm.siteName"
                type="text"
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
              >
              <p class="text-xs text-white/50 mt-1">Доменное имя сайта (например: example.com или localhost:3000)</p>
            </div>

            <div class="flex items-center">
              <input
                v-model="editForm.requiresModeration"
                type="checkbox"
                id="editRequiresModeration"
                class="w-4 h-4 text-[#007AFF] bg-white/5 border-white/10 rounded focus:ring-[#007AFF] focus:ring-2"
              >
              <label for="editRequiresModeration" class="ml-2 text-sm text-white/80">
                Требует модерации событий
              </label>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="closeEditForm"
                class="flex-1 bg-white/10 text-white font-semibold py-3 px-4 rounded-xl hover:bg-white/20 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {{ isSubmitting ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Уведомления -->
      <div v-if="notification" class="fixed top-4 right-4 z-50">
        <div :class="[
          'px-6 py-4 rounded-xl shadow-lg',
          notification.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
        ]">
          {{ notification.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Проверка доступа (только для модераторов)
definePageMeta({
  middleware: 'auth-moderator'
})

interface WhitelistedSite {
  id: string
  siteName: string
  siteAlias: string
  requiresModeration: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AddSiteForm {
  siteName: string
  requiresModeration: boolean
}

interface EditSiteForm extends AddSiteForm {
  id: string
}

interface Notification {
  type: 'success' | 'error'
  message: string
}

// Состояние
const sites = ref<WhitelistedSite[]>([])
const loading = ref(true)
const showAddForm = ref(false)
const showEditForm = ref(false)
const isSubmitting = ref(false)
const notification = ref<Notification | null>(null)

// Формы
const addForm = ref<AddSiteForm>({
  siteName: '',
  requiresModeration: false
})

const editForm = ref<EditSiteForm>({
  id: '',
  siteName: '',
  requiresModeration: false
})

// Методы
const loadSites = async () => {
  try {
    loading.value = true
    const response = await fetch('/api/admin/whitelist')
    const data = await response.json()
    
    if (data.success) {
      // Фильтруем только активные сайты (если сайт в таблице, значит он активен)
      sites.value = data.data.filter((s: WhitelistedSite) => s.isActive)
    } else {
      showNotification('error', 'Ошибка загрузки сайтов')
    }
  } catch (error) {
    console.error('Error loading sites:', error)
    showNotification('error', 'Ошибка загрузки сайтов')
  } finally {
    loading.value = false
  }
}

const addSite = async () => {
  try {
    isSubmitting.value = true
    const response = await fetch('/api/admin/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteName: addForm.value.siteName,
        siteAlias: addForm.value.siteName, // Используем siteName как siteAlias
        requiresModeration: addForm.value.requiresModeration,
        isActive: true // Всегда активен при создании
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      showNotification('success', 'Сайт успешно добавлен')
      closeAddForm()
      await loadSites()
    } else {
      showNotification('error', data.message || 'Ошибка добавления сайта')
    }
  } catch (error) {
    console.error('Error adding site:', error)
    showNotification('error', 'Ошибка добавления сайта')
  } finally {
    isSubmitting.value = false
  }
}

const editSite = (site: WhitelistedSite) => {
  editForm.value = {
    id: site.id,
    siteName: site.siteName,
    requiresModeration: site.requiresModeration
  }
  showEditForm.value = true
}

const updateSite = async () => {
  try {
    isSubmitting.value = true
    const response = await fetch(`/api/admin/whitelist/${editForm.value.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteName: editForm.value.siteName,
        siteAlias: editForm.value.siteName, // Используем siteName как siteAlias
        requiresModeration: editForm.value.requiresModeration
        // isActive не изменяем - если сайт в таблице, значит он активен
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      showNotification('success', 'Сайт успешно обновлен')
      closeEditForm()
      await loadSites()
    } else {
      showNotification('error', data.message || 'Ошибка обновления сайта')
    }
  } catch (error) {
    console.error('Error updating site:', error)
    showNotification('error', 'Ошибка обновления сайта')
  } finally {
    isSubmitting.value = false
  }
}

const closeAddForm = () => {
  showAddForm.value = false
  addForm.value = {
    siteName: '',
    requiresModeration: false
  }
}

const closeEditForm = () => {
  showEditForm.value = false
  editForm.value = {
    id: '',
    siteName: '',
    requiresModeration: false
  }
}

const showNotification = (type: 'success' | 'error', message: string) => {
  notification.value = { type, message }
  setTimeout(() => {
    notification.value = null
  }, 5000)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Загрузка данных при монтировании
onMounted(() => {
  loadSites()
})
</script>
