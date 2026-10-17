# Current System Audit — Kontrakin Property Management SaaS

> Document: `docs/current-system-audit.md`  
> Created: Phase 0 — Full Project Audit  
> Target: Evolution into **Rental Property Operating System**

---

## 1. Executive Summary

Kontrakin is currently an early-to-mid stage Property Management CRUD application built with Next.js 16 (App Router), React 19, TypeScript, PostgreSQL, Prisma ORM, and Better-Auth.

While the application provides foundational UI and basic database operations for properties, rooms, tenants, cashbook transactions, and maintenance requests, it operates as a **single-user CRUD ledger** rather than a **Rental Property Operating System**. Core operational building blocks—including Organizations (Multi-Tenancy), Leases, Invoices, Payment Allocations, Idempotent Recurring Billing, External Payment Verification, Audit Logs, and Background Automation—are currently missing.

Furthermore, several critical security and financial data integrity vulnerabilities exist in the current codebase that must be stabilized before introducing extended features.

---

## 2. Tech Stack & Environment

| Layer | Technology | Version | Notes |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.2.11 | Full-stack server actions & route handlers |
| **UI Library** | React | 19.2.4 | React 19 concurrent features |
| **Language** | TypeScript | ^5.0.0 | Strict mode enabled in `tsconfig.json` |
| **Database** | PostgreSQL | 15+ compatible | Hosted / Supabase-ready |
| **ORM** | Prisma | ^7.9.0 | Output directed to `lib/generated/prisma` |
| **Database Adapter** | `@prisma/adapter-pg` + `pg` | ^7.9.0 / ^8.22.0 | Native PostgreSQL driver adapter |
| **Authentication** | better-auth | ^1.6.25 | Prisma adapter with Admin & Access Control plugins |
| **Styling** | TailwindCSS | ^4.0.0 | PostCSS integration (`@tailwindcss/postcss`) |
| **Component Library** | shadcn/ui + `@base-ui/react` | ^4.14.0 / ^1.6.0 | Headless primitives with custom UI wrappers |
| **Animation** | Framer Motion | ^12.42.2 | Micro-interactions and dashboard transitions |
| **Visualization** | Recharts | ^3.10.0 | Revenue & occupancy charts |
| **Toast Notifications** | Sonner | ^2.0.7 | User feedback notifications |
| **Validation** | Zod | ^4.4.3 | Data schema validation |
| **Testing** | None | — | **No test runner or test suite configured** |

---

## 3. Project Structure & Architectural Patterns

```
kontrakin/
├── app/
│   ├── (auth)/                   # Login, register, forgot-password
│   ├── (public)/                 # Landing & marketing pages
│   ├── api/auth/[...all]/        # Better-auth handler endpoint
│   ├── dashboard/
│   │   ├── admin/                # Admin placeholder dashboard
│   │   ├── owner/                # Owner dashboard (properti, kamar, penghuni, keuangan, laporan, pengaturan)
│   │   ├── tenant/               # Tenant portal (tagihan, kontrak, keluhan, pengaturan)
│   │   ├── layout.tsx            # Authenticated layout with AppSidebar
│   │   └── page.tsx              # Role-based dashboard redirector
├── components/
│   ├── ui/                       # 24+ shadcn/ui components
│   ├── layout/                   # AppSidebar, Header, SiteHeader, Footer
│   ├── dashboard/                # StatCards, Charts, RoomStatus, RecentPayments
│   └── sections/                 # Landing page sections
├── lib/
│   ├── auth/                     # server.ts, client.ts, get-current-user.ts
│   ├── db/                       # prisma.ts (Prisma client singleton with pg adapter)
│   ├── services/                 # dashboard.ts, pemeliharaan.service.ts
│   ├── repositories/             # dashboard.repository.ts, pemeliharaan.repository.ts
│   ├── types/                    # dto.ts, index.ts
│   ├── errors.ts                 # AppError and custom error classes
│   └── utils.ts                  # cn, formatRupiah, formatting helpers
├── prisma/
│   ├── schema.prisma             # Core database schema
│   ├── migrations/               # 3 historical migrations
│   └── seed.mjs                  # Seeding script
```

