
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  app: {
    head: {
      title: 'Консолидатор — MVP',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0f172a' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' }
      ]
    }
  },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  typescript: {
    strict: true,
    typeCheck: false
  },
  devtools: { enabled: true },
  // Настройка CORS для внешнего API
  nitro: {
    compatibilityDate: '2025-11-16',
    routeRules: {
      '/api/external/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true'
        }
      }
    }
  },
  // Настройка автомодерации для тестирования
  // Установите AUTO_MODERATION_ENABLED=true в переменных окружения для включения автомодерации
  // При включенной автомодерации черновики автоматически публикуются при загрузке на платформу
  runtimeConfig: {
    autoModerationEnabled: process.env.AUTO_MODERATION_ENABLED === 'true' || false,
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000'
    }
  }
})
