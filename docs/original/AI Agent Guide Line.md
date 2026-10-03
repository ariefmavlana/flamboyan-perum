# Guideline AI Agent: Perencanaan Pembuatan Web Properti Catalog

## 1. Konsep Utama
Tugas Anda adalah membangun sebuah website Catalog properti perumahan. UI/UX harus disesuaikan dengan behavior orang-orang dari kalangan middle to high agar memudahkan mereka dalam proses surfing nya secara komprehensive dan modern. Pendekatan desain harus berkesan premium, responsif, berfokus pada konversi (Lead Generation), dan sangat memperhatikan optimasi SEO.

## 2. Arsitektur Fitur Frontend (Publik)

### A. Home Page
- **Hero Section**: Banner visual resolusi tinggi dengan *Global Search Bar*.
- **Tombol WhatsApp Terpusat**: Call to Action (CTA) tunggal untuk menghubungi Admin guna proses pembentukan *database* awal calon pembeli.
- **Featured Properties**: Menyorot unit-unit properti unggulan.
- **Social Proof**: Testimoni pelanggan dan logo bank rekanan.

### B. Page List Properti
- **Tampilan Utama**: List berbentuk Card.
- **Data Card**: Informasi card mencakup tipe rumah, kondisi rumah (baru / tidak), sertifikat tanah, lokasi, harga rumah, alamat, luas tanah, jumlah kamar tidur, jumlah kamar mandi, luas bangunan, serta tombol whatsapp agar mudah untuk menghubungi. Data *user marketing* spesifik disembunyikan di tampilan publik.
- **Pencarian Lanjutan**: Tersedia filter untuk grouping berdasarkan informasi, fungsi *sorting* (berdasarkan harga, luasan, terbaru), dan fitur perbandingan (*Compare*) antar spesifikasi properti.

### C. Halaman Detail Properti (Single Page)
- **Spesifikasi Lengkap**: Menampilkan seluruh data atribut properti secara mendetail (Wajib di-render secara SSR untuk kebutuhan meta tag SEO).
- **Media Visual**: Fitur Galery berisi foto - foto dan video properti. Mendukung penyematan tautan video (YouTube/platform video lainya dan dapat di play di web). Ditambahkan dengan fitur *Virtual Tour 360* dan denah (*Floor Plan*).
- **Lokasi & Lingkungan**: Integrasi peta (Google Maps) dan informasi *Point of Interest* (POI) untuk fasilitas publik terdekat.
- **Konversi**: Tombol unduh brosur (PDF) dan tombol WhatsApp terpusat yang otomatis menghasilkan pesan *template* berisi tautan spesifik properti tersebut.

### D. Kalkulator KPR
- **Fungsi Utama**: Fitur untuk Simulasi Penghitungan cicilan bulanan KPR.
- **Variabel Input**: Pilihan suku bunga berbagai bank, input nilai uang muka (DP), durasi tenor, dan pilihan suku bunga (Fixed/Floating).
- **Visualisasi**: Grafik persentase porsi pembayaran bunga dan pokok hutang.

## 3. Arsitektur Fitur Backend (Back Office)

### A. Manajemen Properti & Konten
- **Katalog Unit**: Fitur Management Properti yang di handle oleh user Marketing.
- **Form Input Spesifikasi**: Kolom input informasi properti termasuk info jumlah ruangan, luas tanah, luas bangunan, deskripsi. Dirancang untuk memudahkan marketing mendeskripsikan propertinya dan memudahkan calon pembeli mengetahui detail propertinya.
- **Manajemen Status**: Pembaruan ketersediaan unit (*Available, Booked, Sold Out*).
- **CMS & Akun**: Fitur Content Management dan pengaturan Profil user marketing.

### B. Manajemen Leads & CRM Terpusat (Akses Admin)
- **Penerimaan Leads**: Modul untuk Admin mencatat data calon pembeli yang masuk melalui WhatsApp (Nama, No WA, Properti yang dituju).
- **Distribusi Penugasan**: Admin menggunakan fungsi *dropdown* untuk menugaskan (*assign*) satu calon pembeli ke satu *User Marketing* secara spesifik.
- **Supervisi**: Dashboard pelaporan untuk memantau tingkat konversi dan kecepatan *follow-up* setiap tim marketing.

