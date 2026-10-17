# Rental Property Operating System — Structure Gap Analysis

> Document: `docs/structure-gap-analysis.md`  
> Purpose: Audit analisis kesenjangan arsitektur role dan modul existing terhadap `project-structure.md`, `design.md`, dan `AGENTS.md`.  
> Status: Living Document (Audit & Incremental Migration)

---

## 1. Executive Summary

Berdasarkan `project-structure.md`, target arsitektur Rental Property Operating System berakar pada 3 area kerja utama dan 4 peran pengguna (*MVP Role Strategy*):

```text
Rental Property Operating System
│
├── PLATFORM CONSOLE   ───────► SUPERADMIN  (Mengelola bisnis SaaS, Organizations, Subscriptions, Platform Users)
│
├── OWNER WORKSPACE    ───────► OWNER       (Mengelola portofolio rental, properti, unit, keuangan, tim)
│                      ───────► STAFF       (Membantu Owner dalam organisasi yang sama dengan permission terbatas)
│
└── TENANT PORTAL      ───────► TENANT      (Mengelola sewa, tagihan, pembayaran, kwitansi, keluhan secara mandiri)
```

Prinsip migrasi sesuai `agent.md`:
1. **Preserve Valid Existing Data & Code**: Jangan melakukan rewrite massal yang merusak data atau tabel.
2. **Incremental Alignment**: Sinkronkan role, router, dan permission secara bertahap.
3. **No Auth Duplication**: Tetap gunakan satu sistem autentikasi terpadu (Better-Auth) dengan relasi `organization_user` untuk multi-tenancy.

---

## 2. Structure Audit Matrix

