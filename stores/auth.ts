import { defineStore } from 'pinia'
import type { UserRole } from '~/types'

export interface User {
  code: string
  name: string
  password: string
  role: UserRole // 'applicant' | 'moderator'
  createdAt: string
}

// Предустановленные продюсеры удалены - теперь используется система белых списков сайтов

// Предустановленный модератор
const PRESET_MODERATOR: User = {
  code: 'MOD001',
  name: 'мод1',
  password: 'пар0',
  role: 'moderator',
  createdAt: new Date('2025-01-01').toISOString()
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null as User | null,
    users: [] as User[],
    _usersLoaded: false // Флаг для отслеживания загрузки
  }),

  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    isLoggedIn: (state) => !!state.currentUser, // Alias для isAuthenticated
    userCode: (state) => state.currentUser?.code || null,
    isApplicant: (state) => state.currentUser?.role === 'applicant',
    isModerator: (state) => state.currentUser?.role === 'moderator'
  },

  actions: {
    // Загрузка пользователей из localStorage
    loadUsers() {
      if (process.client) {
        // Если уже загружено, не загружаем повторно (но все равно восстанавливаем currentUser)
        if (this._usersLoaded) {
          // Восстанавливаем currentUser, если он еще не установлен
          if (!this.currentUser) {
            const currentUserCode = localStorage.getItem('currentUserCode')
            if (currentUserCode) {
              const foundUser = this.users.find(u => u.code === currentUserCode)
              if (foundUser) {
                this.currentUser = foundUser
                console.log('✅ User restored (already loaded):', foundUser.code, foundUser.name)
              }
            }
          }
          return
        }

        try {
          const stored = localStorage.getItem('users')
          if (stored) {
            this.users = JSON.parse(stored)
          }

          const LEGACY_NAME_MAP: Record<string, string> = {
            moderator: 'мод1'
          }

          let usersChanged = false

          // Миграция: удаляем старых продюсеров (если есть) и обновляем имена
          const originalUsersCount = this.users.length
          this.users = this.users
            .filter(user => user.role !== 'producer') // Удаляем всех продюсеров
            .map((user) => {
              if (LEGACY_NAME_MAP[user.name]) {
                usersChanged = true
                return { ...user, name: LEGACY_NAME_MAP[user.name] }
              }
              return user
            })
          
          // Если были удалены продюсеры, помечаем как изменено
          if (this.users.length < originalUsersCount) {
            usersChanged = true
            console.log('🗑️ Removed legacy producer accounts during migration')
          }

          const ensurePresetUser = (preset: User) => {
            const index = this.users.findIndex(u => u.code === preset.code)
            if (index === -1) {
              this.users.push(preset)
              usersChanged = true
              return
            }

            const existing = this.users[index]
            const updated: User = {
              ...existing,
              name: preset.name,
              role: preset.role,
              createdAt: existing.createdAt || preset.createdAt,
              password: preset.password
            }

            if (updated.name !== existing.name || updated.role !== existing.role || updated.password !== existing.password || updated.createdAt !== existing.createdAt) {
              this.users.splice(index, 1, updated)
              usersChanged = true
            }
          }

          // Обеспечиваем наличие предустановленного модератора
          ensurePresetUser(PRESET_MODERATOR)

          if (usersChanged) {
            localStorage.setItem('users', JSON.stringify(this.users))
          }

          // Восстанавливаем currentUser из localStorage ПОСЛЕ загрузки всех users
          const currentUserCode = localStorage.getItem('currentUserCode')
          if (currentUserCode) {
            const foundUser = this.users.find(u => u.code === currentUserCode)
            if (foundUser) {
              this.currentUser = foundUser
              console.log('✅ User restored from localStorage:', foundUser.code, foundUser.name)
            } else {
              // Если пользователь не найден, очищаем currentUserCode
              console.warn('⚠️ User code in localStorage not found in users list, clearing:', currentUserCode)
              localStorage.removeItem('currentUserCode')
              this.currentUser = null
            }
          } else {
            // Если нет currentUserCode, убеждаемся, что currentUser = null
            this.currentUser = null
          }

          // Помечаем, что пользователи загружены
          this._usersLoaded = true
        } catch (e) {
          console.error('❌ Failed to load users:', e)
          // В случае ошибки пытаемся восстановить currentUser, если возможно
          try {
            const currentUserCode = localStorage.getItem('currentUserCode')
            if (currentUserCode && this.users.length > 0) {
              const foundUser = this.users.find(u => u.code === currentUserCode)
              if (foundUser) {
                this.currentUser = foundUser
              }
            }
          } catch (recoveryError) {
            console.error('❌ Failed to recover currentUser:', recoveryError)
          }
          this._usersLoaded = true // Помечаем как загруженное даже при ошибке
        }
      }
    },

    // Генерация уникального кода пользователя (6-8 символов)
    generateUserCode(): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const length = Math.floor(Math.random() * 3) + 6 // 6-8 символов
      let code = ''
      
      do {
        code = ''
        for (let i = 0; i < length; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
      } while (this.users.some(u => u.code === code))
      
      return code
    },

    // Регистрация нового пользователя
    register(name: string, password: string): { success: boolean; message: string; code?: string } {
      if (!name || !password) {
        return { success: false, message: 'Заполните все поля' }
      }

      if (password.length < 4) {
        return { success: false, message: 'Пароль должен быть не менее 4 символов' }
      }

      if (this.users.some(u => u.name === name)) {
        return { success: false, message: 'Пользователь с таким именем уже существует' }
      }

      const code = this.generateUserCode()
      const newUser: User = {
        code,
        name,
        password,
        role: 'applicant', // Обычные пользователи - заявители
        createdAt: new Date().toISOString()
      }

      this.users.push(newUser)
      this.currentUser = newUser

      if (process.client) {
        localStorage.setItem('users', JSON.stringify(this.users))
        localStorage.setItem('currentUserCode', code)
      }

      return { 
        success: true, 
        message: `Регистрация успешна!\n\n🔑 Ваш анонимный код для участия: ${code}\n\n(Запомните или запишите его. Этот код будет виден в списке участников вместо вашего логина)`,
        code 
      }
    },

    // Вход по логину (имени) и паролю
    login(nameOrEmail: string, password: string): { success: boolean; message: string } {
      const user = this.users.find(u => u.name.toLowerCase() === nameOrEmail.toLowerCase())

      if (!user) {
        return { success: false, message: 'Пользователь не найден' }
      }

      if (user.password !== password) {
        return { success: false, message: 'Неверный пароль' }
      }

      this.currentUser = user

      if (process.client) {
        localStorage.setItem('currentUserCode', user.code)
      }

      return { success: true, message: 'Вход выполнен успешно' }
    },

    // Выход из аккаунта
    logout() {
      this.currentUser = null
      if (process.client) {
        localStorage.removeItem('currentUserCode')
      }
    }
  }
})

