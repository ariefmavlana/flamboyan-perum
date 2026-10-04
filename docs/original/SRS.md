# Software Requirements Specification (SRS)
## Property Catalog & Lead Management Platform

**Document Type:** Software Requirements Specification (SRS)  
**Source:** `AI Agent Guide Line.md`  
**Version:** 1.1  
**Status:** Draft / Implementation Baseline  
**Last Updated:** 2026-09-30

---

## 1. Document Overview

### 1.1 Purpose

Dokumen ini mendefinisikan kebutuhan perangkat lunak untuk membangun platform **Property Catalog & Lead Management** yang terdiri dari:

1. Website publik untuk eksplorasi dan pencarian properti.
2. Back Office untuk Marketing dalam mengelola katalog properti.
3. Modul CRM untuk Admin dalam menerima, mendistribusikan, dan memonitor leads.
4. Modul CRM untuk Marketing dalam melakukan follow-up dan memperbarui pipeline leads.
5. Sistem notifikasi real-time antara Admin dan Marketing.
6. KPR calculator untuk simulasi cicilan bulanan.
7. Deployment pada shared hosting tanpa Docker, dengan frontend SSR dan backend REST API jika runtime hosting mendukungnya.

SRS ini diturunkan dari `AI Agent Guide Line.md`, yang menetapkan karakteristik utama produk: premium, modern, responsif, berorientasi conversion/lead generation, serta SEO-friendly. Keputusan proyek terbaru mengganti Docker dengan shared hosting dan pilihan database menjadi PostgreSQL/SQLite.

### 1.2 Product Goal

Sistem harus memudahkan calon pembeli dalam:

- menemukan properti yang relevan;
- memahami spesifikasi properti secara lengkap;
- melihat media dan informasi lingkungan properti;
- melakukan simulasi KPR;
- menghubungi Admin melalui WhatsApp dengan konteks properti yang jelas.

Pada sisi internal, sistem harus memudahkan perusahaan dalam:

- mengelola katalog unit;
- menerima leads;
- mendistribusikan leads kepada Marketing;
- melacak pipeline follow-up;
- menyimpan histori aktivitas;
- memonitor aktivitas dan konversi tim Marketing.

### 1.3 Source of Truth

Requirements yang secara eksplisit ditulis dalam dokumen ini mengikuti guideline sumber, kecuali keputusan proyek terbaru tentang hosting dan database. Detail teknis atau bisnis yang tidak terdapat dalam guideline ditandai sebagai **TBD** dan harus diputuskan sebelum implementasi fitur terkait.

### 1.4 Reference Requirements

Guideline menetapkan website catalog properti dengan UI/UX premium untuk pengguna middle-to-high, responsif, conversion-focused, dan SEO optimized. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 2. Scope

### 2.1 In Scope

#### Public Frontend

- Home page.
- Pencarian properti.
- Filtering properti.
- Sorting properti.
- Compare properti.
- Detail properti.
- Gallery foto.
- Video embedding.
- Virtual Tour 360.
- Floor Plan.
- Google Maps.
- Point of Interest (POI).
- Download brosur PDF.
- WhatsApp CTA.
- KPR Calculator.
- SEO metadata dan SSR untuk halaman detail.

#### Back Office

- Property management.
- Property specification management.
- Property availability status management.
- CMS/content management.
- Marketing profile management.
- Lead management.
- Lead assignment.
- Lead pipeline tracking.
- Notes/activity log.
- Lead history/timeline.
- Dashboard reporting.
- Real-time notifications.

#### Infrastructure

- Nuxt.js SSR frontend.
- Laravel REST API backend.
- PostgreSQL sebagai pilihan utama produksi atau SQLite sesuai kapasitas dan pola tulis.
- Eloquent ORM.
- layanan push terkelola yang kompatibel dengan Laravel Echo; Reverb/Soketi hanya bila hosting mendukung proses persisten.
- Laravel Echo.
- shared hosting tanpa Docker, dengan PHP, HTTPS, cron, database dan media persisten.
- proses Node.js persisten dan routing ke Nuxt harus tersedia untuk SSR dinamis.

### 2.2 Out of Scope / Not Defined Yet

Hal-hal berikut belum ditentukan oleh guideline dan tidak boleh diasumsikan sebagai requirement final:

- metode authentication dan authorization secara detail;
- struktur organisasi/tenant bila sistem multi-company;
- payment atau online booking payment;
- integrasi WhatsApp Business API untuk inbound automation;
- integrasi CRM eksternal;
- source data bank dan mekanisme update suku bunga;
- detail algoritma ranking/search relevance;
- detail provider POI;
- detail provider video selain YouTube/platform video yang didukung;
- SLA, RTO, dan RPO;
- backup policy dan disaster recovery;
- audit/compliance requirement spesifik;
- localization/multi-language;
- analytics platform tertentu.

Semua item tersebut berstatus **TBD** sampai ditetapkan oleh product/business owner.

---

## 3. User Roles

### 3.1 Public Buyer / Visitor

Pengguna anonim yang mengakses website publik untuk mencari dan mengevaluasi properti.

Capabilities:

