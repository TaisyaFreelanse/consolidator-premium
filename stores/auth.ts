import { defineStore } from 'pinia'
import type { UserRole } from '~/types'

export interface User {
  code: string
  name: string
  password: string
  role: UserRole // 'applicant' | 'producer'
  createdAt: string
}

// Предустановленные продюсеры
const PRESET_PRODUCERS: User[] = [
  {
    code: 'PROD001',
    name: 'producer1',
    password: 'prod1pass',
    role: 'producer',
    createdAt: new Date('2025-01-01').toISOString()
  },
  {
    code: 'PROD002',
    name: 'producer2',
    password: 'prod2pass',
    role: 'producer',
    createdAt: new Date('2025-01-01').toISOString()
  }
]

// Предустановленный модератор
const PRESET_MODERATOR: User = {
  code: 'MOD001',
  name: 'moderator',
  password: 'modpass',
  role: 'moderator',
  createdAt: new Date('2025-01-01').toISOString()
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null as User | null,
    users: [] as User[]
  }),

  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    userCode: (state) => state.currentUser?.code || null,
    isProducer: (state) => state.currentUser?.role === 'producer',
    isModerator: (state) => state.currentUser?.role === 'moderator'
  },

  actions: {
    // Загрузка пользователей из localStorage
    loadUsers() {
      if (process.client) {
        try {
          const stored = localStorage.getItem('users')
          if (stored) {
            this.users = JSON.parse(stored)
          }
          
          // Добавляем предустановленных продюсеров, если их еще нет
          PRESET_PRODUCERS.forEach(producer => {
            if (!this.users.some(u => u.code === producer.code)) {
              this.users.push(producer)
            }
          })
          
          // Добавляем предустановленного модератора, если его еще нет
          if (!this.users.some(u => u.code === PRESET_MODERATOR.code)) {
            this.users.push(PRESET_MODERATOR)
          }
          
          // Сохраняем обновленный список
          localStorage.setItem('users', JSON.stringify(this.users))

          const currentUserCode = localStorage.getItem('currentUserCode')
          if (currentUserCode) {
            this.currentUser = this.users.find(u => u.code === currentUserCode) || null
          }
        } catch (e) {
          console.error('Failed to load users:', e)
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

