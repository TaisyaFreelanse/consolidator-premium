import type { ControlPointCode } from '~/types'

/**
 * Таблица статусов и извещений для мероприятий
 * Основана на требованиях заказчика
 * 
 * Контрольные точки:
 * 0 – момент записи мероприятия в каталог (появление на сайте)
 * ti10 – начало приема заявок (startApplicationsAt)
 * ti20 – окончание приема заявок (endApplicationsAt)
 * ti30 – начало оформления договоров на участие
 * ti40 – начало проведения мероприятия (startAt)
 * ti50 – окончание проведения мероприятия (endAt)
 * 999 – момент удаления мероприятия из каталога
 */

export interface StatusMessage {
  period: string // Период времени (например, "0 - ti10")
  извещение1: string // Основное извещение о текущем этапе
  извещение1ПриОтмене?: string // Извещение-1 при отмене мероприятия
  извещение2: string // Дополнительное извещение (если есть)
  извещение2ПриОтмене?: string // Извещение-2 при отмене мероприятия
  status: 'starting' | 'active' | 'processing' | 'ongoing' | 'completed' | 'cancelled'
}

/**
 * Таблица извещений по временным интервалам
 */
export const statusMessagesTable: Record<string, StatusMessage> = {
  't0-ti10': {
    period: '0 - ti10',
    извещение1: 'Опубликовали объявление о мероприятии – цену, сроки и другие необходимые сведения.',
    извещение2: 'Начало приема заявок на участие',
    status: 'starting'
  },
  'ti10-ti20': {
    period: 'ti10 - ti20',
    извещение1: 'Принимаем заявки на участие в мероприятии и обеспечительные платежи',
    извещение2: 'Окончание приема заявок на участие, начало калькуляции складочных цен',
    status: 'active'
  },
  'ti20-ti30': {
    period: 'ti20 - ti30',
    извещение1: 'Подводим итоги сбора средств, готовим документы для расчетов с заявителями.',
    извещение2: 'Объявление результатов калькуляции складочных цен',
    status: 'processing'
  },
  'ti30-ti40': {
    period: 'ti30 - ti40',
    извещение1: 'Собрано достаточно средств, мероприятие состоится, проводим расчеты с заявителями',
    извещение1ПриОтмене: 'Собрано недостаточно средств, проводим расчеты с заявителями',
    извещение2: 'Начало мероприятия',
    извещение2ПриОтмене: 'Мероприятие не состоится',
    status: 'processing'
  },
  'ti40-ti50': {
    period: 'ti40 - ti50',
    извещение1: 'Проводится мероприятие',
    извещение1ПриОтмене: 'Собрано недостаточно средств, проводим расчеты с заявителями',
    извещение2: 'Окончание мероприятия',
    извещение2ПриОтмене: 'Мероприятие не состоится',
    status: 'ongoing'
  },
  'ti50-t999': {
    period: 'ti50 - 999',
    извещение1: 'Мероприятие завершилось',
    извещение1ПриОтмене: 'Истек срок проведения мероприятия',
    извещение2: '',
    извещение2ПриОтмене: '',
    status: 'completed'
  },
  't999': {
    period: '999',
    извещение1: 'Мероприятие удалено из каталога',
    извещение2: '',
    status: 'completed'
  }
}

/**
 * Определяет текущий временной интервал на основе контрольных точек мероприятия
 * 
 * @param event - объект мероприятия с датами контрольных точек
 * @param createdAt - дата создания/публикации мероприятия (t0)
 * @returns текущий интервал, контрольную точку и прогресс
 */