| Area | Current Implementation | Target (`project-structure.md`) | Status | Risk Level | Recommended Incremental Change |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Roles** | `User.role` di DB menyimpan string (`"super-admin"`, `"owner"`, `"tenant"`). Di `OrganizationUser.role`: `"owner"`, `"admin"`, `"manager"`, `"finance"`, `"staff"`, `"viewer"`. | 4 Core Roles: `SUPERADMIN`, `OWNER`, `STAFF`, `TENANT`. Staf berada di dalam organisasi owner dengan role `STAFF`. | **IMPROVE** | Medium | Normalisasi penanganan role (case-insensitive & backward compatible). Izinkan role `staff` pada user dan hubungkan ke Owner Workspace dengan RBAC granular. |
| **Authentication** | Single Better-Auth system dengan session cookies di `lib/auth/server.ts` & `proxy.ts`. | Satu auth system terpusat tanpa duplikasi untuk semua role. | **KEEP** | Low | Pertahankan single auth. Jangan buat database auth terpisah untuk tenant atau staff. |
| **Organization & Multi-Tenancy** | Model `Organization` dan `OrganizationUser` aktif. Server actions menggunakan `requireOrganization()` dengan auto-provisioning default workspace. | Seluruh data operasional di-scope ke `organization_id`. Tenant isolasi ketat antar-organisasi. | **KEEP** | Low | Pertahankan model `Organization` dan perluas dukungan agar staff dapat mengakses data organisasi sesuai permission miliknya. |
| **Routing Architecture** | `/dashboard/admin/*` (Superadmin), `/dashboard/owner/*` (Owner), `/dashboard/tenant/*` (Tenant). | `/platform/*` (Superadmin), `/owner/*` (Owner Workspace), `/tenant/*` (Tenant Portal). | **IMPROVE** | Low | Pertahankan prefix `/dashboard/*` yang sudah stabil untuk menghindari breaking changes pada URL yang sudah di-bookmark, sambil mengarahkan `staff` ke `/dashboard/owner`. |
| **Platform Console (SUPERADMIN)** | `/dashboard/admin/page.tsx` masih berupa placeholder 9 baris ("Halaman ini sedang dalam tahap pengembangan"). | Dashboard Platform Console menjawab *"Bagaimana kondisi SaaS saya?"*: Total Org, Managed Units, MRR, Users by role, Audit logs, Health. | **REPLACE (Placeholder)** | Low | Implementasikan antarmuka Platform Console fungsional dengan statistik agregat organisasi, pengguna platform, dan audit log SaaS. |
| **Owner Workspace (OWNER)** | Komprehensif: Properti, Kamar, Penghuni, Kontrak (`/dashboard/owner/kontrak`), Keuangan (`/dashboard/owner/keuangan`), Pemeliharaan (`/dashboard/owner/pemeliharaan`), Pesan (`/dashboard/owner/pesan`), Laporan & AI Advisory (`/dashboard/owner/laporan`). | Operations Command Center dengan Action Center, Portfolio, Rentals, Finance, Operations, Communication, Team, Settings. | **IMPROVE** | Low | Tambahkan modul manajemen Tim & Staf (`/dashboard/owner/tim`) agar Owner dapat mengundang staf dan menetapkan permission operasional. |
| **Staff Role Integration (STAFF)** | Permission RBAC terdefinisi di `lib/auth/permissions.ts` (`ROLE_PERMISSIONS.staff`), namun router `app/dashboard/page.tsx` belum mengarahkan role `staff` ke owner workspace. | `STAFF` mengakses Owner Workspace dengan pembatasan hak akses (tanpa akses billing langganan SaaS, hapus organisasi, dll). | **IMPROVE** | Medium | Perbarui `app/dashboard/page.tsx` agar role `staff` masuk ke `/dashboard/owner`, serta sesuaikan server actions dengan `requirePermission` alih-alih `requireOwner`. |
| **Tenant Portal (TENANT)** | `/dashboard/tenant/page.tsx` masih berupa placeholder 9 baris. Sub-halaman `/kontrak`, `/tagihan`, `/keluhan` sudah memiliki fondasi awal. | Mobile-first portal menjawab *"Apa yang harus saya bayar atau urus?"*: Kamar aktif, tagihan saat ini, tombol bayar, kwitansi, status tiket perbaikan, kontak pengelola. | **REPLACE (Placeholder)** | Low | Bangun Beranda Tenant Portal terpadu yang menampilkan ringkasan sewa aktif, tagihan berjalan, kwitansi terakhir, dan lapor keluhan instan. |
| **Property & Unit** | `Properti` dan `Kamar` tersinkronisasi dengan relasi `organizationId` dan status kamar (`terisi`, `kosong`, `perbaikan`). | Standar domain: overview properti, unit detail, occupancy tracking. | **KEEP** | Low | Pertahankan model dan query yang sudah teruji. |
| **Tenant & Lease** | `Penghuni` terpisah dengan identitas KTP/HP, terhubung ke `Lease` formal dengan status kontrak (`active`, `expiring`, dll). | Tenant profile + Lease lifecycle terintegrasi. | **KEEP** | Low | Pertahankan arsitektur relasi `Penghuni` -> `Lease` -> `Kamar`. |
| **Invoicing & Billing** | Normalized `Invoice` + `InvoiceLine` dengan generator bulanan idempoten dan status tagihan. | Idempotent recurring billing, itemized lines, non-boolean payment. | **KEEP** | Low | Pertahankan `BillingService` dan model finansial. |
| **Payment & Allocation** | `Payment` terhubung ke `Invoice` via `PaymentAllocation` (mendukung partial payment dan multi-invoice). | Normalized payment allocation model. | **KEEP** | Low | Pertahankan arsitektur alokasi pembayaran. |
| **Maintenance & Vendor** | Pipeline pemeliharaan (`menunggu`, `diproses`, `selesai`) + registri `Vendor` + AI triage assistant. | Work order dispatch, vendor matching, tenant ticket visibility. | **KEEP** | Low | Pertahankan modul operasional yang telah selesai di Fase 4 & Fase 8. |
| **Communication** | Abstraksi WhatsApp (`wa.me` instant dispatch + Fonnte API adapter) + audit outbound `Communication`. | Primary channel: WhatsApp-first dengan template standar koleksi. | **KEEP** | Low | Pertahankan modul komunikasi. |
| **Audit Logging** | `AuditLog` dengan masking kredensial otomatis via `logAuditEvent()`. | Comprehensive audit logging untuk mutasi sensitif. | **KEEP** | Low | Pertahankan audit logger framework. |

---

## 3. Detail Kesenjangan & Rencana Tindakan

