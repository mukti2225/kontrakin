# Rental Property Operating System — UI/UX Roadmap

> Document: `docs/ui-ux-roadmap.md`  
> Purpose: Roadmap eksekusi peningkatan UI/UX untuk menjadikan aplikasi sebagai Rental Property Operating System yang profesional, operasional, konsisten, dan siap dijual.  
> Source of Truth: `design.md`, `project-structure.md`, `AGENTS.md`  
> Status: In Progress

---

# 1. Prinsip Utama Desain

1. **Brand Identity** — Hijau/teal sebagai aksen utama, neutral surface untuk mayoritas UI.
2. **Operational Clarity** — UI membantu user mengambil tindakan, bukan hanya melihat data.
3. **Human-Designed SaaS** — Hindari generic AI-template styling, excessive gradient, glowing cards, decorative blobs, excessive glassmorphism.
4. **Information Hierarchy** — Informasi bisnis kritis lebih menonjol daripada dekorasi.
5. **Role-Aware Experience** — Superadmin = SaaS control center; Owner/Staff = rental operations workspace; Tenant = self-service portal.
6. **Responsive Strategy** — Owner/Superadmin desktop-first, Tenant mobile-first.
7. **Actionability** — Alert, KPI, row, dan status penting punya jalur tindakan jelas.
8. **Consistency** — Button, status, filter, table, form, modal, drawer, typography, spacing, feedback mengikuti sistem yang sama.

---

# 2. Target UX Architecture

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

---

# 3. Roadmap Eksekusi

## Batch 0 — UI/UX Audit & Baseline

- [ ] Audit seluruh halaman aktif.
- [ ] Audit sidebar, header, page layout, table, card, form, modal, drawer, tabs, badge, toast, loading, error, empty state.
- [ ] Audit responsive behavior.
- [ ] Audit accessibility dasar.
- [ ] Audit duplicate components.
- [ ] Audit inconsistent spacing/colors/radius.
- [ ] Buat screenshot baseline untuk screen penting.
- [ ] Buat severity classification: Critical / High / Medium / Low.

Output: `docs/ui-ux-audit.md`

---

## Batch 1 — Core Shell, Brand & Workspace Header

- [x] Brand consistency pada sidebar.
- [x] Unified dashboard top bar.
- [x] Staff workspace access.
- [ ] Standardisasi layout width dan page padding.
- [ ] Standardisasi page title + subtitle + primary action.
- [ ] Standardisasi breadcrumb.
- [ ] Organization switcher jika multi-organization didukung.
- [ ] Sidebar active state konsisten.
- [ ] Collapsed sidebar tetap usable.
- [ ] Mobile sidebar behavior.
- [ ] Notification entry point.
- [ ] Profile/account menu consistency.

---

## Batch 2 — Design System Foundation

- [ ] Finalisasi color tokens.
- [ ] Finalisasi typography scale.
- [ ] Finalisasi spacing scale.
- [ ] Finalisasi border radius.
- [ ] Finalisasi shadow usage.
- [ ] Finalisasi semantic status colors.
- [ ] Standardisasi Button, Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, Badge, Alert, Tooltip, Dialog, Drawer, Dropdown, Tabs, Toast, Skeleton, Pagination.
- [ ] Hapus duplicate visual components yang tidak perlu.
- [ ] Pastikan design tokens digunakan konsisten.

---

## Batch 3 — Owner Dashboard / Operations Command Center

- [x] Action Center hierarchy.
- [x] Standardized badging.
- [x] Cleaner card styling.
- [x] Perbaiki KPI hierarchy: Occupancy, Expected Rent, Collected, Outstanding, Vacant Units, Open Maintenance.
- [x] KPI dapat diklik untuk drill-down.
- [x] Comparison vs previous period bila data tersedia (pertumbuhan sewa terkumpul vs bulan lalu).
- [x] Filtered deep-link dari Action Center (kamar kosong, kontrak expiring, penagihan overdue, pemeliharaan aktif).
- [x] Collection summary.
- [x] Property performance summary (Multi-Property Matrix portofolio).
- [x] Recent operational activity (Unified multi-domain activity stream: transaksi kas, sewa baru, & perbaikan).
- [x] Pastikan dashboard tidak menjadi chart gallery.
- [x] Zero-data state.
- [x] Mobile/tablet behavior.

---

## Batch 4 — Global Search & Quick Actions

- [x] Global search untuk Property, Unit, Tenant, Lease, Invoice, Payment, Maintenance.
- [x] Shortcut `Ctrl/Cmd + K`.
- [x] Search result grouping.
- [x] Keyboard navigation.
- [ ] Quick Add berdasarkan permission: Property, Unit, Tenant, Lease, Invoice, Payment, Expense, Maintenance.

