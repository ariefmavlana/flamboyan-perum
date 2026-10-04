export interface Property {
  latitude?: string | null
  longitude?: string | null
  pois?: PointOfInterest[]
  media?: PublicMedia[]
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
export interface PointOfInterest {
  name: string
  category: 'TRANSPORT' | 'EDUCATION' | 'HEALTH' | 'SHOPPING' | 'OTHER'
  distance_m: number
  source_url: string
  source_date: string
}
export interface BankRate {
  id: number
  bank: string
  product: string
  annual_rate: number
  effective_date: string
  valid_until: string
  fixed_months: number
  source_url: string
}
export interface PublicContent {
  hero: {
    id: number
    title: string
    description: string
    eyebrow: string
    property_id: number | null
    property?: Property | null
  } | null
  testimonials: { id: number; name: string; quote: string; context: string }[]
  bank_rates: BankRate[]
}
export interface EditorialContent {
  id: number
  kind: 'HERO' | 'TESTIMONIAL' | 'BANK_RATE'
  payload: Record<string, string | number | null>
  published: boolean
  position: number
  version: number
  verified_at: string | null
}
export interface PublicMedia {
  id: number
  kind: 'PHOTO' | 'FLOOR_PLAN' | 'VIDEO' | 'TOUR' | 'BROCHURE'
  alt: string
  position: number
  url: string | null
  width: number | null
  height: number | null
  sources: { url: string; width: number | null; height: number | null }[]
}
export interface InternalMedia {
  id: number
  kind: PublicMedia['kind']
  alt: string
  position: number
  state: 'PROCESSING' | 'READY' | 'FAILED' | 'ARCHIVED'
  published: boolean
  failure_code: string | null
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