- melihat daftar properti;
- mencari dan memfilter properti;
- membandingkan properti;
- melihat detail properti;
- melihat media, lokasi, dan POI;
- menghitung simulasi KPR;
- mengunduh brosur;
- menghubungi Admin melalui WhatsApp.

### 3.2 Admin

Pengguna internal yang bertanggung jawab atas lead management dan supervisi Marketing.

Capabilities:

- mencatat leads;
- menentukan properti yang diminati lead;
- assign satu lead ke satu User Marketing;
- menerima notifikasi perubahan pipeline dari Marketing;
- memantau dashboard reporting;
- memonitor conversion rate dan follow-up speed.

### 3.3 User Marketing

Pengguna internal yang mengelola katalog properti dan menangani leads yang ditugaskan.

Capabilities:

- mengelola properti yang menjadi tanggung jawabnya;
- mengelola informasi/specification properti;
- mengelola status availability unit;
- mengelola konten sesuai hak akses;
- mengelola profil marketing;
- melihat leads yang ditugaskan kepadanya;
- mengubah pipeline status;
- menambahkan notes/activity;
- melihat history lead;
- menerima notifikasi assignment baru.

### 3.4 Super Admin

**TBD.** Guideline hanya menyebut Admin dan User Marketing. Bila sistem membutuhkan pengelolaan user, role dan konfigurasi platform, role Super Admin dapat ditambahkan pada desain final.

---

## 4. Product Architecture

### 4.1 High-Level Architecture

```text
                        +----------------------+
                        |   Public Visitors    |
                        +----------+-----------+
                                   |
                                   v
                     +--------------------------+
                     |   Nuxt.js SSR Frontend   |
                     | Public + Back Office UI  |
                     +------------+-------------+
                                  |
                                  | REST API / HTTPS
                                  v
                     +--------------------------+
                     |      Laravel Backend     |
                     |     REST API / Auth      |
                     +------+-----------+-------+
                            |           |
                 +----------+           +----------------+
                 |                                       |
                 v                                       v
      +----------------------+               +----------------------+
      | PostgreSQL / SQLite  |               | Push terkelola       |
      | Eloquent ORM         |               | + Laravel Echo       |
      +----------------------+               +----------------------+

External/Platform Integrations:
- WhatsApp
- Google Maps
- POI provider
- YouTube / video platform
- Bank interest rate source (TBD)
```

### 4.2 Required Technology Stack

| Layer | Requirement |
|---|---|
| Frontend | Nuxt.js / Vue.js |
| Rendering | SSR |
| Backend | Laravel |
| API | REST API |
| Database | PostgreSQL utama produksi atau SQLite bila sesuai beban |
| ORM | Laravel Eloquent |
| Real-time | Layanan push terkelola; Reverb/Soketi hanya bila hosting mendukung proses persisten |
| Frontend realtime client | Laravel Echo |
| Hosting | Shared hosting tanpa Docker; PHP, HTTPS, cron, penyimpanan persisten |
| Frontend SSR dinamis | Node.js persisten dan routing ke proses Nuxt wajib tersedia pada paket hosting |
| Backend web root | Laravel `public` sebagai document root |

Pilihan hosting, database, dan layanan real-time di atas menyesuaikan revisi proyek; kemampuan aktual penyedia hosting harus diverifikasi sebelum arsitektur dikunci.

---

## 5. Functional Requirements — Public Website

## 5.1 Home Page

### FR-PUB-001 — Hero Section

Sistem harus menyediakan hero section berupa banner visual resolusi tinggi yang memiliki Global Search Bar.

### FR-PUB-002 — Global Search

Global Search Bar harus menjadi entry point utama pencarian properti dari Home Page.

Search behavior/detail fields: **TBD**.

### FR-PUB-003 — WhatsApp CTA

Sistem harus menyediakan satu CTA WhatsApp terpusat untuk menghubungi Admin.

Tujuan CTA adalah memulai komunikasi dengan calon pembeli dan menjadi titik awal pembentukan database leads. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### FR-PUB-004 — Featured Properties

Home Page harus menampilkan unit/properti unggulan.

### FR-PUB-005 — Social Proof

Home Page harus menampilkan:

- testimoni pelanggan;
- logo bank rekanan.

---

## 5.2 Property Listing

### FR-PUB-010 — Property Card

Daftar properti harus ditampilkan dalam bentuk Card.

Setiap card minimal menampilkan:

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
- tombol WhatsApp.

Data marketing yang bersifat spesifik/internal tidak boleh ditampilkan pada tampilan publik. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### FR-PUB-011 — Advanced Search / Filter

Sistem harus menyediakan pencarian lanjutan untuk grouping/filtering berdasarkan informasi properti.

Filter dimensions harus minimal dapat mendukung atribut yang tersedia pada property model. Daftar filter final: **TBD**.

### FR-PUB-012 — Sorting

Sistem harus menyediakan sorting minimal berdasarkan:

- harga;
- luasan;
- terbaru.

### FR-PUB-013 — Compare

Pengguna harus dapat membandingkan beberapa properti berdasarkan spesifikasi yang relevan.

Jumlah maksimum properti yang dapat dibandingkan: **TBD**.

---

## 5.3 Property Detail

