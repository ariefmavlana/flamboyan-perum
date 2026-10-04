# Product Requirements Document (PRD)
## Property Catalog & Lead Management Platform

**Document Type:** Product Requirements Document (PRD)  
**Source:** `AI Agent Guide Line.md`  
**Related Document:** `SRS.md`  
**Version:** 1.1  
**Status:** Draft / Product Baseline  
**Last Updated:** 2026-09-30

---

## 1. Product Overview

### 1.1 Product Name

**Property Catalog & Lead Management Platform**

### 1.2 Product Summary

Produk ini adalah platform katalog properti yang menggabungkan **website publik untuk discovery dan lead generation** dengan **back office untuk pengelolaan properti dan CRM leads**.

Website publik ditujukan untuk memberikan pengalaman browsing yang premium, modern, responsif, dan mudah digunakan oleh calon pembeli dari segmen middle-to-high. Fokus utama pengalaman publik adalah membantu pengunjung menemukan properti, memahami detailnya, melakukan perbandingan dan simulasi KPR, kemudian menghubungi Admin melalui WhatsApp.

Sisi internal menyediakan workflow untuk Admin dan Marketing: lead dicatat oleh Admin, ditugaskan kepada Marketing tertentu, kemudian diproses menggunakan pipeline status sampai menghasilkan Deal atau Lost. Seluruh perubahan pipeline dicatat dalam histori dan perubahan penting dikirim melalui notifikasi real-time.

Guideline menetapkan bahwa produk harus berorientasi pada conversion/lead generation dan memperhatikan optimasi SEO. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### 1.3 Product Vision

Membangun satu platform digital yang menjadi **single source of truth untuk katalog properti dan perjalanan lead**, dari saat calon pembeli menemukan properti sampai proses follow-up dan status akhir lead.

### 1.4 Product Mission

Menyederhanakan dua proses utama:

1. **Discovery → Interest → Contact** bagi calon pembeli.
2. **Lead → Assignment → Follow-up → Pipeline → Outcome** bagi Admin dan Marketing.

---

## 2. Problem Statement

### 2.1 Masalah dari Sisi Calon Pembeli

Calon pembeli membutuhkan cara yang mudah untuk:

- menemukan properti berdasarkan kebutuhan;
- memahami spesifikasi rumah secara lengkap tanpa harus bertanya untuk informasi dasar;
- melihat foto, video, virtual tour, floor plan, lokasi, dan fasilitas sekitar;
- membandingkan beberapa properti;
- memahami estimasi cicilan KPR;
- menghubungi pihak penjual dengan konteks properti yang jelas.

### 2.2 Masalah dari Sisi Bisnis

Tim internal membutuhkan proses terpusat untuk:

- menjaga katalog properti tetap terkendali;
- menerima dan mencatat leads;
- mendistribusikan leads kepada Marketing;
- melihat status follow-up setiap lead;
- mengetahui histori perjalanan lead;
- memantau aktivitas dan conversion secara operasional.

### 2.3 Problem yang Hendak Diselesaikan Produk

Produk harus mengurangi friksi antara **informasi properti yang tersedia untuk publik** dan **proses follow-up internal**, sehingga aktivitas pemasaran tidak terpisah antara katalog dan CRM.

---

## 3. Goals & Objectives

### 3.1 Product Goals

| ID | Goal | Outcome |
|---|---|---|
| G-01 | Meningkatkan kualitas property discovery | Pengunjung dapat menemukan dan mengevaluasi properti dengan cepat |
| G-02 | Meningkatkan lead generation | CTA WhatsApp menjadi jalur utama dari interest menuju contact |
| G-03 | Memusatkan katalog properti | Informasi dan availability unit dikelola dari back office |
| G-04 | Memperjelas distribusi lead | Setiap lead dapat ditugaskan kepada Marketing tertentu |
| G-05 | Meningkatkan visibility follow-up | Admin dapat memonitor pipeline dan aktivitas Marketing |
| G-06 | Menyediakan histori yang dapat dilacak | Perubahan pipeline tersimpan sebagai timeline aktivitas |
| G-07 | Mendukung SEO | Halaman detail properti dapat dirender secara SSR dan memiliki metadata yang sesuai |

