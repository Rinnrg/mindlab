"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { BookOpen, GraduationCap, ShieldCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type GuideSection = {
  title: string
  description?: string
  steps: string[]
}

type RoleGuideTab = {
  value: string
  label: string
  sections: GuideSection[]
}

type RoleGuide = {
  label: string
  icon: React.ReactNode
  intro: string
  tabs: RoleGuideTab[]
}

function roleLabel(role?: UserRole | null) {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "GURU":
      return "Guru"
    case "SISWA":
      return "Siswa"
    default:
      return "Pengguna"
  }
}

function getRoleGuide(role?: UserRole | null): RoleGuide {
  switch (role) {
    case "ADMIN":
      return {
        label: "Admin",
        icon: <ShieldCheck className="h-4 w-4" />,
        intro: "Panduan admin berbasis halaman: fokus ke manajemen role/pengguna dan monitoring.",
          tabs: [
          {
            value: "user-management",
            label: "Kelola Pengguna",
            sections: [
              {
                title: "Manajemen Role & Akses",
                description: "Penting untuk memastikan pengguna memiliki hak akses yang tepat sesuai fungsinya.",
                steps: [
                  "Buka menu 'Users' dari sidebar utama.",
                  "Gunakan kolom pencarian untuk menemukan pengguna berdasarkan nama atau email.",
                  "Klik tombol 'Edit' (ikon pensil) pada baris pengguna.",
                  "Pilih Role dari dropdown: ADMIN (kontrol penuh), GURU (pengelola kursus), atau SISWA (peserta belajar).",
                  "Klik 'Simpan Perubahan' dan pastikan notifikasi sukses muncul.",
                  "Rekomendasi: Informasikan pengguna untuk logout dan login kembali jika perubahan role tidak langsung terasa.",
                ],
              },
              {
                title: "Monitoring Aktivitas",
                description: "Memantau log sistem untuk keamanan dan audit.",
                steps: [
                  "Masuk ke dashboard utama Admin.",
                  "Lihat widget 'Aktivitas Terbaru' untuk melihat log login, pembuatan kursus, atau penghapusan data.",
                  "Periksa statistik 'Total Pengguna' dan distribusinya per role untuk laporan berkala.",
                ],
              },
            ],
          },
          {
            value: "system-stats",
            label: "Statistik Sistem",
            sections: [
              {
                title: "Analisis Dashboard",
                description: "Memahami performa platform melalui angka.",
                steps: [
                  "Pantau 'Kursus Aktif' untuk melihat pertumbuhan konten.",
                  "Cek 'Siswa Aktif' untuk melihat tingkat keterlibatan pengguna.",
                  "Gunakan data ini untuk memberikan dukungan kepada Guru yang memiliki banyak kursus atau siswa.",
                ],
              },
            ],
          },
        ],
      }
    case "GURU":
      return {
        label: "Guru",
        icon: <BookOpen className="h-4 w-4" />,
        intro: "Panduan guru per halaman: tambah course, materi, kuis, pengumpulan, dan input nilai.",
          tabs: [
          {
            value: "course-pbl",
            label: "Kursus & PBL",
            sections: [
              {
                title: "Membuat Kursus Baru",
                description: "Langkah pertama sebelum menambahkan materi.",
                steps: [
                  "Buka menu 'Courses' lalu klik 'Buat Kursus' (ikon Plus).",
                  "Upload cover kursus yang menarik, isi judul, kategori, dan deskripsi lengkap.",
                  "Pilih 'Level' kursus (Mudah/Menengah/Sulit) untuk panduan siswa.",
                  "Setelah disimpan, Anda akan diarahkan ke halaman Detail Kursus.",
                ],
              },
              {
                title: "Integrasi Sintaks PBL",
                description: "Aplikasi ini mendukung Problem Based Learning (PBL) dengan 5 fase standar.",
                steps: [
                  "Setiap materi dan tugas dapat dihubungkan ke salah satu Sintaks PBL (1 s/d 5).",
                  "Fase 1: Orientasi pada Masalah, Fase 2: Mengorganisasi Siswa, dst.",
                  "Gunakan tab 'PBL' di dashboard untuk memantau kemajuan proyek siswa secara terpusat.",
                ],
              },
            ],
          },
          {
            value: "materi-upload",
            label: "Materi & Media",
            sections: [
              {
                title: "Upload Materi",
                description: "Mendukung berbagai format file dan media.",
                steps: [
                  "Di dalam Kursus, klik 'Tambah Materi'.",
                  "Isi judul dan deskripsi yang menjelaskan apa yang akan dipelajari.",
                  "Anda bisa mengunggah file (PDF/Video) atau menyematkan Link (YouTube/Web).",
                  "Gunakan fitur 'Preview' untuk melihat tampilan materi di sisi siswa.",
                ],
              },
            ],
          },
          {
            value: "asesmen-quiz",
            label: "Kuis & Impor Excel",
            sections: [
              {
                title: "Membuat Kuis",
                steps: [
                  "Pilih 'Tambah Asesmen' di dalam kursus.",
                  "Atur durasi (menit) dan jumlah soal yang akan ditampilkan.",
                  "Anda bisa menambah soal satu per satu (Pilihan Ganda).",
                ],
              },
              {
                title: "Fitur Impor Excel",
                description: "Cara cepat membuat banyak soal sekaligus.",
                steps: [
                  "Gunakan tombol 'Import Excel' di halaman kelola soal kuis.",
                  "Download template Excel yang disediakan.",
                  "Isi soal, pilihan A-E, dan kunci jawaban sesuai format.",
                  "Upload kembali file Excel dan sistem akan memproses otomatis.",
                ],
              },
            ],
          },
          {
            value: "grading",
            label: "Penilaian & Tugas",
            sections: [
              {
                title: "Koreksi Tugas",
                steps: [
                  "Buka menu 'Pengumpulan' pada setiap item tugas/proyek.",
                  "Lihat daftar siswa yang sudah mengumpulkan.",
                  "Klik 'Detail' untuk melihat file/tautan yang dikirim siswa.",
                  "Berikan 'Nilai' (0-100) dan 'Feedback' (catatan saran/koreksi).",
                  "Feedback sangat penting agar siswa tahu bagian mana yang perlu diperbaiki.",
                ],
              },
            ],
          },
        ],
      }
    case "SISWA":
      return {
        label: "Siswa",
        icon: <GraduationCap className="h-4 w-4" />,
        intro: "Panduan siswa per halaman: akses kursus/materi/kuis dan cara pengumpulan tugas.",
          tabs: [
          {
            value: "learning-flow",
            label: "Alur Belajar",
            sections: [
              {
                title: "Navigasi Kursus",
                steps: [
                  "Cari kursus di halaman 'Daftar Kursus'.",
                  "Gunakan Progress Bar untuk melihat sejauh mana Anda telah belajar.",
                  "Materi disusun secara sistematis, pastikan membaca instruksi guru di setiap item.",
                ],
              },
              {
                title: "Memahami Fase PBL",
                description: "Proyek Anda dibagi menjadi beberapa tahap (Sintaks).",
                steps: [
                  "Gunakan tab Sintaks (1-5) untuk melihat tugas apa yang harus dikerjakan sekarang.",
                  "Setiap fase memiliki materi pendukung dan pengumpulan tugas spesifik.",
                ],
              },
            ],
          },
          {
            value: "assignment",
            label: "Tugas & Kuis",
            sections: [
              {
                title: "Mengerjakan Kuis",
                steps: [
                  "Perhatikan 'Durasi' sebelum memulai kuis.",
                  "Pilih jawaban dengan teliti, sistem akan menyimpan jawaban Anda secara otomatis.",
                  "Klik 'Submit Akhir' hanya jika semua soal sudah terjawab.",
                ],
              },
              {
                title: "Mengirim Tugas",
                steps: [
                  "Buka halaman pengumpulan tugas.",
                  "Pilih file (pastikan ukuran file tidak melebihi batas).",
                  "Klik 'Kirim' dan pastikan status berubah menjadi 'Diserahkan'.",
                ],
              },
            ],
          },
          {
            value: "progress",
            label: "Nilai & Portofolio",
            sections: [
              {
                title: "Melihat Hasil Belajar",
                steps: [
                  "Cek nilai Anda di halaman detail kuis atau tugas setelah dinilai Guru.",
                  "Baca 'Feedback' dari guru untuk bahan evaluasi.",
                  "Proyek terbaik Anda akan muncul di halaman 'Profil' sebagai portofolio digital.",
                ],
              },
            ],
          },
        ],
      }
    default:
      return {
        label: "Pengguna",
        icon: <BookOpen className="h-4 w-4" />,
        intro: "Panduan singkat penggunaan Mindlab.",
        tabs: [
          {
            value: "mulai",
            label: "Mulai",
            sections: [
              {
                title: "Langkah awal",
                steps: [
                  "Login untuk mengakses fitur sesuai role.",
                  "Gunakan pencarian di header untuk menemukan halaman.",
                ],
              },
            ],
          },
        ],
      }
  }
}