---

## Batch 5 — Property & Unit UX

### Property List
- [ ] Search.
- [ ] Filter status/type.
- [ ] Occupancy summary.
- [ ] Revenue/outstanding summary bila relevan.
- [ ] Clear primary CTA.

### Property Detail
- [x] Overview.
- [x] Units.
- [x] Tenants.
- [x] Finance.
- [x] Maintenance.
- [ ] Documents.
- [ ] Activity.

### Unit List
- [x] Visual status yang jelas.
- [x] Filter Vacant / Occupied / Reserved / Maintenance / Notice (Semua / Terisi / Kosong / Tunggakan).
- [x] Quick access ke tenant/lease.

### Unit Detail
- [ ] Current tenant.
- [ ] Current lease.
- [ ] Current balance.
- [ ] Revenue.
- [ ] Maintenance cost.
- [ ] Documents.
- [ ] Activity timeline.

---

## Batch 6 — Tenant Management UX

- [x] Tenant list hierarchy.
- [x] Search nama/phone/unit.
- [x] Status filter.
- [x] Tenant profile header.
- [x] Current Unit, Lease, Current Balance, Payment History, Maintenance, Documents, Communication.
- [x] Quick actions: Send Message, Create Invoice, Record Payment, Create Maintenance.
- [x] Move tenant flow.
- [x] Tenant history.
- [x] Empty/error state.

---

## Batch 7 — Lease UX

- [x] Status filters.
- [x] Expiring soon visibility.
- [x] Property/unit filters.
- [x] Clear date presentation.
- [x] Create/Edit Lease dibagi: Tenant & Unit, Lease Period, Billing, Deposit & Fees, Documents.
- [x] Inline validation.
- [x] Prevent conflicting active lease.
- [x] Clear summary before activation.
- [x] Destructive confirmation untuk terminate.
- [x] Renewal flow.
- [x] Lease timeline.

---

## Batch 8 — Financial UX: Invoice

- [x] Search invoice/tenant/unit.
- [x] Filter Draft / Issued / Partial / Paid / Overdue / Cancelled.
- [x] Date range.
- [x] Property filter.
- [x] Outstanding summary.
- [x] Bulk reminder action jika didukung.
- [x] Invoice detail: Tenant, Unit, Lease, Invoice Items, Total, Paid, Balance Due, Due Date, Payment History, Communication History, Activity Timeline.
- [x] Overdue jelas.
- [x] Partial payment jelas.
- [x] Cancel invoice confirmation.

---

## Batch 9 — Financial UX: Payment & Reconciliation

- [x] Payment list/detail.
- [x] Payment Amount / Allocated Amount / Unallocated Amount.
- [x] Reconciliation flow.
- [x] Partial allocation UX.
- [x] One payment to multiple invoices.
- [x] Manual payment form.
- [x] Refund confirmation.
- [x] Reversal state.
- [x] Credit/overpayment presentation.
- [x] Financial audit trail visibility.
- [x] Prevent duplicate submit.
- [x] Clear success feedback.

---

## Batch 10 — Expense UX

- [x] Expense list.
- [x] Category/property/unit/vendor filter.
- [x] Receipt preview.
- [x] Expense detail.
- [x] Link expense to maintenance.
- [x] Monthly expense summary.
- [x] Export UX.


---

## Batch 11 — Maintenance Operations UX

- [x] Filter priority/status/property/unit/assigned user/vendor.
- [x] SLA indication.
- [x] Maintenance detail: Problem, Tenant, Unit, Priority, Status, Assigned User, Vendor, Photos, SLA, Estimated Cost, Actual Cost, Timeline.
- [x] Status actions: Reported→Review, Reviewed→Assign, Assigned→Start, In Progress→Complete, Completed→Close.


---

## Batch 12 — Vendor UX

- [x] Vendor list/category/contact/status.
- [x] Work history.
- [x] Maintenance relationship.
- [x] Expense history.
- [x] Responsive contact actions.


---

## Batch 13 — Communication UX

- [x] Message history.
- [x] WhatsApp/email delivery status.
- [x] Template selection.
- [x] Send message flow.
- [x] Failed delivery state + retry.
- [x] Tenant communication timeline.
- [x] Jangan membuat complex chat UI jika belum diperlukan.


---

## Batch 14 — Tenant Portal Mobile-First

- [x] Touch target & spacing.
- [x] Quick mobile navigation.
- [x] WhatsApp manager access.
- [x] Maintenance tracking.
- [x] Receipt history.
- [x] Home hierarchy.
- [x] Current unit card.
- [x] Current outstanding invoice.
- [x] Pay Now CTA.
- [x] Payment success page.
- [x] Payment history.
- [x] Receipt detail/download.
- [x] Lease summary/document.
- [x] Maintenance creation flow.
- [x] Maintenance status timeline.
- [x] Documents page.
- [x] Profile page.
- [x] Mobile bottom navigation review.
- [x] Tablet behavior.
- [x] No-outstanding-payment state.

