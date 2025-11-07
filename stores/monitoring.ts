
import { defineStore } from 'pinia'
import type { MonitoringSnapshot } from '~/types'

export const useMonitoringStore = defineStore('monitoring', {
  state: () => ({ 
    cache: new Map<string, MonitoringSnapshot>(), // Кэш по eventId
    loaded: false 
  }),
  actions: {
    async fetch() {
      // Базовая инициализация (пустая для нового подхода)
      this.loaded = true
    },
    
    async fetchByEvent(eventId: string, forceReload = false) {
      // Если уже закэшировано и не требуется перезагрузка
      if (this.cache.has(eventId) && !forceReload) {
        console.log(`📊 Monitoring data for ${eventId} already cached`)
        return this.cache.get(eventId)!
      }
      
      console.log(`🔄 Fetching monitoring data for ${eventId} from API...`)
      
      try {
        const res = await fetch(`/api/monitoring/${eventId}`)
        
        // Проверяем статус ответа
        if (!res.ok) {
          if (res.status === 404) {
            // Событие не найдено в БД - это кастомное событие из localStorage
            console.warn(`⚠️ Event ${eventId} not found in DB (custom event), using empty snapshot`)
            
            const emptySnapshot: MonitoringSnapshot = {
              eventId,
              nowPoint: 't0',
              applicants: []
            }
            this.cache.set(eventId, emptySnapshot)
            return emptySnapshot
          }
          throw new Error(`API error: ${res.status} ${res.statusText}`)
        }
        
        const response = await res.json()
        
        if (!response.success) {
          throw new Error('Failed to fetch monitoring data from API')
        }
        
        const snapshot = response.data as MonitoringSnapshot
        this.cache.set(eventId, snapshot)
        console.log(`✅ Monitoring data loaded for ${eventId}:`, snapshot.applicants.length, 'applicants')
        
        return snapshot
      } catch (error) {
        console.error('❌ Failed to fetch monitoring data from API:', error)
        
        // Fallback to mock data if API fails
        try {
          const res = await fetch('/mock/monitoring.json')
          const mockList = await res.json()
          const snapshot = mockList.find((x: MonitoringSnapshot) => x.eventId === eventId)
          
          if (snapshot) {
            this.cache.set(eventId, snapshot)
            console.log(`📦 Loaded fallback mock monitoring data for ${eventId}`)
            return snapshot
          }
          
          // Если нет данных - возвращаем пустой snapshot
          const emptySnapshot: MonitoringSnapshot = {
            eventId,
            nowPoint: 't0',
            applicants: []
          }
          this.cache.set(eventId, emptySnapshot)
          return emptySnapshot
        } catch (fallbackError) {
          console.error('❌ Failed to load mock monitoring data:', fallbackError)
          
          // Возвращаем пустой snapshot
          const emptySnapshot: MonitoringSnapshot = {
            eventId,
            nowPoint: 't0',
            applicants: []
          }
          this.cache.set(eventId, emptySnapshot)
          return emptySnapshot
        }
      }
    },
    
    byEvent(id: string) {
      return this.cache.get(id)
    },
    
    // Инвалидация кэша (после создания заявки/доплаты)
    invalidate(eventId: string) {
      this.cache.delete(eventId)
      console.log(`🗑️ Invalidated monitoring cache for ${eventId}`)
    }
  }
})
