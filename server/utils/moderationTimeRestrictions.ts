/**
 * Утилиты для проверки временных ограничений модерации
 */

export interface EventTimeData {
  endApplicationsAt: Date | string | null
  status?: string
  requiresModeration?: boolean
}

/**
 * Проверка, можно ли модерировать событие (до наступления ti20)
 */
export function canModerateEvent(event: EventTimeData): boolean {
  // Если событие не требует модерации, его нельзя модерировать
  if (event.requiresModeration === false) {
    return false
  }

  // Если событие уже опубликовано, его нельзя модерировать
  if (event.status === 'published') {
    return false
  }

  // Если нет даты окончания приема заявок, можно модерировать
  if (!event.endApplicationsAt) {
    return true
  }

  const ti20Date = event.endApplicationsAt instanceof Date
    ? event.endApplicationsAt
    : new Date(event.endApplicationsAt)

  // Если дата некорректна, можно модерировать
  if (Number.isNaN(ti20Date.getTime())) {
    return true
  }

  // Можно модерировать только до наступления ti20
  return new Date() < ti20Date
}

/**
 * Проверка, прошла ли контрольная точка ti20 (окончание приема заявок)
 */
export function isTi20Passed(event: EventTimeData): boolean {
  if (!event.endApplicationsAt) {
    return false
  }

  const ti20Date = event.endApplicationsAt instanceof Date
    ? event.endApplicationsAt
    : new Date(event.endApplicationsAt)

  if (Number.isNaN(ti20Date.getTime())) {
    return false
  }

  return new Date() >= ti20Date
}

/**
 * Получение времени до наступления ti20 в миллисекундах
 */
export function getTimeUntilTi20(event: EventTimeData): number | null {
  if (!event.endApplicationsAt) {
    return null
  }

  const ti20Date = event.endApplicationsAt instanceof Date
    ? event.endApplicationsAt
    : new Date(event.endApplicationsAt)

  if (Number.isNaN(ti20Date.getTime())) {
    return null
  }

  const timeUntil = ti20Date.getTime() - new Date().getTime()
  return Math.max(0, timeUntil)
}

/**
 * Проверка, является ли событие срочным для модерации (менее 24 часов до ti20)
 */
export function isUrgentForModeration(event: EventTimeData): boolean {
  const timeUntil = getTimeUntilTi20(event)
  if (timeUntil === null) {
    return false
  }

  const URGENT_THRESHOLD = 24 * 60 * 60 * 1000 // 24 часа в миллисекундах
  return timeUntil < URGENT_THRESHOLD && timeUntil > 0
}

/**
 * Проверка, является ли событие критически срочным (менее 6 часов до ti20)
 */
export function isCriticalForModeration(event: EventTimeData): boolean {
  const timeUntil = getTimeUntilTi20(event)
  if (timeUntil === null) {
    return false
  }

  const CRITICAL_THRESHOLD = 6 * 60 * 60 * 1000 // 6 часов в миллисекундах
  return timeUntil < CRITICAL_THRESHOLD && timeUntil > 0
}

/**
 * Получение статуса срочности для события
 */
export function getModerationUrgencyStatus(event: EventTimeData): 'normal' | 'urgent' | 'critical' | 'expired' {
  if (isTi20Passed(event)) {
    return 'expired'
  }

  if (isCriticalForModeration(event)) {
    return 'critical'
  }

  if (isUrgentForModeration(event)) {
    return 'urgent'
  }

  return 'normal'
}

/**
 * Форматирование времени до ti20 для отображения
 */
export function formatTimeUntilTi20(event: EventTimeData): string | null {
  const timeUntil = getTimeUntilTi20(event)
  if (timeUntil === null || timeUntil <= 0) {
    return null
  }

  const hours = Math.floor(timeUntil / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}д ${hours % 24}ч`
  } else if (hours > 0) {
    return `${hours}ч`
  } else {
    const minutes = Math.floor(timeUntil / (1000 * 60))
    return `${minutes}м`
  }
}

/**
 * Создание ошибки для случая истечения времени модерации
 */
export function createTi20ExpiredError(action: string = 'moderate') {
  return {
    statusCode: 409,
    statusMessage: `Cannot ${action} event after the end of application period (ti20)`
  }
}
