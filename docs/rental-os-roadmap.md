# Rental Property Operating System — Implementation Roadmap

> Document: `docs/rental-os-roadmap.md`  
> Created: Phase 0 — Full Project Audit  
> Implementation Strategy: Incremental, safe, non-destructive migration following `agent.md` & `design.md`.

---

## 1. Migration Philosophy & Rules of Engagement

1. **Safety First**: Treat existing production data as sacrosanct. Never delete columns or truncate tables.
2. **Dual-Read / Backward Compatibility**: Introduce new multi-tenancy columns (`organization_id`) with backfills while preserving legacy foreign keys (`ownerId`) until full migration is verified.
3. **No Blind Rewrites**: Extend existing modules (`Properti`, `Kamar`, `Penghuni`, `Transaksi`, `Pemeliharaan`) progressively toward target domain models.
4. **Strict Financial Correctness**: Never model financial state with booleans (`is_paid`). Use normalized `Payment -> PaymentAllocation -> Invoice` relationships with decimal/fixed precision.
5. **No AI Before Core Data**: Advanced analytics and AI triage must not precede reliable leasing, billing, and operational workflows.

---

## 2. Phased Roadmap

```text
Phase 1: Foundation (Organizations, Scoping, Security & Auditing)
   ↓
Phase 2: Rental Core (Tenants, Leases, Charges & Deposits)
   ↓
Phase 3: Finance Core (Invoices, Itemized Lines, Payments, Allocations & Expenses)
   ↓
Phase 4: Operations (Action Center, Maintenance, Work Orders & Vendors)
   ↓
Phase 5: Communication (WhatsApp Abstraction, Reminders & Templates)
   ↓
Phase 6: Automation (Rules Engine, Triggers & Background Schedulers)
   ↓
Phase 7: Analytics (Portfolio Dashboard, Collection Rates & Unit Margins)
   ↓
Phase 8: Intelligence (AI Advisory Insights & Predictive Risk)
```

---

### Phase 1 — Foundation (Status: COMPLETED)

**Objective**: Establish rock-solid multi-tenancy, eliminate critical authorization vulnerabilities, build the audit infrastructure, and ensure strict data isolation.

#### Deliverables:
1. **Security & Authorization Hotfix**: [x] COMPLETED
   - Fix IDOR / authorization bypass on `updateKamar` and `deleteKamar` in `app/dashboard/owner/kamar/action.ts`.
   - Ensure all server actions rigorously enforce session authentication and tenant boundaries.
2. **Multi-Tenancy Core Models**: [x] COMPLETED
   - Create `Organization` model: `id`, `name`, `slug`, `timezone` (default: "Asia/Jakarta"), `currency` (default: "IDR"), `logo`, `created_at`, `updated_at`.
   - Create `OrganizationUser` join model: `id`, `organization_id`, `user_id`, `role` (`owner`, `admin`, `manager`, `finance`, `staff`, `viewer`), `status`.
   - Create automatic migration / backfill helper: Each existing `User` with role `owner` is assigned their default `Organization` where they are `owner`.
