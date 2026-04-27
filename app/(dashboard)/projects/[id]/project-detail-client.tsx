"use client"

import * as React from "react"
import { useState, useMemo } from "react"
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
  MoreHorizontal,
  Pencil,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { AnimateIn } from "@/components/ui/animate-in"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { useRouter } from "next/navigation"

interface ProjectDetailClientProps {
  course: Course
  assessments: Asesmen[]
}

const SINTAKS_PHASES = [
  { id: "1", title: "Orientasi pada Masalah" },
  { id: "2", title: "Mengorganisasikan Siswa" },
  { id: "3", title: "Membimbing Penyelidikan" },
  { id: "4", title: "Mengembangkan dan Menyajikan Hasil" },
  { id: "5", title: "Menganalisis dan Mengevaluasi" },
]

export default function ProjectDetailClient({ course, assessments }: ProjectDetailClientProps) {
  const { user } = useAuth()
  const { t } = useAutoTranslate()
  const router = useRouter()
  const { confirm, error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  
  const [activeSintak, setActiveSintak] = useState("1")

  const filteredMateri = useMemo(() => {
    return (course.materi || []).filter(m => (m.sintak || "1") === activeSintak)
  }, [course.materi, activeSintak])

  const filteredAsesmen = useMemo(() => {
    return (assessments || []).filter(a => (a.sintak || "1") === activeSintak)
  }, [assessments, activeSintak])

  // Set custom breadcrumb with useMemo to prevent re-renders
  const breadcrumbItems = useMemo(() => [
    {
      label: 'PBL',
      href: '/projects',
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
    const confirmed = await confirm(t("Hapus Materi"), {
      description: t(`Apakah Anda yakin ingin menghapus materi "${materiTitle}"?`),
      confirmText: t("Hapus"),
      cancelText: t("Batal"),
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
        loadingMessage: t("Menghapus materi..."),
        successTitle: t("Berhasil!"),
        successDescription: t(`Materi "${materiTitle}" berhasil dihapus`),
        errorTitle: t("Gagal"),
        autoCloseMs: 1500,
        onSuccess: () => router.refresh(),
      }
    )
  }

  const handleDeleteAsesmen = async (asesmenId: string, asesmenName: string) => {
    const confirmed = await confirm(t("Hapus Asesmen"), {
      description: t(`Apakah Anda yakin ingin menghapus asesmen "${asesmenName}"?`),
      confirmText: t("Hapus"),
      cancelText: t("Batal"),
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
        loadingMessage: t("Menghapus asesmen..."),
        successTitle: t("Berhasil!"),
        successDescription: t(`Asesmen "${asesmenName}" berhasil dihapus`),
        errorTitle: t("Gagal"),
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
              {t("Pembelajaran")} {course.judul}
            </h1>
          </div>
        </div>
      </AnimateIn>

      <AnimateIn stagger={1}>
        <Tabs value={activeSintak} onValueChange={setActiveSintak} className="space-y-6">
          <div className="overflow-visible pb-2 scrollbar-none">
            <TabsList className="ios-tab-list">
              {SINTAKS_PHASES.map((phase) => (
                <TabsTrigger
                  key={phase.id}
                  value={phase.id}
                  className="ios-tab-trigger"
                >
                  <span className="ios-tab-text">Sintak {phase.id}</span>
                </TabsTrigger>
              ))}
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
                        <Link href={`/projects/${course.id}/add-materi?sintak=${activeSintak}`}>
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
                        <div key={material.id} className="group relative w-full border border-border/50 rounded-xl p-4 flex items-start gap-4 hover:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base mb-1">{material.judul}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{material.deskripsi}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button asChild variant="secondary" size="sm" className="rounded-lg">
                              <Link href={`/projects/${course.id}/${material.id}`}>
                                Buka
                              </Link>
                            </Button>
                            {isTeacherOrAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/projects/${course.id}/${material.id}/edit`}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDeleteMateri(material.id, material.judul)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                    <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-9 shadow-sm gap-2">
                      <Link href={`/projects/${course.id}/add-asesmen?sintak=${activeSintak}`}>
                        <Plus className="h-4 w-4" />
                        Tambah Tugas
                      </Link>
                    </Button>
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
                        <div key={assessment.id} className="group relative w-full border border-border/50 rounded-xl p-4 flex items-start gap-4 hover:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">{assessment.nama}</h4>
                              <Badge variant={assessment.tipe === 'KUIS' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                {assessment.tipe === 'KUIS' ? 'Kuis' : 'Tugas'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{assessment.deskripsi}</p>
                            {assessment.tgl_selesai && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Tenggat: {new Date(assessment.tgl_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button asChild variant="secondary" size="sm" className="rounded-lg">
                              <Link href={`/projects/${course.id}/${assessment.id}`}>
                                Buka
                              </Link>
                            </Button>
                            {isTeacherOrAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/projects/${course.id}/${assessment.id}/edit`}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDeleteAsesmen(assessment.id, assessment.nama)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
