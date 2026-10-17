# Rental Property Operating System — Design Specification

> File: `design.md`  
> Purpose: Menjadi sumber acuan utama untuk mengubah aplikasi Property Management SaaS yang sudah ada menjadi **Rental Property Operating System** yang scalable, mudah digunakan, dan memiliki nilai jual tinggi.

---

## 1. Product Direction

### 1.1 Product Vision

Bangun sebuah **Rental Property Operating System** yang membantu pemilik dan operator properti mengelola seluruh siklus operasional rental dari satu platform:

- Property & unit
- Tenant
- Lease
- Billing
- Payment
- Collection
- Maintenance
- Expenses
- Staff
- Communication
- Reporting
- Automation
- Portfolio intelligence

Produk tidak boleh berhenti sebagai aplikasi pencatatan.

Produk harus berkembang dari:

```text
System of Record
      ↓
System of Action
      ↓
System of Intelligence
```

### 1.2 Core Promise

> Membantu pemilik/operator mengelola lebih banyak unit dengan lebih sedikit pekerjaan administratif.

### 1.3 Primary Target User

Fokus utama:

- Pemilik kos
- Operator kos
- Pemilik kontrakan
- Apartment rental operator
- Coliving operator
- Property management company
- Residential rental manager
- Small commercial rental operator

Ideal customer profile:

```text
20–500 managed units
2+ properties
2+ staff
Masih banyak menggunakan Excel + WhatsApp + transfer manual
```

---

# 2. Product Principles

Semua keputusan produk harus mengikuti prinsip berikut.

## 2.1 Automation First

Jangan hanya membantu user melakukan pekerjaan.

Usahakan sistem mengerjakannya secara otomatis.

Contoh:

```text
BAD
User membuka tenant
User membuka invoice
User mengirim reminder

GOOD
Invoice overdue
→ reminder otomatis
→ payment diterima
→ reconciliation
→ receipt
→ dashboard update
```

## 2.2 Action-Oriented UX

Dashboard tidak hanya berisi grafik.

Dashboard harus memberitahu user:

> Apa yang harus saya lakukan sekarang?

## 2.3 WhatsApp First

Untuk market Indonesia:

- Staff menggunakan web app.
- Tenant tidak wajib install aplikasi.
- Tenant dapat menerima invoice, reminder, receipt, dan maintenance update via WhatsApp.
- Tenant portal menggunakan secure web link.

## 2.4 Progressive Complexity

UI harus sederhana untuk user kecil, tetapi tetap scalable untuk operator besar.

Jangan tampilkan semua fitur enterprise kepada user baru.

## 2.5 Financial Accuracy

Billing, payment, allocation, deposit, dan refund harus memiliki data model yang benar sejak awal.

Jangan menggunakan boolean sederhana seperti:

```text
is_paid = true
```

untuk menggantikan sistem pembayaran yang sebenarnya.

---

# 3. Main Product Areas

Navigasi utama disarankan:

```text
Dashboard

Portfolio
├── Properties
├── Units
└── Occupancy

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
├── Vendors
└── Tasks

Communication
├── Messages
└── Templates

Analytics

Team

Settings
```

Jangan membuat menu terlalu panjang.

Gunakan nested navigation seperlunya.

---

# 4. Dashboard Design

Dashboard harus menjadi **Operations Command Center**.

## 4.1 Top Summary

Tampilkan maksimal 5–6 KPI utama:

```text
Occupancy
93%

Expected Rent
Rp 185.000.000

Collected
Rp 171.000.000

Outstanding
Rp 14.000.000

Open Maintenance
8

Vacant Units
6
```

## 4.2 Action Center

Komponen paling penting:

```text
Needs Attention

12 overdue invoices
Rp 18.600.000 outstanding
[Review]

4 leases expire in <30 days
[Review]

3 maintenance tickets overdue
[Review]

5 units vacant >21 days
[Review]

2 unreconciled payments
[Review]
```

Setiap card harus dapat diklik dan membawa user ke filtered view.

## 4.3 Portfolio Health

Tampilkan:

- Occupancy trend
- Revenue trend
- Collection rate
- Maintenance SLA
- Expense trend

Hindari dashboard penuh chart tanpa actionable context.

---

# 5. Property & Unit Module

## 5.1 Property

Required fields:

```text
id
organization_id
name
code
property_type
address
city
province
postal_code
timezone
status
created_at
updated_at
```

Optional:

