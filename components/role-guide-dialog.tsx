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
            value: "role",
            label: "Manajemen Role",
            sections: [
              {
                title: "Tujuan",
                description: "Mengatur hak akses agar fitur yang muncul sesuai tanggung jawab pengguna.",
                steps: [
                  "Buka menu Users / Pengguna.",
                  "Cari akun yang ingin diubah (gunakan pencarian di header bila perlu).",
                  "Buka aksi Edit / Detail pengguna.",
                  "Ubah Role (Admin/Guru/Siswa) sesuai kebutuhan.",
                  "Simpan perubahan.",
                  "Minta pengguna logout-login agar role baru diterapkan sepenuhnya.",
                ],
              },
              {
                title: "Checklist keamanan",
                steps: [
                  "Pastikan hanya user tertentu yang punya role ADMIN.",
                  "Gunakan role GURU untuk pengelolaan course, bukan ADMIN (kecuali perlu).",
                  "Audit perubahan role secara berkala (cek Activity/Stats jika tersedia).",
                ],
              },
            ],
          },
          {
            value: "monitor",
            label: "Monitoring",
            sections: [
              {
                title: "Pantau aktivitas",
                steps: [
                  "Buka halaman Activity untuk melihat aktivitas terbaru.",
                  "Gunakan filter/pencarian untuk menelusuri tindakan pengguna tertentu.",
                ],
              },
              {
                title: "Pantau statistik",
                steps: [
                  "Buka Stats untuk melihat ringkasan penggunaan.",
                  "Gunakan insight untuk perbaikan struktur kelas/course.",
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
            value: "course",
            label: "Tambah Kursus",
            sections: [
              {
                title: "Membuat kursus baru",
                steps: [
                  "Buka halaman Courses.",
                  "Klik tombol 'Kursus Baru'.",
                  "Isi judul, kategori, deskripsi, dan pengaturan lain.",
                  "Simpan untuk membuat course.",
                  "Masuk ke course detail untuk menambah materi/asesmen.",
                ],
              },
              {
                title: "Mengatur siswa",
                steps: [
                  "Buka course detail.",
                  "Masuk tab/halaman Students.",
                  "Tambahkan siswa (manual/import jika tersedia).",
                ],
              },
            ],
          },
          {
            value: "materi",
            label: "Tambah Materi",
            sections: [
              {
                title: "Menambahkan materi",
                steps: [
                  "Buka course yang dituju.",
                  "Klik 'Tambah Materi'.",
                  "Isi judul materi dan konten/deskripsi.",
                  "Upload lampiran bila diperlukan.",
                  "Simpan, lalu cek materi tampil di daftar.",
                ],
              },
              {
                title: "Tips pengelolaan",
                steps: [
                  "Gunakan penamaan konsisten (mis. Minggu 1, Minggu 2).",
                  "Sertakan tujuan belajar + sumber referensi singkat.",
                ],
              },
            ],
          },
          {
            value: "kuis",
            label: "Tambah Kuis",
            sections: [
              {
                title: "Membuat kuis/asesmen",
                steps: [
                  "Buka course yang dituju.",
                  "Klik 'Tambah Asesmen' / 'Kuis'.",
                  "Isi judul, waktu, durasi (jika ada), dan aturan.",
                  "Tambahkan soal (pilihan ganda/essay sesuai dukungan).",
                  "Simpan dan lakukan uji coba singkat (preview) jika tersedia.",
                ],
              },
            ],
          },
          {
            value: "pengumpulan",
            label: "Tugas/Pengumpulan",
            sections: [
              {
                title: "Membuat tugas dengan pengumpulan file",
                steps: [
                  "Buka course yang dituju.",
                  "Buat item pengumpulan/tugas.",
                  "Tentukan instruksi, format file, dan deadline.",
                  "Simpan lalu informasikan ke siswa (via schedule/announcement jika ada).",
                ],
              },
              {
                title: "Memantau pengumpulan",
                steps: [
                  "Masuk ke halaman pengumpulan pada item tugas.",
                  "Lihat daftar submission siswa.",
                  "Unduh/preview file untuk pemeriksaan.",
                ],
              },
            ],
          },
          {
            value: "nilai",
            label: "Input Nilai",
            sections: [
              {
                title: "Memberi nilai & feedback",
                steps: [
                  "Buka item kuis/tugas yang ingin dinilai.",
                  "Pilih submission siswa.",
                  "Isi nilai.",
                  "Tambahkan catatan/feedback.",
                  "Simpan lalu cek rekap nilai (jika ada).",
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
            value: "akses-kursus",
            label: "Akses Kursus",
            sections: [
              {
                title: "Melihat kursus",
                steps: [
                  "Buka halaman Courses.",
                  "Gunakan pencarian untuk menemukan kursus.",
                  "Klik kartu kursus untuk masuk ke detail.",
                ],
              },
              {
                title: "Tips",
                steps: [
                  "Periksa kategori/filter jika kursus tidak muncul.",
                  "Cek Schedule untuk memastikan deadline.",
                ],
              },
            ],
          },
          {
            value: "materi",
            label: "Akses Materi",
            sections: [
              {
                title: "Membuka materi",
                steps: [
                  "Masuk ke course yang diikuti.",
                  "Pilih materi dari daftar.",
                  "Baca instruksi dan unduh lampiran jika ada.",
                ],
              },
              {
                title: "Catatan belajar",
                steps: [
                  "Simpan poin penting dan pertanyaan untuk diskusi.",
                  "Gunakan fitur search untuk kembali ke halaman materi cepat.",
                ],
              },
            ],
          },
          {
            value: "kuis",
            label: "Akses Kuis",
            sections: [
              {
                title: "Mengerjakan kuis",
                steps: [
                  "Masuk ke course.",
                  "Buka item kuis/asesmen.",
                  "Baca aturan dan batas waktu.",
                  "Isi jawaban lalu submit.",
                  "Pastikan muncul notifikasi berhasil.",
                ],
              },
            ],
          },
          {
            value: "pengumpulan",
            label: "Pengumpulan Tugas",
            sections: [
              {
                title: "Upload tugas",
                steps: [
                  "Masuk ke course.",
                  "Buka item tugas/pengumpulan.",
                  "Baca instruksi + format file yang diminta.",
                  "Klik upload dan pilih file.",
                  "Kirim/submit pengumpulan.",
                  "Cek status pengumpulan (terkirim/tersimpan).",
                ],
              },
              {
                title: "Troubleshooting",
                steps: [
                  "Jika upload gagal, cek ukuran/format file.",
                  "Coba refresh lalu upload ulang.",
                  "Pastikan koneksi stabil sebelum submit.",
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

      <DialogContent className="max-w-[92vw] sm:max-w-[520px] md:max-w-[640px]">
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
          <TabsList className="w-full">
            {guide.tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

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
                        <li key={step}>{step}</li>
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
