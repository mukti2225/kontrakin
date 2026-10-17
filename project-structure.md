# Rental Property Operating System — Target Structure & Agent Alignment Guide

> File: `project-structure.md`  
> Purpose: Menjadi sumber acuan utama bagi developer dan AI coding agent untuk memahami struktur role, modul, hubungan data, permission, dan arah produk Rental Property Operating System.

---

# 1. Product Structure

Aplikasi dibagi menjadi 3 area utama:

```text
Rental Property Operating System
│
├── Platform Console
│   └── Superadmin
│
├── Owner Workspace
│   ├── Owner
│   └── Staff
│
└── Tenant Portal
    └── Tenant
```

Prinsip utama:

- `Superadmin` mengelola bisnis SaaS.
- `Owner` mengelola bisnis rental property miliknya.
- `Staff` membantu Owner dengan akses terbatas.
- `Tenant` mengelola kebutuhan sewanya sendiri.

Role utama saat ini:

```text
SUPERADMIN
OWNER
STAFF
TENANT
```

Jangan membuat terlalu banyak role pada MVP.

---

# 2. Superadmin

Superadmin adalah tim internal pemilik SaaS dan tidak termasuk dalam organization customer.

Mengelola:

```text
Organizations
Subscriptions
Plans
Usage
Platform Users
Support
Audit Logs
Feature Flags
System Health
Platform Settings
```

Dashboard harus menjawab:

> Bagaimana kondisi SaaS saya?

KPI utama:

```text
Total Organizations
Active Organizations
Trial Organizations
Active Subscriptions
MRR
Managed Units
Active Users
Failed Payments
System Errors
```

Recommended routes:

```text
/platform
/platform/dashboard
/platform/organizations
/platform/subscriptions
/platform/plans
/platform/usage
/platform/support
/platform/audit
/platform/system
/platform/settings
```

---

# 3. Owner

Owner adalah customer utama SaaS dan memiliki akses penuh terhadap organization miliknya.

Owner mengelola:

```text
Properties
Units
Tenants
Leases
Invoices
Payments
Expenses
Maintenance
Reports
Team
Settings
```

Owner Dashboard harus menjawab:

> Bagaimana kondisi bisnis property saya?

KPI:

```text
Occupancy
Expected Rent
Collected Rent
Outstanding Rent
Vacant Units
Open Maintenance
```

Action Center:

```text
Overdue invoices
Expiring leases
Vacant units
Maintenance overdue
Unreconciled payments
```

Setiap item harus menuju filtered view.

---

# 4. Staff

Staff adalah user yang membantu Owner dalam organization yang sama.

Untuk MVP gunakan satu role:

```text
STAFF
```

Akses dikendalikan menggunakan permissions, misalnya:

```text
tenant.view
tenant.create
tenant.update
unit.view
maintenance.view
maintenance.update
invoice.view
```

Contoh Staff A:

```text
✓ Tenant
✓ Unit
✓ Maintenance

✕ Subscription
✕ Team Management
✕ Refund
✕ Delete Organization
```

Future specialization dapat menjadi:

```text
Property Manager
Finance
Operations
Maintenance
Viewer
```

Tetapi jangan implementasikan sampai benar-benar dibutuhkan.

---

# 5. Tenant

Tenant adalah penyewa dan menggunakan portal terpisah.

Tenant hanya dapat mengakses resource miliknya:

```text
My Unit
My Lease
My Invoices
My Payments
My Receipts
My Maintenance Requests
My Documents
My Profile
```

Tenant Dashboard harus menjawab:

> Apa yang harus saya bayar atau urus?

Recommended dashboard:

```text
Current Unit
Current Bill
Amount
Due Date
[Pay Now]
Recent Payment
Maintenance Status
Lease Summary
Quick Actions
```

Recommended routes:

```text
/tenant
/tenant/home
/tenant/payments
/tenant/maintenance
/tenant/lease
/tenant/documents
/tenant/profile
```

Tenant Portal harus mobile-first.

---

# 6. Owner Workspace Navigation

```text
Dashboard

Portfolio
├── Properties
└── Units

Rentals
├── Tenants
├── Leases
└── Deposits

Finance
├── Invoices
├── Payments
├── Expenses
└── Reports

Operations
├── Maintenance
└── Vendors

Communication
├── Messages
└── Templates

Team
Settings
```

---

# 7. Core Domain Model

```text
Organization
│
├── Owner
├── Staff
│
├── Properties
│   └── Units
│       ├── Lease
│       │   └── Tenant
│       ├── Invoices
│       ├── Payments
│       └── Maintenance
│
├── Tenants
├── Expenses
├── Vendors
├── Communications
└── Reports
```

---

# 8. Organization

Organization adalah boundary utama data customer.

Contoh:

```text
Organization: PT Maju Property
Users:
- Budi → Owner
- Andi → Staff
Properties:
- Kost Melati
- Kost Mawar
- Residence 88
```

Semua business entity harus memiliki `organization_id` atau mekanisme tenant scope yang setara.

---

# 9. Authentication Model

Gunakan satu authentication system.

```text
users
- id
- name
- email
- phone
- password/auth fields
- status
```

