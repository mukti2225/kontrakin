-- CreateEnum
CREATE TYPE "StatusKamar" AS ENUM ('kosong', 'terisi', 'maintenance');

-- CreateEnum
CREATE TYPE "TipeKamar" AS ENUM ('Standard', 'Deluxe', 'VIP');

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "emailVerified" SET DEFAULT false,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Kamar" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "lantai" INTEGER NOT NULL,
    "tipe" "TipeKamar" NOT NULL,
    "hargaBulanan" INTEGER NOT NULL,
    "status" "StatusKamar" NOT NULL DEFAULT 'kosong',
    "penghuni" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kamar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kamar_nomor_key" ON "Kamar"("nomor");
