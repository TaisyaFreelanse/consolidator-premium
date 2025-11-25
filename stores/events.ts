
import { defineStore } from 'pinia'
import type { EventItem } from '~/types'
import { useAuthStore } from './auth'

export const useEventsStore = defineStore('events', {
  state: () => ({ list: [] as EventItem[], loaded: false }),
  actions: {
    async fetch(forceReload = false) {
      // Если уже загружено и не требуется принудительная перезагрузка
      if (this.loaded && !forceReload) {
        console.log('📦 Events already loaded, skipping fetch')
        return
      }
      
      console.log('🔄 Fetching events from API...')
      
      try {
        // Получаем producerCode из auth store, если пользователь - продюсер
        // producerCode в событиях соответствует name продюсера в auth
        // Модератор должен видеть все черновики всех продюсеров
        let producerCode: string | undefined = undefined
        let isModerator: boolean = false
        if (process.client) {
          const auth = useAuthStore()
          if (auth.isModerator) {
            isModerator = true
            console.log('👮 Fetching events for moderator (all drafts visible)')
          }
          // Продюсеры удалены - теперь используется система белых списков сайтов
        }
        
        // Load events from backend API
        // Если producerCode указан, API вернет опубликованные + черновики этого продюсера
        // Если isModerator=true, API вернет все события (опубликованные + все черновики)
        // Иначе - только опубликованные (публичный доступ)
        let apiUrl = '/api/events'
        if (isModerator) {
          apiUrl = '/api/events?allDrafts=true'
        } else if (producerCode) {
          apiUrl = `/api/events?producerCode=${encodeURIComponent(producerCode)}`
        }
        
        const res = await fetch(apiUrl)
        const response = await res.json()
        
        if (!response.success) {
          throw new Error('Failed to fetch events from API')
        }
        
        const apiEvents = response.data || []
        console.log('✅ Loaded events from API:', apiEvents.length)
        
        // Load custom draft events from localStorage (черновики и неопубликованные)
        let customEvents: EventItem[] = []
        if (process.client) {
          try {
            const stored = localStorage.getItem('customEvents')
            if (stored) {
              customEvents = JSON.parse(stored)
              if (customEvents.length > 0) {
                try {
                  const payload = customEvents.map(event => {
                    const priceTotalRaw = Number(event.priceTotal || 0)
                    const pricePerSeatRaw = event.pricePerSeat != null ? Number(event.pricePerSeat) : null

                    const normalizeMoney = (value: number) => {
                      if (!Number.isFinite(value)) return 0
                      // Если сумма выглядит как рубли, переводим в копейки
                      return value < 1000 ? Math.round(value * 100) : Math.round(value)
                    }

                    return {
                      id: event.id,
                      title: event.title,
                      author: event.author,
                      location: event.location,
                      startAt: event.startAt,
                      endAt: event.endAt || null,
                      seatLimit: event.seatLimit ?? null,
                      priceTotal: normalizeMoney(priceTotalRaw),
                      pricePerSeat: pricePerSeatRaw != null ? normalizeMoney(pricePerSeatRaw) : null,
                      image: event.image || null,
                      category: event.category || null,
                      description: event.description || null,
                      activities: event.activities || [],
                      controlPlan: event.controlPlan || [],
                      startApplicationsAt: event.startApplicationsAt || null,
                      endApplicationsAt: event.endApplicationsAt || null,
                      startContractsAt: event.startContractsAt || null,
                      status: event.status || 'draft',
                      producerName: event.producerName || null,
                      producerCode: event.producerCode || null,
                      createdAt: event.createdAt || null,
                      updatedAt: event.updatedAt || null
                    }
                  })

                  const importResponse = await fetch('/api/events/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ events: payload })
                  })

                  const importResult = await importResponse.json()

                  if (importResponse.ok && importResult.success) {
                    console.log(`🚚 Migrated ${importResult.data?.imported ?? payload.length} local events to the backend`)
                    localStorage.removeItem('customEvents')
                    // Обновляем список событий из API после миграции
                    this.loaded = false
                    await this.fetch(true)
                    return
                  }

                  console.warn('⚠️ Не удалось импортировать локальные события:', importResult)
                } catch (migrationError) {
                  console.warn('⚠️ Ошибка при миграции локальных событий:', migrationError)
                }
              }
 
              // Логируем каждое событие
              customEvents.forEach((event, index) => {
                console.log(`  Event ${index}:`, {
                  id: event.id,
                  title: event.title,
                  status: event.status,
                  producer: event.producerName
                })
              })
            } else {
              console.log('ℹ️ No custom events in localStorage')
            }
          } catch (e) {
            console.error('❌ Failed to load custom events:', e)
          }
        }
        
        // Combine custom (drafts) and API events (published)
        this.list = [...customEvents, ...apiEvents]
        this.loaded = true
        
        console.log('📦 Total events loaded:', this.list.length, '(custom:', customEvents.length, ', API:', apiEvents.length, ')')
      } catch (error) {
        console.error('❌ Failed to fetch events from API, falling back to mock data:', error)
        
        // Fallback to mock data if API fails
        try {
          const res = await fetch('/mock/events.json')
          const mockEvents = await res.json()
          this.list = mockEvents
          this.loaded = true
          console.log('📦 Loaded fallback mock events:', mockEvents.length)
        } catch (fallbackError) {
          console.error('❌ Failed to load mock data:', fallbackError)
          this.list = []
          this.loaded = true
        }
      }
    },
    
    // Reload events from localStorage (for refresh after creating/editing)
    reload() {
      this.loaded = false
      return this.fetch(true)
    },
    
    // Add new event
    addEvent(event: EventItem) {
      this.list.unshift(event)
      
      // Save to localStorage
      if (process.client) {
        try {
          const customEvents = JSON.parse(localStorage.getItem('customEvents') || '[]')
          customEvents.unshift(event)
          localStorage.setItem('customEvents', JSON.stringify(customEvents))
          console.log('✅ Event saved to localStorage')
        } catch (e) {
          console.error('❌ Failed to save event:', e)
        }
      }
    }
  }
})