export function getCurrentTimeInterval(
  event: {
    startApplicationsAt?: string // ti10
    endApplicationsAt?: string // ti20
    startContractsAt?: string // ti30
    startAt: string // ti40
    endAt?: string // ti50
  },
  createdAt?: string
): { currentInterval: string; currentPoint: ControlPointCode; progress: number } {
  const now = Date.now()
  
  // Определяем временные точки
  const t0 = createdAt ? new Date(createdAt).getTime() : 0
  const ti10 = event.startApplicationsAt ? new Date(event.startApplicationsAt).getTime() : null
  const ti20 = event.endApplicationsAt ? new Date(event.endApplicationsAt).getTime() : null
  const ti30 = event.startContractsAt ? new Date(event.startContractsAt).getTime() : null
  const ti40 = new Date(event.startAt).getTime()
  const ti50 = event.endAt ? new Date(event.endAt).getTime() : null
  
  // Определяем текущий интервал
  if (ti50 && now >= ti50) {
    // После окончания мероприятия
    const progress = 100
    return { currentInterval: 'ti50-t999', currentPoint: 'ti50', progress }
  } else if (now >= ti40) {
    // Мероприятие идёт (ti40 - ti50)
    if (ti50) {
      const totalDuration = ti50 - ti40
      const elapsed = now - ti40
      const progress = Math.min(100, (elapsed / totalDuration) * 100)
      return { currentInterval: 'ti40-ti50', currentPoint: 'ti40', progress }
    } else {
      return { currentInterval: 'ti40-ti50', currentPoint: 'ti40', progress: 50 }
    }
  } else if (ti30 && now >= ti30) {
    // Оформление договоров (ti30 - ti40)
    const totalDuration = ti40 - ti30
    const elapsed = now - ti30
    const progress = Math.min(100, (elapsed / totalDuration) * 100)
    return { currentInterval: 'ti30-ti40', currentPoint: 'ti30', progress }
  } else if (ti20 && now >= ti20) {
    // Подведение итогов (ti20 - ti30)
    if (ti30) {
      const totalDuration = ti30 - ti20
      const elapsed = now - ti20
      const progress = Math.min(100, (elapsed / totalDuration) * 100)
      return { currentInterval: 'ti20-ti30', currentPoint: 'ti20', progress }
    } else if (ti40) {
      // Если нет ti30, то прогресс до ti40
      const totalDuration = ti40 - ti20
      const elapsed = now - ti20
      const progress = Math.min(100, (elapsed / totalDuration) * 100)
      return { currentInterval: 'ti20-ti30', currentPoint: 'ti20', progress }
    } else {
      return { currentInterval: 'ti20-ti30', currentPoint: 'ti20', progress: 50 }
    }
  } else if (ti10 && now >= ti10) {
    // Прием заявок (ti10 - ti20)
    if (ti20) {
      const totalDuration = ti20 - ti10
      const elapsed = now - ti10
      const progress = Math.min(100, (elapsed / totalDuration) * 100)
      return { currentInterval: 'ti10-ti20', currentPoint: 'ti10', progress }
    } else {
      return { currentInterval: 'ti10-ti20', currentPoint: 'ti10', progress: 50 }
    }
  } else if (ti10 && now < ti10) {
    // До начала приема заявок (t0 - ti10)
    if (t0 > 0) {
      const totalDuration = ti10 - t0
      const elapsed = now - t0
      const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
      return { currentInterval: 't0-ti10', currentPoint: 't0', progress }
    } else {
      return { currentInterval: 't0-ti10', currentPoint: 't0', progress: 0 }
    }
  } else {
    // Мероприятие еще не опубликовано или нет данных о ti10
    return { currentInterval: 't0-ti10', currentPoint: 't0', progress: 0 }
  }
}

/**
 * Преобразует контрольную точку в временной интервал
 * @param controlPoint - код контрольной точки (t0, ti10, ti20, и т.д.)
 * @returns интервал для этой контрольной точки
 */
export function controlPointToInterval(controlPoint: ControlPointCode): string {
  switch (controlPoint) {
    case 't0':
      return 't0-ti10'
    case 'ti10':
      return 'ti10-ti20'
    case 'ti20':
      return 'ti20-ti30'
    case 'ti30':
      return 'ti30-ti40'
    case 'ti40':
      return 'ti40-ti50'
    case 'ti50':
    case 't999':
      return 'ti50-t999'
    default:
      return 't0-ti10'
  }
}

/**
 * Получает сообщение о статусе для текущего интервала
 * @param interval - текущий временной интервал
 * @param isCancelled - признак отмены мероприятия
 */
export function getStatusMessage(interval: string, isCancelled: boolean = false): StatusMessage | null {
  if (interval === 'not-started') {
    return {
      period: 'Ожидание',
      извещение1: 'Прием заявок еще не начался',
      извещение2: 'Следите за объявлением',
      status: 'starting'
    }
  }
  
  const message = statusMessagesTable[interval]
  if (!message) return null
  
  // Если мероприятие отменено и есть альтернативные тексты
  if (isCancelled && (message.извещение1ПриОтмене || message.извещение2ПриОтмене)) {
    return {
      ...message,
      извещение1: message.извещение1ПриОтмене || message.извещение1,
      извещение2: message.извещение2ПриОтмене || message.извещение2,
      status: 'cancelled'
    }
  }
  
  return message
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

/**
 * Универсальный таймер обратного отсчета до следующей контрольной точки
 * Используется на странице Мониторинг
 */
export function getCountdownTimer(deadlineNext?: string, currentInterval?: string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  isZero: boolean
  formatted: string
  urgent: boolean
} {
  // После ti50 показываем нули
  if (!deadlineNext || currentInterval === 'ti50-t999') {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isZero: true,
      formatted: '0 дн 0 ч 0 мин',
      urgent: false
    }
  }
  
  const now = Date.now()
  const deadline = new Date(deadlineNext).getTime()
  const diff = deadline - now
  
  // Если дедлайн прошел
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isZero: true,
      formatted: '0 дн 0 ч 0 мин',
      urgent: false
    }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  // Форматирование
  let formatted = ''
  if (days > 0) {
    formatted = `${days} дн ${hours} ч ${minutes} мин`
  } else if (hours > 0) {
    formatted = `${hours} ч ${minutes} мин`
  } else if (minutes > 0) {
    formatted = `${minutes} мин ${seconds} сек`
  } else {
    formatted = `${seconds} сек`
  }
  
  // Срочно, если осталось меньше 24 часов
  const urgent = diff < (24 * 60 * 60 * 1000)
  
  return {
    days,
    hours,
    minutes,
    seconds,
    isZero: false,
    formatted,
    urgent
  }
}

