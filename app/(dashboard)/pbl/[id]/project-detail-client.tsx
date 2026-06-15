"use client"

import * as React from "react"
import { useState, useMemo, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useBreadcrumbPage } from "@/hooks/use-breadcrumb"
import type { Course, Asesmen, Materi } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Network,
  Plus,
  BarChart,
  BookOpen,
  Calendar,
  Pencil,
  Trash2,
  Lock,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { AnimateIn } from "@/components/ui/animate-in"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { useRouter } from "next/navigation"

interface PblDetailClientProps {
  course: Course
  assessments: Asesmen[]
}

const SINTAKS_PHASES = [
  { id: "1", title: "Orientasi PBL" },
  { id: "2", title: "Mengorganisasi" },
  { id: "3", title: "Membimbing Penyelidikan" },
  { id: "4", title: "Mengembangkan dan Menyajikan Hasil Karya" },
  { id: "5", title: "Menganalisis dan Mengevaluasi Proses Pemecahan PBL" },
]

export default function PblDetailClient({ course, assessments }: PblDetailClientProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { confirm, error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()

  const [activeSintak, setActiveSintak] = useState("1")

  // ── Sintak locking (only for SISWA) ──────────────────────────────────
  const isSiswa = user?.role === "SISWA"
  const [unlockedSintaks, setUnlockedSintaks] = useState<string[]>(["1", "2", "3", "4", "5"])
  const [completedSintaks, setCompletedSintaks] = useState<string[]>([])
  const [loadingSintakStatus, setLoadingSintakStatus] = useState(false)

  const fetchSintakStatus = useCallback(async () => {
    if (!isSiswa || !user?.id) return
    setLoadingSintakStatus(true)
    try {
      const res = await fetch(`/api/pbl/${course.id}/sintak-status?siswaId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setUnlockedSintaks(data.unlockedSintaks ?? ["1"])
        setCompletedSintaks(data.completedSintaks ?? [])
      }
    } catch {
      // Jika gagal, biarkan semua terbuka agar tidak memblokir siswa
    } finally {
      setLoadingSintakStatus(false)
    }
  }, [isSiswa, user?.id, course.id])

  useEffect(() => {
    fetchSintakStatus()
  }, [fetchSintakStatus])

  const isSintakLocked = (sintakId: string) =>
    isSiswa && !loadingSintakStatus && !unlockedSintaks.includes(sintakId)

  const isSintakCompleted = (sintakId: string) =>
    completedSintaks.includes(sintakId)

  const handleTabChange = (value: string) => {
    if (isSintakLocked(value)) return
    setActiveSintak(value)
  }
  // ─────────────────────────────────────────────────────────────────────

  const filteredMateri = useMemo(() => {
  return (course.materi || []).filter(m => (m.origin === 'PBL' || !m.origin) && (m.sintak || "1") === activeSintak)
  }, [course.materi, activeSintak])

  const filteredAsesmen = useMemo(() => {
  return (assessments || []).filter(a => (a.origin === 'PBL' || !a.origin) && (a.sintak || "1") === activeSintak)
  }, [assessments, activeSintak])

  // Set custom breadcrumb with useMemo to prevent re-renders
  const breadcrumbItems = useMemo(() => [
    {
      label: 'PBL',
      href: '/pbl',
      icon: <Network className="h-4 w-4" />
    },
    {
      label: course.judul,
      icon: <BookOpen className="h-4 w-4" />
    }
  ], [course.judul])

  useBreadcrumbPage(course.judul, breadcrumbItems)

  const isTeacherOrAdmin = user?.role === "GURU" || user?.role === "ADMIN"

  const activeSintakInfo = SINTAKS_PHASES.find(s => s.id === activeSintak)

  const handleDeleteMateri = async (materiId: string, materiTitle: string) => {
    const confirmed = await confirm("Hapus Materi", {
      description: `Apakah Anda yakin ingin menghapus materi "${materiTitle}"?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "warning",
    })

    if (!confirmed) return

    await execute(
      async () => {
        const response = await fetch(`/api/materi/${materiId}`, {
          method: "DELETE",
        })
        if (!response.ok) throw new Error("Failed to delete materi")
      },
      {
  loadingMessage: "Menghapus materi...",
  successTitle: "Berhasil!",
  successDescription: `Materi "${materiTitle}" berhasil dihapus`,
  errorTitle: "Gagal",
        autoCloseMs: 1500,
        onSuccess: () => router.refresh(),
      }
    )
  }

  const handleDeleteAsesmen = async (asesmenId: string, asesmenName: string) => {
    const confirmed = await confirm("Hapus Asesmen", {
      description: `Apakah Anda yakin ingin menghapus asesmen "${asesmenName}"?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "warning",
    })

    if (!confirmed) return

    await execute(
      async () => {
        const response = await fetch(`/api/asesmen/${asesmenId}`, {
          method: "DELETE",
        })
        if (!response.ok) throw new Error("Failed to delete asesmen")
      },
      {
  loadingMessage: "Menghapus asesmen...",
  successTitle: "Berhasil!",
  successDescription: `Asesmen "${asesmenName}" berhasil dihapus`,
  errorTitle: "Gagal",
        autoCloseMs: 1500,
        onSuccess: () => router.refresh(),
      }
    )
  }

  return (
    <div className="w-full space-y-6">
      <AlertComponent />
      <ActionFeedback />

      <AnimateIn>
        <div className="ios-glass-section rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-3">
            <Network className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              PBL {course.judul}
            </h1>
          </div>
        </div>
      </AnimateIn>

      <AnimateIn stagger={1}>
        <Tabs value={activeSintak} onValueChange={handleTabChange} className="space-y-6">
          <div className="w-[calc(100%+2rem)] sm:w-full overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="ios-tab-list min-w-max">
              {SINTAKS_PHASES.map((phase) => {
                const locked = isSintakLocked(phase.id)
                const completed = isSintakCompleted(phase.id)
                return (
                  <TabsTrigger
                    key={phase.id}
                    value={phase.id}
                    disabled={locked}
                    className={
                      locked
                        ? "ios-tab-trigger opacity-40 cursor-not-allowed select-none"
                        : "ios-tab-trigger"
                    }
                    title={locked ? `Selesaikan Sintak ${Number(phase.id) - 1} terlebih dahulu` : undefined}
                  >
                    <span className="ios-tab-text flex items-center gap-1.5">
                      {locked ? (
                        <Lock className="h-3 w-3 shrink-0" />
                      ) : completed ? (
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
                      ) : null}
                      Sintak {phase.id}
                    </span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <div className="mt-4 sm:mt-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">
              Sintak {activeSintak}: {activeSintakInfo?.title}
            </h2>

            <div className="space-y-6">
              {/* Materi Section */}
              <Card className="ios-glass-card border-border/30 rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-4 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
                    <CardTitle className="text-lg sm:text-xl font-semibold">
                      Materi {course.judul}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTeacherOrAdmin && (
                      <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-9 shadow-sm gap-2">
                        <Link href={`/pbl/${course.id}/add-materi?sintak=${activeSintak}`}>
                          <Plus className="h-4 w-4" />
                          Tambah BAB
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {filteredMateri.length === 0 ? (
                    <div className="w-full ios-glass-inset rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center">
                      <p className="text-muted-foreground">Belum ada BAB. Tambahkan BAB terlebih dahulu.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredMateri.map((material, index) => (
                        <div
                          key={material.id}
                          className="group relative w-full border border-border/50 rounded-xl p-4 flex items-start gap-4 hover:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm cursor-pointer"
                          onClick={() => router.push(`/pbl/${course.id}/${material.id}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              router.push(`/pbl/${course.id}/${material.id}`);
                            }
                          }}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base mb-1">{material.judul}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{material.deskripsi}</p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isTeacherOrAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/pbl/${course.id}/${material.id}/edit`)
                                  }}
                                >
                                  <Pencil className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 rounded-lg text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteMateri(material.id, material.judul)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Hapus</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Asesmen Section */}
              <Card className="ios-glass-card border-border/30 rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-4 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
                    <CardTitle className="text-lg sm:text-xl font-semibold">
                      Lampiran Tugas
                    </CardTitle>
                  </div>
                  {isTeacherOrAdmin && (
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end shrink-0">
                      <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 sm:px-4 h-8 sm:h-9 shadow-sm gap-1.5 sm:gap-2">
                        <Link href={`/pbl/${course.id}/add-asesmen?sintak=${activeSintak}&type=KUIS`}>
                          <FileText className="h-3.5 w-3.5 sm:h-4 w-4" />
                          <span className="text-xs sm:text-sm">Kuis</span>
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="rounded-full px-3 sm:px-4 h-8 sm:h-9 gap-1.5 sm:gap-2">
                        <Link href={`/pbl/${course.id}/add-asesmen?sintak=${activeSintak}&type=TUGAS&mode=INDIVIDU`}>
                          <Plus className="h-3.5 w-3.5 sm:h-4 w-4" />
                          <span className="text-xs sm:text-sm">Individu</span>
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="rounded-full px-3 sm:px-4 h-8 sm:h-9 gap-1.5 sm:gap-2">
                        <Link href={`/pbl/${course.id}/add-asesmen?sintak=${activeSintak}&type=TUGAS&mode=KELOMPOK`}>
                          <Plus className="h-3.5 w-3.5 sm:h-4 w-4" />
                          <span className="text-xs sm:text-sm">Kelompok</span>
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {filteredAsesmen.length === 0 ? (
                    <div className="w-full ios-glass-inset rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center">
                      <p className="text-muted-foreground">Belum ada tugas. Tambahkan tugas terlebih dahulu.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAsesmen.map((assessment, index) => (
                        <div
                          key={assessment.id}
                          className="group relative w-full border border-border/50 rounded-xl p-4 flex items-start gap-4 hover:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm cursor-pointer"
                          onClick={() => router.push(`/pbl/${course.id}/${assessment.id}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              router.push(`/pbl/${course.id}/${assessment.id}`);
                            }
                          }}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">{assessment.nama}</h4>
                              {!!assessment.sintak && (
                                <Badge variant="secondary" className="text-[10px] h-5">
                                  Sintak {assessment.sintak}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{assessment.deskripsi}</p>
                            {assessment.tgl_selesai && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Tenggat: {new Date(assessment.tgl_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isTeacherOrAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/pbl/${course.id}/${assessment.id}/edit`)
                                  }}
                                >
                                  <Pencil className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 rounded-lg text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteAsesmen(assessment.id, assessment.nama)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Hapus</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </AnimateIn>
    </div>
  )
}
