# Peta kata kunci dan Local SEO

Versi 1.0 · 2026-10-14 · Semua status volume/kompetisi: `NOT VERIFIED` (tidak ada data volume, CPC, atau kesulitan kata kunci yang dikarang).

Dokumen ini adalah peta hipotesis kata kunci ke halaman yang **sudah ada**, plus checklist Local SEO. Tidak ada halaman baru yang dibuat untuk mengejar kata kunci; halaman tipis/duplikat dilarang.

## 1. Peta kata kunci (hipotesis)

| Kata kunci | Intent | Halaman target | Peluang konten | Niat konversi | Status |
|---|---|---|---|---|---|
| rumah dijual Bandung Timur | Komersial | `/` (beranda) + `/properti` | — | Tinggi | NOT VERIFIED |
| rumah baru Cibiru Wetan | Komersial/lokal | `/` + `/bandung-timur` | Tambahan konteks kawasan bila data resmi tersedia | Tinggi | NOT VERIFIED |
| perumahan Cibiru | Komersial/lokal | `/bandung-timur` | Nama perumahan + alamat dari CMS | Tinggi | NOT VERIFIED |
| Bukit Flamboyan Indah 2 | Brand/proyek | `/` + `/properti/{slug}` tipe | Konsistensi penamaan di seluruh halaman | Sangat tinggi | NOT VERIFIED |
| rumah dijual dekat Cileunyi | Lokal | `/bandung-timur` + `/properti` | Butuh data jarak/akses terverifikasi sebelum menyebut Cileunyi | Tinggi | NOT VERIFIED |
| rumah tipe 36/60 Bandung | Komersial | `/properti/bukit-flamboyan-indah-2-36-60` | Penjelasan spesifikasi tipe (dari data katalog) | Tinggi | NOT VERIFIED |
| rumah KPR Bandung Timur | Komersial/informasional | `/properti/{slug}#simulasi-kpr` + `/panduan/merencanakan-pembiayaan` | Panduan pembiayaan sudah ada; kalkulator ada di halaman detail | Sedang–tinggi | NOT VERIFIED |
| cara memilih rumah pertama | Informasional | `/panduan/kunjungan-rumah`, `/panduan/memilih-lokasi` | Panduan existing | Sedang | NOT VERIFIED |
| simulasi KPR | Informasional/transaksional | `#simulasi-kpr` di detail properti | Tidak ada halaman khusus; jangan buat halaman kosong | Sedang | NOT VERIFIED |
| rumah second di Bandung Timur | Komersial | Belum ada inventori resale terverifikasi | Hanya bila katalog memuat unit bekas | Sedang | NOT VERIFIED |

Catatan: kata kunci di atas adalah **asumsi**. Jangan menuliskan angka volume, CPC, atau peringkat apa pun tanpa sumber data resmi (Google Keyword Planner/Ahrefs/Semrush milik pengguna).

## 2. Aturan on-page yang dipegang

- Satu topik utama per halaman; `h1` tunggal dan deskriptif; tidak ada keyword stuffing.
- Judul dan deskripsi unik per halaman (lihat [technical-seo.md](../audits/technical-seo.md)).
- Deskripsi mencerminkan inventori yang benar-benar tayang; klaim yang tidak dapat diverifikasi tidak ditulis.
- Panduan lama yang sudah baik dipertahankan; penambahan artikel hanya bila memberi informasi baru yang bermanfaat.

## 3. Local SEO

Fakta yang boleh dipakai (bersumber katalog/CMS, bukan karangan):

- Nama pengembang: `PT. Batu Wangi Indah`; nama proyek: `Bukit Flamboyan Indah 2`.
- Lokasi: `Jl. Cikoneng, Ciguruwik, Cibiru Wetan, Kabupaten Bandung`; konteks pasar: Bandung Timur.
- Kontak marketing: WhatsApp Admin dari CMS (`62895375894848`, nomor sementara pengguna).
- Rentang harga: mengikuti katalog published (contoh program ≤ 2026-10-29; lihat [brochure-kpr-research.md](../brochure-kpr-research.md)).

Data yang **belum tersedia** dan tidak boleh dikarang: koordinat final, daftar fasilitas dengan jarak terukur, waktu tempuh, legalitas per unit, nomor telepon kantor/alamat kantor marketing.

Checklist Local SEO (tindakan):

1. Konsistenkan nama bisnis + nomor WhatsApp + alamat di situs, Instagram, iklan, dan Google Business Profile begitu profil dibuat.
2. Bila koordinat resmi tersedia, tambahkan sebagai data terverifikasi (properti sudah memiliki kolom koordinat/POI di API) dan tampilkan peta setelah persetujuan pengunjung.
3. Google Business Profile: **hanya** buat bila bisnis memenuhi kelayakan Google (lokasi fisik yang dapat dikunjungi pelanggan). Kesiapannya: NAP konsisten, foto asli (bukan ilustrasi), kategori yang tepat, deskripsi tanpa klaim berlebihan. Tidak ada profil yang dibuat pada pekerjaan ini.
4. Pastikan konsistensi NAP di seluruh materi iklan sebelum kampanye berjalan.

## 4. Klaster konten

Tiga panduan yang sudah ada (`kunjungan-rumah`, `memilih-lokasi`, `merencanakan-pembiayaan`) sudah menutup intent informasional utama. Usulan lanjutan (PLANNED, butuh penulis/manusia, bukan produksi massal):

- Panduan membandingkan tipe rumah (memanfaatkan fitur bandingkan).
- Penjelasan perbedaan luas tanah dan luas bangunan (mengangkat istilah yang ada di katalog).
- Checklist berkas pembelian rumah — **hanya** bila dapat ditinjau pihak berkompeten; artikel keuangan/legal wajib membedakan panduan umum dari nasihat profesional.

## 5. Batas

Dokumen ini tidak mengklaim peningkatan trafik, peringkat, atau konversi. Semua keputusan kata kunci final memerlukan data kata kunci nyata dan, untuk klaim performa, laporan Search Console setelah domain resmi aktif.