### FR-PUB-020 — Property Detail Page

Sistem harus menyediakan halaman detail untuk satu properti dengan spesifikasi lengkap.

Halaman ini **wajib dirender dengan SSR** untuk mendukung SEO dan rendering meta tag.

### FR-PUB-021 — Complete Specifications

Halaman detail minimal menyediakan seluruh atribut properti yang tersedia dan relevan bagi calon pembeli.

### FR-PUB-022 — Photo Gallery

Halaman detail harus menyediakan gallery foto properti.

### FR-PUB-023 — Video

Halaman detail harus mendukung penyematan dan playback video melalui tautan dari YouTube atau platform video lain yang didukung.

### FR-PUB-024 — Virtual Tour 360

Halaman detail harus menyediakan dukungan Virtual Tour 360.

### FR-PUB-025 — Floor Plan

Halaman detail harus menampilkan denah/floor plan apabila tersedia.

### FR-PUB-026 — Google Maps

Halaman detail harus menyediakan integrasi Google Maps untuk lokasi properti.

### FR-PUB-027 — Point of Interest

Sistem harus dapat menampilkan Point of Interest/fasilitas publik terdekat.

Provider POI dan radius pencarian: **TBD**.

### FR-PUB-028 — Brochure Download

Sistem harus menyediakan tombol untuk mengunduh brosur properti dalam format PDF.

### FR-PUB-029 — Property-specific WhatsApp CTA

WhatsApp CTA pada detail properti harus menghasilkan pesan template yang menyertakan tautan spesifik properti tersebut.

Requirements tersebut mengikuti guideline halaman detail properti. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 5.4 KPR Calculator

### FR-PUB-030 — Mortgage Simulation

Sistem harus dapat melakukan simulasi cicilan bulanan KPR.

### FR-PUB-031 — Bank Selection

Pengguna harus dapat memilih bank dengan pilihan suku bunga yang tersedia.

Sumber dan mekanisme update interest rate: **TBD**.

### FR-PUB-032 — Down Payment

Pengguna harus dapat memasukkan nilai uang muka (DP).

### FR-PUB-033 — Tenor

Pengguna harus dapat memilih durasi tenor.

Pilihan tenor final: **TBD**.

### FR-PUB-034 — Interest Type

Pengguna harus dapat memilih tipe suku bunga:

- Fixed;
- Floating.

### FR-PUB-035 — Payment Visualization

Sistem harus memvisualisasikan persentase porsi pembayaran antara:

- bunga;
- pokok hutang.

Requirements KPR Calculator mengikuti guideline sumber. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### 5.4.1 Calculation Contract

Formula kalkulasi final, aturan fixed-to-floating transition, biaya admin/provisi, insurance, tax, dan biaya lain: **TBD**.

Pada tahap implementasi awal, kalkulator hanya boleh menghitung komponen yang telah didefinisikan secara resmi oleh product owner.

---

## 6. Functional Requirements — Back Office

## 6.1 Property & Content Management

### FR-BO-PROP-001 — Property Catalog Management

User Marketing harus dapat membuat, melihat, mengubah, dan mengelola properti yang menjadi tanggung jawabnya sesuai authorization policy.

### FR-BO-PROP-002 — Property Specification

Form properti harus mendukung input minimal:

- jumlah ruangan;
- luas tanah;
- luas bangunan;
- deskripsi.

Form harus dirancang untuk memudahkan Marketing dalam mendeskripsikan properti dan membantu calon pembeli memahami detail properti. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### FR-BO-PROP-003 — Property Availability Status

Sistem harus mendukung status unit:

- `AVAILABLE`;
- `BOOKED`;
- `SOLD_OUT`.

Status harus dapat diperbarui oleh authorized User Marketing.

### FR-BO-PROP-004 — Content Management

Sistem harus menyediakan fungsi Content Management.

Detail jenis content, versioning, publication workflow, dan approval: **TBD**.

### FR-BO-PROP-005 — Marketing Profile

User Marketing harus dapat mengelola profilnya sesuai permission.

Field profil: **TBD**.

---

## 6.2 Lead & CRM Management — Admin

### FR-CRM-001 — Lead Creation

Admin harus dapat mencatat leads yang masuk melalui WhatsApp.

Data minimal:

- nama;
- nomor WhatsApp;
- properti yang dituju.

### FR-CRM-002 — Lead Assignment

Admin harus dapat assign satu lead kepada satu User Marketing tertentu melalui dropdown.

Satu assignment aktif harus mereferensikan satu User Marketing.

Aturan reassignment, assignment history, dan alasan reassignment: **TBD**.

### FR-CRM-003 — Lead Monitoring

Admin harus dapat memantau status leads yang sedang ditangani oleh Marketing.

### FR-CRM-004 — Conversion Dashboard

Dashboard Admin harus mendukung monitoring minimal:

- tingkat konversi;
- kecepatan follow-up setiap tim marketing.

Definisi formula conversion rate dan follow-up speed: **TBD**.

Requirements lead management mengikuti guideline sumber. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 6.3 Lead Tracking — Marketing

### FR-MKT-001 — Assigned Lead Table