### A. Kesenjangan 1: Router & Session Role Normalization (`SUPERADMIN`, `OWNER`, `STAFF`, `TENANT`)
- **Masalah**: `app/dashboard/page.tsx` melakukan switch-case kaku: `"super-admin"`, `"owner"`, `"tenant"`. Pengguna dengan role `"staff"` atau `"superadmin"` (tanpa tanda minus) saat ini diarahkan ke `/unauthorized`.
- **Solusi Non-Destruktif**:
  - Buat helper normalisasi role:
    - `"superadmin"` / `"super-admin"` / `"admin"` -> Superadmin Console (`/dashboard/admin`).
    - `"owner"` -> Owner Workspace (`/dashboard/owner`).
    - `"staff"` -> Owner Workspace (`/dashboard/owner`) dengan permission organisasi.
    - `"tenant"` -> Tenant Portal (`/dashboard/tenant`).
  - Perbarui `lib/auth/get-current-user.ts` agar `requireWorkspaceAccess(permission)` dapat memverifikasi owner maupun staf organisasi secara mulus.

### B. Kesenjangan 2: Platform Console Dashboard (`SUPERADMIN`)
- **Masalah**: `/dashboard/admin/page.tsx` saat ini hanya teks dummy 9 baris tanpa fungsi pemantauan SaaS.
- **Solusi Non-Destruktif**:
  - Bangun Platform Console Dashboard yang memuat data agregat riil:
    1. Metrik SaaS: Total Organizations, Active Leases/Units, Total Registered Users (Owner, Staff, Tenant), Total Audit Events.
    2. Tabel Organisasi: Daftar organisasi pelanggan SaaS, nama owner, jumlah kamar, status keaktifan.
    3. Tabel Pengguna Platform: Manajemen akun platform dengan filter role.
    4. Ringkasan Audit Sistem: Aktivitas penting di seluruh platform.

### C. Kesenjangan 3: Staf & Manajemen Tim (`STAFF` di Owner Workspace)
- **Masalah**: `project-structure.md` mewajibkan Owner Workspace memiliki modul `Team`, dan staf dikendalikan lewat permission. Belum ada antarmuka bagi Owner untuk melihat daftar staf dan mengundang/menugaskan role staf.
- **Solusi Non-Destruktif**:
  - Bangun antarmuka `/dashboard/owner/tim`:
    1. Daftar anggota tim organisasi (`owner`, `staff`).
    2. Formulir tambah/undang staf ke organisasi dengan pemilihan role & permission preset (misal: Staf Pemeliharaan, Staf Operasional Kamar).
    3. Pencatatan audit saat staf ditambahkan/dihapus.
  - Tambahkan menu "Tim & Staf" di `components/layout/AppSidebar.tsx` untuk Owner.

### D. Kesenjangan 4: Tenant Command Center (`TENANT`)
- **Masalah**: `/dashboard/tenant/page.tsx` saat ini hanya teks placeholder ("Halaman ini sedang dalam tahap pengembangan").
- **Solusi Non-Destruktif**:
  - Bangun Beranda Portal Tenant mobile-first yang menjawab *"Apa yang harus saya bayar atau urus?"*:
    1. Ringkasan Kamar: Nomor kamar, nama properti, status kontrak sewa aktif.
    2. Tagihan Aktif: Nominal jatuh tempo, tanggal tempo, status, tombol aksi cepat "Konfirmasi / Bayar via WhatsApp / Transfer".
    3. Riwayat Pembayaran Terakhir: Kwitansi pembayaran yang telah lunas.
    4. Tiket Keluhan & Pemeliharaan: Status penanganan komplain kamar secara real-time.
    5. Aksi Cepat: Lapor keluhan baru, hubungi pengelola via WhatsApp.

---

## 4. Prioritas Eksekusi Migrasi Bertahap

```text
Langkah 1: Normalisasi Router & RBAC Helper (app/dashboard/page.tsx & lib/auth/get-current-user.ts)
   ↓
Langkah 2: Platform Console Superadmin (/dashboard/admin/page.tsx & action.ts)
   ↓
Langkah 3: Manajemen Tim & Staf (/dashboard/owner/tim/page.tsx & action.ts + Sidebar update)
   ↓
Langkah 4: Portal Tenant Terpadu (/dashboard/tenant/page.tsx & action.ts)
   ↓
Langkah 5: Pengujian Menyeluruh (Unit tests 4 role, Typecheck 0 error, Next.js build sukses)
```
