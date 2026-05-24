/*
  Warnings:

  - You are about to drop the `AnggotaKelompok` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KelompokTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KelompokTemplateAnggota` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AnggotaKelompok" DROP CONSTRAINT "AnggotaKelompok_kelompokId_fkey";

-- DropForeignKey
ALTER TABLE "AnggotaKelompok" DROP CONSTRAINT "AnggotaKelompok_siswaId_fkey";

-- DropForeignKey
ALTER TABLE "KelompokTemplate" DROP CONSTRAINT "KelompokTemplate_courseId_fkey";

-- DropForeignKey
ALTER TABLE "KelompokTemplateAnggota" DROP CONSTRAINT "KelompokTemplateAnggota_siswaId_fkey";

-- DropForeignKey
ALTER TABLE "KelompokTemplateAnggota" DROP CONSTRAINT "KelompokTemplateAnggota_templateId_fkey";

-- DropTable
DROP TABLE "AnggotaKelompok";

-- DropTable
DROP TABLE "KelompokTemplate";

-- DropTable
DROP TABLE "KelompokTemplateAnggota";

-- CreateTable
CREATE TABLE "_KelompokAnggota" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_KelompokAnggota_AB_unique" ON "_KelompokAnggota"("A", "B");

-- CreateIndex
CREATE INDEX "_KelompokAnggota_B_index" ON "_KelompokAnggota"("B");

-- AddForeignKey
ALTER TABLE "_KelompokAnggota" ADD CONSTRAINT "_KelompokAnggota_A_fkey" FOREIGN KEY ("A") REFERENCES "Kelompok"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KelompokAnggota" ADD CONSTRAINT "_KelompokAnggota_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
