# Rental Property Operating System — Gap Analysis

> Document: `docs/rental-os-gap-analysis.md`  
> Created: Phase 0 — Full Project Audit  
> Comparison: **Current Kontrakin Application** vs. **Target Rental Property Operating System (`design.md`)**

---

## 1. Overview

This gap analysis benchmarks the existing Kontrakin codebase against the comprehensive specification defined in `design.md` and the safety guidelines in `agent.md`.

Each module is classified according to the standard rubric:
- **KEEP**: Already compatible with target architecture.
- **IMPROVE**: Feature concept is correct, but requires refactoring, security fixes, or functional extensions.
- **REPLACE**: Current implementation cannot safely support the target operational/financial requirements and must be replaced incrementally.
- **NEW**: Essential capability not present in the existing application.
- **REMOVE**: Confirmed obsolete functionality (none identified at this stage).
- **UNKNOWN**: Under evaluation (none pending).

---

## 2. Comprehensive Module Gap Analysis Table

| Module | Current State in Kontrakin | Target State (`design.md`) | Classification | Priority | Risk |
|---|---|---|---|---|---|
| **Organizations** | None. Single-owner user model (`ownerId: user.id`). No company or multi-user account entity. | Multi-tenant `Organization` entity with company profile, timezone, tax settings, and currency. | **NEW** | P0 (Critical) | High |
| **Users** | `User` with roles `owner`, `tenant`, `admin`. Auth powered by better-auth. | Global `User` linked to `Organization` via `OrganizationUser` membership with assigned roles. | **IMPROVE** | P0 (Critical) | Medium |
| **Roles** | Static string field on `User` (`role`). Coarse distinction (`owner` vs `tenant`). | Configurable organization roles: Owner, Admin, Property Manager, Finance, Operations, Maintenance, Viewer. | **IMPROVE** | P0 (Critical) | Medium |
| **Permissions** | Checked via rudimentary `requireOwner()`, `requireTenant()`. Several actions lack checks entirely. | Server-enforced granular permissions (`resource.action`, e.g., `invoice.create`, `payment.record`). | **IMPROVE** | P0 (Critical) | High |
| **Properties** | `Properti` model (`id`, `nama`, `tipe`, `alamat`, `foto`, `ownerId`). Direct disk upload to `public/uploads`. | `Property` model scoped to `organization_id`, with property code, timezone, bank accounts, and private document storage. | **IMPROVE** | P1 (High) | Low |
| **Units** | `Kamar` model (`nomor`, `lantai`, `tipe`, `hargaBulanan: Int`, `status`, `ownerId`). Auth bypass bug on update/delete. | `Unit` model scoped to `organization_id`, linked to `Property`, `Floor`, `Building`, `UnitType`, decimal `base_rent`, `deposit_amount`. | **IMPROVE** | P1 (High) | Medium |
| **Tenants** | `Penghuni` model (`nama`, `noHp`, `email`, `noKtp`, `tanggalMasuk`, `tanggalKeluar`). Tightly bound to a single room. | `Tenant` as a single source of truth customer profile with document records, emergency contacts, and multi-lease history. | **IMPROVE** | P1 (High) | Medium |
| **Leases** | Non-existent. Implicit occupancy via `tanggalMasuk`/`tanggalKeluar` directly on `Penghuni`. | Formal `Lease` contract entity with lifecycle states (`draft`, `active`, `expiring`, `renewed`, `completed`, `terminated`), billing frequency, late fee rules. | **NEW / REPLACE** | P1 (High) | High |
| **Lease Charges** | Flat `hargaBulanan` integer on `Kamar`. | Granular recurring charge items: rent, electricity, water, parking, internet, service charges, custom fees (`lease_charges`). | **NEW** | P2 (Medium) | Medium |
| **Deposits** | None. Not tracked in database. | Formal security deposit lifecycle: collection, holding, damage deductions, refunds, and transfer balance. | **NEW** | P2 (Medium) | High |
| **Invoices** | Non-existent. No billing schedule, no invoice records, no due dates. | Comprehensive `Invoice` model (`invoice_number`, `issue_date`, `due_date`, `total`, `balance_due`, statuses: `draft`, `issued`, `partial`, `paid`, `overdue`). | **NEW** | P1 (High) | High |
| **Invoice Lines** | Non-existent. | Itemized charges per invoice (`description`, `quantity`, `unit_price`, `amount`, `type`). | **NEW** | P1 (High) | Medium |
| **Payments** | Simulated cashbook `Transaksi` with `jumlah: Int`. Mocked tenant instant "pay" button. | Idempotent `Payment` model with payment methods, provider references, receipt generator, and gateway webhooks. | **REPLACE / EXTEND** | P1 (High) | High |
| **Payment Allocations** | None. Single payment directly creates a flat transaction record. | Normalized `PaymentAllocation` (`payment_id`, `invoice_id`, `amount`) supporting partial payments, overpayments, and multi-invoice settlement. | **NEW** | P1 (High) | High |
| **Expenses** | Stored in `Transaksi` with `jenis: "pengeluaran"`. Flat category string. | Structured `Expense` entity with vendor links, unit/property attribution, approval status, and receipt attachment. | **IMPROVE** | P2 (Medium) | Low |
| **Maintenance** | `Pemeliharaan` model with basic priority and status (`menunggu`, `diproses`, `selesai`). | End-to-end `MaintenanceRequest` & `WorkOrder` with vendor assignment, cost tracking (est vs act), photo evidence, SLA timers. | **IMPROVE** | P2 (Medium) | Low |
| **Vendors** | None. Maintenance has no vendor association. | `Vendor` registry with specialty category, contact details, rating, and linked expense history. | **NEW** | P3 (Low) | Low |
| **Communication** | None. No message records or channel history. | `Communication` audit trail logging outbound messages across WhatsApp, email, SMS, and in-app channels. | **NEW** | P3 (Low) | Low |
| **WhatsApp** | None. Manual WhatsApp communication by owner outside the app. | Provider-agnostic `MessagingProvider` abstraction for automated invoice links, payment receipts, and payment reminders. | **NEW** | P2 (Medium) | Medium |
| **Notifications** | Client-side Sonner toast alerts only. | System notifications (in-app, email, WhatsApp) triggered by domain events (overdue bill, expiring lease, ticket update). | **NEW** | P2 (Medium) | Low |
| **Dashboard** | Standard stat cards + 2 charts. Hardcoded placeholders (`tunggakan = 0`, placeholder charts). | **Operations Command Center** displaying real-time operational KPIs and actionable alerts. | **IMPROVE** | P1 (High) | Medium |
| **Reports** | Simple aggregate sums of `Transaksi` in `/dashboard/owner/laporan`. | Portfolio P&L, Occupancy trends, Collection rate, Unit contribution margins, and Exportable Financial Statements. | **IMPROVE** | P2 (Medium) | Low |
| **Action Center** | Non-existent. | Actionable operational triage hub: Overdue invoices, expiring leases, overdue maintenance, vacant units, and unreconciled payments. | **NEW** | P1 (High) | Medium |
| **Automation** | None. All workflows require manual user actions. | Event-driven trigger/condition/action rules (e.g., auto-reminder at H-3, late fee application at H+2). | **NEW** | P4 (Future) | Medium |
| **Analytics** | Basic monthly revenue and occupancy charts. | Granular property-level and unit-level NOI, occupancy rate, on-time payment rate, and maintenance SLA performance. | **IMPROVE** | P3 (Low) | Low |
| **Audit Logs** | None. Mutations and deletions occur silently without trace. | Dedicated `AuditLog` recording actor, organization, entity, action, timestamp, before/after JSON snapshots, and IP address. | **NEW** | P0 (Critical) | Low |
| **Import** | None. | Fault-tolerant CSV/Excel import wizard for Properties, Units, Tenants, and Opening Balances with validation and row-level error reporting. | **NEW** | P2 (Medium) | Medium |
| **Export** | None. | CSV/PDF export for invoices, payment receipts, monthly cashflow, and tax summaries. | **NEW** | P2 (Medium) | Low |