Marketing harus memiliki dashboard berbentuk tabel konvensional yang menampilkan daftar prospek yang telah ditugaskan Admin.

### FR-MKT-002 — Pipeline Status

Marketing harus dapat memperbarui tahapan lead melalui dropdown.

Status yang wajib tersedia:

1. `NEW_LEAD`
2. `FOLLOWED_UP`
3. `SURVEY_LOKASI`
4. `PEMBERKASAN_KPR`
5. `DEAL`
6. `LOST`

### FR-MKT-003 — Lead Notes

Marketing harus dapat menambahkan histori aktivitas atau catatan khusus pada lead.

### FR-MKT-004 — Lead History

Marketing harus dapat membuka histori lead melalui tombol **Lihat Histori**.

UI yang digunakan adalah **Side Drawer** yang meluncur dari kanan.

### FR-MKT-005 — Vertical Timeline

History dalam Side Drawer harus menggunakan Vertical Timeline.

Setiap entry timeline minimal berisi:

- tanggal/jam;
- aktor;
- status perubahan;
- catatan.

Urutan history harus descending, sehingga aktivitas terbaru berada di atas.

Requirements tracking Marketing mengikuti guideline sumber. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 7. Real-time Notification Requirements

### FR-RT-001 — Marketing Assignment Notification

Marketing harus menerima notifikasi real-time ketika Admin memberikan assignment lead baru.

UI notification menggunakan ikon bell.

### FR-RT-002 — Admin Pipeline Update Notification

Admin harus menerima notifikasi real-time ketika Marketing memperbarui pipeline status lead.

### FR-RT-003 — Event Delivery

Implementasi utama pada shared hosting menggunakan layanan push terkelola yang kompatibel dengan Laravel Echo, misalnya Pusher. Laravel Reverb atau Soketi hanya dapat dipilih bila penyedia hosting mendukung proses jangka panjang, port/routing WebSocket, dan pemantauan proses. Frontend menggunakan Laravel Echo sebagai client. Event notifikasi harus dipersistenkan di database sebelum dikirim; saat koneksi push terputus, pengguna tetap dapat melihat notifikasi tersimpan setelah memuat ulang aplikasi.

### FR-RT-004 — Notification State

State notifikasi minimal harus mampu membedakan:

- unread;
- read.

Model data dan endpoint untuk state tersebut: **TBD**.

Guideline mensyaratkan notifikasi real-time dua arah antara Admin dan Marketing. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 8. End-to-End User Flows

### 8.1 Buyer Flow

```text
Home / Listing
      |
      v
Explore Properties
      |
      v
Property Detail
      |
      +--> Gallery / Video / 360 / Floor Plan
      |
      +--> Location / POI
      |
      +--> KPR Calculator
      |
      v
WhatsApp CTA
      |
      v
WhatsApp Admin
```

Flow ini mengikuti alur utama guideline: eksplorasi web → analisis detail → klik CTA WhatsApp → dialihkan ke WhatsApp Admin. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

### 8.2 CRM Flow

```text
Lead enters WhatsApp
        |
        v
Admin records lead
        |
        v
Admin assigns Marketing A
        |
        v
Real-time notification to Marketing A
        |
        v
Marketing sees Assigned Lead Table
        |
        v
Marketing contacts lead
        |
        v
Marketing updates pipeline + notes
        |
        v
Real-time notification to Admin
        |
        v
Activity recorded in Vertical Timeline
```

### 8.3 Lead State Transition

```text
NEW_LEAD
   |
   v
FOLLOWED_UP
   |
   v
SURVEY_LOKASI
   |
   v
PEMBERKASAN_KPR
   |
   +-------> LOST
   |
   v
DEAL
```

Allowed transition matrix detail: **TBD**. Sistem harus memiliki aturan validasi agar status tidak berpindah secara ilegal setelah transition matrix ditetapkan.

---

## 9. Data Requirements

## 9.1 Property Entity

Minimum logical attributes:

| Field | Requirement | Public |
|---|---|---|
| Property ID | Unique identifier | Yes |
| House Type | Required catalog attribute | Yes |
| Condition | New / not new | Yes |
| Land Certificate | Certificate information | Yes |
| Location | Location information | Yes |
| Price | Property price | Yes |
| Address | Property address | Yes |
| Land Area | Land size | Yes |
| Bedrooms | Number of bedrooms | Yes |
| Bathrooms | Number of bathrooms | Yes |
| Building Area | Building size | Yes |
| Description | Property description | Yes |
| Availability Status | Available / Booked / Sold Out | Yes |
| Marketing Owner | Internal ownership relation | No |
| Media | Images/videos/360/floor plan | Yes where published |
| Brochure | PDF brochure | Yes where published |
| SEO Data | Metadata for indexing | System-generated/published |

The guideline explicitly requires the core public property attributes and hides marketing-specific user data from public display. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

## 9.2 Lead Entity

Minimum logical attributes:

| Field | Requirement |
|---|---|
| Lead ID | Unique identifier |
| Name | Required |
| WhatsApp Number | Required |
| Interested Property | Required |
| Assigned Marketing | Required after assignment |
| Pipeline Status | Required |
| Notes | Optional, multiple entries recommended |
| Created At | Required |
| Updated At | Required |

