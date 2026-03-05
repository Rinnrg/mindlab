// Types for the Mindlab application

export type UserRole = "ADMIN" | "GURU" | "SISWA"
export type TipeAsesmen = "KUIS" | "TUGAS"
export type TipePengerjaan = "INDIVIDU" | "KELOMPOK"
export type TipeJawaban = "PILIHAN_GANDA" | "ISIAN"

export interface User {
  id: string
  username?: string
  email: string
  nama: string
  role: UserRole
  foto?: string
  createdAt: Date
}

export interface Course {
  id: string
  judul: string
  deskripsi?: string
  gambar: string
  kategori: string
  guruId: string
  guru?: User
  asesmen?: Asesmen[]
  materi?: Materi[]
}

export interface Materi {
  id: string
  judul: string
  deskripsi?: string
  kelasTarget?: string[]
  tgl_unggah: Date
  lampiran?: string
  courseId: string
}

export interface Asesmen {
  id: string
  nama: string
  deskripsi?: string
  kelasTarget?: string[]
  tipe: TipeAsesmen
  tipePengerjaan?: TipePengerjaan
  jml_soal?: number | null  // Optional - akan dihitung dari jumlah soal
  durasi?: number | null    // Optional
  tgl_mulai?: Date
  tgl_selesai?: Date
  lampiran?: string
  guruId: string
  courseId: string
  soal?: Soal[]
  nilai?: Nilai[]
  pengumpulanProyek?: PengumpulanProyek[] // Renamed from pengumpulanTugas
}

export interface Soal {
  id: string
  pertanyaan: string
  bobot: number
  tipeJawaban: TipeJawaban
  asesmenId: string
  opsi?: Opsi[]
  jawabanSiswa?: JawabanSiswa[]
}

export interface Opsi {
  id: string
  teks: string
  isBenar: boolean
  soalId: string
}

export interface Nilai {
  id: string
  skor: number
  tanggal: Date
  siswaId: string
  asesmenId: string
  jawabanSiswa?: JawabanSiswa[]
}

export interface JawabanSiswa {
  id: string
  jawaban: string | null
  isBenar: boolean | null
  skorDidapat: number | null
  tanggalJawab: Date
  siswaId: string
  soalId: string
  nilaiId: string | null
  siswa?: User
  soal?: Soal
}

export interface PengumpulanProyek {
  id: string
  namaKelompok?: string
  ketua?: string
  anggota?: string
  fileUrl?: string
  catatan?: string
  sourceCode?: string
  output?: string
  tgl_unggah: Date
  nilai?: number
  siswaId?: string
  kelompokId?: string
  asesmenId?: string
  siswa?: User
  asesmen?: Asesmen
}

export interface Masalah {
  id: string
  judul: string
  deskripsi: string
  tgl_mulai: Date
  tgl_selesai: Date
  lampiran?: string
  guruId: string
  kelompok?: Kelompok[]
}

export interface Kelompok {
  id: string
  nama: string
  masalahId: string
  anggota?: AnggotaKelompok[]
  pengumpulan?: PengumpulanProyek[]
}

export interface AnggotaKelompok {
  id: string
  siswaId: string
  kelompokId: string
  siswa?: User
}

export interface PengumpulanProyek {
  id: string
  link?: string
  catatan?: string
  sourceCode?: string
  output?: string
  tgl_unggah: Date
  nilai?: number
  kelompokId: string
}

export interface ProfileShowcase {
  id: string
  judul: string
  deskripsi?: string
  nilai: number
  tanggalDinilai: Date
  isPublic: boolean
  siswaId: string
  pengumpulanProyekId: string
  createdAt: Date
  updatedAt: Date
  siswa?: User
  pengumpulanProyek?: PengumpulanProyek
}

export interface ScheduleEvent {
  id: string
  title: string
  date: Date
  type: "assignment" | "project" | "assessment"
  courseId?: string
}
