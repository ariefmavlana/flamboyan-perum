import type { LeadStatus, Paginated } from './types'

export interface InquiryOption {
  property_id: number
  title: string
  canonical_path: string
}

export interface InquiryOptionsResponse {
  data: InquiryOption[]
  meta: {
    enabled: boolean
    privacy_notice_version: string | null
    privacy_notice_url: string | null
    service_hours_notice: string | null
    attribution_context_enabled: boolean
  }
}

export type InquiryPurpose = 'CONSULTATION' | 'VISIT_REQUEST'
export type InquiryResolutionAction =
  'ACCEPT_NEW' | 'LINK_EXISTING' | 'REJECT_SPAM'

export interface InquiryAttribution {
  source?: string | null
  medium?: string | null
  campaign?: string | null
  content?: string | null
  term?: string | null
  method?: string | null
  captured_at?: string | null
}

export interface InternalInquiry {
  id: number
  receipt: string
  property_id: number
  property: InquiryOption | null
  name: string | null
  whatsapp_number: string | null
  purpose: InquiryPurpose
  preferred_visit_at: string | null
  message: string | null
  privacy_notice_version: string
  marketing_opt_in: boolean
  state: string
  version: number
  lead_id: number | null
  attribution: { first_touch: InquiryAttribution | null; last_touch: InquiryAttribution | null; method: string } | null
  resolution_action: InquiryResolutionAction | null
  resolution_reason: string | null
  resolved_at: string | null
  created_at: string
}

export type InquiryPage = Paginated<InternalInquiry>

export type VisitStatus =
  'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface OutcomeActor {
  id: number
  name: string
}

export interface LeadOutcomes {
  lead_id: number
  lead_version: number
  visits_meta: { current_page: number; last_page: number; total: number }
  qualification: {
    qualified: boolean
    reason: string | null
    changed_at: string | null
    actor: OutcomeActor | null
  } | null
  visits: {
    id: number
    status: VisitStatus
    scheduled_at: string | null
    reason: string | null
    version: number
    changed_at: string
    actor: OutcomeActor | null
  }[]
  akad: {
    confirmed: boolean
    occurred_at: string | null
    reference: string | null
    reason: string | null
    changed_at: string | null
    actor: OutcomeActor | null
  } | null
  attribution: {
    first_touch: InquiryAttribution | null
    last_touch: InquiryAttribution | null
    method: string
    captured_at: string | null
  }
}

export interface GrowthReport {
  cohort: 'lead_created_at'
  inquiry_cohort: 'inquiry_created_at'
  inquiries: { total: number; pending: number; resolved: number; rejected_spam: number; expired: number }
  valid_leads_unique: number
  linked_inquiry_leads_unique: number
  unknown_source_unique: number
  qualified_unique: number
  visits_confirmed_unique: number
  visits_completed_unique: number
  deals_unique: number
  akad_confirmed_unique: number
  campaigns: { source: string; medium: string; campaign: string; method: string; valid_leads_unique: number; qualified_unique: number; akad_confirmed_unique: number }[]
  costs: { available: boolean; cpl_idr: number | null; cpql_idr: number | null; reason: string }
}

export interface OutcomeLeadSummary {
  id: number
  name: string
  status: LeadStatus
  version: number
  property?: { id: number; title: string; slug: string }
}
