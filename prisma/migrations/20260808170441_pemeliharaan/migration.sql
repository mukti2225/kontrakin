-- CreateEnum
CREATE TYPE "TipeProperti" AS ENUM ('Kost', 'Kontrakan', 'Ruko', 'Apartemen');

-- CreateEnum
CREATE TYPE "StatusPemeliharaan" AS ENUM ('menunggu', 'diproses', 'selesai');

-- CreateEnum
CREATE TYPE "Prioritas" AS ENUM ('rendah', 'sedang', 'tinggi');

-- DropIndex
DROP INDEX "Kamar_nomor_key";

-- AlterTable
ALTER TABLE "Kamar" ADD COLUMN     "propertiId" TEXT;

-- CreateTable
CREATE TABLE "properti" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" "TipeProperti" NOT NULL,
    "alamat" TEXT NOT NULL,
    "foto" TEXT,
    "lokasiMaps" TEXT,
    "fasilitas" TEXT,
    "deskripsi" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemeliharaan" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "status" "StatusPemeliharaan" NOT NULL DEFAULT 'menunggu',
    "prioritas" "Prioritas" NOT NULL DEFAULT 'sedang',
    "kategori" TEXT NOT NULL,
    "foto" TEXT,
    "penghuniId" TEXT NOT NULL,
    "kamarId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pemeliharaan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Kamar_propertiId_idx" ON "Kamar"("propertiId");

-- AddForeignKey
ALTER TABLE "Kamar" ADD CONSTRAINT "Kamar_propertiId_fkey" FOREIGN KEY ("propertiId") REFERENCES "properti"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properti" ADD CONSTRAINT "properti_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeliharaan" ADD CONSTRAINT "pemeliharaan_kamarId_fkey" FOREIGN KEY ("kamarId") REFERENCES "Kamar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeliharaan" ADD CONSTRAINT "pemeliharaan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeliharaan" ADD CONSTRAINT "pemeliharaan_penghuniId_fkey" FOREIGN KEY ("penghuniId") REFERENCES "penghuni"("id") ON DELETE CASCADE ON UPDATE CASCADE;
