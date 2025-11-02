
import { defineStore } from 'pinia'

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({ ids: new Set<string>() }),
  getters: {
    count: (s) => s.ids.size
  },
  actions: {
    add(id: string){ this.ids.add(id) },
    remove(id: string){ this.ids.delete(id) },
    toggle(id: string){ this.ids.has(id) ? this.ids.delete(id) : this.ids.add(id) }
  }
})