### 9.2.1 Lead History Entity

Minimum logical attributes:

- History ID;
- Lead ID;
- Date/Time;
- Actor;
- Previous Status;
- New Status;
- Note/Description.

The history must be append-only from the application perspective unless a dedicated correction/audit process is later defined.

## 9.3 User Entity

Logical roles:

- `ADMIN`;
- `MARKETING`;
- `SUPER_ADMIN` (**TBD**).

Profile fields are **TBD**.

---

## 10. API Requirements

### 10.1 Public API

Backend should expose REST endpoints sufficient for:

- property listing;
- property search/filter/sort;
- property comparison data;
- property detail;
- property media;
- property brochure;
- KPR calculation data/configuration;
- public content;
- POI/location data where applicable.

Exact route naming and versioning: **TBD**.

### 10.2 Admin API

Backend should expose endpoints for:

- lead creation;
- lead listing/search/filter;
- lead assignment;
- lead status update;
- lead notes;
- lead history;
- dashboard/reporting data;
- notification state.

### 10.3 Marketing API

Backend should expose endpoints for:

- owned/assigned property management;
- property specification management;
- availability status changes;
- assigned lead list;
- lead status changes;
- lead notes;
- lead history;
- profile management.

### 10.4 API Conventions

The final API contract should define:

- API versioning;
- request/response format;
- validation error format;
- authentication mechanism;
- authorization failure format;
- pagination contract;
- sorting/filtering parameter convention;
- idempotency requirements where necessary;
- rate limiting;
- correlation/request ID.

All items above are **TBD** unless defined in a separate technical specification.

---

## 11. SEO Requirements

### NFR-SEO-001 — SSR

Property detail pages must be rendered using SSR.

### NFR-SEO-002 — Metadata

Property detail pages must render property-specific metadata suitable for search engine indexing.

### NFR-SEO-003 — Crawlable Content

Core property information must be available in server-rendered HTML rather than relying exclusively on client-side execution.

### NFR-SEO-004 — Semantic URLs

Property detail URLs should use a stable, human-readable structure.

Exact URL format: **TBD**.

### NFR-SEO-005 — Structured Data

Schema.org structured data / Open Graph / Twitter metadata: **TBD**.

The source guideline explicitly states that detail property pages must use SSR for SEO meta tags. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 12. Non-Functional Requirements

## 12.1 UI/UX

### NFR-UI-001 — Premium Experience

UI/UX harus berkesan premium dan modern.

### NFR-UI-002 — Target Audience

Design harus mempertimbangkan behavior pengguna dari kalangan middle-to-high.

### NFR-UI-003 — Responsive

Website harus responsif pada desktop, tablet, dan mobile.

### NFR-UI-004 — Conversion Focus

CTA WhatsApp harus menjadi conversion path utama pada public website.

## 12.2 Performance

Target numerik berikut belum ditentukan oleh guideline dan harus ditetapkan pada technical/product specification:

- maximum API latency;
- maximum page load time;
- SSR response target;
- image optimization target;
- maximum compare payload;
- concurrent user target.

Status: **TBD**.

## 12.3 Availability

Availability/SLA target: **TBD**.

## 12.4 Scalability

Arsitektur harus memungkinkan pemindahan frontend, backend, database, dan layanan real-time ke layanan terpisah ketika batas shared hosting tercapai. Kapasitas proses Node, PHP, koneksi database, serta laju tulis SQLite harus diukur pada target hosting.

## 12.5 Security

Minimum security controls yang harus dipertimbangkan pada implementasi:

- authentication untuk Back Office;
- role-based authorization;
- validasi dan sanitasi input;
- secure password/session handling;
- HTTPS untuk environment production;
- protection terhadap common web/API attacks;
- access control pada property ownership dan leads;
- protection terhadap public exposure of internal marketing data;
- secure file upload dan validation untuk gambar/video/brosur;
- secret management di luar source code.

Detail security standard dan compliance: **TBD**.

## 12.6 Maintainability

Kode harus memisahkan domain/property management, CRM/leads, authentication, content management, notification, dan integration concerns agar dapat dikembangkan secara modular.

---

## 13. Media & File Requirements

### 13.1 Supported Media

Property dapat memiliki:

- photo;
- video URL/embed;
- Virtual Tour 360;
- floor plan;
- brochure PDF.

### 13.2 Public Visibility

Media hanya boleh ditampilkan bila telah berstatus published/available sesuai content workflow yang disepakati.

### 13.3 File Validation

File upload harus divalidasi untuk:

- MIME type;
- file size;
- file extension;
- content integrity;
- storage path ownership/access control.

Nilai maksimum ukuran file: **TBD**.

---

## 14. External Integrations

## 14.1 WhatsApp

Use cases:

- CTA utama pada Home Page;
- CTA per-property;
- template message yang menyertakan link property;
- lead handoff ke Admin.

Jenis integration (deep link vs WhatsApp Business API): **TBD**.

## 14.2 Google Maps

Use case:

- menampilkan lokasi properti.

## 14.3 POI Provider

Use case:

- menampilkan fasilitas publik terdekat.

Provider/API: **TBD**.

