-- AlterTable penghuni
ALTER TABLE "penghuni" ADD COLUMN IF NOT EXISTS "portalAccessStatus" TEXT NOT NULL DEFAULT 'NOT_SENT';
ALTER TABLE "penghuni" ADD COLUMN IF NOT EXISTS "portalActivatedAt" TIMESTAMP(3);
ALTER TABLE "penghuni" ADD COLUMN IF NOT EXISTS "lastPortalAccessAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "penghuni_portalAccessStatus_idx" ON "penghuni"("portalAccessStatus");

-- CreateTable tenant_user
CREATE TABLE IF NOT EXISTS "tenant_user" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_user_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_user_tenant_id_user_id_key" ON "tenant_user"("tenant_id", "user_id");
CREATE INDEX IF NOT EXISTS "tenant_user_user_id_idx" ON "tenant_user"("user_id");
CREATE INDEX IF NOT EXISTS "tenant_user_tenant_id_idx" ON "tenant_user"("tenant_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenant_user_tenant_id_fkey'
    ) THEN
        ALTER TABLE "tenant_user" ADD CONSTRAINT "tenant_user_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "penghuni"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenant_user_user_id_fkey'
    ) THEN
        ALTER TABLE "tenant_user" ADD CONSTRAINT "tenant_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable tenant_activation_token
CREATE TABLE IF NOT EXISTS "tenant_activation_token" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_activation_token_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_activation_token_token_hash_key" ON "tenant_activation_token"("token_hash");
CREATE INDEX IF NOT EXISTS "tenant_activation_token_tenant_id_idx" ON "tenant_activation_token"("tenant_id");
CREATE INDEX IF NOT EXISTS "tenant_activation_token_organization_id_idx" ON "tenant_activation_token"("organization_id");
CREATE INDEX IF NOT EXISTS "tenant_activation_token_token_hash_idx" ON "tenant_activation_token"("token_hash");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenant_activation_token_tenant_id_fkey'
    ) THEN
        ALTER TABLE "tenant_activation_token" ADD CONSTRAINT "tenant_activation_token_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "penghuni"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenant_activation_token_organization_id_fkey'
    ) THEN
        ALTER TABLE "tenant_activation_token" ADD CONSTRAINT "tenant_activation_token_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable tenant_otp
CREATE TABLE IF NOT EXISTS "tenant_otp" (
    "id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_otp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tenant_otp_token_id_idx" ON "tenant_otp"("token_id");
CREATE INDEX IF NOT EXISTS "tenant_otp_identifier_idx" ON "tenant_otp"("identifier");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenant_otp_token_id_fkey'
    ) THEN
        ALTER TABLE "tenant_otp" ADD CONSTRAINT "tenant_otp_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "tenant_activation_token"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Backfill existing active tenant-user connections
INSERT INTO "tenant_user" ("id", "tenant_id", "user_id", "status", "linked_at", "createdAt", "updatedAt")
SELECT 
    'tu_' || substr(md5(random()::text), 1, 16),
    p.id,
    p."userId",
    'active',
    p."createdAt",
    p."createdAt",
    NOW()
FROM "penghuni" p
WHERE p."userId" IS NOT NULL
ON CONFLICT ("tenant_id", "user_id") DO NOTHING;

-- Update portalAccessStatus for previously linked tenants
UPDATE "penghuni"
SET "portalAccessStatus" = 'ACTIVE', "portalActivatedAt" = "createdAt"
WHERE "userId" IS NOT NULL AND "portalAccessStatus" = 'NOT_SENT';
