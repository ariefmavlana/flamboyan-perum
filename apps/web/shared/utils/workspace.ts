import type { StaffAccount } from '../types'

const sections = [
  {
    label: 'Penjualan',
    links: [
      {
        to: '/backoffice',
        label: 'Calon pembeli',
        icon: 'users',
        guide: 'calon-pembeli',
        description:
          'Catat, tugaskan, dan tindak lanjuti perjalanan pembelian.',
        admin: false,
      },
      {
        to: '/backoffice/permintaan',
        label: 'Permintaan masuk',
        icon: 'bell',
        guide: 'permintaan',
        description:
          'Tinjau formulir publik sebelum membuat atau menautkan calon pembeli.',
        admin: true,
      },
      {
        to: '/backoffice/hasil',
        label: 'Hasil prospek',
        icon: 'chart',
        guide: 'hasil',
        description:
          'Catat qualification, kunjungan aktual, dan hasil sampai akad.',
        admin: false,
      },
      {
        to: '/backoffice/laporan',
        label: 'Hasil penjualan',
        icon: 'chart',
        guide: 'laporan',
        description:
          'Pantau perkembangan tim menurut periode dan penanggung jawab.',
        admin: true,
      },
    ],
  },
  {
    label: 'Website',
    links: [
      {
        to: '/backoffice/properti',
        label: 'Katalog properti',
        icon: 'home',
        guide: 'katalog',
        description: 'Kelola informasi rumah, foto, denah, dan publikasi.',
        admin: false,
      },
      {
        to: '/backoffice/konten',
        label: 'Konten publik',
        icon: 'file',
        guide: 'konten',
        description: 'Perbarui beranda, video, kawasan, dan pembiayaan bank.',
        admin: true,
      },
    ],
  },
  {
    label: 'Administrasi',
    links: [
      {
        to: '/backoffice/akun',
        label: 'Akun tim',
        icon: 'users',
        guide: 'akun',
        description: 'Kelola akses dan penanggung jawab pekerjaan tim.',
        admin: true,
      },
      {
        to: '/backoffice/privasi',
        label: 'Kandidat retensi',
        icon: 'shield',
        guide: 'retensi',
        description:
          'Tinjau kandidat retensi melalui prosedur privasi terkontrol.',
        admin: true,
      },
      {
        to: '/backoffice/operasi',
        label: 'Kesehatan layanan',
        icon: 'settings',
        guide: 'layanan',
        description: 'Periksa penyimpanan, antrean, dan bukti cadangan.',
        admin: true,
      },
    ],
  },
  {
    label: 'Bantuan & akun',
    links: [
      {
        to: '/backoffice/panduan',
        label: 'Panduan kerja',
        icon: 'book',
        guide: 'mulai',
        description: 'Langkah kerja dan jawaban untuk kendala sehari-hari.',
        admin: false,
      },
      {
        to: '/backoffice/profil',
        label: 'Profil saya',
        icon: 'user',
        guide: 'profil',
        description: 'Perbarui nama dan keamanan akun Anda.',
        admin: false,
      },
    ],
  },
] as const

export function workspaceNavigation(role?: StaffAccount['role'] | null) {
  if (!role) return []
  return sections
    .map((section) => ({
      label: section.label,
      links: section.links
        .filter((link) => !link.admin || role === 'ADMIN')
        .map((link) => ({
          ...link,
          description:
            role === 'MARKETING' && link.to === '/backoffice'
              ? 'Tindak lanjuti calon pembeli yang ditugaskan kepada Anda.'
              : role === 'MARKETING' && link.to === '/backoffice/hasil'
                ? 'Catat qualification dan kunjungan calon pembeli yang ditugaskan kepada Anda.'
                : role === 'MARKETING' && link.to === '/backoffice/properti'
                  ? 'Kelola informasi dan media properti milik Anda.'
                  : link.description,
        })),
    }))
    .filter((section) => section.links.length)
}