### 3.2 Business Objectives

Produk diarahkan untuk mendukung:

- peningkatan jumlah calon pembeli yang menghubungi Admin;
- pengelolaan database leads yang lebih terstruktur;
- distribusi leads yang jelas kepada Marketing;
- pemantauan kecepatan follow-up;
- monitoring conversion dari lead menuju Deal.

Angka target dan baseline kuantitatif **TBD**.

---

## 4. Target Users

### 4.1 Primary User — Property Buyer / Visitor

Profil umum:

- datang melalui search engine, direct traffic, campaign, atau referral;
- membutuhkan informasi properti yang lengkap dan visual;
- menggunakan perangkat desktop maupun mobile;
- membutuhkan jalur komunikasi yang cepat dengan Admin.

### 4.2 Primary Internal User — Marketing

Kebutuhan utama:

- mengelola informasi unit properti;
- melihat leads yang diberikan kepadanya;
- melakukan follow-up;
- memperbarui tahapan pipeline;
- menambahkan notes;
- melihat histori lead.

### 4.3 Primary Internal User — Admin

Kebutuhan utama:

- mencatat lead;
- mengaitkan lead dengan properti;
- memilih Marketing penerima lead;
- memonitor perubahan pipeline;
- melihat pelaporan aktivitas dan conversion.

### 4.4 Additional Role — Super Admin

**TBD.** Guideline secara eksplisit mendefinisikan Admin dan User Marketing; kebutuhan role di atasnya belum ditentukan.

---

## 5. Product Principles

### 5.1 Premium Experience

UI/UX harus memberikan kesan premium dan modern, sesuai target pengguna middle-to-high.

### 5.2 Conversion Focused

Jalur dari property discovery menuju WhatsApp harus jelas dan tidak menambah langkah yang tidak diperlukan.

### 5.3 Information Rich, Not Information Overloaded

Detail properti harus lengkap, tetapi disajikan dalam struktur yang mudah dipindai.

### 5.4 SEO First for Public Property Pages

Halaman detail properti merupakan aset konten utama dan harus tersedia melalui SSR untuk kebutuhan indexing dan metadata SEO. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### 5.5 Traceable CRM

Setiap perpindahan pipeline harus dapat ditelusuri melalui histori lead.

---

## 6. Product Scope

### 6.1 Public Product

Produk publik mencakup:

- Home Page;
- Global Search;
- Property Listing;
- filtering dan grouping;
- sorting;
- property comparison;
- Property Detail Page;
- photo gallery;
- video embedding;
- Virtual Tour 360;
- Floor Plan;
- Google Maps dan POI;
- downloadable brochure;
- WhatsApp CTA;
- KPR Calculator.

Fitur-fitur tersebut berasal dari arsitektur frontend pada guideline. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### 6.2 Internal Product

Back office mencakup:

- Property Management;
- Property Content Management;
- Availability Management;
- Marketing Profile;
- Lead Management;
- Lead Assignment;
- Pipeline Tracking;
- Notes/Activity Log;
- Lead History;
- Reporting Dashboard;
- Real-time Notifications.

Guideline mendefinisikan modul back office untuk Management Properti, Admin CRM, Marketing CRM, dan notifikasi real-time. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### 6.3 Infrastructure Scope

Teknologi target:

- Nuxt.js / Vue.js dengan SSR untuk frontend;
- Laravel REST API untuk backend;
- PostgreSQL sebagai pilihan utama produksi atau SQLite sesuai kapasitas dan pola tulis, dengan Eloquent;
- layanan push terkelola yang kompatibel dengan Laravel Echo untuk real-time; Reverb/Soketi hanya jika hosting mendukung proses persisten;
- Laravel Echo untuk client;
- shared hosting tanpa Docker, dengan PHP, database persisten, cron, HTTPS, dan penyimpanan media persisten;
- dukungan proses Node.js persisten dan routing untuk Nuxt SSR dinamis harus dikonfirmasi sebelum memilih paket hosting.

