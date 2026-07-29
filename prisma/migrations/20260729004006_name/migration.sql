-- CreateEnum
CREATE TYPE "StatusKamar" AS ENUM ('kosong', 'terisi', 'maintenance');

-- CreateEnum
CREATE TYPE "TipeKamar" AS ENUM ('Standard', 'Deluxe', 'VIP');

-- CreateEnum
CREATE TYPE "StatusPenghuni" AS ENUM ('aktif', 'nonaktif');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'tenant',
    "registrationRole" TEXT NOT NULL DEFAULT 'tenant',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "kodeUndangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "impersonatedBy" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kamar" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "lantai" INTEGER NOT NULL,
    "tipe" "TipeKamar" NOT NULL,
    "hargaBulanan" INTEGER NOT NULL,
    "status" "StatusKamar" NOT NULL DEFAULT 'kosong',
    "catatan" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kamar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penghuni" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noHp" TEXT NOT NULL,
    "email" TEXT,
    "noKtp" TEXT,
    "tanggalMasuk" TIMESTAMP(3) NOT NULL,
    "tanggalKeluar" TIMESTAMP(3),
    "status" "StatusPenghuni" NOT NULL DEFAULT 'aktif',
    "catatan" TEXT,
    "ownerId" TEXT NOT NULL,
    "userId" TEXT,
    "kamarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penghuni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaksi" (
    "id" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,
    "kamarId" TEXT,
    "penghuniId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_kodeUndangan_key" ON "user"("kodeUndangan");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "user_banned_idx" ON "user"("banned");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Kamar_nomor_key" ON "Kamar"("nomor");

-- CreateIndex
CREATE UNIQUE INDEX "Kamar_ownerId_nomor_key" ON "Kamar"("ownerId", "nomor");

-- CreateIndex
CREATE UNIQUE INDEX "penghuni_noKtp_key" ON "penghuni"("noKtp");

-- CreateIndex
CREATE UNIQUE INDEX "penghuni_userId_key" ON "penghuni"("userId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kamar" ADD CONSTRAINT "Kamar_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penghuni" ADD CONSTRAINT "penghuni_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penghuni" ADD CONSTRAINT "penghuni_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penghuni" ADD CONSTRAINT "penghuni_kamarId_fkey" FOREIGN KEY ("kamarId") REFERENCES "Kamar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaksi" ADD CONSTRAINT "Transaksi_kamarId_fkey" FOREIGN KEY ("kamarId") REFERENCES "Kamar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaksi" ADD CONSTRAINT "Transaksi_penghuniId_fkey" FOREIGN KEY ("penghuniId") REFERENCES "penghuni"("id") ON DELETE SET NULL ON UPDATE CASCADE;
