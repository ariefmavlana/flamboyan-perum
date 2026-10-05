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
  availability: 'AVAILABLE' | 'BOOKED' | 'SOLD_OUT' | 'CHECK_REQUIRED'
  featured: boolean
  commercial?: PublicCommercial | null
}
export interface PaymentPlan {
  title: string
  kind: 'CASH' | 'INSTALLMENT'
  upfront_idr: number
  months: number
  monthly_idr: number
  total_idr: number
  valid_from: string
  valid_until: string
  quota: number
  source_name: string
  notes: string
}
export interface CommercialSettings {
  floors: number
  lot_dimensions: string
  planned_units: number
  features: string[]
  source_name: string
  source_date: string
  notes: string
  fee_notes: string
  program_fee_idr: number | null
  program_fee_start: string | null
  program_fee_until: string | null
  next_fee_idr: number | null
  next_fee_start: string | null
  payment_plans: PaymentPlan[]
}
export interface PublicCommercial extends Omit<
  CommercialSettings,
  'program_fee_start' | 'program_fee_until' | 'next_fee_idr' | 'next_fee_start'
> {
  normal_price_idr: string
  offer_until: string | null
}
export interface Development {
  id: number
  name: string
  developer: string
  address: string
  whatsapp: string
  website: string
  planned_units: number
  house_types: number
  facilities: string
  nearby: string
  source_name: string
  source_date: string
  notes: string
}
export interface RatePhase {
  months: number
  annual_rate: number
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
  floating_rate?: number
  min_tenor_months?: number
  max_tenor_months?: number
  checked_date?: string
  conditions?: string
  min_principal_idr?: number
  max_principal_idr?: number
  max_ltv_percent?: number
  phases?: RatePhase[]
  provision_percent?: number
  admin_percent?: number
  admin_min_idr?: number
  admin_max_idr?: number
  appraisal_min_idr?: number
  appraisal_max_idr?: number
}
export interface PublicContent {
  development?: Development | null
  hero: {
    id: number
    title: string
    description: string
    eyebrow: string
    property_id: number | null
    property?: Property | null
    media?: PublicMedia | null
  } | null
  testimonials: { id: number; name: string; quote: string; context: string }[]
  bank_rates: BankRate[]
  bank_partners?: {
    id: number
    name: string
    website: string
    logo_url: string
  }[]
}
export interface EditorialContent {
  id: number
  kind: 'HERO' | 'TESTIMONIAL' | 'BANK_RATE' | 'BANK_PARTNER' | 'DEVELOPMENT'
  payload: Record<string, string | number | null | RatePhase[]>
  published: boolean
  position: number
  version: number
  verified_at: string | null
  logo_uploaded?: boolean
}
export interface PublicMedia {
  id: number
  kind: 'PHOTO' | 'FLOOR_PLAN' | 'MASTERPLAN' | 'VIDEO' | 'TOUR' | 'BROCHURE'
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
export interface InternalProperty extends Omit<Property, 'commercial'> {
  commercial?: CommercialSettings | null
  offer_price_idr?: string | null
  offer_start?: string | null
  offer_end?: string | null
  next_price_idr?: string | null
  next_price_start?: string | null
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
  whatsapp_number: string | null
  anonymized_at?: string | null
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
  redacted_at?: string | null
  created_at: string
  actor: { id: number; name: string }
  previous_assignee?: { id: number; name: string } | null
  next_assignee?: { id: number; name: string } | null
}

export interface LeadReport {
  cohort_size: number
  conversion_percent: number
  statuses: Record<string, number>
  follow_up: {
    completed: number
    median_seconds: number | null
    not_followed_up: number
    invalid_timing_count: number
    pending_age: {
      unassigned: number
      under_1_day: number
      '1_to_7_days': number
      over_7_days: number
    }
  }
  current_assignees: {
    user_id: number | null
    name: string
    lead_count: number
    deals: number
    conversion_percent: number
  }[]
  first_follow_up_actors: { user_id: number; name: string; completed: number }[]
  funnel: { enabled: boolean; property_view: number; whatsapp_click: number }
}
