// Утилита для отладки localStorage

export const debugLocalStorage = () => {
  if (!process.client) return

  console.log('🔍 === DEBUG: LocalStorage Contents ===')
  
  try {
    // Проверяем customEvents
    const customEvents = localStorage.getItem('customEvents')
    if (customEvents) {
      const parsed = JSON.parse(customEvents)
      console.log('📦 Custom Events:', parsed.length, 'items')
      console.table(parsed.map((e: any) => ({
        id: e.id,
        title: e.title,
        status: e.status || '❌ no status',
        producer: e.producerName || '❌ no producer',
        created: e.createdAt ? new Date(e.createdAt).toLocaleString('ru-RU') : '❌ no date'
      })))
      
      // Показываем черновики отдельно
      const drafts = parsed.filter((e: any) => e.status === 'draft')
      if (drafts.length > 0) {
        console.log('📝 Drafts found:', drafts.length)
        console.table(drafts.map((e: any) => ({
          id: e.id,
          title: e.title,
          producer: e.producerName
        })))
      } else {
        console.log('ℹ️ No drafts found')
      }
      
      // Показываем опубликованные отдельно
      const published = parsed.filter((e: any) => e.status === 'published')
      if (published.length > 0) {
        console.log('✅ Published events:', published.length)
      }
    } else {
      console.log('❌ No custom events found in localStorage')
    }
    
    // Проверяем users
    const users = localStorage.getItem('users')
    if (users) {
      const parsed = JSON.parse(users)
      console.log('👥 Users:', parsed.length, 'items')
      console.table(parsed.map((u: any) => ({
        code: u.code,
        name: u.name,
        role: u.role || 'no role'
      })))
    } else {
      console.log('❌ No users found in localStorage')
    }
    
    // Проверяем currentUserCode
    const currentUserCode = localStorage.getItem('currentUserCode')
    console.log('👤 Current User Code:', currentUserCode || 'not logged in')
    
    console.log('🔍 === END DEBUG ===')
  } catch (e) {
    console.error('❌ Error reading localStorage:', e)
  }
}

export const clearCustomEvents = () => {
  if (!process.client) return
  
  const confirm = window.confirm('⚠️ Удалить ВСЕ созданные мероприятия?\n\nЭто действие нельзя отменить!')
  if (confirm) {
    localStorage.removeItem('customEvents')
    console.log('✅ Custom events cleared')
    window.location.reload()
  }
}

// Добавляем в window для доступа из консоли браузера
if (typeof window !== 'undefined') {
  (window as any).debugLocalStorage = debugLocalStorage;
  (window as any).clearCustomEvents = clearCustomEvents;
  
  console.log('💡 Debug utils loaded! Use in console:');
  console.log('   debugLocalStorage() - show localStorage contents');
  console.log('   clearCustomEvents() - clear all custom events');
}