### C. Tracking Penugasan (Akses Marketing)
- **Tabel CRM Konvensional**: Tampilan *dashboard* berupa tabel baris standar yang memuat daftar prospek yang telah ditugaskan oleh Admin.
- **Pipeline Status**: Fungsi *dropdown* untuk memperbarui tahapan operasional calon pembeli: *New Lead, Followed Up, Survey Lokasi, Pemberkasan/KPR, Deal*, dan *Lost*.
- **Log Catatan (Notes)**: Kolom penambahan histori aktivitas atau catatan khusus per calon pembeli pada tabel baris tersebut.
- **Riwayat Perjalanan (History)**: Tombol "Lihat Histori" pada tabel yang akan memunculkan UI *Side Drawer* (panel meluncur dari kanan). Di dalamnya menampilkan *Vertical Timeline* (berisi: Tanggal/Jam, Aktor, Status Perubahan, dan Catatan) untuk melacak kronologi *leads* dari awal masuk hingga tahap akhir secara *descending*.

### D. Sistem Notifikasi (Real-time)
- **Notifikasi Marketing**: Ikon lonceng (*bell*) peringatan *real-time* jika ada penugasan *leads* baru dari Admin.
- **Notifikasi Admin**: Ikon lonceng (*bell*) peringatan *real-time* jika *User Marketing* telah memperbarui tahapan (*Pipeline Status*) calon pembeli.

## 4. Alur Interaksi Sistem (User Flows)
- **Flow Pembeli**: Eksplorasi Web -> Menganalisis Halaman Detail -> Klik CTA WhatsApp -> Dialihkan ke WA Admin.
- **Flow CRM (Distribusi & Tracking)**: Admin mencatat leads -> Admin *assign* ke Marketing A -> Ikon lonceng Marketing A menyala -> Marketing A melihat *Tabel Penugasan* -> Marketing A melakukan kontak dan memperbarui *Pipeline Status* beserta catatan -> Ikon lonceng Admin menyala -> Jejak pembaruan terekam otomatis di *Vertical Timeline*.

## 5. Standar Teknologi & Infrastruktur (AI Generation Rules)
- **Frontend Framework**: Gunakan Nuxt.js (Vue.js) yang diatur dalam mode SSR (Server-Side Rendering) untuk memastikan halaman publik terindeks sempurna oleh mesin pencari.
- **Backend Framework**: Gunakan Laravel untuk membangun arsitektur *REST API* yang *robust*.
- **Database & ORM**: Gunakan PostgreSQL sebagai pilihan utama produksi atau SQLite bila kapasitas dan pola tulisnya sesuai, dipadukan dengan Eloquent ORM bawaan Laravel. Migrasi, indeks, transaksi, dan query inti harus dapat diuji pada kedua database. Data CRM dan katalog harus persisten; file media disimpan terpisah dari database.
- **Sistem Real-time (Notifikasi)**: Gunakan Laravel Echo di Nuxt.js dengan layanan *push* terkelola yang kompatibel (misalnya Pusher) sebagai pilihan awal shared hosting. Reverb/Soketi hanya boleh dipilih bila hosting menyediakan proses jangka panjang dan akses WebSocket. Simpan notifikasi di database agar tetap tersedia saat koneksi real-time terputus.
- **Deployment**: Target produksi adalah shared hosting tanpa Docker. Laravel harus berjalan pada PHP yang didukung hosting, dengan *document root* mengarah ke direktori `public`, konfigurasi rahasia di luar web root, HTTPS, akses database, penyimpanan persisten, dan cron. Nuxt SSR dinamis hanya dapat dipertahankan bila paket hosting mendukung proses Node.js persisten dan routing ke proses tersebut. Jika tidak, keputusan rendering dan/atau platform hosting harus diselesaikan sebelum implementasi; *prerender* hanya dapat dipakai bila pembaruan seluruh halaman properti dipublikasikan ulang secara andal. Tetapkan prosedur migrasi, backup dan uji restore untuk database serta media.
