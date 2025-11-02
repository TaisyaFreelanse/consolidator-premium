
import { defineStore } from 'pinia'
import type { MonitoringSnapshot } from '~/types'

export const useMonitoringStore = defineStore('monitoring', {
  state: () => ({ list: [] as MonitoringSnapshot[], loaded: false }),
  actions: {
    async fetch() {
      if (this.loaded) return
      const res = await fetch('/mock/monitoring.json')
      this.list = await res.json()
      this.loaded = true
    },
    byEvent(id: string){
      return this.list.find(x => x.eventId === id)
    }
  }
})
