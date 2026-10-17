-- CreateTable Organization
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable OrganizationUser
CREATE TABLE "organization_user" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditLog
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable Lease
CREATE TABLE "lease" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "penghuniId" TEXT NOT NULL,
    "kamarId" TEXT NOT NULL,
    "nomorKontrak" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "billingFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "rentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "depositAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "billingDay" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable LeaseCharge
CREATE TABLE "lease_charge" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lease_charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable Invoice
CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "penghuniId" TEXT NOT NULL,
    "leaseId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "penaltyTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable InvoiceLine
CREATE TABLE "invoice_line" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'rent',
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable Payment
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "penghuniId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'transfer',
    "paymentReference" TEXT,
    "provider" TEXT,
    "providerTransactionId" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable PaymentAllocation
CREATE TABLE "payment_allocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable Vendor
CREATE TABLE "vendor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "rating" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- AlterTable Properti
ALTER TABLE "properti" ADD COLUMN "organizationId" TEXT;

-- AlterTable Kamar
ALTER TABLE "Kamar" ADD COLUMN "organizationId" TEXT;

-- AlterTable Penghuni
ALTER TABLE "penghuni" ADD COLUMN "organizationId" TEXT;

-- AlterTable Transaksi
ALTER TABLE "Transaksi" ADD COLUMN "organizationId" TEXT;

-- AlterTable Pemeliharaan
ALTER TABLE "pemeliharaan" ADD COLUMN "organizationId" TEXT, ADD COLUMN "vendorId" TEXT;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");
CREATE UNIQUE INDEX "organization_user_organizationId_userId_key" ON "organization_user"("organizationId", "userId");
CREATE UNIQUE INDEX "invoice_invoiceNumber_key" ON "invoice"("invoiceNumber");

-- CreateIndexes
CREATE INDEX "organization_user_userId_idx" ON "organization_user"("userId");
CREATE INDEX "audit_log_organizationId_idx" ON "audit_log"("organizationId");
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

CREATE INDEX "properti_organizationId_idx" ON "properti"("organizationId");
CREATE INDEX "Kamar_organizationId_idx" ON "Kamar"("organizationId");
CREATE INDEX "penghuni_organizationId_idx" ON "penghuni"("organizationId");
CREATE INDEX "Transaksi_organizationId_idx" ON "Transaksi"("organizationId");
CREATE INDEX "pemeliharaan_organizationId_idx" ON "pemeliharaan"("organizationId");

CREATE INDEX "lease_organizationId_idx" ON "lease"("organizationId");
CREATE INDEX "lease_penghuniId_idx" ON "lease"("penghuniId");
CREATE INDEX "lease_kamarId_idx" ON "lease"("kamarId");
CREATE INDEX "lease_charge_leaseId_idx" ON "lease_charge"("leaseId");

CREATE INDEX "invoice_organizationId_idx" ON "invoice"("organizationId");
CREATE INDEX "invoice_penghuniId_idx" ON "invoice"("penghuniId");
CREATE INDEX "invoice_status_idx" ON "invoice"("status");
CREATE INDEX "invoice_line_invoiceId_idx" ON "invoice_line"("invoiceId");

CREATE INDEX "payment_organizationId_idx" ON "payment"("organizationId");
CREATE INDEX "payment_penghuniId_idx" ON "payment"("penghuniId");
CREATE INDEX "payment_allocation_paymentId_idx" ON "payment_allocation"("paymentId");
CREATE INDEX "payment_allocation_invoiceId_idx" ON "payment_allocation"("invoiceId");
CREATE INDEX "vendor_organizationId_idx" ON "vendor"("organizationId");

-- AddForeignKeys
ALTER TABLE "organization_user" ADD CONSTRAINT "organization_user_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_user" ADD CONSTRAINT "organization_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "properti" ADD CONSTRAINT "properti_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Kamar" ADD CONSTRAINT "Kamar_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "penghuni" ADD CONSTRAINT "penghuni_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaksi" ADD CONSTRAINT "Transaksi_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pemeliharaan" ADD CONSTRAINT "pemeliharaan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pemeliharaan" ADD CONSTRAINT "pemeliharaan_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lease" ADD CONSTRAINT "lease_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lease" ADD CONSTRAINT "lease_penghuniId_fkey" FOREIGN KEY ("penghuniId") REFERENCES "penghuni"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lease" ADD CONSTRAINT "lease_kamarId_fkey" FOREIGN KEY ("kamarId") REFERENCES "Kamar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lease_charge" ADD CONSTRAINT "lease_charge_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_penghuniId_fkey" FOREIGN KEY ("penghuniId") REFERENCES "penghuni"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment" ADD CONSTRAINT "payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment" ADD CONSTRAINT "payment_penghuniId_fkey" FOREIGN KEY ("penghuniId") REFERENCES "penghuni"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vendor" ADD CONSTRAINT "vendor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
