import type { User, Course, Asesmen, Proyek, ProfileShowcase, ScheduleEvent } from "./types"
import { SINTAKS_MAP, type SintaksKey } from "./constants/project"

// Mock current user - change role to test different views
export const currentUser: User = {
  id: "1",
  username: "siswa1",
  email: "siswa@example.com",
  nama: "Ahmad Fauzi",
  role: "SISWA",
  foto: undefined,
  createdAt: new Date("2024-01-15"),
}

export const mockUsers: User[] = [
  currentUser,
  {
    id: "2",
    username: "guru1",
    email: "guru@example.com",
    nama: "Dr. Siti Rahayu",
    role: "GURU",
    foto: undefined,
    createdAt: new Date("2023-06-01"),
  },
  {
    id: "3",
    username: "admin",
    email: "admin@example.com",
    nama: "Administrator",
    role: "ADMIN",
    foto: undefined,
    createdAt: new Date("2023-01-01"),
  },
  {
    id: "4",
    username: "siswa2",
    email: "siswa2@example.com",
    nama: "Budi Santoso",
    role: "SISWA",
    createdAt: new Date("2024-02-10"),
  },
  {
    id: "5",
    username: "siswa3",
    email: "siswa3@example.com",
    nama: "Citra Dewi",
    role: "SISWA",
    createdAt: new Date("2024-02-15"),
  },
]

export const mockCourses: Course[] = [
  {
    id: "c1",
    judul: "Pemrograman Web dengan React",
    gambar: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop",
    kategori: "Programming",
    guruId: "2",
    guru: mockUsers[1],
  },
  {
    id: "c2",
    judul: "Database Management System",
    gambar: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=300&fit=crop",
    kategori: "Database",
    guruId: "2",
    guru: mockUsers[1],
  },
  {
    id: "c3",
    judul: "UI/UX Design Fundamentals",
    gambar: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
    kategori: "Design",
    guruId: "2",
    guru: mockUsers[1],
  },
  {
    id: "c4",
    judul: "Algoritma dan Struktur Data",
    gambar: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=300&fit=crop",
    kategori: "Programming",
    guruId: "2",
    guru: mockUsers[1],
  },
]

export const mockAsesmenList: Asesmen[] = [
  {
    id: "a1",
    nama: "Quiz React Basics",
    deskripsi: "Quiz tentang dasar-dasar React",
    jml_soal: 10,
    durasi: 30,
    guruId: "2",
    courseId: "c1",
  },
  {
    id: "a2",
    nama: "UTS Database",
    deskripsi: "Ujian Tengah Semester Database",
    jml_soal: 25,
    durasi: 90,
    guruId: "2",
    courseId: "c2",
  },
  {
    id: "a3",
    nama: "Quiz UI Principles",
    deskripsi: "Quiz tentang prinsip-prinsip UI Design",
    jml_soal: 15,
    durasi: 45,
    guruId: "2",
    courseId: "c3",
  },
]

export const mockProyek: Proyek[] = [
  {
    id: "p1",
    judul: "Orientasi Masalah",
    deskripsi:
      "Mengorientasikan siswa pada masalah nyata yang akan menjadi dasar proyek. Siswa diharapkan dapat mengidentifikasi, menganalisis, dan memahami konteks masalah secara mendalam.",
    tgl_mulai: new Date("2024-12-01"),
    tgl_selesai: new Date("2024-12-07"),
    lampiran: "/documents/jobsheet-sintaks-1.pdf",
    guruId: "2",
  },
  {
    id: "p2",
    judul: "Mengorganisasi",
    deskripsi:
      "Mengorganisasi siswa untuk belajar dan membagi tugas dalam kelompok. Siswa menyusun rencana kerja, pembagian peran, dan strategi penyelesaian masalah.",
    tgl_mulai: new Date("2024-12-08"),
    tgl_selesai: new Date("2024-12-14"),
    lampiran: "/documents/jobsheet-sintaks-2.pdf",
    guruId: "2",
  },
  {
    id: "p3",
    judul: "Membimbing Penyelidikan",
    deskripsi:
      "Membimbing penyelidikan individu maupun kelompok untuk mengumpulkan data dan informasi yang relevan dengan permasalahan proyek.",
    tgl_mulai: new Date("2024-12-15"),
    tgl_selesai: new Date("2024-12-21"),
    lampiran: "/documents/jobsheet-sintaks-3.pdf",
    guruId: "2",
  },
  {
    id: "p4",
    judul: "Mengembangkan dan Menyajikan Hasil Karya",
    deskripsi:
      "Mengembangkan dan menyajikan hasil karya berupa laporan, model, atau produk. Siswa mempresentasikan hasil proyek di depan kelas.",
    tgl_mulai: new Date("2024-12-22"),
    tgl_selesai: new Date("2024-12-28"),
    guruId: "2",
  },
  {
    id: "p5",
    judul: "Menganalisis dan Mengevaluasi Proses Pemecahan Masalah",
    deskripsi:
      "Menganalisis dan mengevaluasi proses pemecahan masalah yang telah dilakukan. Siswa melakukan refleksi dan memberikan feedback terhadap proses pembelajaran.",
    tgl_mulai: new Date("2024-12-29"),
    tgl_selesai: new Date("2025-01-04"),
    guruId: "2",
  },
]