### Architectural Inconsistency
The project defines a layered architecture (`Route/Action -> Service -> Repository -> Prisma`), but this pattern is only adopted in `dashboard` and `pemeliharaan`. Other modules (`kamar`, `penghuni`, `keuangan`, `properti`) execute raw Prisma queries directly inside Next.js Server Actions (`action.ts`) without service or repository layers.

---

## 4. Existing Database Model

The existing Prisma schema (`prisma/schema.prisma`) comprises 9 models:

### 4.1 Authentication & Identity
- **`User`**: `id`, `name`, `email` (unique), `role` (`tenant`, `owner`, `admin`), `registrationRole`, `banned`, `banReason`, `banExpires`, `emailVerified`, `image`, `kodeUndangan` (unique), `createdAt`, `updatedAt`.
- **`Session`**: Session state managed by `better-auth`.
- **`Account`**: OAuth credentials and hashed passwords.
- **`Verification`**: Email verification tokens.

### 4.2 Property & Inventory
- **`Properti`**:
  - Columns: `id`, `nama`, `tipe` (`Kost`, `Kontrakan`, `Ruko`, `Apartemen`), `alamat`, `foto`, `lokasiMaps`, `fasilitas`, `deskripsi`, `ownerId`.
  - Relation: Belongs to `User` (`owner`), has many `Kamar`.
- **`Kamar`**:
  - Columns: `id`, `nomor`, `lantai`, `tipe` (`Standard`, `Deluxe`, `VIP`), `hargaBulanan` (Int), `status` (`kosong`, `terisi`, `maintenance`), `catatan`, `ownerId`, `propertiId`.
  - Relations: Belongs to `User` (`owner`), optional `Properti`, has many `Penghuni`, `Transaksi`, `Pemeliharaan`.
  - Constraints: `@@unique([ownerId, nomor])`.

### 4.3 Tenant & Leasing
- **`Penghuni`**:
  - Columns: `id`, `nama`, `noHp`, `email`, `noKtp` (unique), `tanggalMasuk`, `tanggalKeluar`, `status` (`aktif`, `nonaktif`), `catatan`, `ownerId`, `userId` (optional unique), `kamarId` (optional).
  - Relations: Linked to `User` (`owner`), optional `User` (`user` account), optional `Kamar`.
  - **Gap**: Not a proper Lease! Only stores check-in/out dates and single room assignment. No deposit, billing cycle, lease charges, or renewal tracking.

### 4.4 Finance & Cashbook
- **`Transaksi`**:
  - Columns: `id`, `jenis` (`pemasukan`, `pengeluaran`), `kategori`, `jumlah` (Int), `tanggal`, `keterangan`, `kamarId`, `penghuniId`, `ownerId`.
  - Relations: Optional `Kamar`, optional `Penghuni`, belongs to `User` (`owner`).
  - **Gap**: Generic single-entry cashbook. No concept of `Invoice`, `InvoiceLine`, `Payment`, `PaymentAllocation`, or reconciliation.

### 4.5 Maintenance & Operations
- **`Pemeliharaan`**:
  - Columns: `id`, `judul`, `deskripsi`, `status` (`menunggu`, `diproses`, `selesai`), `prioritas` (`rendah`, `sedang`, `tinggi`), `kategori`, `foto`, `penghuniId`, `kamarId`, `ownerId`.
  - Relations: Belongs to `Penghuni`, `Kamar`, `User` (`owner`).

---

## 5. Authentication & Authorization

### 5.1 Authentication Mechanism
- Managed through **Better-Auth** (`lib/auth/server.ts`).
- Uses cookie-based sessions with PostgreSQL Prisma adapter.
- Supports email/password login and registration.
- Registration assigns `registrationRole` which is converted into user `role` (`owner` or `tenant`).

### 5.2 Authorization Architecture
- Helpers in `lib/auth/get-current-user.ts`:
  - `getCurrentUser()`: Extracts user from session headers.
  - `requireUser()`: Asserts authenticated session.
  - `requireOwner()`: Asserts `user.role === 'owner'`.
  - `requireTenant()`: Asserts `user.role === 'tenant'`.
