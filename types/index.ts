
export type ControlPointCode = 't0'|'ti10'|'ti20'|'ti30'|'ti40'|'ti50'|'t999'
export type EventCategory = 'master-class' | 'training' | 'excursion' | 'gastro-show' | 'lecture' | 'cruise'

export interface EventItem {
  id: string
  title: string
  author: string
  location: string
  startAt: string
  seatLimit?: number
  priceTotal: number
  pricePerSeat?: number
  image?: string
  controlPlan: ControlPointCode[]
  category?: EventCategory
  description?: string
  activities?: string[]
  startApplicationsAt?: string
  endApplicationsAt?: string
  authorInfo?: {
    name: string
    title: string
    achievements?: string[]
  }
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