3. **Audit Logging Framework**: [x] COMPLETED
   - Create `AuditLog` model: `id`, `organization_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `before_data` (JSON), `after_data` (JSON), `ip_address`, `created_at`.
   - Provide centralized `logAuditEvent()` utility function in `lib/audit/audit-logger.ts` with sensitive field masking.
4. **Data Scoping Migration**: [x] COMPLETED
   - Add optional `organizationId` foreign key to `Properti`, `Kamar`, `Penghuni`, `Transaksi`, `Pemeliharaan`.
   - Backfill `organizationId` from existing `ownerId`.
   - Update repository queries and server actions to scope strictly to `organizationId`.
5. **File Upload Hardening**: [x] COMPLETED
   - Validate file MIME types (JPEG, PNG, WebP only), enforce max file size (5MB), and sanitize file names in `lib/storage/`.

---

### Phase 2 — Rental Core (Tenants & Leases) (Status: COMPLETED)

**Objective**: Replace ad-hoc tenant dates with formal lease contracts, recurring charge definitions, and deposit management.

#### Deliverables:
1. **Tenant Profile Entity**: [x] COMPLETED
   - Decouple tenant profile (`Penghuni`) from single room stay with unique identity (`noKtp`), email, phone, and historical occupancy.
2. **Lease Entity (`Lease`)**: [x] COMPLETED
   - `Lease` model with contract numbers, start/end dates, monthly rent, deposits, and status lifecycle (`active`, `expiring`, `completed`, `terminated`).
   - Management UI in `/dashboard/owner/kontrak` with creation modal, filters, and status badges.
3. **Lease Charges (`LeaseCharge`)**: [x] COMPLETED
   - Granular breakdown of charges attached to a lease: `rent`, `electricity`, `water`, `parking`, `service_charge`, `internet`.
4. **Deposit Management**: [x] COMPLETED
   - Track held security deposits in Lease records with auto-fill from room defaults.

---

### Phase 3 — Finance Core (Invoicing, Allocations & Expenses) (Status: COMPLETED)

**Objective**: Implement an enterprise-grade financial engine capable of partial payments, overpayments, credit balances, and idempotent recurring billing.

#### Deliverables:
1. **Invoices & Itemized Lines**: [x] COMPLETED
   - `Invoice` and `InvoiceLine` models with currency, line breakdowns, subtotal, balance due, and status tracking.
2. **Payments & Payment Allocations**: [x] COMPLETED
   - `Payment` and `PaymentAllocation` models ensuring normalized multi-invoice payment settlement and partial payments.
3. **Idempotent Recurring Billing Service**: [x] COMPLETED
   - `BillingService.generateMonthlyInvoices()` evaluates active leases and creates periodic invoices with guaranteed idempotency.
4. **Owner Invoicing & Finance UI**: [x] COMPLETED
   - Integrated Invoicing tab in `/dashboard/owner/keuangan` with status filters (Overdue, Unpaid, Paid), 1-click automatic monthly billing generation, invoice detail breakdown dialog, and payment allocation modal.
5. **Safe Financial Operations & Legacy Compatibility**: [x] COMPLETED
   - Preserved cashbook (`Transaksi`) view in secondary tab with audit logging on deletions.

---

### Phase 4 — Operations & Action Center (Status: COMPLETED)

**Objective**: Transform maintenance handling and turn the dashboard into an actionable Operations Command Center.

#### Deliverables:
1. **Action Center (Hero Feature)**: [x] COMPLETED
   - Real-time operational triage banner in `/dashboard/owner` providing 1-click drill-downs into:
     - Overdue invoices & outstanding balances (`/dashboard/owner/keuangan?tab=invoices&filter=overdue`).
     - Expiring leases in < 30 days (`/dashboard/owner/kontrak`).
     - Open maintenance requests (`/dashboard/owner/pemeliharaan`).
     - Vacant units (`/dashboard/owner/properti`).
2. **Maintenance & Work Orders**: [x] COMPLETED
   - Dedicated management UI in `/dashboard/owner/pemeliharaan` with status pipeline (`menunggu`, `diproses`, `selesai`), category tagging, and priority badges.
3. **Vendor Management**: [x] COMPLETED
   - `Vendor` registry with category specialization (AC, Plumbing, Electrical, Cleaning, Civil, General), contact info, and assignment to maintenance work orders.

---

### Phase 5 — Communication (WhatsApp & Reminders) (Status: COMPLETED)

**Objective**: Implement the primary communication channel for Indonesian rental operations without tight provider lock-in.

#### Deliverables:
1. **Messaging Provider Abstraction**: [x] COMPLETED
   - Interface `MessagingProvider` (`sendMessage`, `sendTemplate`, `getDeliveryStatus`).
   - Adapters for providers: `DirectWhatsAppProvider` (`wa.me` instant dispatch), `FonnteWhatsAppProvider` (gateway API), and `MockMessagingProvider`.
2. **Standard Rental Collection Templates**: [x] COMPLETED
   - Indonesian rental templates: H-5 friendly reminder (`reminder_h5`), H-1 due reminder (`reminder_h1`), Due date reminder (`reminder_due`), Overdue escalation (`overdue_h1`), Payment receipt / kwitansi (`receipt_paid`), and Broadcast pengumuman (`announcement`).
   - Dynamic placeholder interpolation engine (`renderTemplate`).
3. **Owner Communication Hub & 1-Click WhatsApp Invoicing**: [x] COMPLETED
   - Dedicated communication management interface at `/dashboard/owner/pesan` with message composer, live WhatsApp preview, and outbound audit trail.
   - 1-click "Kirim WA" action directly on unpaid invoice rows in `/dashboard/owner/keuangan`.
4. **Communication Audit Trail**: [x] COMPLETED
   - `Communication` database entity tracking recipient, phone, channel, template, rendered message, provider, and timestamp.

---

### Phase 6 — Automation Engine (Status: COMPLETED)

**Objective**: Event-driven operational triggers to reduce manual overhead.

#### Deliverables:
1. **Domain Events**: [x] COMPLETED
   - In-process domain event bus in `lib/events/event-bus.ts` and `lib/events/domain-events.ts`: `lease.activated`, `invoice.issued`, `invoice.overdue`, `payment.received`, `payment.allocated`, `maintenance.created`.
2. **Automation Rules Engine**: [x] COMPLETED
   - Automated background scanner in `lib/services/automation.service.ts` for recurring invoice generation, overdue flagging, and audit logging.
   - Decoupled event hooks in billing and payment workflows with error isolation.

---

### Phase 7 — Analytics & Advanced Reporting (Status: COMPLETED)

**Objective**: Accurate portfolio performance and unit-level contribution accounting.

#### Deliverables:
1. **Portfolio Health KPIs**: [x] COMPLETED
   - Real-time calculation of Net Operating Income (NOI), operating profit margin, physical occupancy rate, and collection efficiency rate in `app/dashboard/owner/laporan/action.ts`.
2. **Unit-Level Profitability**: [x] COMPLETED
   - Net contribution margin accounting per individual room (revenue vs maintenance/utility expenses) to pinpoint loss-making units.
3. **Monthly Cashflow & Export Engine**: [x] COMPLETED
   - Interactive Recharts bar visualization for 12-month revenue vs expenses vs NOI.
   - Client-side CSV export of unit contribution reports and formatted print layout.

---

### Phase 8 — Intelligence & AI Advisory (Status: COMPLETED)

**Objective**: Non-destructive, explainable AI features built atop verified operational data.

#### Deliverables:
1. **Maintenance Triage Assistant**: [x] COMPLETED
   - Explainable triage heuristic in `lib/intelligence/maintenance-triage.ts` classifying categories (AC, plumbing, electrical, civil, sanitation), detecting safety risks, estimating resolution SLAs, and providing immediate damage mitigation advice.
2. **Collection Delinquency Risk Forecasting**: [x] COMPLETED
   - Scoring engine in `lib/intelligence/collection-risk.ts` evaluating tenant payment timeliness, overdue aging, and delinquency risk levels (Low, Medium, High) with explainable risk factors.
   - 1-click WhatsApp action with pre-filled reminder template tailored to the tenant's risk profile.
3. **Executive Portfolio Summary**: [x] COMPLETED
   - Natural language operational summary generator in `lib/intelligence/portfolio-summary.ts`.
   - Dual-tab executive intelligence view integrated into `/dashboard/owner/laporan` displaying operational narrative, strategic owner recommendations, delinquency watchlist, and loss-making room warnings.

---

## 3. Definition of Done Checklist for Completed Milestones

- [x] Database schema updated via non-destructive Prisma migration (`20261017000000_rental_os_foundation`).
- [x] Backward compatibility maintained for existing UI and cashbook data.
- [x] Multi-tenant isolation verified (`organizationId`).
- [x] Authorization enforced on all server actions / API endpoints.
- [x] Financial operations are idempotent with decimal/fixed precision and allocation tracking.
- [x] Audit logs captured for sensitive mutations (status changes, deletions, payment recordings).
- [x] Error, loading, empty, and success states provided in UI.
- [x] Typecheck (`tsc --noEmit`), test runner (`node --test`), and Next.js production build (`next build`) pass with 0 errors.