Relationship internal:

```text
organization_users
- organization_id
- user_id
- role
```

Tenant relationship:

```text
tenant_users
- tenant_id
- user_id
```

Jangan membuat duplicate authentication system untuk Owner, Staff, dan Tenant.

---

# 10. Authorization

Gunakan kombinasi:

```text
Role
+
Permission
+
Resource Ownership
```

Owner memiliki permission penuh di organization miliknya.

Staff mendapatkan permission sesuai kebutuhan.

Tenant hanya dapat mengakses resource dengan ownership yang valid, misalnya:

```text
invoice.tenant_id == currentTenant.id
```

---

# 11. Multi-Tenancy Rule

Organization A tidak boleh dapat membaca, mengubah, menghapus, atau mereferensikan data Organization B.

Contoh query aman:

```text
SELECT *
FROM invoices
WHERE id = :invoice_id
AND organization_id = :current_organization_id
```

Jangan query hanya berdasarkan `id` untuk business record.

---

# 12. Property Module

Property memiliki:

```text
Units
Tenants
Leases
Invoices
Expenses
Maintenance
```

Property detail page:

```text
Overview
Units
Tenants
Finance
Maintenance
Documents
Activity
```

---

# 13. Unit Module

Status unit:

```text
vacant
reserved
occupied
notice
maintenance
inactive
```

Unit detail:

```text
Tenant
Lease
Current Balance
Revenue
Maintenance
Documents
Activity
```

---

# 14. Tenant Module

Tenant terkait dengan:

```text
Lease
Invoices
Payments
Deposits
Maintenance
Documents
Communications
```

Jangan duplicate tenant ketika tenant pindah unit. History harus dipertahankan.

---

# 15. Lease Module

Lease menghubungkan Tenant + Unit.

Status:

```text
draft
active
expiring
renewed
terminated
completed
```

Lease dapat menghasilkan recurring invoices.

---

# 16. Invoice Module

Status:

```text
draft
issued
partial
paid
overdue
cancelled
refunded
```

Invoice memiliki `invoice_lines`, misalnya:

```text
Rent
Electricity
Water
Parking
Service Charge
Late Fee
```

---

# 17. Payment Module

Jangan hanya menggunakan `invoice.is_paid`.

Gunakan:

```text
Payment
↓
Payment Allocation
↓
Invoice
```

Support:

```text
Partial payment
Multiple payments
One payment → multiple invoices
Overpayment
Credit
Refund
Reversal
```

---

# 18. Collection Engine

Target workflow:

```text
Invoice created
↓
Reminder H-5
↓
Reminder H-1
↓
Due Date
↓
Late Reminder
↓
Payment
↓
Reconciliation
↓
Receipt
↓
Dashboard Update
```

Collection adalah salah satu hero feature aplikasi.

---

# 19. Expense Module

Expense dapat dihubungkan ke:

```text
Property
Unit
Maintenance
Vendor
```

---

# 20. Maintenance Module

Flow:

```text
Reported
↓
Reviewed
↓
Assigned
↓
In Progress
↓
Waiting
↓
Completed
↓
Closed
```

Maintenance terkait dengan:

```text
Tenant
Unit
Property
Vendor
Expense
```

Owner/Staff dapat mengelola ticket. Tenant hanya melihat ticket miliknya.

---

# 21. Vendor Module

Vendor terkait dengan:

```text
Maintenance
Work Order
Expense
```

---

# 22. Communication

Prioritas channel:

```text
1. WhatsApp
2. Email
3. In-App
```

Semua outbound communication penting harus dicatat.

---

# 23. Dashboard Architecture

Aplikasi memiliki 3 dashboard utama:

## Platform Dashboard

Untuk Superadmin.

> Bagaimana kondisi SaaS saya?

## Owner Dashboard

Untuk Owner dan Staff.

> Bagaimana kondisi bisnis rental ini?

Konten berubah berdasarkan permission.

## Tenant Dashboard

Untuk Tenant.

> Apa yang perlu saya bayar atau urus?

Jangan gunakan layout Owner dan Tenant yang sama.

---

# 24. Route Architecture

Recommended:

```text
/platform/*   → Superadmin
/owner/*      → Owner Workspace
/tenant/*     → Tenant Portal
```

Jika aplikasi existing sudah memiliki routing yang baik, jangan rewrite hanya demi mengikuti nama ini.

---

# 25. Owner vs Asset Owner

Di UI, `Owner` berarti customer/account owner.

Jangan mengasumsikan bahwa Owner SaaS selalu pemilik aset secara legal/ekonomi.

Future entity jika dibutuhkan:

```text
asset_owners
property_ownerships
```

Jangan implementasikan pada MVP kecuali ada kebutuhan nyata.

---

# 26. MVP Role Scope

Gunakan:

```text
SUPERADMIN
OWNER
STAFF
TENANT
```

Jangan pecah Staff menjadi banyak role sampai benar-benar diperlukan.

---

# 27. MVP Modules

