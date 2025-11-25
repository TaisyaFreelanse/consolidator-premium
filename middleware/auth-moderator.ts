export default defineNuxtRouteMiddleware((to, from) => {
  // Проверяем, что пользователь авторизован и является модератором
  
  // Пропускаем проверку на сервере
  if (process.server) {
    return
  }
  
  // Проверяем авторизацию на клиенте
  if (process.client) {
    const auth = useAuthStore()
    
    // Загружаем пользователей, если они еще не загружены
    if (!auth._usersLoaded) {
      auth.loadUsers()
      // Даем время на загрузку
      return new Promise(resolve => {
        setTimeout(() => {
          if (!auth.isAuthenticated || !auth.isModerator) {
            return navigateTo('/')
          }
          resolve(undefined)
        }, 100)
      })
    }
    
    // Если пользователи уже загружены, проверяем сразу
    if (!auth.isAuthenticated || !auth.isModerator) {
      return navigateTo('/')
    }
  }
})
