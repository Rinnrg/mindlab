-- CreateEnum
CREATE TYPE "ItemOrigin" AS ENUM ('COURSE', 'PBL');

-- CreateEnum
CREATE TYPE "SubmissionComponent" AS ENUM ('UPLOAD_FILE', 'COMPILER', 'TEXT');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GURU', 'SISWA');

-- CreateEnum
CREATE TYPE "TipeAsesmen" AS ENUM ('KUIS', 'TUGAS');

-- CreateEnum
CREATE TYPE "TipePengerjaan" AS ENUM ('INDIVIDU', 'KELOMPOK');

-- CreateEnum
CREATE TYPE "TipeJawaban" AS ENUM ('PILIHAN_GANDA', 'ISIAN');

-- CreateEnum
CREATE TYPE "StatusPengumpulan" AS ENUM ('PENDING', 'DINILAI', 'REVISI', 'VALIDATED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255),
    "role" "Role" NOT NULL DEFAULT 'SISWA',
    "foto" VARCHAR(255),
    "kelas" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "deskripsi" VARCHAR(1000),
    "gambar" TEXT NOT NULL,
    "kategori" VARCHAR(255) NOT NULL,
    "guruId" UUID NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KelompokTemplate" (
    "id" UUID NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "courseId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KelompokTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KelompokTemplateAnggota" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "siswaId" UUID NOT NULL,

    CONSTRAINT "KelompokTemplateAnggota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materi" (
    "id" UUID NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "deskripsi" VARCHAR(1000),
    "kelasTarget" VARCHAR(255)[],
    "tgl_unggah" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lampiran" VARCHAR(255),
    "fileData" BYTEA,
    "fileName" VARCHAR(255),
    "fileType" VARCHAR(255),
    "fileSize" INTEGER,
    "courseId" UUID NOT NULL,
    "sintak" VARCHAR(50),
    "origin" "ItemOrigin" NOT NULL DEFAULT 'COURSE',

    CONSTRAINT "Materi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asesmen" (
    "id" UUID NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "deskripsi" VARCHAR(1000),
    "kelasTarget" VARCHAR(255)[],
    "tipe" "TipeAsesmen" NOT NULL DEFAULT 'KUIS',
    "tipePengerjaan" "TipePengerjaan",
    "submissionComponents" "SubmissionComponent"[] DEFAULT ARRAY['UPLOAD_FILE']::"SubmissionComponent"[],
    "jml_soal" INTEGER,
    "durasi" INTEGER,
    "tgl_mulai" TIMESTAMP(3),
    "tgl_selesai" TIMESTAMP(3),
    "lampiran" VARCHAR(255),
    "antiCurang" BOOLEAN NOT NULL DEFAULT false,
    "fileData" BYTEA,
    "fileName" VARCHAR(255),
    "fileType" VARCHAR(255),
    "fileSize" INTEGER,
    "guruId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "sintak" VARCHAR(50),
    "origin" "ItemOrigin" NOT NULL DEFAULT 'COURSE',
    "acakJawaban" BOOLEAN NOT NULL DEFAULT false,
    "acakSoal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Asesmen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Soal" (
    "id" UUID NOT NULL,
    "pertanyaan" VARCHAR(1000) NOT NULL,
    "gambar" TEXT,
    "bobot" INTEGER NOT NULL DEFAULT 10,
    "tipeJawaban" "TipeJawaban" NOT NULL DEFAULT 'PILIHAN_GANDA',
    "asesmenId" UUID NOT NULL,

    CONSTRAINT "Soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opsi" (
    "id" UUID NOT NULL,
    "teks" TEXT NOT NULL,
    "isBenar" BOOLEAN NOT NULL DEFAULT false,
    "soalId" UUID NOT NULL,

    CONSTRAINT "Opsi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JawabanSiswa" (
    "id" UUID NOT NULL,
    "jawaban" VARCHAR(1000),
    "isBenar" BOOLEAN,
    "skorDidapat" DOUBLE PRECISION,
    "tanggalJawab" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siswaId" UUID NOT NULL,
    "soalId" UUID NOT NULL,
    "nilaiId" UUID,

    CONSTRAINT "JawabanSiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nilai" (
    "id" UUID NOT NULL,
    "skor" DOUBLE PRECISION NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siswaId" UUID NOT NULL,
    "asesmenId" UUID NOT NULL,
    "attemptId" UUID,

    CONSTRAINT "Nilai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KuisAttempt" (
    "id" UUID NOT NULL,
    "attemptNo" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "resetAt" TIMESTAMP(3),
    "siswaId" UUID NOT NULL,
    "asesmenId" UUID NOT NULL,

    CONSTRAINT "KuisAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pbl" (
    "id" UUID NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "deskripsi" VARCHAR(1000) NOT NULL,
    "tgl_mulai" TIMESTAMP(3) NOT NULL,
    "tgl_selesai" TIMESTAMP(3) NOT NULL,
    "lampiran" VARCHAR(255),
    "sintaks" VARCHAR(255)[],
    "fileData" BYTEA,
    "fileName" VARCHAR(255),
    "fileType" VARCHAR(255),
    "fileSize" INTEGER,
    "guruId" UUID NOT NULL,

    CONSTRAINT "pbl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelompok" (
    "id" UUID NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "pblId" UUID,
    "asesmenId" UUID,
    "ketuaId" UUID,

    CONSTRAINT "Kelompok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnggotaKelompok" (
    "id" UUID NOT NULL,
    "kelompokId" UUID NOT NULL,
    "siswaId" UUID NOT NULL,

    CONSTRAINT "AnggotaKelompok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PengumpulanProyek" (
    "id" UUID NOT NULL,
    "catatan" VARCHAR(1000),
    "sourceCode" VARCHAR(5000),
    "textContent" TEXT,
    "output" VARCHAR(5000),
    "tgl_unggah" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nilai" DOUBLE PRECISION,
    "namaKelompok" VARCHAR(255),
    "ketua" VARCHAR(255),
    "anggota" VARCHAR(255)[],
    "fileUrl" VARCHAR(255),
    "fileData" BYTEA,
    "fileName" VARCHAR(255),
    "fileType" VARCHAR(255),
    "fileSize" INTEGER,
    "status" "StatusPengumpulan" NOT NULL DEFAULT 'PENDING',
    "feedback" VARCHAR(1000),
    "validatedAt" TIMESTAMP(3),
    "validatedBy" VARCHAR(255),
    "skorK1" DOUBLE PRECISION,
    "skorK2" DOUBLE PRECISION,
    "skorK3" DOUBLE PRECISION,
    "skorK4" DOUBLE PRECISION,
    "kelompokId" UUID,
    "siswaId" UUID,
    "asesmenId" UUID,

    CONSTRAINT "PengumpulanProyek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileShowcase" (
    "id" UUID NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "deskripsi" VARCHAR(1000),
    "nilai" DOUBLE PRECISION NOT NULL,
    "tanggalDinilai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "siswaId" UUID NOT NULL,
    "pengumpulanProyekId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileShowcase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "courseId" UUID NOT NULL,
    "siswaId" UUID NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumDiskusi" (
    "id" UUID NOT NULL,
    "pesan" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "asesmenId" UUID NOT NULL,

    CONSTRAINT "ForumDiskusi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalasanForum" (
    "id" UUID NOT NULL,
    "pesan" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "forumDiskusiId" UUID NOT NULL,

    CONSTRAINT "BalasanForum_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Course_guruId_idx" ON "Course"("guruId");

-- CreateIndex
CREATE INDEX "Course_kategori_idx" ON "Course"("kategori");

-- CreateIndex
CREATE INDEX "KelompokTemplate_courseId_idx" ON "KelompokTemplate"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "KelompokTemplate_courseId_nama_key" ON "KelompokTemplate"("courseId", "nama");

-- CreateIndex
CREATE INDEX "KelompokTemplateAnggota_templateId_idx" ON "KelompokTemplateAnggota"("templateId");

-- CreateIndex
CREATE INDEX "KelompokTemplateAnggota_siswaId_idx" ON "KelompokTemplateAnggota"("siswaId");

-- CreateIndex
CREATE UNIQUE INDEX "KelompokTemplateAnggota_templateId_siswaId_key" ON "KelompokTemplateAnggota"("templateId", "siswaId");

-- CreateIndex
CREATE INDEX "Materi_courseId_idx" ON "Materi"("courseId");

-- CreateIndex
CREATE INDEX "Materi_tgl_unggah_idx" ON "Materi"("tgl_unggah");

-- CreateIndex
CREATE INDEX "Materi_kelasTarget_idx" ON "Materi"("kelasTarget");

-- CreateIndex
CREATE INDEX "Asesmen_guruId_idx" ON "Asesmen"("guruId");

-- CreateIndex
CREATE INDEX "Asesmen_courseId_idx" ON "Asesmen"("courseId");

-- CreateIndex
CREATE INDEX "Asesmen_tipe_idx" ON "Asesmen"("tipe");

-- CreateIndex
CREATE INDEX "Asesmen_tgl_mulai_idx" ON "Asesmen"("tgl_mulai");

-- CreateIndex
CREATE INDEX "Asesmen_tgl_selesai_idx" ON "Asesmen"("tgl_selesai");

-- CreateIndex
CREATE INDEX "Asesmen_kelasTarget_idx" ON "Asesmen"("kelasTarget");

-- CreateIndex
CREATE INDEX "Soal_asesmenId_idx" ON "Soal"("asesmenId");

-- CreateIndex
CREATE INDEX "Opsi_soalId_idx" ON "Opsi"("soalId");

-- CreateIndex
CREATE INDEX "JawabanSiswa_siswaId_idx" ON "JawabanSiswa"("siswaId");

-- CreateIndex
CREATE INDEX "JawabanSiswa_soalId_idx" ON "JawabanSiswa"("soalId");

-- CreateIndex
CREATE INDEX "JawabanSiswa_nilaiId_idx" ON "JawabanSiswa"("nilaiId");

-- CreateIndex
CREATE UNIQUE INDEX "JawabanSiswa_siswaId_soalId_key" ON "JawabanSiswa"("siswaId", "soalId");

-- CreateIndex
CREATE INDEX "Nilai_siswaId_idx" ON "Nilai"("siswaId");

-- CreateIndex
CREATE INDEX "Nilai_asesmenId_idx" ON "Nilai"("asesmenId");

-- CreateIndex
CREATE INDEX "Nilai_tanggal_idx" ON "Nilai"("tanggal");

-- CreateIndex
CREATE INDEX "Nilai_attemptId_idx" ON "Nilai"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "Nilai_siswaId_asesmenId_key" ON "Nilai"("siswaId", "asesmenId");

-- CreateIndex
CREATE INDEX "KuisAttempt_asesmenId_idx" ON "KuisAttempt"("asesmenId");

-- CreateIndex
CREATE INDEX "KuisAttempt_siswaId_idx" ON "KuisAttempt"("siswaId");

-- CreateIndex
CREATE INDEX "KuisAttempt_startedAt_idx" ON "KuisAttempt"("startedAt");

-- CreateIndex
CREATE INDEX "KuisAttempt_submittedAt_idx" ON "KuisAttempt"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "KuisAttempt_siswaId_asesmenId_key" ON "KuisAttempt"("siswaId", "asesmenId");

-- CreateIndex
CREATE INDEX "pbl_guruId_idx" ON "pbl"("guruId");

-- CreateIndex
CREATE INDEX "pbl_tgl_mulai_idx" ON "pbl"("tgl_mulai");

-- CreateIndex
CREATE INDEX "pbl_tgl_selesai_idx" ON "pbl"("tgl_selesai");

-- CreateIndex
CREATE INDEX "Kelompok_pblId_idx" ON "Kelompok"("pblId");

-- CreateIndex
CREATE INDEX "Kelompok_asesmenId_idx" ON "Kelompok"("asesmenId");

-- CreateIndex
CREATE INDEX "Kelompok_ketuaId_idx" ON "Kelompok"("ketuaId");

-- CreateIndex
CREATE INDEX "AnggotaKelompok_kelompokId_idx" ON "AnggotaKelompok"("kelompokId");

-- CreateIndex
CREATE INDEX "AnggotaKelompok_siswaId_idx" ON "AnggotaKelompok"("siswaId");

-- CreateIndex
CREATE INDEX "PengumpulanProyek_kelompokId_idx" ON "PengumpulanProyek"("kelompokId");

-- CreateIndex
CREATE INDEX "PengumpulanProyek_siswaId_idx" ON "PengumpulanProyek"("siswaId");

-- CreateIndex
CREATE INDEX "PengumpulanProyek_asesmenId_idx" ON "PengumpulanProyek"("asesmenId");

-- CreateIndex
CREATE INDEX "PengumpulanProyek_tgl_unggah_idx" ON "PengumpulanProyek"("tgl_unggah");

-- CreateIndex
CREATE INDEX "PengumpulanProyek_status_idx" ON "PengumpulanProyek"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileShowcase_pengumpulanProyekId_key" ON "ProfileShowcase"("pengumpulanProyekId");

-- CreateIndex
CREATE INDEX "ProfileShowcase_siswaId_idx" ON "ProfileShowcase"("siswaId");

-- CreateIndex
CREATE INDEX "ProfileShowcase_isPublic_idx" ON "ProfileShowcase"("isPublic");

-- CreateIndex
CREATE INDEX "ProfileShowcase_tanggalDinilai_idx" ON "ProfileShowcase"("tanggalDinilai");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "Enrollment_siswaId_idx" ON "Enrollment"("siswaId");

-- CreateIndex
CREATE INDEX "Enrollment_enrolledAt_idx" ON "Enrollment"("enrolledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_courseId_siswaId_key" ON "Enrollment"("courseId", "siswaId");

-- CreateIndex
CREATE INDEX "ForumDiskusi_asesmenId_idx" ON "ForumDiskusi"("asesmenId");

-- CreateIndex
CREATE INDEX "ForumDiskusi_userId_idx" ON "ForumDiskusi"("userId");

-- CreateIndex
CREATE INDEX "ForumDiskusi_createdAt_idx" ON "ForumDiskusi"("createdAt");

-- CreateIndex
CREATE INDEX "BalasanForum_forumDiskusiId_idx" ON "BalasanForum"("forumDiskusiId");

-- CreateIndex
CREATE INDEX "BalasanForum_userId_idx" ON "BalasanForum"("userId");

-- CreateIndex
CREATE INDEX "BalasanForum_createdAt_idx" ON "BalasanForum"("createdAt");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelompokTemplate" ADD CONSTRAINT "KelompokTemplate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelompokTemplateAnggota" ADD CONSTRAINT "KelompokTemplateAnggota_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "KelompokTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelompokTemplateAnggota" ADD CONSTRAINT "KelompokTemplateAnggota_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materi" ADD CONSTRAINT "Materi_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asesmen" ADD CONSTRAINT "Asesmen_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asesmen" ADD CONSTRAINT "Asesmen_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Soal" ADD CONSTRAINT "Soal_asesmenId_fkey" FOREIGN KEY ("asesmenId") REFERENCES "Asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opsi" ADD CONSTRAINT "Opsi_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "Soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JawabanSiswa" ADD CONSTRAINT "JawabanSiswa_nilaiId_fkey" FOREIGN KEY ("nilaiId") REFERENCES "Nilai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JawabanSiswa" ADD CONSTRAINT "JawabanSiswa_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JawabanSiswa" ADD CONSTRAINT "JawabanSiswa_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "Soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_asesmenId_fkey" FOREIGN KEY ("asesmenId") REFERENCES "Asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "KuisAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KuisAttempt" ADD CONSTRAINT "KuisAttempt_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KuisAttempt" ADD CONSTRAINT "KuisAttempt_asesmenId_fkey" FOREIGN KEY ("asesmenId") REFERENCES "Asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pbl" ADD CONSTRAINT "pbl_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelompok" ADD CONSTRAINT "Kelompok_pblId_fkey" FOREIGN KEY ("pblId") REFERENCES "pbl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelompok" ADD CONSTRAINT "Kelompok_asesmenId_fkey" FOREIGN KEY ("asesmenId") REFERENCES "Asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelompok" ADD CONSTRAINT "Kelompok_ketuaId_fkey" FOREIGN KEY ("ketuaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnggotaKelompok" ADD CONSTRAINT "AnggotaKelompok_kelompokId_fkey" FOREIGN KEY ("kelompokId") REFERENCES "Kelompok"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnggotaKelompok" ADD CONSTRAINT "AnggotaKelompok_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengumpulanProyek" ADD CONSTRAINT "PengumpulanProyek_asesmenId_fkey" FOREIGN KEY ("asesmenId") REFERENCES "Asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengumpulanProyek" ADD CONSTRAINT "PengumpulanProyek_kelompokId_fkey" FOREIGN KEY ("kelompokId") REFERENCES "Kelompok"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengumpulanProyek" ADD CONSTRAINT "PengumpulanProyek_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileShowcase" ADD CONSTRAINT "ProfileShowcase_pengumpulanProyekId_fkey" FOREIGN KEY ("pengumpulanProyekId") REFERENCES "PengumpulanProyek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileShowcase" ADD CONSTRAINT "ProfileShowcase_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumDiskusi" ADD CONSTRAINT "ForumDiskusi_asesmenId_fkey" FOREIGN KEY ("asesmenId") REFERENCES "Asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumDiskusi" ADD CONSTRAINT "ForumDiskusi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalasanForum" ADD CONSTRAINT "BalasanForum_forumDiskusiId_fkey" FOREIGN KEY ("forumDiskusiId") REFERENCES "ForumDiskusi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalasanForum" ADD CONSTRAINT "BalasanForum_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
