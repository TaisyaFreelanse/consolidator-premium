
import { defineStore } from 'pinia'
import type { EventItem } from '~/types'

export const useEventsStore = defineStore('events', {
  state: () => ({ list: [] as EventItem[], loaded: false }),
  actions: {
    async fetch() {
      if (this.loaded) return
      
      // Load events from mock data
      const res = await fetch('/mock/events.json')
      const mockEvents = await res.json()
      
      // Load custom events from localStorage
      let customEvents: EventItem[] = []
      if (process.client) {
        try {
          const stored = localStorage.getItem('customEvents')
          if (stored) {
            customEvents = JSON.parse(stored)
          }
        } catch (e) {
          console.error('Failed to load custom events:', e)
        }
      }
      
      // Combine mock and custom events
      this.list = [...customEvents, ...mockEvents]
      this.loaded = true
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
        } catch (e) {
          console.error('Failed to save event:', e)
        }
      }
    }
  }
})
