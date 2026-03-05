import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed Users (Guru dan Siswa)
  const guru1 = await prisma.user.upsert({
    where: { email: 'rino@guru.com' },
    update: {},
    create: {
      id: 'guru1',
      email: 'rino@guru.com',
      nama: 'Rino Raihan Gumilang S.pd',
      username: 'rino_guru',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'GURU',
      kelas: null,
    },
  })

  const siswa1 = await prisma.user.upsert({
    where: { email: 'siswa1@student.com' },
    update: {},
    create: {
      id: 'siswa1',
      email: 'siswa1@student.com',
      nama: 'Ahmad Rizky',
      username: 'ahmad_rizky',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'SISWA',
      kelas: 'XI RPL 1',
    },
  })

  const siswa2 = await prisma.user.upsert({
    where: { email: 'siswa2@student.com' },
    update: {},
    create: {
      id: 'siswa2',
      email: 'siswa2@student.com',
      nama: 'Siti Nurhaliza',
      username: 'siti_nur',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'SISWA',
      kelas: 'XI RPL 1',
    },
  })

  const siswa3 = await prisma.user.upsert({
    where: { email: 'siswa3@student.com' },
    update: {},
    create: {
      id: 'siswa3',
      email: 'siswa3@student.com',
      nama: 'Budi Santoso',
      username: 'budi_santoso',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'SISWA',
      kelas: 'XI RPL 2',
    },
  })

  // Seed Courses
  const course1 = await prisma.course.upsert({
    where: { id: 'course1' },
    update: {},
    create: {
      id: 'course1',
      judul: 'Pemrograman Web',
      deskripsi: 'Mata pelajaran pemrograman web untuk kelas XI RPL',
      gambar: '/api/placeholder/400/200',
      kategori: 'Programming',
      guruId: guru1.id,
    },
  })

  // Seed PBL Projects
  const pbl1 = await prisma.pBL.upsert({
    where: { id: 'pbl1' },
    update: {},
    create: {
      id: 'pbl1',
      judul: 'Orientasi Masalah',
      deskripsi: 'Mengorientasikan siswa pada masalah nyata yang akan menjadi dasar proyek. Siswa diharapkan dapat mengidentifikasi, menganalisis, dan memahami konteks masalah secara mendalam.',
      tgl_mulai: new Date('2024-12-06T00:00:00Z'),
      tgl_selesai: new Date('2024-12-13T00:00:00Z'),
      sintaks: ['sintaks_1'],
      guruId: guru1.id,
    },
  })

  const pbl2 = await prisma.pBL.upsert({
    where: { id: 'pbl2' },
    update: {},
    create: {
      id: 'pbl2',
      judul: 'Mengorganisasi',
      deskripsi: 'Mengorganisasi siswa ke dalam kelompok belajar dan membantu mereka menentukan subtopik yang akan dipelajari.',
      tgl_mulai: new Date('2024-12-13T00:00:00Z'),
      tgl_selesai: new Date('2024-12-20T00:00:00Z'),
      sintaks: ['sintaks_1', 'sintaks_2'],
      guruId: guru1.id,
    },
  })

  const pbl3 = await prisma.pBL.upsert({
    where: { id: 'pbl3' },
    update: {},
    create: {
      id: 'pbl3',
      judul: 'Membimbing Penyelidikan',
      deskripsi: 'Membimbing penyelidikan individu maupun kelompok untuk mengumpulkan data dan informasi yang relevan dengan permasalahan proyek.',
      tgl_mulai: new Date('2024-12-20T00:00:00Z'),
      tgl_selesai: new Date('2024-12-27T00:00:00Z'),
      sintaks: ['sintaks_1', 'sintaks_2', 'sintaks_3'],
      guruId: guru1.id,
    },
  })

  const pbl4 = await prisma.pBL.upsert({
    where: { id: 'pbl4' },
    update: {},
    create: {
      id: 'pbl4',
      judul: 'Mengembangkan dan Menyajikan Hasil Karya',
      deskripsi: 'Mengembangkan dan menyajikan hasil karya berupa laporan, model, atau produk. Siswa mempresentasikan hasil proyek di depan kelas.',
      tgl_mulai: new Date('2024-12-27T00:00:00Z'),
      tgl_selesai: new Date('2025-01-03T00:00:00Z'),
      sintaks: ['sintaks_1', 'sintaks_2', 'sintaks_3', 'sintaks_4'],
      guruId: guru1.id,
    },
  })

  const pbl5 = await prisma.pBL.upsert({
    where: { id: 'pbl5' },
    update: {},
    create: {
      id: 'pbl5',
      judul: 'Menganalisis dan Mengevaluasi Proses Pemecahan Masalah',
      deskripsi: 'Menganalisis dan mengevaluasi proses pemecahan masalah yang telah dilakukan, termasuk refleksi dari pembelajaran yang didapat.',
      tgl_mulai: new Date('2025-01-03T00:00:00Z'),
      tgl_selesai: new Date('2025-01-10T00:00:00Z'),
      sintaks: ['sintaks_1', 'sintaks_2', 'sintaks_3', 'sintaks_4', 'sintaks_5'],
      guruId: guru1.id,
    },
  })

  // Seed Kelompok untuk setiap PBL
  const kelompok1 = await prisma.kelompok.upsert({
    where: { id: 'kelompok1' },
    update: {},
    create: {
      id: 'kelompok1',
      nama: 'Kelompok Alpha',
      pblId: pbl1.id,
    },
  })

  const kelompok2 = await prisma.kelompok.upsert({
    where: { id: 'kelompok2' },
    update: {},
    create: {
      id: 'kelompok2',
      nama: 'Kelompok Beta',
      pblId: pbl2.id,
    },
  })

  const kelompok3 = await prisma.kelompok.upsert({
    where: { id: 'kelompok3' },
    update: {},
    create: {
      id: 'kelompok3',
      nama: 'Kelompok Gamma',
      pblId: pbl3.id,
    },
  })

  // Seed Anggota Kelompok
  await prisma.anggotaKelompok.upsert({
    where: { id: 'anggota1' },
    update: {},
    create: {
      id: 'anggota1',
      kelompokId: kelompok1.id,
      siswaId: siswa1.id,
    },
  })

  await prisma.anggotaKelompok.upsert({
    where: { id: 'anggota2' },
    update: {},
    create: {
      id: 'anggota2',
      kelompokId: kelompok1.id,
      siswaId: siswa2.id,
    },
  })

  await prisma.anggotaKelompok.upsert({
    where: { id: 'anggota3' },
    update: {},
    create: {
      id: 'anggota3',
      kelompokId: kelompok2.id,
      siswaId: siswa3.id,
    },
  })

  // Seed Asesmen
  const asesmen1 = await prisma.asesmen.upsert({
    where: { id: 'asesmen1' },
    update: {},
    create: {
      id: 'asesmen1',
      nama: 'Quiz HTML Dasar',
      deskripsi: 'Quiz tentang dasar-dasar HTML',
      tipe: 'KUIS',
      tipe_pengerjaan: 'INDIVIDU',
      durasi: 30,
      tgl_mulai: new Date('2024-12-01T10:00:00Z'),
      tgl_selesai: new Date('2024-12-01T11:00:00Z'),
      courseId: course1.id,
      guruId: guru1.id,
    },
  })

  // Seed Soal untuk Asesmen
  const soal1 = await prisma.soal.upsert({
    where: { id: 'soal1' },
    update: {},
    create: {
      id: 'soal1',
      teks: 'Apa kepanjangan dari HTML?',
      tipe: 'PILIHAN_GANDA',
      poin: 10,
      asesmenId: asesmen1.id,
    },
  })

  // Seed Opsi Jawaban
  await prisma.opsiJawaban.upsert({
    where: { id: 'opsi1' },
    update: {},
    create: {
      id: 'opsi1',
      teks: 'HyperText Markup Language',
      isBenar: true,
      soalId: soal1.id,
    },
  })

  await prisma.opsiJawaban.upsert({
    where: { id: 'opsi2' },
    update: {},
    create: {
      id: 'opsi2',
      teks: 'High Tech Modern Language',
      isBenar: false,
      soalId: soal1.id,
    },
  })

  await prisma.opsiJawaban.upsert({
    where: { id: 'opsi3' },
    update: {},
    create: {
      id: 'opsi3',
      teks: 'Home Tool Markup Language',
      isBenar: false,
      soalId: soal1.id,
    },
  })

  await prisma.opsiJawaban.upsert({
    where: { id: 'opsi4' },
    update: {},
    create: {
      id: 'opsi4',
      teks: 'Hyperlink and Text Markup Language',
      isBenar: false,
      soalId: soal1.id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('📊 Data yang ditambahkan:')
  console.log('- Users: 4 (1 guru, 3 siswa)')
  console.log('- Courses: 1')
  console.log('- PBL Projects: 5')
  console.log('- Kelompok: 3')
  console.log('- Anggota Kelompok: 3')
  console.log('- Asesmen: 1')
  console.log('- Soal: 1')
  console.log('- Opsi Jawaban: 4')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