Penyesuaian deployment dan pilihan database di atas adalah keputusan proyek yang menggantikan ketentuan infrastruktur pada guideline awal.

---

## 7. MVP Definition

MVP difokuskan pada alur bisnis inti berikut:

```text
Visitor
  ↓
Browse / Search Property
  ↓
Property Detail
  ↓
WhatsApp CTA
  ↓
Admin records Lead
  ↓
Admin assigns Marketing
  ↓
Marketing receives Notification
  ↓
Marketing follows up
  ↓
Pipeline Status Updates
  ↓
Admin receives Notification
  ↓
Lead History is recorded
```

### 7.1 MVP — Must Have

| Priority | Feature | Rationale |
|---|---|---|
| P0 | Home Page | Entry point utama public website |
| P0 | Property Listing | Discovery katalog |
| P0 | Property Detail | Informasi utama sebelum conversion |
| P0 | WhatsApp CTA | Jalur conversion utama |
| P0 | Property Management | Sumber data katalog |
| P0 | Lead Management | Menangkap dan menyimpan prospek |
| P0 | Lead Assignment | Distribusi lead ke Marketing |
| P0 | Pipeline Tracking | Tracking lifecycle lead |
| P0 | Lead History | Audit perjalanan lead |
| P0 | Real-time Notification | Memberitahu assignment dan perubahan pipeline |
| P0 | SSR Property Detail | Mendukung tujuan SEO |
| P1 | Search & Filter | Mempercepat discovery |
| P1 | Sorting | Mendukung eksplorasi katalog |
| P1 | KPR Calculator | Mendukung evaluasi kemampuan pembayaran |
| P1 | Gallery / Video / Floor Plan | Memperkaya property detail |
| P1 | Google Maps / POI | Mendukung evaluasi lokasi |
| P1 | Compare | Mendukung evaluasi beberapa properti |
| P1 | Brochure PDF | Mendukung kebutuhan informasi offline |
| P1 | Reporting Dashboard | Supervisi Admin |

Prioritas P0/P1 di atas merupakan **prioritas produk yang diturunkan dari alur inti guideline**, bukan prioritas yang secara eksplisit dituliskan oleh guideline.

---

## 8. User Journeys

### 8.1 Buyer Journey

Guideline mendefinisikan flow pembeli sebagai:

```text
Eksplorasi Web
    ↓
Menganalisis Halaman Detail
    ↓
Klik CTA WhatsApp
    ↓
Dialihkan ke WhatsApp Admin
```

[AI Agent Guide Line.md](<AI Agent Guide Line.md>)

#### Expected Product Experience

1. Visitor tiba di Home Page.
2. Visitor menggunakan search atau navigasi katalog.
3. Visitor membuka Property Detail.
4. Visitor memeriksa harga, spesifikasi, media, lokasi, dan informasi pendukung.
5. Visitor melakukan Compare atau simulasi KPR bila diperlukan.
6. Visitor menekan WhatsApp CTA.
7. Sistem membuka WhatsApp Admin dengan template message yang mengacu pada properti tertentu.
8. Proses komunikasi dilanjutkan di WhatsApp.

### 8.2 Admin Lead Distribution Journey

```text
Lead masuk / dicatat
    ↓
Admin memilih properti
    ↓
Admin assign Marketing
    ↓
Notification → Marketing
    ↓
Marketing melihat lead
```

### 8.3 Marketing Follow-up Journey

```text
Lead assigned
    ↓
Open Lead
    ↓
Follow-up
    ↓
Update Pipeline
    ↓
Add Notes
    ↓
History recorded
    ↓
Notification → Admin
```

### 8.4 Pipeline Lifecycle

Status yang didefinisikan guideline:

```text
New Lead
   ↓
Followed Up
   ↓
Survey Lokasi
   ↓
Pemberkasan / KPR
   ↓
Deal
```