- **Authorization Gaps**:
  1. Role checks are coarse-grained (only `owner` vs `tenant`). No granular permissions (`property.update`, `invoice.create`, `payment.refund`, `team.manage`).
  2. Severe IDOR / Auth Bypass: In `app/dashboard/owner/kamar/action.ts`, functions `updateKamar(id, data)` and `deleteKamar(id)` **do not call `requireOwnerId()`** or verify that the room belongs to the requesting user!
  3. No multi-user organization support: An owner cannot invite managers, accountants, or field staff with restricted privileges.

---

## 6. Multi-Tenancy Architecture

- **Current Implementation**: Single-user scoping via `ownerId = user.id`.
- **Tenancy Evaluation**:
  - There is **no `Organization` entity**.
  - All properties, rooms, tenants, transactions, and maintenance requests are directly tied to an individual user (`ownerId: user.id`).
  - If a property management team has 3 staff members, they must share a single user account password, presenting serious operational and audit risks.
  - Cross-tenant data isolation relies strictly on developer manual filtering (`where: { ownerId }`). Multiple server actions omit this filter during updates and deletions, allowing cross-tenant tampering.

---

## 7. Existing Rental Workflow

The current application executes the following fragmented workflow:

```text
1. Owner signs up & registers property
   └── Creates Properti (app/dashboard/owner/properti)
2. Owner creates Rooms
   └── Creates Kamar attached to Properti (app/dashboard/owner/kamar)
3. Owner creates Tenant (or Tenant registers via Owner's kodeUndangan)
   └── Creates Penghuni & links to Kamar
4. Rent Payment (Manual Cashbook Entry OR Mock Tenant Payment)
   ├── Mode A (Owner): Clicks "Catat Pembayaran" in Penghuni page
   │   └── Creates Transaksi (jenis: "pemasukan", kategori: "Sewa Kamar", jumlah: X)
   └── Mode B (Tenant): Opens /dashboard/tenant/tagihan and clicks "Bayar Sekarang"
       └── Server action blindly creates Transaksi without gateway confirmation or invoice tracking
5. Financial Reporting
   └── /dashboard/owner/keuangan & /dashboard/owner/laporan sum raw Transaksi rows
```

### Critical Flaws in Current Workflow:
1. No invoices are ever generated.
2. No billing schedules or due dates exist.
3. Overdue tracking in the dashboard is hard-coded to `0` (`const tunggakan = 0; // Placeholder`).
4. Tenant payment action is an unverified mock that mutates owner revenue directly.

---

## 8. Technical Debt & Code Quality

1. **Inconsistent Architecture**: `pemeliharaan` and `dashboard` use Repository/Service patterns; `kamar`, `penghuni`, `keuangan`, `properti` use raw Server Actions calling Prisma directly.
2. **Hardcoded Placeholders**:
   - `dashboard.service.ts`: `tunggakan = 0`, `delta = '+0%'`, static chart values.
   - `keuangan-client.tsx`: Overdue calculation relies on client-side approximations rather than database invoice balances.
3. **No Migration / Rollback Safety**: Migrations contain basic SQL; no rollback plans, feature flags, or seed consistency checks.
4. **Zero Automated Tests**: No unit, integration, or end-to-end tests exist in the repository.

---

## 9. Security Risks

| Risk Level | Finding | Location | Impact |
|---|---|---|---|
| **CRITICAL** | Authorization bypass on `updateKamar` and `deleteKamar` | `app/dashboard/owner/kamar/action.ts:68, 111` | Any authenticated user can modify or delete any other owner's rooms by supplying the room ID. |
| **CRITICAL** | Unrestricted file upload to local filesystem | `app/dashboard/owner/properti/actions.ts:35-49` | Uploaded property images are written to `public/uploads` without MIME validation, extension whitelist, or file size limits. Enables remote code execution / disk exhaustion. |
| **HIGH** | Unverified mock payment execution | `app/dashboard/tenant/tagihan/action.ts:26-37` | Tenant can arbitrarily generate confirmed revenue transactions for the owner without money transfer or invoice verification. |
| **HIGH** | Single-user tenancy without organization isolation | Entire DB schema | Precludes multi-staff management, shared property access, and role boundaries. |
| **MEDIUM** | In-place deletion of financial records | `app/dashboard/owner/keuangan/action.ts:76` | Owners can permanently delete `Transaksi` records, eliminating audit trails and falsifying historical accounting. |

---

## 10. Financial Data Risks

