import type { Lead, LeadStatus } from '../types'

export const leadLabels: Record<LeadStatus, string> = {
  NEW_LEAD: 'Baru',
  FOLLOWED_UP: 'Sudah dihubungi',
  SURVEY_LOKASI: 'Survei lokasi',
  PEMBERKASAN_KPR: 'Pemberkasan / KPR',
  DEAL: 'Pembelian selesai',
  LOST: 'Tidak dilanjutkan',
}

export const leadTransitions: Record<LeadStatus, LeadStatus[]> = {
  NEW_LEAD: ['FOLLOWED_UP', 'LOST'],
  FOLLOWED_UP: ['SURVEY_LOKASI', 'LOST'],
  SURVEY_LOKASI: ['PEMBERKASAN_KPR', 'LOST'],
  PEMBERKASAN_KPR: ['DEAL', 'LOST'],
  DEAL: [],
  LOST: [],
}

export const workQueues = [
  {
    key: 'unassigned',
    label: 'Belum ditugaskan',
    hint: 'Pilih Marketing penanggung jawab',
    admin: true,
  },
  {
    key: 'contact',
    label: 'Perlu dihubungi',
    hint: 'Mulai percakapan dengan calon pembeli',
    admin: false,
  },
  {
    key: 'visit',
    label: 'Kunjungan & tindak lanjut',
    hint: 'Atur survei atau catat hasil kunjungan',
    admin: false,
  },
  {
    key: 'documents',
    label: 'Pemberkasan',
    hint: 'Tindak lanjuti dokumen pembelian',
    admin: false,
  },
] as const
export type WorkQueue = (typeof workQueues)[number]['key']
export interface LeadSummary {
  total: number
  active: number
  statuses: Record<LeadStatus, number>
  work: Record<WorkQueue, number>
}

export function nextLeadAction(lead: Lead): string {
  if (lead.anonymized_at) return 'Kontak telah dianonimkan'
  if (lead.status === 'DEAL') return 'Pembelian selesai — riwayat tersimpan'
  if (lead.status === 'LOST') return 'Proses berakhir — riwayat tersimpan'
  if (!lead.assigned_marketing_id) return 'Tugaskan ke Marketing'
  return {
    NEW_LEAD: 'Hubungi calon pembeli',
    FOLLOWED_UP: 'Rencanakan survei lokasi',
    SURVEY_LOKASI: 'Tindak lanjuti hasil survei',
    PEMBERKASAN_KPR: 'Konfirmasi kelengkapan & hasil pembelian',
  }[lead.status]
}