## 14.4 Video Platform

Minimal mendukung YouTube dan platform video lain yang kompatibel dengan embed/playback.

## 14.5 Bank Interest Rate

Sistem harus menyediakan pilihan suku bunga berbagai bank untuk KPR Calculator.

Source of truth untuk rate dan mekanisme refresh belum ditentukan (**TBD**).

---

## 15. Reporting & Dashboard

### 15.1 Admin Dashboard

Minimal dapat menampilkan informasi untuk supervisi:

- jumlah leads;
- distribution of leads per marketing;
- pipeline distribution;
- conversion rate;
- follow-up speed.

Definition dan formula KPI: **TBD**.

### 15.2 Marketing Dashboard

Minimal menampilkan:

- daftar lead yang ditugaskan;
- pipeline status masing-masing lead;
- catatan aktivitas;
- akses history.

---

## 16. Permissions & Data Visibility

Minimum authorization rules:

| Capability | Public | Admin | Marketing |
|---|---:|---:|---:|
| View published property | Yes | Yes | Yes |
| Manage property | No | TBD | Yes, scoped |
| View marketing-specific data | No | Yes | Yes, scoped |
| Create lead | No* | Yes | TBD |
| Assign lead | No | Yes | No |
| Change lead pipeline | No | TBD | Yes, assigned/scoped |
| Add lead notes | No | TBD | Yes, assigned/scoped |
| View full lead history | No | Yes | Yes, assigned/scoped |
| View conversion reports | No | Yes | TBD |

`*` Public user initiates the lead through WhatsApp; exact mechanism for creating the lead record is TBD.

---

## 17. Auditability

The system should preserve enough information to reconstruct the journey of a lead from initial entry to final state.

At minimum, status changes should record:

- timestamp;
- actor;
- previous status;
- new status;
- note/comment.

This requirement is derived from the Vertical Timeline history specified in the guideline. [AI Agent Guide Line.md](<AI Agent Guide Line.md>)

---

## 18. Validation Requirements

### 18.1 Property Validation

At minimum, validate:

- required core property attributes;
- numeric property dimensions;
- valid price value;
- valid availability status;
- valid media/file references.

Exact required/optional matrix: **TBD**.

### 18.2 Lead Validation

At minimum, validate:

- name is present;
- WhatsApp number is present and valid according to agreed format;
- property reference is valid;
- assigned Marketing exists and is active when assignment is created;
- status belongs to allowed pipeline states.

### 18.3 KPR Calculator Validation

At minimum, validate:

- property/loan amount is non-negative;
- DP is within valid range;
- tenor is valid;
- interest rate is valid;
- fixed/floating selection is valid.

Exact business constraints: **TBD**.

---

## 19. Error Handling Requirements

The API should return structured error responses for:

- validation errors;
- authentication failures;
- authorization failures;
- resource not found;
- duplicate/conflicting operation;
- external integration failure;
- server/internal errors.

Exact error response schema and error code catalog: **TBD**.

The frontend should show user-friendly messages while avoiding exposure of sensitive internal implementation details.

---

## 20. Deployment Requirements

### 20.1 Shared Hosting Capability Gate

Deployment produksi menggunakan shared hosting tanpa Docker. Sebelum implementasi final, paket hosting yang dipilih harus dibuktikan menyediakan:

- versi PHP dan ekstensi yang diperlukan Laravel, Composer/deploy artefak, serta akses menjalankan migrasi;
- document root ke direktori Laravel `public`, HTTPS, dan konfigurasi rahasia di luar web root;
- koneksi PostgreSQL atau akses file SQLite privat yang persisten dan dapat ditulis;
- cron untuk tugas terjadwal, kuota media, dan akses untuk backup serta restore;
- proses Node.js persisten dan routing HTTPS ke Nuxt bila SSR dinamis tetap menjadi requirement;
- konektivitas keluar ke layanan push terkelola bila notifikasi real-time digunakan.

Shared hosting yang hanya dapat menyajikan berkas statis tidak dapat menjalankan Nuxt SSR dinamis pada setiap request. Prerender dapat dipertimbangkan hanya bila seluruh URL properti yang dipublikasikan atau diubah dibangun dan diterbitkan ulang secara andal; strategi ini bukan pengganti otomatis untuk SSR dinamis. Jika syarat SSR atau notifikasi instan tidak dapat dipenuhi, paket hosting atau keputusan fitur terkait harus ditetapkan ulang sebelum implementasi.

### 20.2 Environment Configuration

Konfigurasi harus berasal dari variabel lingkungan atau berkas konfigurasi privat yang dikelola hosting, bukan ditanam di source code atau direktori publik.

Minimum configurable groups:

- application environment;
- database connection;
- API base URL;
- WhatsApp configuration;
- Google Maps credentials;
- realtime provider credentials;
- storage credentials;
- bank-rate source credentials if applicable.

### 20.3 Production Topology

Topologi final bergantung pada kemampuan paket hosting, tetapi harus mencakup:

