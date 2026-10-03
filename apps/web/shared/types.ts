export interface Property {
  id: number
  slug: string
  title: string
  house_type: string
  condition: 'NEW' | 'RESALE'
  certificate: string
  location: string
  address: string
  description: string
  price_idr: string
  land_area: string
  building_area: string
  bedrooms: number
  bathrooms: number
  availability: 'AVAILABLE' | 'BOOKED' | 'SOLD_OUT'
  featured: boolean
}
export interface Paginated<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    total: number
    per_page: number
  }
  links: { prev: string | null; next: string | null }
}
export interface User {
  id: number
  name: string
  role: 'ADMIN' | 'MARKETING'
}
export type LeadStatus =
  | 'NEW_LEAD'
  | 'FOLLOWED_UP'
  | 'SURVEY_LOKASI'
  | 'PEMBERKASAN_KPR'
  | 'DEAL'
  | 'LOST'
export interface Lead {
  id: number
  name: string
  whatsapp_number: string
  property_id: number
  assigned_marketing_id: number | null
  status: LeadStatus
  version: number
}
export interface LeadHistory {
  id: number
  type: string
  from_status: LeadStatus | null
  to_status: LeadStatus | null
  note: string | null
  created_at: string
  actor: { id: number; name: string }
}
