
import { defineStore } from 'pinia'
import type { EventItem } from '~/types'

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
        // Load events from backend API
        const res = await fetch('/api/events')
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
              console.log('✅ Loaded custom events from localStorage:', customEvents.length)
              
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