- domain, HTTPS, routing ke Nuxt SSR bila dipakai, serta routing ke Laravel API;
- PostgreSQL yang disediakan/diizinkan hosting, atau satu berkas SQLite privat yang persisten;
- penyimpanan media persisten dengan direktori dan hak akses yang jelas; file media tidak disimpan dalam database;
- notifikasi tersimpan di database dan layanan push terkelola; server Reverb/Soketi internal hanya jika proses persisten tersedia;
- cron Laravel; pekerjaan asinkron boleh memakai antrean database dan proses worker terkelola bila hosting mengizinkan, atau eksekusi berkala berbatas waktu melalui cron yang diuji; pekerjaan berat tidak boleh diam-diam berjalan pada request publik;
- log yang dapat diakses, pemantauan kesehatan aplikasi, dan prosedur rilis/rollback.

### 20.4 Database Persistence, Migration, and Recovery

- PostgreSQL adalah pilihan utama produksi bila tersedia. SQLite boleh digunakan pada satu instalasi dengan beban tulis ringan dan kemampuan backup file yang konsisten; batas konkurensi dan ketersediaan harus diuji pada target hosting.
- Laravel/Eloquent harus menggunakan migrasi dan query inti yang kompatibel dengan kedua pilihan database; pengujian alur katalog, lead, assignment, histori, dan notifikasi dijalankan pada PostgreSQL dan SQLite sebelum pilihan produksi dikunci.
- Penulisan lead, assignment, perubahan status, histori, dan notifikasi terkait harus memakai transaksi agar perubahan bisnis tidak tersimpan sebagian. Skema final harus menetapkan foreign key, indeks untuk pencarian utama, dan aturan keunikan yang disepakati; struktur logis di §23 belum menggantikan desain fisik tersebut.
- Berkas SQLite, termasuk file jurnal/WAL bila aktif, harus berada di luar web root dan pada storage persisten. Backup SQLite harus menggunakan mekanisme snapshot/backup yang konsisten, bukan menyalin berkas database aktif secara sembarang.
- Backup mencakup database, media unggahan, dan konfigurasi pemulihan yang diperlukan. Frekuensi, retensi, lokasi cadangan terpisah, RPO/RTO, serta uji restore berkala wajib diputuskan dan dicatat sebelum rilis produksi.
- Deploy harus mencakup migrasi terkontrol, pemeriksaan kesehatan, dan langkah rollback aplikasi/database yang realistis bagi shared hosting.

---

## 21. Acceptance Criteria

### 21.1 Public Website

A release is acceptable when:

- Home Page contains hero banner, Global Search, WhatsApp CTA, Featured Properties, and Social Proof.
- Property listing is card-based and contains the required public fields.
- Property listing supports filtering, required sorting options, and Compare.
- Property detail page exposes complete specifications and media features.
- Property detail page is SSR-rendered.
- Property detail provides Maps/POI, brochure download, and property-specific WhatsApp message.
- KPR Calculator accepts the required variables and visualizes interest/principal portions.

### 21.2 Back Office

A release is acceptable when:

- Marketing can manage property information and availability state.
- Admin can record leads and assign them to one Marketing user.
- Marketing can see assigned leads in a table.
- Marketing can update pipeline status.
- Marketing can add notes.
- Lead history is available as a right-side drawer with descending vertical timeline.
- Admin can see reporting related to conversion and follow-up speed.

### 21.3 Real-time

A release is acceptable when:

- new lead assignments generate a notification for the assigned Marketing user;
- Marketing pipeline updates generate a notification for Admin;
- notification delivery occurs without manual page refresh, subject to the chosen realtime provider;
- notification read/unread state behaves according to the final product specification.

### 21.4 Deployment

A release is acceptable when:

- frontend dan backend dapat dipasang pada paket shared hosting yang dipilih tanpa Docker;
- respons HTML untuk setiap URL detail properti berisi konten dan metadata yang dihasilkan melalui SSR, dan runtime Nuxt yang dibutuhkan telah dibuktikan pada hosting;
- application configuration is externally configurable;
- production deployment tidak menaruh rahasia atau database SQLite di web root;
- data katalog, CRM, histori, notifikasi, dan media tetap ada setelah restart serta rilis aplikasi;
- migrasi dan uji restore database beserta media berhasil pada target hosting.

---

## 22. Suggested Domain Modules

For implementation, the backend should be structured into clear modules/bounded responsibilities:

```text
Auth & Users
├── Authentication
├── Authorization
└── Marketing Profile

Property
├── Property Catalog
├── Specifications
├── Media
├── Availability
├── Brochure
├── SEO Metadata
└── Location / POI

Content
├── Featured Properties
├── Testimonials
└── Bank Partners

CRM
├── Leads
├── Assignment
├── Pipeline
├── Notes
├── Lead History
└── Reporting

KPR
├── Bank Rate Configuration
├── Simulation
└── Calculation Result

Notification
├── Events
├── Delivery
└── Read/Unread State

Integration
├── WhatsApp
├── Google Maps
├── Video Provider
└── POI Provider
```

---

## 23. Recommended Initial Logical Database Model

The following is a logical baseline, not a final physical schema.

