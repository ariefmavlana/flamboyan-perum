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
export interface StaffAccount extends User {
  email: string
  is_active: boolean
  version: number
  email_verified_at: string | null
}
export interface InternalProperty extends Property {
  owner_id: number
  owner: { id: number; name: string }
  publication: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  version: number
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
  property?: { id: number; title: string; slug: string }
  assignee?: { id: number; name: string } | null
}
export interface LeadHistory {
  id: number
  type: string
  from_status: LeadStatus | null
  to_status: LeadStatus | null
  note: string | null
  created_at: string
  actor: { id: number; name: string }
  previous_assignee?: { id: number; name: string } | null
  next_assignee?: { id: number; name: string } | null
}