Alternative outcome:

```text
Any applicable stage → Lost
```

Pipeline status ini harus tersedia untuk update oleh Marketing. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 9. Feature Requirements

## 9.1 Home Page

### Objective

Mengenalkan katalog dan mendorong visitor masuk ke proses discovery.

### Requirements

- Hero banner resolusi tinggi.
- Global Search Bar.
- Featured Properties.
- WhatsApp CTA terpusat.
- Social Proof berupa testimonial dan logo bank rekanan.

Guideline secara eksplisit menyebut empat komponen tersebut. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### Success Indicator

Visitor dapat menemukan entry point pencarian dan CTA WhatsApp tanpa kebingungan.

---

## 9.2 Property Listing

### Objective

Memungkinkan visitor menelusuri kumpulan unit secara cepat.

### Property Card Information

Card harus dapat menampilkan:

- tipe rumah;
- kondisi rumah (baru / tidak);
- sertifikat tanah;
- lokasi;
- harga rumah;
- alamat;
- luas tanah;
- jumlah kamar tidur;
- jumlah kamar mandi;
- luas bangunan;
- WhatsApp CTA.

Informasi user marketing tertentu tidak ditampilkan ke publik. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### Discovery Tools

- advanced filter;
- grouping/filter berdasarkan atribut;
- sorting harga;
- sorting luasan;
- sorting terbaru;
- Compare.

Field filter dan business rule detail **TBD** bila belum ditentukan dalam SRS.

---

## 9.3 Property Detail

### Objective

Memberikan informasi yang cukup untuk membantu visitor mengevaluasi properti sebelum contact.

### Content

Detail harus mencakup seluruh atribut properti yang tersedia, termasuk informasi yang relevan dengan katalog.

### Media

- photo gallery;
- video embedding;
- Virtual Tour 360;
- Floor Plan.

Video harus dapat menggunakan tautan YouTube atau platform video lain yang didukung sistem. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### Location

- Google Maps;
- POI/fasilitas publik terdekat.

### Conversion

- Download brochure PDF.
- Centralized WhatsApp CTA.
- Template WhatsApp harus otomatis mengandung konteks/link property spesifik.

---

## 9.4 KPR Calculator

### Objective

Membantu visitor melakukan simulasi cicilan bulanan.

### Inputs

- bank / pilihan suku bunga;
- nilai DP;
- tenor;
- tipe suku bunga Fixed / Floating.

### Output

- estimasi cicilan bulanan;
- visualisasi proporsi bunga;
- visualisasi proporsi pokok hutang.

Formula, skenario fixed-to-floating, sumber suku bunga, dan frekuensi update rate **TBD**.

Guideline mendefinisikan fungsi dan input utama calculator. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 9.5 Property Management

### Objective

Memberikan Marketing kemampuan mengelola katalog properti.

### Capabilities

- create property;
- edit property;
- mengisi spesifikasi;
- mengelola jumlah ruangan;
- mengelola luas tanah;
- mengelola luas bangunan;
- mengelola deskripsi;
- mengelola media/konten;
- memperbarui availability;
- mengelola profile Marketing sesuai hak akses.

Status availability:

- Available;
- Booked;
- Sold Out.

Requirements ini mengikuti guideline back office. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 9.6 Lead Management — Admin

### Objective

Memastikan setiap lead yang masuk tercatat dan dapat ditindaklanjuti.

### Lead Data Minimum

Guideline mendefinisikan minimal:

- Nama;
- No. WhatsApp;
- Properti yang dituju.

[AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### Assignment

Admin harus dapat memilih satu User Marketing melalui dropdown dan menugaskan lead tersebut secara spesifik.

### Reporting

Admin membutuhkan dashboard untuk memantau:

- conversion rate;
- follow-up speed;
- aktivitas tim Marketing.

Definisi formula KPI **TBD**.

---

## 9.7 Lead Tracking — Marketing

### Objective

Menyediakan workspace operasional untuk menangani leads yang telah ditugaskan.

### Table

Lead ditampilkan dalam tabel baris standar.

### Pipeline

Marketing dapat memilih status dari:

- New Lead;
- Followed Up;
- Survey Lokasi;
- Pemberkasan/KPR;
- Deal;
- Lost.

### Notes

Marketing dapat menambahkan catatan aktivitas/histori.

### History

Tombol “Lihat Histori” membuka Side Drawer dengan Vertical Timeline.

Timeline harus memuat:

- tanggal/jam;
- aktor;
- status perubahan;
- catatan.

Urutan history harus descending, dari aktivitas terbaru ke terlama. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 9.8 Real-time Notifications

### Marketing Notification

Marketing menerima notifikasi real-time ketika Admin melakukan assignment lead baru.

### Admin Notification

Admin menerima notifikasi real-time ketika Marketing memperbarui pipeline lead.

### UI

Notifikasi direpresentasikan melalui ikon bell. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### Technology

Implementation target:

- layanan push terkelola yang kompatibel dengan Laravel Echo sebagai pilihan awal shared hosting;
- Laravel Echo di Nuxt.js.

Notifikasi harus disimpan di database dan tetap dapat dilihat setelah koneksi real-time terputus. Reverb/Soketi hanya layak bila paket hosting mendukung proses persisten dan WebSocket. Provider final **TBD**.

---

## 10. UX Requirements

### 10.1 Public UX

Public experience harus:

- premium;
- modern;
- responsif;
- mudah discan;
- conversion focused;
- visual-heavy untuk membantu evaluasi properti;
- memiliki CTA yang jelas.

### 10.2 Internal UX

Back office harus mengutamakan operational efficiency:

- tabel untuk data CRM;
- filter/search untuk data leads;
- dropdown untuk pipeline status;
- side drawer untuk history;
- bell notification untuk event real-time.

Guideline secara eksplisit memilih tabel konvensional untuk CRM dan Side Drawer + Vertical Timeline untuk history. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### 10.3 Responsive Behavior

Website publik harus responsive untuk perangkat mobile dan desktop.

Breakpoints, browser support matrix, dan accessibility target **TBD**.

---

## 11. SEO Requirements

### Objectives

Memaksimalkan kemampuan halaman properti untuk ditemukan dan diindeks oleh search engine.

### Requirements

- Property Detail wajib menggunakan SSR.
- Metadata halaman harus dapat dibuat berdasarkan properti.
- URL property harus bersifat indexable.
- Konten detail properti harus tersedia pada server-rendered HTML.
- Social sharing metadata **TBD**.
- Structured data/schema markup **TBD**.
- Sitemap dan robots policy **TBD**.

Guideline mewajibkan SSR pada halaman detail untuk kebutuhan meta tag SEO. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 12. Data & Content Model — Product View

Model produk secara konseptual membutuhkan entity berikut:

```text
Property
 ├── Property Specification
 ├── Property Media
 ├── Property Availability
 ├── Property Location
 ├── Property POI
 ├── Property Brochure
 └── Property Marketing Owner

Lead
 ├── Interested Property
 ├── Assigned Marketing
 ├── Pipeline Status
 ├── Notes / Activities
 └── History / Timeline

Marketing User
 ├── Profile
 └── Assigned Leads

Bank / Interest Rate
 └── KPR Simulation Data
```

ERD, exact field definitions, constraints, indexing strategy, dan relationship cardinality mengikuti SRS / technical design dan belum seluruhnya ditentukan oleh guideline.

---

## 13. Product Analytics & Success Metrics

### 13.1 North-Star Direction

Arah utama pengukuran produk adalah **qualified property interest yang berujung pada contact/lead**.

### 13.2 Funnel Metrics

Funnel yang direkomendasikan untuk diukur:

```text
Property Page View
      ↓
Property Engagement
      ↓
WhatsApp CTA Click
      ↓
Lead Recorded
      ↓
Lead Assigned
      ↓
Lead Follow-up
      ↓
Deal / Lost
```

### 13.3 Operational Metrics

- jumlah lead masuk;
- jumlah lead per property;
- jumlah lead per Marketing;
- waktu dari lead masuk ke assignment;
- waktu dari assignment ke follow-up;
- distribusi pipeline status;
- jumlah Deal;
- jumlah Lost;
- conversion rate.

Definisi resmi formula KPI dan target numerik **TBD**.

---

## 14. Non-Functional Product Requirements

### 14.1 Performance

Public property page harus dirancang agar cepat dimuat dan tetap responsive.

Target response time, Core Web Vitals, throughput, dan concurrency **TBD**.

### 14.2 Availability

Platform harus dirancang untuk dapat digunakan oleh public visitor dan internal users sesuai operational needs.

SLA availability **TBD**.

### 14.3 Security

Produk harus membatasi akses back office berdasarkan role dan tidak mengekspos data internal Marketing ke public website.

Detail authentication, authorization model, encryption, secret management, audit log, dan retention **TBD**.

### 14.4 Scalability

Frontend dan backend harus dapat diperbarui secara terpisah sesuai kemampuan shared hosting. Batas proses, memori, koneksi database, dan beban tulis SQLite harus dievaluasi sebelum skala trafik meningkat.

### 14.5 Maintainability

Frontend dan backend harus memiliki proses build, konfigurasi, dan prosedur rilis yang terdokumentasi sesuai kemampuan hosting, tanpa ketergantungan pada Docker.

---

## 15. Integrations

### 15.1 WhatsApp

Purpose:

- contact CTA;
- mengarahkan visitor ke Admin;
- membawa konteks property melalui prefilled template message.

Metode implementasi WhatsApp dan inbound lead automation **TBD**.

### 15.2 Google Maps

Purpose:

- menampilkan lokasi properti;
- membantu visitor memahami area sekitar.

### 15.3 POI Provider

Purpose:

- memberikan informasi fasilitas publik terdekat.

Provider dan radius pencarian **TBD**.

### 15.4 Video Platform

Purpose:

- embedding video properti.

YouTube disebut sebagai platform yang harus didukung; platform tambahan **TBD**. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### 15.5 Real-time Provider

Alternatif:

- layanan push terkelola yang kompatibel dengan Laravel Echo (pilihan awal);
- Laravel Reverb atau Soketi bila kemampuan hosting sudah dibuktikan.

Pilihan final **TBD**. Notifikasi tetap disimpan di database agar tidak hilang ketika koneksi push gagal.

---

## 16. Constraints & Assumptions

### 16.1 Constraints

- Frontend menggunakan Nuxt.js/Vue.js.
- Public property pages menggunakan SSR.
- Backend menggunakan Laravel REST API.
- Database menggunakan PostgreSQL sebagai pilihan utama produksi atau SQLite bila beban dan kemampuan hosting sesuai. Kedua jalur harus didukung oleh migrasi dan pengujian inti.
- Eloquent menjadi ORM.
- Notifikasi disimpan di database dan dikirim melalui layanan push terkelola yang kompatibel dengan Laravel Echo; Reverb/Soketi membutuhkan dukungan proses persisten dan WebSocket.
- Deployment menggunakan shared hosting tanpa Docker. Nuxt SSR dinamis mensyaratkan proses Node.js persisten dan routing yang didukung hosting.

### 16.2 Assumptions

- WhatsApp merupakan channel komunikasi utama antara visitor dan Admin.
- Admin menjadi pihak yang mencatat dan mendistribusikan leads.
- Satu lead ditugaskan kepada satu Marketing pada satu assignment.
- Marketing bertanggung jawab memperbarui pipeline lead yang ditugaskan.
- Perubahan pipeline membutuhkan histori.
- Data Marketing tertentu tidak boleh ditampilkan di public catalog.

Assumption yang belum disepakati harus dikonfirmasi sebelum fitur terkait dianggap final.

---

## 17. Out of Scope for Initial Product Definition

Item berikut belum menjadi requirement produk yang terdefinisi dalam guideline:

- online payment;
- booking transaction/payment gateway;
- e-signature;
- mortgage application submission ke bank;
- integrasi ERP/accounting;
- advanced recommendation engine;
- AI chatbot/property agent;
- automated WhatsApp bot;
- multi-language;
- multi-tenant architecture;
- native mobile application.

Status masing-masing: **TBD / Future Scope**.

---

## 18. Risks & Product Considerations

| Risk | Impact | Mitigation Direction |
|---|---|---|
| Informasi property tidak konsisten | Visitor kehilangan kepercayaan | Centralized property management |
| Lead tidak segera di-follow-up | Conversion dapat menurun | Assignment + notification + follow-up tracking |
| Property sudah tidak tersedia tetapi masih tampil | Poor user experience | Availability status management |
| Detail property tidak SEO-friendly | Organic discovery berkurang | SSR property detail |
| Pipeline update tidak terlacak | Admin kehilangan visibility | Automatic history/timeline |
| Notification gagal diterima | Marketing/Admin dapat terlambat merespons | Realtime infrastructure + fallback strategy (TBD) |
| Suku bunga KPR tidak diperbarui | Simulasi menjadi tidak representatif | Define data source dan update ownership (TBD) |
| Paket shared hosting tidak mendukung proses Node.js persisten | Halaman properti tidak dapat dirender SSR pada setiap request | Verifikasi fitur hosting sebelum implementasi; pilih hosting yang sesuai atau putuskan strategi rendering ulang |
| Backup database tanpa media atau tanpa uji pemulihan | Data katalog/CRM tidak dapat dipulihkan utuh | Backup database dan media dengan retensi serta uji restore berkala |

---

## 19. Acceptance Criteria — Product Level

### Public Website

- Visitor dapat membuka Home Page dan menemukan Global Search.
- Visitor dapat melihat daftar properti dalam bentuk card.
- Visitor dapat membuka detail properti.
- Property Detail menampilkan informasi dan media yang tersedia.
- Visitor dapat menggunakan CTA WhatsApp dari property context.
- Property Detail dapat dirender melalui SSR.
- Visitor dapat melakukan simulasi KPR setelah input variabel yang disediakan.

### Property Management

- Marketing dapat membuat/mengubah informasi property sesuai aksesnya.
- Availability dapat diperbarui menjadi Available, Booked, atau Sold Out.

### CRM

- Admin dapat mencatat lead.
- Admin dapat mengaitkan lead dengan property.
- Admin dapat assign lead ke Marketing melalui dropdown.
- Marketing dapat melihat lead yang ditugaskan.
- Marketing dapat mengubah pipeline status.
- Marketing dapat menambahkan notes.
- User dapat membuka history lead.
- History menampilkan tanggal/jam, aktor, perubahan status, dan catatan.

### Notification

- Marketing mendapat notifikasi ketika lead baru di-assign.
- Admin mendapat notifikasi ketika pipeline lead diperbarui Marketing.

### Deployment

- Aplikasi dapat dipasang dan diperbarui di shared hosting tanpa Docker, dengan HTTPS dan rahasia di luar web root.
- Halaman detail properti terbukti menghasilkan HTML berisi konten dan metadata saat diminta; paket hosting mendukung runtime yang dipilih.
- Data katalog, lead, histori, notifikasi, dan media tetap ada setelah proses aplikasi atau hosting dimulai ulang.
- Migrasi database, backup, dan pemulihan database beserta media telah diuji pada target hosting.

---

## 20. Open Questions / TBD

Bagian berikut harus diselesaikan Product Owner/Business Owner sebelum requirement dianggap final:

| Topic | Question |
|---|---|
| Authentication | Bagaimana login Admin dan Marketing dilakukan? |
| Authorization | Apakah Marketing hanya dapat melihat property/leads miliknya atau ada scope lain? |
| Lead creation | Apakah seluruh lead selalu dibuat manual oleh Admin, atau ada mekanisme inbound otomatis dari WhatsApp? |
| Assignment | Apakah satu lead dapat di-reassign? Bagaimana histori reassignment dicatat? |
| Pipeline | Apakah Marketing diperbolehkan mundur ke status sebelumnya? |
| Lost | Apakah status Lost membutuhkan reason/category? |
| Property ownership | Apakah satu property dapat dimiliki/ditangani lebih dari satu Marketing? |
| Search | Attribute apa saja yang menjadi filter public? |
| Compare | Berapa jumlah property maksimum yang dapat dibandingkan? |
| KPR | Dari mana data suku bunga diperoleh dan siapa yang memperbaruinya? |
| SEO | Apakah dibutuhkan Schema.org, sitemap, canonical, Open Graph, dan Twitter/X metadata? |
| Maps | API/provider apa yang digunakan untuk Maps dan POI? |
| Media | Bagaimana penyimpanan foto, video reference, floor plan, dan brochure? |
| Notification | Apakah perlu unread count, notification center, atau hanya toast/bell indicator? |
| Reporting | Apa definisi resmi conversion rate dan follow-up speed? |
| Security | Requirement authentication, authorization, audit, retention, dan privacy apa yang diwajibkan? |
| Localization | Apakah bahasa selain Bahasa Indonesia diperlukan? |
| Deployment | Paket shared hosting mana, dan apakah tersedia PHP/ekstensi, Node.js persisten, routing SSR, PostgreSQL/SQLite, cron, HTTPS, kuota media, backup, monitoring, dan akses deploy yang dibutuhkan? |
| Database | Apakah PostgreSQL tersedia di paket produksi? Jika SQLite dipilih, berapa batas trafik/tulis dan bagaimana lokasi privat serta backup konsistennya? |

---

## 21. Traceability to Guideline

| Guideline Area | PRD Coverage |
|---|---|
| Product concept | Sections 1–5 |
| Home Page | Section 9.1 |
| Property Listing | Section 9.2 |
| Property Detail | Section 9.3 |
| KPR Calculator | Section 9.4 |
| Property Management | Section 9.5 |
| Admin CRM | Section 9.6 |
| Marketing CRM | Section 9.7 |
| Notifications | Section 9.8 |
| User Flows | Section 8 |
| Technology / Infrastructure | Sections 6.3, 15, 16 |
| SEO / SSR | Section 11 |

---

## 22. Relationship with SRS

Dokumen ini dan `SRS.md` memiliki fungsi yang berbeda:

| Document | Primary Question | Focus |
|---|---|---|
| `PRD.md` | **Why are we building it and what product should exist?** | User, problem, goals, scope, priorities, journeys, success |
| `SRS.md` | **What must the software/system do?** | Functional requirements, technical constraints, roles, APIs, data, NFR |

Recommended workflow:

```text
AI Agent Guide Line.md
       ↓
     PRD.md
       ↓
     SRS.md
       ↓
Architecture / ERD / API Contract
       ↓
Implementation Tasks
       ↓
Development / QA / Release
```

---

## 23. Definition of Done — Product Requirement

A product feature can be considered ready for implementation completion when:

1. User problem and expected outcome are clear.
2. Functional behavior is defined in the SRS.
3. Relevant acceptance criteria are testable.
4. Role/access behavior is defined.
5. Required states and edge cases are documented.
6. Relevant UI/UX behavior is defined.
7. Required integrations are identified.
8. SEO requirements are covered for public property content where applicable.
9. Analytics/KPI event requirements are defined where applicable.
10. No unresolved TBD blocks the implementation of the feature.

---

## 24. Product Status

**Current status:** Draft / Baseline.

This PRD is derived from `AI Agent Guide Line.md` with the project owner's revision to shared hosting and PostgreSQL/SQLite. Items explicitly present in the guideline are treated as source requirements except where that revision supersedes the original infrastructure choices; additional prioritization, product framing, assumptions, and open questions are identified as derived product structure rather than undisclosed source requirements.