```text
latitude
longitude
description
manager_user_id
bank_account_id
```

## 5.2 Unit

Required fields:

```text
id
organization_id
property_id
building_id
floor_id
unit_number
unit_type_id
status
base_rent
deposit_amount
created_at
updated_at
```

## 5.3 Unit Lifecycle

```text
vacant
reserved
occupied
notice
maintenance
inactive
```

Lifecycle changes harus menghasilkan activity log.

---

# 6. Tenant Module

Tenant profile harus menjadi single source of truth.

Fields:

```text
id
organization_id
full_name
phone
email
identity_type
identity_number
date_of_birth
emergency_contact_name
emergency_contact_phone
status
notes
```

Related information:

- Active lease
- Historical leases
- Invoices
- Payments
- Deposits
- Maintenance requests
- Documents
- Communication history
- Internal notes

Jangan menduplikasi tenant ketika tenant pindah unit.

---

# 7. Lease Module

Lease adalah hubungan formal antara tenant dan unit.

Fields:

```text
id
organization_id
tenant_id
unit_id
start_date
end_date
billing_frequency
rent_amount
deposit_amount
billing_day
late_fee_type
late_fee_value
status
contract_document_id
```

Status:

```text
draft
active
expiring
renewed
terminated
completed
```

## 7.1 Lease Charges

Jangan menyimpan semua biaya sebagai satu angka rent.

Gunakan:

```text
lease_charges
- rent
- electricity
- water
- parking
- service_charge
- internet
- cleaning
- custom_fee
```

---

# 8. Billing & Invoice Module

## 8.1 Invoice

Fields:

```text
id
organization_id
tenant_id
lease_id
property_id
unit_id
invoice_number
issue_date
due_date
subtotal
discount_total
tax_total
penalty_total
total
balance_due
status
currency
```

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

## 8.2 Invoice Line

```text
invoice_id
type
description
quantity
unit_price
amount
```

## 8.3 Recurring Billing

Background job:

```text
active lease
→ billing schedule
→ create invoice
→ schedule reminder
```

Harus idempotent.

Jangan membuat invoice duplikat ketika job retry.

---

# 9. Payment Module

Payment module merupakan salah satu area paling kritikal.

## 9.1 Payment

```text
id
organization_id
tenant_id
amount
payment_method
payment_reference
provider
provider_transaction_id
paid_at
status
metadata
```

## 9.2 Payment Allocation

Gunakan tabel terpisah:

```text
payment_allocations

payment_id
invoice_id
amount
```

Satu payment dapat membayar beberapa invoice.

Satu invoice dapat dibayar beberapa payment.

## 9.3 Must Support

- Partial payment
- Multiple invoice payment
- Overpayment
- Credit balance
- Discount
- Penalty
- Refund
- Reversal
- Manual payment
- Gateway payment

## 9.4 Reconciliation Flow

```text
Payment Gateway
      ↓
Webhook
      ↓
Verify signature
      ↓
Check idempotency
      ↓
Create/update payment
      ↓
Allocate payment
      ↓
Update invoice balance
      ↓
Generate receipt
      ↓
Send notification
```

---

# 10. Collection Engine

Collection automation adalah hero feature.

## 10.1 Default Workflow

```text
H-5
Friendly reminder

H-1
Due reminder

Due date
Invoice due

H+1
Late reminder

H+3
Second reminder

H+7
Escalation
```

Semua interval dapat dikonfigurasi.

## 10.2 Collection Configuration

Per organization:

```text
default reminder schedule
message templates
late fee configuration
preferred communication channel
business hours
```

---

# 11. Maintenance Module

## 11.1 Maintenance Request

```text
id
organization_id
property_id
unit_id
tenant_id
category
title
description
priority
status
assigned_user_id
vendor_id
reported_at
due_at
completed_at
```

## 11.2 Status

```text
reported
reviewed
assigned
in_progress
waiting_parts
waiting_tenant
completed
closed
cancelled
```

## 11.3 Priority

```text
low
normal
high
urgent
```

## 11.4 Maintenance Detail Page

Tampilkan:

- Problem
- Tenant
- Unit
- Images
- Timeline
- Assigned person
- Vendor
- SLA
- Estimated cost
- Actual cost
- Before/after photo
- Notes

---

# 12. Vendor Module

Fields:

```text
id
organization_id
name
category
phone
email
address
rating
notes
status
```

Relasi:

- Work orders
- Quotes
- Expenses
- Historical maintenance
- Performance