---

## Batch 15 — Superadmin Platform Console

- [x] Platform Dashboard: Active Organizations, Active Subscriptions, Trials, MRR, Managed Units, Active Users, Failed Payments, Platform Issues.
- [x] Organization list/search/filter/detail.
- [x] Organization detail: Plan, Usage, Users, Activity, Subscription.
- [x] Subscription states: Active, Trial, Past Due, Cancelled.
- [x] Plan detail + feature limits.
- [x] Audit logs.
- [x] System health.
- [x] Failed jobs.
- [x] Support access state.
- [x] Safe impersonation/support mode UX jika ada.

---

## Batch 16 — Team & Permission UX

- [x] Team member list.
- [x] Owner vs Staff clarity.
- [x] Invite Staff.
- [x] Staff status.
- [x] Permission editor/grouping.
- [x] Remove member confirmation.
- [x] Prevent Owner accidental lockout.
- [x] Restricted features jelas.
- [x] Jangan mengandalkan UI hiding untuk security.

---

## Batch 17 — Onboarding & First-Run Experience

- [x] Welcome flow.
- [x] Create Organization.
- [x] Create first Property.
- [x] Add/import Units.
- [x] Add/import Tenants.
- [x] Add Lease.
- [x] Create first invoice.
- [x] Checklist onboarding.
- [x] Progress indication.
- [x] Contextual help.
- [x] Empty states terhubung ke onboarding.

Target:

```text
Signup → Organization → Property → Units → Tenant → Lease → First Invoice
```

---

## Batch 18 — Import / Migration UX

- [x] Upload CSV/XLSX.
- [x] Column mapping.
- [x] Validation.
- [x] Preview.
- [x] Import.
- [x] Import result.
- [x] Row-level errors.
- [x] Download failed rows.
- [x] Prevent duplicate accidental import.
- [x] Import history.

---

## Batch 19 — Table Usability & Responsive Data Views

- [x] Tabular figures.
- [x] Currency alignment.
- [x] Stable filter/search layout.
- [x] Column visibility.
- [x] Bulk selection/actions.
- [x] Sticky header bila relevan.
- [x] Responsive overflow.
- [x] Mobile alternative untuk data kritis.
- [x] Empty filtered state.
- [x] Pagination consistency.
- [x] Row click vs action menu consistency.

---

## Batch 20 — Form UX Standardization

- [x] Standard required indicator/helper text/field error.
- [x] Dirty form warning.
- [x] Save/discard behavior.
- [x] Prevent duplicate submit.
- [x] Smart defaults.
- [x] Consistent date picker, currency input, phone input, file upload.
- [x] Form section hierarchy.

---

## Batch 21 — Modal, Drawer & Detail Interaction Rules

- [x] Define penggunaan modal/drawer/full page.
- [x] Standard modal footer.
- [x] Standard destructive confirmation.
- [x] Drawer close behavior.
- [x] Unsaved change handling.
- [x] Mobile behavior.

Rule:

```text
Modal = confirmation / small action
Drawer = quick contextual view/edit
Page = complex flow
```

---

## Batch 22 — Empty, Loading, Error & Success States

- [x] Actionable empty states.
- [x] Focus rings.
- [x] Skeleton standard.
- [x] Button loading state.
- [x] Retry state.
- [x] Network error state.
- [x] Permission denied state.
- [x] 404 state.
- [x] Success toast consistency.
- [x] Hindari generic "Something went wrong".

---

## Batch 23 — Notifications & Activity UX

- [ ] Notification center.
- [ ] Read/unread state.
- [ ] Group notifications.
- [ ] Deep link to entity.
- [ ] Activity timeline component.
- [ ] Implement activity timeline pada Tenant, Lease, Invoice, Payment, Maintenance, Property.

---

## Batch 24 — Reports UX

- [ ] Report index/categories.
- [ ] Date/property filter.
- [ ] Export.
- [ ] Empty/loading state.
- [ ] Report description.
- [ ] Financial totals hierarchy.
- [ ] Printable/PDF-friendly view bila relevan.

---

## Batch 25 — Analytics UX

Setelah data operasional stabil:

- [ ] Occupancy.
- [ ] Collection rate.
- [ ] Revenue trend.
- [ ] Expense trend.
- [ ] Unit profitability.
- [ ] Property profitability.
- [ ] Vacancy trend.
- [ ] Maintenance SLA.
- [ ] Hindari chart overload.
- [ ] Setiap chart harus menjawab business question.

---