```text
Authentication
Organization
Owner
Staff
Tenant
Property
Unit
Lease
Invoice
Payment
Payment Allocation
Expense
Maintenance
Dashboard
Reports
WhatsApp Reminder
Audit Logs
Import
Export
```

---

# 28. Core End-to-End Workflow

Agent harus memprioritaskan workflow ini:

```text
Owner creates property
↓
Owner creates/imports units
↓
Tenant is created
↓
Tenant gets account/access
↓
Lease is activated
↓
Recurring invoice generated
↓
Tenant receives reminder
↓
Tenant pays
↓
Payment reconciled
↓
Receipt generated
↓
Owner dashboard updated
↓
Tenant dashboard updated
↓
Maintenance request can be submitted
↓
Expense can be recorded
↓
Reports available
```

Jika workflow ini belum lengkap, jangan memprioritaskan AI atau fitur dekoratif.

---

# 29. Agent Alignment Rules

AI agent MUST read this file before significant structural changes.

Jika implementasi saat ini tidak sesuai:

```text
Inspect
↓
Document
↓
Classify
↓
Plan Migration
↓
Implement Safely
```

Classification:

```text
KEEP
IMPROVE
REPLACE
REMOVE
UNKNOWN
```

Never remove `UNKNOWN` functionality.

---

# 30. Agent Audit Requirements

Jika project belum sesuai, buat:

```text
docs/structure-gap-analysis.md
```

Gunakan table:

```text
| Area | Current | Target | Status | Risk | Recommended Change |
```

Audit minimal:

```text
Roles
Authentication
Organization
Multi-tenancy
Routes
Dashboard
Property
Unit
Tenant
Lease
Invoice
Payment
Expenses
Maintenance
Permissions
```

---

# 31. Agent Migration Priority

```text
1. Data safety
2. Tenant isolation
3. Authentication
4. Authorization
5. Organization
6. Owner / Staff / Tenant relationship
7. Property
8. Unit
9. Tenant
10. Lease
11. Invoice
12. Payment
13. Reconciliation
14. Expense
15. Maintenance
16. Dashboard
17. Communication
18. Reporting
19. Automation
20. AI
```

---

# 32. Agent Must Not Do

Do NOT:

```text
Rewrite whole application unnecessarily
Create duplicate authentication
Create separate auth databases for each role
Break existing customer data
Drop tables casually
Remove working features without audit
Mix Superadmin with Owner
Allow Tenant to access global organization data
Use frontend-only authorization
Store monetary values as float
Trust frontend payment success
```

---

# 33. UI Principle

Platform Console:

```text
business / SaaS focused
```

Owner Workspace:

```text
operational / desktop-first
```

Tenant Portal:

```text
simple / mobile-first
```

Avoid excessive gradients, glassmorphism, decorative UI, dan AI-template look.

Prioritize clarity, speed, actions, status, dan financial visibility.

---

# 34. Final Target Structure

```text
Rental Property Operating System
│
├── PLATFORM CONSOLE
│   └── Superadmin
│       ├── Organizations
│       ├── Plans
│       ├── Subscriptions
│       ├── Usage
│       ├── Support
│       ├── Audit
│       └── System
│
├── OWNER WORKSPACE
│   ├── Owner
│   └── Staff
│       ├── Dashboard
│       ├── Properties
│       ├── Units
│       ├── Tenants
│       ├── Leases
│       ├── Invoices
│       ├── Payments
│       ├── Expenses
│       ├── Maintenance
│       ├── Reports
│       ├── Team
│       └── Settings
│
└── TENANT PORTAL
    └── Tenant
        ├── Home
        ├── Payments
        ├── Maintenance
        ├── Lease
        ├── Documents
        └── Profile
```

---

# 35. Product Mental Model

Superadmin:

> Bagaimana kondisi SaaS saya?

Owner:

> Bagaimana kondisi bisnis property saya?

Staff:

> Apa pekerjaan yang perlu saya lakukan?

Tenant:

> Apa yang perlu saya bayar atau urus?

---

# 36. Final Rule

Keep the product simple.

Current role strategy:

```text
SUPERADMIN
OWNER
STAFF
TENANT
```

Current application strategy:

```text
System of Record
↓
System of Action
↓
System of Intelligence
```

Current priority:

```text
PROPERTY
+
TENANT
+
LEASE
+
MONEY
+
OPERATIONS
Everything else is secondary.

---

# 37. Provisioning & Authentication Model

Kontrakin implements an asymmetric, secure onboarding model:

```text
OWNER
Public registration (/register) → Create account & org → Owner Workspace

STAFF
Owner invitation (/dashboard/owner/tim) → Scoped permissions → Owner Workspace

TENANT
Owner creates Tenant record (Penghuni) → Activation token & WhatsApp OTP → Tenant Portal

SUPERADMIN
Internal seed / provisioning → Platform Console
```

- **No Public Tenant Registration:** Public visitors can only register as property Owners.
- **Server Enforcement:** Server hooks strictly override public signup roles to `owner`.
- **Deprecated Tenant Route:** `/register/tenant` guides visitors with an informational notice pointing to login and activation instructions.
- **Existing Tenant Accounts:** Active tenants log in normally via role-neutral `/login` gateway.