export function RoleGuideDialog() {
  const { user } = useAuth()

  const guide = useMemo(() => getRoleGuide(user?.role), [user?.role])
  const [activeTab, setActiveTab] = useState(() => guide.tabs[0]?.value ?? "")

  // Keep tab stable when role changes (or during hydration)
  const safeActiveTab = guide.tabs.some((t) => t.value === activeTab)
    ? activeTab
    : (guide.tabs[0]?.value ?? "")

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary transition-[color,transform] duration-[140ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          aria-label="Panduan"
          title="Panduan"
        >
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 sm:max-w-[520px] md:max-w-[640px]">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2">
              {guide.icon}
              Panduan ({roleLabel(user?.role)})
            </span>
          </DialogTitle>
          <DialogDescription className="text-left">
            {guide.intro}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={safeActiveTab} onValueChange={(v) => setActiveTab(v)} className="mt-4">
          <div className="w-full max-w-full overflow-x-auto pb-2 mt-4 scrollbar-hide">
          <TabsList className="flex w-max min-w-full gap-1 bg-transparent p-0">
            {guide.tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="ios-tab-trigger whitespace-nowrap px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

          {guide.tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-3">
              <div className="space-y-4">
                {tab.sections.map((section) => (
                  <section key={section.title} className="space-y-2">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                      {section.description ? (
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      ) : null}
                    </div>
                    <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                      {section.steps.map((step) => (
                        <li key={step} className="break-words">{step}</li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 flex justify-end">
          <DialogClose asChild>
            <Button variant="secondary">Tutup</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