```text
users
  └── role

marketing_profiles
  └── user_id -> users.id

properties
  ├── marketing_user_id -> users.id
  └── availability_status

property_media
  └── property_id -> properties.id

property_brochures
  └── property_id -> properties.id

property_locations
  └── property_id -> properties.id

property_poi (optional / cached)
  └── property_id -> properties.id

leads
  ├── property_id -> properties.id
  ├── assigned_marketing_id -> users.id
  └── current_pipeline_status

lead_notes
  ├── lead_id -> leads.id
  └── actor_user_id -> users.id

lead_histories
  ├── lead_id -> leads.id
  └── actor_user_id -> users.id

notifications
  └── recipient_user_id -> users.id

bank_interest_rates
  └── bank configuration for KPR calculator

testimonials

bank_partners

cms_contents
```

Exact normalization, indexes, foreign keys, soft-delete strategy, and audit columns are **TBD** in the database design phase.

---

## 24. Requirement Traceability Matrix

| Guideline Area | SRS Sections |
|---|---|
| Premium / modern / responsive / conversion / SEO | §1, §11, §12 |
| Home Page | §5.1 |
| Property Listing | §5.2 |
| Property Detail | §5.3 |
| KPR Calculator | §5.4 |
| Property & Content Management | §6.1 |
| Leads & CRM Admin | §6.2 |
| Lead Tracking Marketing | §6.3 |
| Real-time Notifications | §7 |
| Buyer Flow | §8.1 |
| CRM Flow | §8.2 |
| Nuxt SSR | §4.2, §11 |
| Laravel REST API | §4.2, §10 |
| PostgreSQL/SQLite + Eloquent (revisi proyek) | §4.2, §20.4 |
| Layanan push terkelola + Echo (revisi deployment) | §4.2, §7 |
| Shared hosting tanpa Docker (revisi proyek) | §4.2, §20 |

---

## 25. Open Questions / Decisions Required Before Implementation

The following decisions should be completed before the related feature is considered implementation-ready:

1. Authentication mechanism for Admin/Marketing.
2. Authorization model and property ownership scope.
3. Whether Admin can directly edit/manage properties.
4. Whether Super Admin exists.
5. Maximum number of properties allowed in Compare.
6. Exact Global Search behavior and searchable fields.
7. Exact filter dimensions and supported operators.
8. Exact KPR formula and financial assumptions.
9. Bank interest-rate data source and update frequency.
10. WhatsApp integration method.
11. POI provider, radius, and cost constraints.
12. Property/public URL convention.
13. SEO structured-data strategy.
14. Media storage provider and retention policy.
15. Upload limits for photos/video/floor plan/brochure.
16. Lead deduplication policy.
17. Lead reassignment policy.
18. Allowed pipeline status transitions.
19. Conversion-rate formula.
20. Follow-up-speed KPI definition.
21. Notification read/unread persistence.
22. Pagination and API response standard.
23. Rate limiting policy.
24. Backup, restore, and disaster recovery requirements.
25. Observability: logging, metrics, health checks, and alerting.
26. Availability/SLA targets.
27. Penyedia dan paket shared hosting, termasuk dukungan PHP/ekstensi, Node.js persisten, routing, cron, PostgreSQL, SQLite, serta batas resource.
28. Pilihan database produksi dan ambang beban yang memicu migrasi dari SQLite ke PostgreSQL.
29. Strategi backup konsisten untuk PostgreSQL atau SQLite, media, frekuensi, retensi, lokasi terpisah, RPO/RTO, dan bukti uji restore.
30. Model operasi notifikasi real-time dan pekerjaan asinkron bila paket hosting tidak menyediakan worker/proses persisten.

---

## 26. Implementation Principle for AI Coding Agents

AI coding agents implementing this SRS should follow these rules:

1. Treat explicit requirements in this document as mandatory unless marked **TBD**.
2. Do not invent business rules for **TBD** items.
3. Keep public-facing and internal Marketing/Admin data separated.
4. Preserve lead history so operational changes remain traceable.
5. Keep role/permission checks in backend; frontend checks are not sufficient security controls.
6. Prefer modular implementation by domain rather than one monolithic feature/module.
7. Maintain SSR behavior for SEO-critical public pages.
8. Keep third-party integrations behind dedicated service/adaptor layers where practical.
9. Keep environment-specific credentials outside source code.
10. Add automated tests for critical flows, especially property visibility, lead assignment, pipeline transition, history creation, and realtime event dispatch.

---

## 27. Definition of Done (Baseline)

A feature is considered complete when:

- its functional requirements are implemented;
- validation and authorization rules are enforced server-side;
- API and UI behavior are tested;
- relevant automated tests exist for critical business logic;
- public SEO requirements remain intact where applicable;
- audit/history requirements are preserved;
- no secrets are committed to source code;
- deployment dan migrasi pada shared hosting target berhasil, serta data dan media tetap persisten setelah restart;
- backup dan restore database serta media telah diuji;
- documentation is updated for any changed API or business behavior.

---

## 28. Change Log

| Version | Date | Description |
|---|---|---|
| 1.0 | 2026-09-30 | Initial SRS derived from `AI Agent Guide Line.md` |
| 1.1 | 2026-09-30 | Shared hosting tanpa Docker, PostgreSQL/SQLite, prasyarat SSR, persistensi dan pemulihan data |

