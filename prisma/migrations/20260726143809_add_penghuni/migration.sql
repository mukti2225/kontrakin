-- CreateEnum
CREATE TYPE "StatusPenghuni" AS ENUM ('aktif', 'nonaktif');

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
    "kamarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penghuni_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "penghuni_noKtp_key" ON "penghuni"("noKtp");

-- AddForeignKey
ALTER TABLE "penghuni" ADD CONSTRAINT "penghuni_kamarId_fkey" FOREIGN KEY ("kamarId") REFERENCES "Kamar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