Future:

```text
average_response_time
average_cost
completion_rate
```

---

# 13. Expenses

Expense fields:

```text
id
organization_id
property_id
unit_id
vendor_id
category
amount
expense_date
payment_status
description
receipt_document_id
```

Expense dapat dialokasikan ke:

- Portfolio
- Property
- Unit
- Maintenance work order

---

# 14. Financial Analytics

## 14.1 Property Level

```text
Revenue
Expense
Net Operating Income
Occupancy
Collection Rate
Outstanding
Maintenance Cost
```

## 14.2 Unit Level

```text
Rent Revenue
Other Revenue
Maintenance Expense
Other Expense
Net Contribution
Occupancy Days
Vacancy Days
```

## 14.3 Required Filters

```text
date range
property
unit
owner
status
```

---

# 15. Communication System

Semua outbound communication sebaiknya dicatat.

Entity:

```text
communications

organization_id
tenant_id
channel
template_id
subject
message
status
sent_at
provider_message_id
```

Channels:

```text
whatsapp
email
sms
in_app
```

MVP prioritization:

```text
1. WhatsApp
2. Email
3. In-app
```

---

# 16. Tenant Experience

Tenant tidak wajib memiliki akun.

Tenant dapat menggunakan secure magic link.

Tenant portal:

```text
My Unit
Current Invoice
Payment History
Receipts
Lease
Maintenance
Documents
```

Default landing page:

```text
Rp 1.800.000
Due 5 Oct

[Pay Now]

Recent payments
Maintenance request
Lease details
```

---

# 17. Role & Permission

Default roles:

```text
Owner
Admin
Property Manager
Finance
Operations
Maintenance
Viewer
```

Permission model:

```text
resource.action

property.view
property.update

invoice.view
invoice.create
invoice.update
invoice.cancel

payment.view
payment.record
payment.refund

team.manage
```

Server harus melakukan authorization.

Jangan mengandalkan hidden button di frontend.

---

# 18. Audit Log

Audit log wajib untuk action sensitif.

Track:

```text
actor_user_id
organization_id
action
entity_type
entity_id
before_data
after_data
ip_address
created_at
```

Audit:

- Payment modified
- Invoice cancelled
- Refund issued
- Lease modified
- Expense approved
- User role changed
- Tenant deleted
- Property deleted

---

# 19. Multi-Tenancy

Semua business entity harus scoped menggunakan:

```text
organization_id
```

Setiap query wajib memiliki tenant scope.

Recommended pattern:

```text
organization
└── users
└── properties
└── tenants
└── leases
└── invoices
└── payments
```

Harus ada automated tests untuk memastikan Organization A tidak dapat mengakses data Organization B.

---

# 20. Authentication & Security

Minimum:

- Strong password hashing
- Secure cookies/session or secure token strategy
- MFA untuk admin/owner
- Rate limiting
- CSRF protection jika menggunakan cookie-based auth
- Secure headers
- Webhook signature validation
- Object storage signed URLs
- Sensitive data masking
- Session revocation
- Login audit
- Backup
- Restore procedure

---

# 21. Automation Engine

Long-term differentiator.

Model:

```text
Trigger
Condition
Action
```

Example:

```text
WHEN
invoice.overdue

IF
days_overdue >= 3

THEN
send_whatsapp
create_task
notify_property_manager
```

Example:

```text
WHEN
lease.expiring

IF
days_until_expiry = 30

THEN
send_renewal_offer
create_task
```

Architecture entities:

```text
automation_rules
automation_conditions
automation_actions
automation_runs
```

---

# 22. Action Center

Action center dibangun dari domain events.

Possible actions:

```text
invoice overdue
payment unreconciled
lease expiring
maintenance overdue
unit vacant too long
expense awaiting approval
deposit pending refund
```

Entity:

```text
action_items

organization_id
type
entity_type
entity_id
priority
title
description
status
due_at
```

---

# 23. Search

Global search:

```text
tenant
phone
unit
property
invoice number
payment reference
maintenance ticket
```

Shortcut:

```text
Cmd/Ctrl + K
```

---

# 24. Import & Migration

Karena aplikasi sudah existing, migration experience sangat penting.

Import wizard:

```text
Upload
↓
Map Columns
↓
Validate
↓
Preview
↓
Import
↓
Result
```

Support:

- CSV
- XLSX

Import targets:

- Properties
- Units
- Tenants
- Leases
- Opening balances