1. **Storage of Money as 32-bit Integer (`Int`)**:
   - `Kamar.hargaBulanan` and `Transaksi.jumlah` are Prisma `Int` (PostgreSQL `integer`, 4 bytes).
   - Maximum value is `2,147,483,647` (~2.14 billion IDR). High-end commercial rentals, cumulative portfolio revenue, or multi-unit transactions will overflow and crash or corrupt the database.
   - No decimal precision support for discounts, tax calculations, or multi-currency.
2. **Absence of Invoices & Payment Allocations**:
   - Payments are recorded as flat single transactions.
   - Partial payments, overpayments, credit balances, split payments across invoices, and deposit deductions cannot be accounted for.
3. **No Idempotency**:
   - Repeating a payment submission or webhook creates duplicate revenue records.
4. **Historical Mutation Without Reversal**:
   - Modifying or deleting a transaction silently updates existing rows without maintaining debit/credit reversals or audit logs.

---

## 11. Feature Classification

| Feature / Module | Current Implementation | Classification | Target Architecture Action |
|---|---|---|---|
| **Auth & Sessions** | better-auth with Prisma adapter | **KEEP** | Retain better-auth; extend user hooks and session context to include active organization. |
| **Properti** | Basic CRUD in `app/dashboard/owner/properti` | **IMPROVE** | Scope to `organization_id`; add timezone, property code, bank accounts, and secure file storage. |
| **Kamar (Units)** | Basic CRUD in `app/dashboard/owner/kamar` | **IMPROVE** | Scope to `organization_id`; fix critical auth bug; link to `UnitType`, `Building`, `Floor`; rename/alias to Unit standard. |
| **Penghuni (Tenants)** | Basic tenant contact list | **IMPROVE** | Decouple tenant profile from single unit stay; support historical occupancy and emergency contacts. |
| **Lease & Contracts** | Implicit check-in dates in `Penghuni` | **REPLACE** | Replace implicit lease modeling with dedicated `Lease`, `LeaseCharge`, and `Deposit` entities. |
| **Billing & Invoices** | Non-existent (mocked in UI) | **REPLACE** | Build formal `Invoice`, `InvoiceLine`, and recurring billing engine. |
| **Transaksi (Payments)** | Flat cashbook table (`Transaksi`) | **IMPROVE / EXTEND** | Preserve `Transaksi` for legacy cashbook/expenses, but build dedicated `Payment` and `PaymentAllocation` engine for rentals. |
| **Pemeliharaan (Maintenance)** | Ticket logging with priority and status | **IMPROVE** | Add vendor assignment, work orders, SLA due dates, cost tracking, and organization scoping. |
| **Dashboard** | Static metric cards & placeholder charts | **IMPROVE** | Transform into **Operations Command Center** with real-time KPI aggregations and Action Center alerts. |
| **Laporan (Reports)** | Basic transaction aggregation | **IMPROVE** | Enhance into Portfolio P&L, Occupancy reports, and Unit Contribution statements. |
| **Admin Dashboard** | Empty stub at `/dashboard/admin` | **UNKNOWN / IMPROVE** | Keep route; evolve into system administration or multi-organization oversight. |
| **WhatsApp Reminders** | Non-existent | **NEW (Phase 5)** | Build provider-agnostic messaging integration (`WhatsAppProvider`). |
| **Action Center** | Non-existent | **NEW (Phase 4)** | Build actionable triage list for overdue invoices, expiring leases, and urgent maintenance. |
| **Audit Logs** | Non-existent | **NEW (Phase 1)** | Build audit trail logging sensitive financial, leasing, and permission events. |
| **Organizations & RBAC** | Non-existent (single-owner model) | **NEW (Phase 1)** | Build `Organization`, `OrganizationUser`, and granular permissions. |

---

## 12. Conclusion & Immediate Priority

The existing application has clean UI components and solid foundations in Next.js 16 and Prisma, but suffers from critical architectural and security vulnerabilities:
1. **Critical authorization holes** in `kamar/action.ts`.
2. **Missing multi-tenancy foundation** (`organization_id`).
3. **Absence of financial correctness** (no invoices, integer money, unverified payments).

The evolution to **Rental Property Operating System** must proceed in strict compliance with `agent.md` without destructive rewrites, starting with **Phase 1: Foundation (Organizations, Scoping, Security Fixes, and Audit Logging)**.