## Batch 26 — Responsive & Cross-Device QA

- [ ] 1440px desktop.
- [ ] Laptop.
- [ ] Tablet landscape/portrait.
- [ ] Mobile common widths.
- [ ] Sidebar/table/drawer/modal/form behavior.
- [ ] Tenant bottom navigation.
- [ ] Touch target audit.

---

## Batch 27 — Accessibility Pass

- [ ] WCAG AA contrast.
- [ ] Keyboard navigation.
- [ ] Focus order/visible.
- [ ] Semantic labels.
- [ ] Form associations.
- [ ] Dialog/tooltip accessibility.
- [ ] Screen reader labels.
- [ ] Status tidak bergantung pada warna saja.

---

## Batch 28 — Performance & Perceived Speed

- [ ] Audit re-render besar.
- [ ] Audit large tables.
- [ ] Pagination/server filtering bila perlu.
- [ ] Lazy load heavy views.
- [ ] Skeleton untuk perceived speed.
- [ ] Optimize images.
- [ ] Hindari layout shift.
- [ ] Debounce search yang tepat.
- [ ] Hindari blocking UI untuk background work non-kritis.

---

## Batch 29 — UX Analytics & Product Instrumentation

- [ ] Track onboarding completion.
- [ ] Track first property/tenant/lease/invoice/payment.
- [ ] Track maintenance submission.
- [ ] Track failed workflows.
- [ ] Track high-abandonment forms.

Gunakan data untuk menemukan UX problem nyata.

---

## Batch 30 — Final Consistency & Production Polish

- [ ] Audit icons.
- [ ] Audit terminology.
- [ ] Audit capitalization.
- [ ] Audit date format.
- [ ] Audit IDR format.
- [ ] Audit status language.
- [ ] Audit page titles.
- [ ] Audit CTA wording.
- [ ] Audit breadcrumbs.
- [ ] Audit visual density.
- [ ] Audit duplicate components.
- [ ] Audit mobile regression.
- [ ] Audit browser behavior.
- [ ] Final build/test/lint/typecheck.

---

# 4. Priority Tiers

## P0 — Must Complete Before Commercial Release

```text
Core Shell
Design System Foundation
Owner Dashboard
Property
Unit
Tenant
Lease
Invoice
Payment
Maintenance
Tenant Portal
Empty/Error/Loading
Responsive Critical Flows
Onboarding
Import
Accessibility Basic
```

## P1 — Strong Product Quality

```text
Global Search
Quick Add
Expense
Vendor
Communication
Team Permission UX
Superadmin
Reports
Notifications
Activity Timeline
```

## P2 — Advanced

```text
Analytics
Saved Filters
Advanced Superadmin
Advanced UX Analytics
Feature-specific optimization
```

---

# 5. Primary UX Flows to Validate

## Owner — New Rental

```text
Create Property → Add Unit → Add Tenant → Create Lease → Generate Invoice
```

## Owner — Collection

```text
Invoice → Reminder → Payment → Reconciliation → Receipt
```

## Owner — Maintenance

```text
Maintenance Report → Review → Assign → Work → Expense → Complete
```

## Tenant — Pay Rent

```text
Open Dashboard → View Bill → Pay → Confirmation → Receipt
```

## Tenant — Report Issue

```text
Open Maintenance → Report → Upload Photo → Submit → Track Status
```

## Superadmin — Customer Management

```text
Organization List → Organization Detail → Subscription → Usage → Support/Audit
```

---

# 6. Definition of Done — UI/UX

Sebuah batch tidak selesai hanya karena tampilannya lebih bagus.

Harus divalidasi terhadap:

```text
Clarity
Consistency
Task Completion
Responsive Behavior
Permission Behavior
Loading
Empty
Error
Success Feedback
Accessibility
No Regression
```

Untuk financial flow:

```text
Amount clarity
Status clarity
Confirmation
Audit visibility
No duplicate action
```

---

# 7. Final Experience Target

Superadmin:
> Saya dapat memahami dan mengontrol bisnis SaaS saya.

Owner:
> Saya langsung tahu kondisi bisnis property saya dan apa yang perlu saya lakukan.

Staff:
> Saya tahu pekerjaan yang perlu saya kerjakan tanpa melihat data yang tidak relevan.

Tenant:
> Saya dapat membayar, melihat kontrak, dan melaporkan masalah dengan cepat.

---

# 8. Final Rule

Do not optimize for decoration.

Optimize for:

```text
Clarity
Speed
Trust
Consistency
Actionability
Financial Accuracy
Operational Efficiency
```

Aplikasi dianggap berhasil secara UX jika user dapat menyelesaikan pekerjaan utama dengan lebih sedikit langkah, lebih sedikit kebingungan, dan lebih sedikit kesalahan.