Setiap import harus mempunyai:

```text
import_id
status
row_count
success_count
error_count
error_file
```

---

# 25. UX Design System

## 25.1 Visual Direction

Gunakan:

- Clean
- Professional
- Operational
- Neutral
- Dense enough untuk business software
- Tidak terasa seperti template AI
- Minimal gradient
- Strong typography hierarchy
- Consistent spacing
- Clear status colors
- Functional iconography

## 25.2 Page Layout

Recommended:

```text
Page title
Subtitle / context
Primary action

Filters / tabs

Main content

Optional side panel / activity
```

## 25.3 Tables

Business software akan banyak menggunakan table.

Must support:

- Search
- Filter
- Sort
- Pagination
- Bulk select
- Bulk actions
- Column visibility
- Export
- Saved filters later

## 25.4 Status Badges

Gunakan consistent semantic status.

Example:

```text
Paid
Overdue
Partial
Draft
Occupied
Vacant
Urgent
Completed
```

---

# 26. Empty States

Jangan hanya menampilkan:

```text
No data
```

Gunakan actionable empty states:

```text
No tenants yet

Import tenants from Excel or add your first tenant.

[Import Excel]
[Add Tenant]
```

---

# 27. Error Handling

Semua destructive / financial action harus jelas.

Contoh:

```text
Cannot delete this lease because it already has issued invoices.
```

Bukan:

```text
Something went wrong.
```

---

# 28. Architecture Recommendation

Untuk existing SaaS:

> Jangan rewrite seluruh project jika tidak diperlukan.

Gunakan **modular monolith** terlebih dahulu.

Suggested modules:

```text
auth
organizations
properties
units
tenants
leases
billing
payments
expenses
maintenance
vendors
communications
automation
reports
analytics
audit
subscriptions
```

---

# 29. Domain Events

Gunakan domain/event system internal.

Examples:

```text
lease.created
lease.activated

invoice.created
invoice.issued
invoice.overdue
invoice.paid

payment.received
payment.allocated

maintenance.created
maintenance.assigned
maintenance.completed

unit.vacated
unit.occupied
```

Events dapat memicu:

- Notification
- Automation
- Audit
- Analytics
- Background jobs

---

# 30. Background Jobs

Gunakan worker/queue untuk:

- Invoice generation
- Reminder
- WhatsApp
- Email
- Report generation
- Payment webhook processing
- Import
- Export
- Analytics aggregation

Jangan menjalankan pekerjaan berat di request lifecycle.

---

# 31. API Design

Gunakan REST, RPC, atau framework-native API sesuai stack existing.

Yang penting:

```text
versioning strategy
consistent errors
authorization
pagination
filtering
idempotency
validation
audit
```

Financial mutations sebaiknya menggunakan idempotency key jika relevan.

---

# 32. Suggested Data Model

Core entities:

```text
organizations
users
organization_users

properties
buildings
floors
unit_types
units

tenants
tenant_documents

leases
lease_charges
deposits

invoices
invoice_lines

payments
payment_allocations
credits
refunds

expenses

vendors
maintenance_requests
work_orders

communications
message_templates

automation_rules
automation_runs

action_items
notifications

documents

audit_logs

subscriptions
```

---

# 33. Existing Application Migration Strategy

Jangan langsung mengganti semua sistem.

Gunakan fase.

## Phase 0 — Audit

Dokumentasikan existing:

```text
pages
routes
API endpoints
database tables
authentication
payment logic
roles
reports
integrations
```

Setiap modul dikategorikan:

```text
KEEP
IMPROVE
REPLACE
REMOVE
```

## Phase 1 — Foundation

Pastikan:

- organization model benar
- RBAC benar
- property/unit model benar
- audit logs tersedia

## Phase 2 — Rental Core

Refactor:

- tenant
- lease
- recurring charges
- invoice

## Phase 3 — Finance

Build/refactor:

- payment
- allocation
- reconciliation
- deposit
- expenses

## Phase 4 — Operations

Build:

- maintenance
- vendors
- action center

## Phase 5 — Automation

Build:

- notifications
- WhatsApp
- automation rules

## Phase 6 — Analytics

Build:

- property performance
- unit performance
- portfolio dashboard

---

# 34. MVP Scope

MVP harus memiliki:

```text
Authentication
Organization

Properties
Units

Tenants
Leases

Recurring invoice
Invoices

Payments
Payment allocation
Manual reconciliation

Expenses

Maintenance

WhatsApp reminders

Dashboard
Reports

Roles
Audit logs

Import
Export
```