export function getProjectBySintaks(sintaksKey: SintaksKey): Proyek | undefined {
  const sintaksInfo = SINTAKS_MAP[sintaksKey]
  if (!sintaksInfo) return undefined
  return mockProyek.find((p) => p.judul === sintaksInfo.title)
}

export const mockSintaksSubmissions: Record<
  SintaksKey,
  {
    submitted: boolean
    grade: number | null
    submittedAt: Date | null
  }
> = {
  sintaks_1: { submitted: true, grade: 85, submittedAt: new Date("2024-12-06") },
  sintaks_2: { submitted: true, grade: 88, submittedAt: new Date("2024-12-13") },
  sintaks_3: { submitted: true, grade: null, submittedAt: new Date("2024-12-20") },
  sintaks_4: { submitted: false, grade: null, submittedAt: null },
  sintaks_5: { submitted: false, grade: null, submittedAt: null },
}

export const mockShowcase: ProfileShowcase[] = [
  {
    id: "s1",
    judul: "Portfolio Website",
    deskripsi: "Website portfolio personal dengan animasi modern",
    nilai: 92,
    tanggalDinilai: new Date("2024-11-15"),
    isPublic: true,
    siswaId: "1",
    pengumpulanProyekId: "pp1",
    createdAt: new Date("2024-11-15"),
    updatedAt: new Date("2024-11-15"),
    siswa: currentUser,
  },
  {
    id: "s2",
    judul: "Task Management App",
    deskripsi: "Aplikasi manajemen tugas dengan fitur drag and drop",
    nilai: 88,
    tanggalDinilai: new Date("2024-11-20"),
    isPublic: true,
    siswaId: "4",
    pengumpulanProyekId: "pp2",
    createdAt: new Date("2024-11-20"),
    updatedAt: new Date("2024-11-20"),
    siswa: mockUsers[3],
  },
]

export const mockScheduleEvents: ScheduleEvent[] = [
  {
    id: "e1",
    title: "Quiz React Basics",
    date: new Date("2024-12-20"),
    type: "assessment",
    courseId: "c1",
  },
  {
    id: "e2",
    title: "E-Commerce Project Deadline",
    date: new Date("2024-12-20"),
    type: "project",
    courseId: "c1",
  },
  {
    id: "e3",
    title: "UTS Database",
    date: new Date("2024-12-22"),
    type: "assessment",
    courseId: "c2",
  },
  {
    id: "e4",
    title: "Dashboard Analytics Deadline",
    date: new Date("2024-12-25"),
    type: "project",
    courseId: "c1",
  },
  {
    id: "e5",
    title: "UI Design Assignment",
    date: new Date("2024-12-18"),
    type: "assignment",
    courseId: "c3",
  },
]

export const dashboardStats = {
  siswa: {
    totalCourses: 4,
    completedAssignments: 12,
    pendingAssignments: 3,
    averageGrade: 85.5,
  },
  guru: {
    totalCourses: 4,
    totalStudents: 120,
    pendingGrading: 8,
    totalAssessments: 15,
  },
  admin: {
    totalUsers: 150,
    totalCourses: 12,
    activeStudents: 120,
    activeTeachers: 8,
  },
}