---

## 3. High-Risk Gaps Demanding Immediate Remediation

### 3.1 Security & Multi-Tenant Isolation
- **Problem**: In `app/dashboard/owner/kamar/action.ts`, `updateKamar` and `deleteKamar` operate on raw `id` without verifying `ownerId` or user authentication. Any authenticated user can modify or delete rooms across the platform.
- **Remediation**: Enforce strict tenant/owner scoping on all queries and introduce `organization_id` architecture.

### 3.2 Monetary Precision & Integer Overflow
- **Problem**: Currency values (`hargaBulanan`, `jumlah`) are stored as 32-bit `Int` in Prisma/PostgreSQL, capped at Rp 2,147,483,647.
- **Remediation**: Migrate monetary columns to `Decimal(15, 2)` or 64-bit `BigInt` to prevent overflow and ensure decimal precision.

### 3.3 Ghost Financial Workflow
- **Problem**: The tenant portal contains a "Bayar Tagihan" button that creates fake revenue entries directly in the database without an invoice, billing record, or payment gateway verification.
- **Remediation**: Establish a proper `Invoice` -> `Payment` -> `PaymentAllocation` pipeline. Mock actions must never directly write unverified revenue.

### 3.4 Unsafe File Uploads
- **Problem**: Property image uploads write directly to `public/uploads` with arbitrary file extensions and no MIME validation.
- **Remediation**: Implement strict MIME/extension validation, file size limits, and transition toward secure object storage.

---

## 4. Architectural Target Architecture Mapping

```
Existing (Single-User CRUD)                  Target (Rental Property OS)
───────────────────────────                  ───────────────────────────
User (owner)                                 Organization
  │                                            ├── OrganizationUser (Roles & Permissions)
  ├── Properti                                 ├── Property (Timezone, Code, Settings)
  │     └── Kamar                                │     └── Unit (UnitType, Floor, BaseRent)
  ├── Penghuni (tied to Kamar)                 ├── Tenant (Single Source of Truth)
  └── Transaksi (flat ledger)                  ├── Lease (Lifecycle, Recurring Charges, Deposits)
                                               ├── Invoice & InvoiceLine (Recurring Billing)
                                               ├── Payment & PaymentAllocation (Multi-Invoice/Partial)
                                               ├── Expense (Attributed to Unit/Property)
                                               ├── Maintenance & Vendor (Work Orders, SLAs)
                                               ├── Action Center & Automated Alerts
                                               └── AuditLog (Complete Traceability)
```
