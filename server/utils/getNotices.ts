/**
 * Утилита для получения текстов извещений между контрольными точками
 * 
 * Контрольные точки:
 * t0 – момент записи мероприятия в каталог (появление на сайте)
 * ti10 – начало приема заявок
 * ti20 – окончание приема заявок
 * ti30 – начало оформления договоров на участие в мероприятии
 * ti40 – начало проведения мероприятия
 * ti50 – окончание проведения мероприятия
 * t999 – момент удаления мероприятия из каталога (исчезновение с сайта)
 */

export type ControlPoint = 't0' | 'ti10' | 'ti20' | 'ti30' | 'ti40' | 'ti50' | 't999'

export interface Notice {
  notice1: string
  notice1Cancelled: string | null
  notice2: string
  notice2Cancelled: string | null
}

interface NoticeMap {
  [key: string]: Notice
}

const NOTICES: NoticeMap = {
  't0-ti10': {
    notice1: 'Опубликовали объявление о мероприятии – цену, сроки и другие необходимые сведения.',
    notice1Cancelled: '',
    notice2: 'Начало приема заявок на участие',
    notice2Cancelled: ''
  },
  'ti10-ti20': {
    notice1: 'Принимаем заявки на участие в мероприятии и обеспечительные платежи',
    notice1Cancelled: '',
    notice2: 'Окончание приема заявок на участие, начало калькуляции складочных цен',
    notice2Cancelled: ''
  },
  'ti20-ti30': {
    notice1: 'Подводим итоги сбора средств, готовим документы для расчетов с заявителями.',
    notice1Cancelled: '',
    notice2: 'Объявление результатов калькуляции складочных цен',
    notice2Cancelled: ''
  },
  'ti30-ti40': {
    notice1: 'Собрано достаточно средств, мероприятие состоится, проводим расчеты с заявителями',
    notice1Cancelled: 'Собрано недостаточно средств, проводим расчеты с заявителями',
    notice2: 'Начало мероприятия',
    notice2Cancelled: 'Мероприятие не состоится'
  },
  'ti40-ti50': {
    notice1: 'Проводится мероприятие',
    notice1Cancelled: 'Собрано недостаточно средств, проводим расчеты с заявителями',
    notice2: 'Окончание мероприятия',
    notice2Cancelled: 'Мероприятие не состоится'
  },
  'ti50-t999': {
    notice1: 'Мероприятие завершилось',
    notice1Cancelled: 'Истек срок проведения мероприятия',
    notice2: '',
    notice2Cancelled: ''
  }
}

/**
 * Получить интервал контрольных точек
 */
function getControlPointInterval(currentPoint: ControlPoint | null): string | null {
  const points: ControlPoint[] = ['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999']
  
  if (!currentPoint) {
    return 't0-ti10' // по умолчанию начало
  }
  
  const currentIndex = points.indexOf(currentPoint)
  if (currentIndex === -1 || currentIndex === points.length - 1) {
    return null // последняя точка
  }
  
  const nextPoint = points[currentIndex + 1]
  return `${currentPoint}-${nextPoint}`
}

/**
 * Получить тексты извещений для текущей контрольной точки
 * 
 * @param currentControlPoint - текущая контрольная точка
 * @param isCancelled - отменено ли мероприятие
 * @returns объект с текстами извещений
 */
export function getNotices(
  currentControlPoint: ControlPoint | null,
  isCancelled: boolean = false
): Notice | null {
  const interval = getControlPointInterval(currentControlPoint)
  
  if (!interval) {
    return null // нет извещений после t999
  }
  
  const notice = NOTICES[interval]
  
  if (!notice) {
    return null
  }
  
  return {
    notice1: isCancelled && notice.notice1Cancelled ? notice.notice1Cancelled : notice.notice1,
    notice1Cancelled: notice.notice1Cancelled,
    notice2: isCancelled && notice.notice2Cancelled ? notice.notice2Cancelled : notice.notice2,
    notice2Cancelled: notice.notice2Cancelled
  }
}

/**
 * Получить все возможные интервалы и их извещения (для справки/тестирования)
 */
export function getAllNotices(): { interval: string, notices: Notice }[] {
  return Object.entries(NOTICES).map(([interval, notices]) => ({
    interval,
    notices
  }))
}

/**
 * Проверить валидность контрольной точки
 */
export function isValidControlPoint(point: string): point is ControlPoint {
  return ['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999'].includes(point)
}