---

# 35. Post-MVP

Build setelah core usage tervalidasi:

```text
Payment gateway automation
Tenant portal
Owner portal
Vendor portal
Approval workflows

Advanced automation

Multi-owner accounting

AI portfolio assistant
AI maintenance triage

Benchmarking

Open API
Integrations
```

---

# 36. AI Features

AI tidak boleh menjadi prioritas sebelum core data reliable.

Useful AI:

### Portfolio Insights

```text
Why did revenue decrease this month?
```

### Maintenance Classification

```text
Tenant:
"AC berisik dan tidak dingin"

AI:
Category: AC
Priority: Medium
Likely issue: refrigerant/compressor
```

### Collection Risk

```text
7 tenants likely to pay late
```

### Monthly Summary

Generate portfolio summary.

AI harus:

- explainable
- advisory
- non-destructive by default

AI tidak boleh langsung melakukan refund/payment tanpa explicit approval.

---

# 37. Pricing Architecture

Sistem harus mendukung:

```text
subscription plan
unit limit
user limit
feature flags
usage
trial
billing cycle
```

Suggested plan direction:

```text
Free
Starter
Growth
Business
Pro
Enterprise
```

Jangan hard-code feature access di UI.

Gunakan centralized feature entitlement.

---

# 38. Product Metrics

Track:

```text
active_managed_units
monthly_rent_processed
collection_rate
occupancy_rate
on_time_payment_rate
automated_reconciliation_rate
maintenance_resolution_time

trial_conversion
MRR
ARPU
churn
NRR
```

---

# 39. Activation Event

Activation ideal:

```text
property created
+
units imported
+
tenant & lease created
+
first invoice generated
+
first payment recorded/reconciled
```

---

# 40. Definition of Done

Sebuah feature tidak dianggap selesai hanya karena UI sudah muncul.

Minimum:

```text
UI
API
Validation
Authorization
Database migration
Error states
Loading states
Empty states
Audit if needed
Tests
Responsive state
Documentation
```

Untuk financial feature:

```text
Idempotency
Concurrency consideration
Audit
Reversal flow
Edge cases
```

---

# 41. Coding Quality Rules

Refactor harus:

- kecil dan bertahap
- backward compatible jika memungkinkan
- tidak mencampur unrelated changes
- menggunakan migrations
- memiliki rollback path
- menghindari destructive schema changes langsung
- memiliki tests untuk domain penting

---

# 42. Final Product Standard

Sebelum membangun sebuah feature, tanyakan:

```text
Apakah mengurangi pekerjaan manual?
Apakah meningkatkan collection?
Apakah meningkatkan revenue?
Apakah mengurangi operational risk?
Apakah meningkatkan visibility?
```

Jika tidak memberikan manfaat nyata, jangan menjadi prioritas.

Tujuan akhir:

```text
Property
+
Tenant
+
Money
+
Operations
+
Automation
+
Intelligence
=
Rental Property Operating System
```

---

# 43. Authentication & User Provisioning Architecture

To maintain high data integrity, strict multi-tenancy, and eliminate rogue accounts, Kontrakin enforces a partitioned provisioning model:

### 43.1 Partitioned User Creation Model
```text
OWNER
Public registration (/register)
      ↓
Create account & organization
      ↓
Owner Workspace (/dashboard/owner)

STAFF
Invited by Owner from Organization Team Management
      ↓
Role-scoped permissions
      ↓
Owner Workspace (/dashboard/owner)

TENANT
Created as business record by Owner (Penghuni)
      ↓
Owner sends secure activation link
      ↓
OTP verification via WhatsApp / Email
      ↓
User account linked / provisioned
      ↓
Tenant Portal (/dashboard/tenant)

SUPERADMIN
Internal provisioning / seed only
      ↓
Platform Console (/dashboard/admin)
```

### 43.2 Security Rules:
1. **No Public Tenant Registration:** Public visitors cannot register as tenants or choose roles on signup.
2. **Server-Enforced Role Assignment:** Backend database hooks unconditionally force `role: "owner"` on public registrations.
3. **Deprecated Routes:** Any direct navigation to `/register/tenant` safely renders an informative migration notice directing users to login or request an activation link from their property owner.
4. **Tenant Preservation:** Existing active tenant accounts and credentials remain fully functional through the role-neutral `/login` gateway.

