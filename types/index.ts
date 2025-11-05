
export type ControlPointCode = 't0'|'ti10'|'ti20'|'ti30'|'ti40'|'ti50'|'t999'
export type EventCategory = 'master-class' | 'training' | 'excursion' | 'gastro-show' | 'lecture' | 'cruise'
export type EventStatus = 'draft' | 'published'
export type UserRole = 'applicant' | 'producer'

export interface EventItem {
  id: string
  title: string
  author: string
  location: string
  startAt: string // ti40 - начало проведения мероприятия
  endAt?: string // ti50 - окончание проведения мероприятия
  seatLimit?: number
  priceTotal: number
  pricePerSeat?: number
  image?: string
  controlPlan: ControlPointCode[]
  category?: EventCategory
  description?: string
  activities?: string[]
  startApplicationsAt?: string // ti10 - начало приема заявок
  endApplicationsAt?: string // ti20 - окончание приема заявок
  startContractsAt?: string // ti30 - начало оформления договоров
  authorInfo?: {
    name: string
    title: string
    achievements?: string[]
  }
  status?: EventStatus // draft (черновик) | published (опубликовано)
  producerName?: string // Имя продюсера, создавшего мероприятие
  createdAt?: string // Дата создания мероприятия
  updatedAt?: string // Дата последнего обновления
}
export interface FavoriteItem { eventId: string; pinnedAt: string }
export interface Applicant { code: string; seats: number; paidAmount: number }
export interface MonitoringSnapshot {
  eventId: string
  nowPoint: ControlPointCode
  collected: number
  deficit: number
  surplus: number
  applicants: Applicant[]
  deadlineNext?: string
}
