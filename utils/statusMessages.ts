import type { ControlPointCode } from '~/types'

/**
 * Таблица статусов и извещений для мероприятий
 * Основана на требованиях заказчика
 */

export interface StatusMessage {
  period: string // Период времени (например, "0 - ti10")
  извещение1: string // Основное извещение о текущем этапе
  извещение2: string // Дополнительное извещение (если есть)
  status: 'starting' | 'active' | 'critical' | 'final' | 'completed' | 'cancelled'
}

/**
 * Таблица извещений по временным интервалам
 */
export const statusMessagesTable: Record<string, StatusMessage> = {
  't0-ti10': {
    period: '0 - ti10',
    извещение1: 'Опубликовали объявление о мероприятии – цену, сроки и другие необходимые сведения',
    извещение2: 'Прием заявок открыт. Можно регистрироваться',
    status: 'starting'
  },
  'ti10-ti20': {
    period: 'ti10 - ti20',
    извещение1: 'Первые заявители зарегистрировались',
    извещение2: 'Сбор набирает обороты',
    status: 'active'
  },
  'ti20-ti30': {
    period: 'ti20 - ti30',
    извещение1: 'Сбор продолжается',
    извещение2: 'Оцените свои шансы попасть в число участников',
    status: 'active'
  },
  'ti30-ti40': {
    period: 'ti30 - ti40',
    извещение1: 'Критическая точка сбора',
    извещение2: 'Если недобор средств – возможна отмена. Если перебор участников – нужно повышать ставки',
    status: 'critical'
  },
  'ti40-ti50': {
    period: 'ti40 - ti50',
    извещение1: 'Финальный этап сбора',
    извещение2: 'Осталось мало времени для регистрации',
    status: 'final'
  },
  'ti50-t999': {
    period: 'ti50 - завершение',
    извещение1: 'Сбор завершается',
    извещение2: 'Проводим окончательные расчеты с участниками',
    status: 'final'
  },
  't999': {
    period: 'Завершено',
    извещение1: 'Сбор средств завершен',
    извещение2: 'Ожидайте подтверждения участия',
    status: 'completed'
  }
}

/**
 * Определяет текущий временной интервал на основе дат начала и конца сбора
 */
export function getCurrentTimeInterval(
  startApplicationsAt: string,
  endApplicationsAt: string,
  controlPlan: ControlPointCode[]
): { currentInterval: string; currentPoint: ControlPointCode; progress: number } {
  const now = Date.now()
  const start = new Date(startApplicationsAt).getTime()
  const end = new Date(endApplicationsAt).getTime()
  
  // Если сбор еще не начался
  if (now < start) {
    return {
      currentInterval: 'not-started',
      currentPoint: 't0',
      progress: 0
    }
  }
  
  // Если сбор завершен
  if (now > end) {
    return {
      currentInterval: 't999',
      currentPoint: 't999',
      progress: 100
    }
  }
  
  // Вычисляем прогресс по времени (0-100%)
  const totalDuration = end - start
  const elapsed = now - start
  const progress = (elapsed / totalDuration) * 100
  
  // Фильтруем только ti точки из плана
  const timePoints = controlPlan.filter(p => p.startsWith('ti') || p === 't0' || p === 't999')
  
  // Определяем текущий интервал на основе прогресса
  if (progress < 10) {
    return { currentInterval: 't0-ti10', currentPoint: 't0', progress }
  } else if (progress < 20) {
    return { currentInterval: 'ti10-ti20', currentPoint: 'ti10', progress }
  } else if (progress < 30) {
    return { currentInterval: 'ti20-ti30', currentPoint: 'ti20', progress }
  } else if (progress < 40) {
    return { currentInterval: 'ti30-ti40', currentPoint: 'ti30', progress }
  } else if (progress < 50) {
    return { currentInterval: 'ti40-ti50', currentPoint: 'ti40', progress }
  } else {
    return { currentInterval: 'ti50-t999', currentPoint: 'ti50', progress }
  }
}

/**
 * Получает сообщение о статусе для текущего интервала
 */
export function getStatusMessage(interval: string): StatusMessage | null {
  if (interval === 'not-started') {
    return {
      period: 'Ожидание',
      извещение1: 'Прием заявок еще не начался',
      извещение2: 'Следите за объявлением',
      status: 'starting'
    }
  }
  
  return statusMessagesTable[interval] || null
}

/**
 * Определяет статус дефицита/профицита
 */
export function getMoneyStatus(collected: number, priceTotal: number): {
  type: 'deficit' | 'balanced' | 'surplus'
  amount: number
  percentage: number
  color: 'red' | 'green' | 'blue'
  label: string
} {
  const diff = collected - priceTotal
  const percentage = Math.round((collected / priceTotal) * 100)
  
  if (diff < 0) {
    return {
      type: 'deficit',
      amount: Math.abs(diff),
      percentage,
      color: 'red',
      label: 'Дефицит'
    }
  } else if (diff === 0) {
    return {
      type: 'balanced',
      amount: 0,
      percentage: 100,
      color: 'blue',
      label: 'Точная сумма'
    }
  } else {
    return {
      type: 'surplus',
      amount: diff,
      percentage,
      color: 'green',
      label: 'Профицит'
    }
  }
}

/**
 * Определяет статус мест
 */
export function getSeatsStatus(applicantsCount: number, seatLimit: number): {
  type: 'available' | 'full' | 'overflow'
  freeSeats: number
  overflowCount: number
  color: 'green' | 'yellow' | 'red'
  label: string
} {
  const diff = seatLimit - applicantsCount
  
  if (diff > 0) {
    return {
      type: 'available',
      freeSeats: diff,
      overflowCount: 0,
      color: 'green',
      label: 'Места свободны'
    }
  } else if (diff === 0) {
    return {
      type: 'full',
      freeSeats: 0,
      overflowCount: 0,
      color: 'yellow',
      label: 'Мест нет'
    }
  } else {
    return {
      type: 'overflow',
      freeSeats: 0,
      overflowCount: Math.abs(diff),
      color: 'red',
      label: 'Перебор участников'
    }
  }
}

/**
 * Форматирует время до конца сбора
 */
export function getTimeRemaining(endApplicationsAt: string): {
  formatted: string
  urgent: boolean
  ended: boolean
} {
  const now = Date.now()
  const end = new Date(endApplicationsAt).getTime()
  const diff = end - now
  
  if (diff <= 0) {
    return {
      formatted: 'Сбор завершен',
      urgent: false,
      ended: true
    }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  let formatted = ''
  if (days > 0) {
    formatted = `${days} дн ${hours} ч`
  } else if (hours > 0) {
    formatted = `${hours} ч ${minutes} мин`
  } else {
    formatted = `${minutes} мин`
  }
  
  // Срочно, если осталось меньше 24 часов
  const urgent = diff < (24 * 60 * 60 * 1000)
  
  return { formatted, urgent, ended: false }
}

