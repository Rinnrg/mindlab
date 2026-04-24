"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useBreadcrumbPage } from "@/hooks/simple-breadcrumb"
import type { Course, Asesmen } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  FileText,
  Video,
  Download,
  Play,
  Clock,
  CheckCircle2,
  Calendar,
  Plus,
  Pencil,
  Users,
  BookOpen,
  MoreHorizontal,
  Trash2,
  Eye,
  Mail,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import AddStudentDialog from "./add-student-dialog"
import EditTeacherDialog from "./edit-teacher-dialog"
import { useAsyncAction } from "@/hooks/use-async-action"

interface CourseDetailClientProps {
  course: Course
  assessments: Asesmen[]
}

interface Enrollment {
  id: string
  progress: number
  siswa: {
    id: string
    nama: string
    email: string
    foto: string | null
    kelas: string | null
  }
  averageGrade: number
}

export default function CourseDetailClient({ course, assessments }: CourseDetailClientProps) {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { confirm, error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const [activeTab, setActiveTab] = useState("materials")
  const [tabKey, setTabKey] = useState(0) // For re-render animation
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [editTeacherOpen, setEditTeacherOpen] = useState(false)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)

  // Handle tab from query parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && (tab === 'materials' || tab === 'assessments' || tab === 'students')) {
      setActiveTab(tab)
      setTabKey(prev => prev + 1)
    }
  }, [searchParams])

  // Set custom breadcrumb with useMemo to prevent re-renders
  const breadcrumbItems = useMemo(() => [
    {
      label: 'Kursus',
      href: '/courses',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: course.judul,
      icon: <BookOpen className="h-4 w-4" />
    }
  ], [course.judul])

  useBreadcrumbPage(course.judul, breadcrumbItems)

  const isTeacherOrAdmin = user?.role === "GURU" || user?.role === "ADMIN"

  // Filter materi dan asesmen berdasarkan kelas siswa
  const filteredMateri = useMemo(() => {
    if (isTeacherOrAdmin || !user?.kelas) {
      // Guru/Admin melihat semua materi, atau jika user tidak memiliki kelas
      return course.materi || []
    }
    
    return (course.materi || []).filter((materi) => {
      // Jika kelasTarget kosong, berarti untuk semua kelas
      if (!materi.kelasTarget || materi.kelasTarget.length === 0) {
        return true
      }
      // Cek apakah kelas siswa termasuk dalam kelasTarget
      return materi.kelasTarget.includes(user.kelas)
    })
  }, [course.materi, user?.kelas, isTeacherOrAdmin])

  const filteredAsesmen = useMemo(() => {
    if (isTeacherOrAdmin || !user?.kelas) {
      // Guru/Admin melihat semua asesmen, atau jika user tidak memiliki kelas
      return assessments || []
    }
    
    return (assessments || []).filter((asesmen) => {
      // Jika kelasTarget kosong, berarti untuk semua kelas
      if (!asesmen.kelasTarget || asesmen.kelasTarget.length === 0) {
        return true
      }
      // Cek apakah kelas siswa termasuk dalam kelasTarget
      return asesmen.kelasTarget.includes(user.kelas)
    })
  }, [assessments, user?.kelas, isTeacherOrAdmin])

  // TODO: Implement completed tracking in the database
  const completedCount = 0
  const progressPercent = filteredMateri && filteredMateri.length > 0 
    ? Math.round((completedCount / filteredMateri.length) * 100) 
    : 0

  // Group enrollments by kelas
  const groupedEnrollments = useMemo(() => {
    const groups: Record<string, Enrollment[]> = {}
    enrollments.forEach((enrollment) => {
      const kelas = enrollment.siswa.kelas || "Tanpa Kelas"
      if (!groups[kelas]) {
        groups[kelas] = []
      }
      groups[kelas].push(enrollment)
    })
    // Sort keys: named classes first (sorted), "Tanpa Kelas" last
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Tanpa Kelas") return 1
      if (b === "Tanpa Kelas") return -1
      return a.localeCompare(b, 'id')
    })
    return sortedKeys.map((kelas) => ({ kelas, students: groups[kelas] }))
  }, [enrollments])

  // Set active tab from URL params
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Fetch enrolled students function with useCallback
  const fetchEnrollments = useCallback(async () => {
    setIsLoadingStudents(true)
    try {
      const response = await fetch(`/api/courses/${course.id}/enrollments`)
      if (response.ok) {
        const data = await response.json()
        setEnrollments(data)
      } else {
        console.error("Failed to fetch enrollments:", response.status)
        setEnrollments([])
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error)
      setEnrollments([])
    } finally {
      setIsLoadingStudents(false)
    }
  }, [course.id])

  // Fetch enrolled students when component mounts (for teacher/admin)
  useEffect(() => {
    if (isTeacherOrAdmin) {
      fetchEnrollments()
    }
  }, [isTeacherOrAdmin, fetchEnrollments])

  const handleRemoveStudent = async (siswaId: string, siswaName: string) => {
    const confirmed = await confirm("Hapus Siswa", {
      description: `Apakah Anda yakin ingin menghapus "${siswaName}" dari course ini?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "warning",
    })

    if (!confirmed) return

    await execute(
      async () => {
        const response = await fetch(
          `/api/courses/${course.id}/enrollments?siswaId=${siswaId}`,
          { method: "DELETE" }
        )
        if (!response.ok) throw new Error("Failed to remove student")
      },
      {
        loadingMessage: "Menghapus siswa...",
        successTitle: "Berhasil!",
        successDescription: "Berhasil menghapus siswa dari course",
        errorTitle: "Gagal",
        autoCloseMs: 1500,
        onSuccess: () => fetchEnrollments(),
      }
    )
  }

  // Handler untuk delete materi
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

  // Handler untuk delete asesmen
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
    <div className="w-full space-y-4 sm:space-y-6">
      <AlertComponent />
      <ActionFeedback />
      
      {/* Dialogs */}
      <EditTeacherDialog
        open={editTeacherOpen}
        onOpenChange={setEditTeacherOpen}
        courseId={course.id}
        currentTeacherId={course.guruId}
      />
      
      <AddStudentDialog
        open={addStudentOpen}
        onOpenChange={setAddStudentOpen}
        courseId={course.id}
        onSuccess={fetchEnrollments}
      />
      
      {/* Course Header - iOS Glass */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl sm:rounded-3xl border border-border/30">
            <img
              src={course.gambar || "/placeholder.svg?height=400&width=700&query=course"}
              alt={course.judul}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <Badge className="mb-2 bg-background/80 text-foreground backdrop-blur-md text-xs sm:mb-3 rounded-lg border-0">
                {course.kategori}
              </Badge>
              <h1 className="text-lg font-bold text-background sm:text-2xl md:text-3xl text-balance">{course.judul}</h1>
            </div>
          </div>
          
          {/* Course Description */}
          {course.deskripsi && (
            <Card className="ios-glass-card border-border/30 rounded-2xl">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base font-semibold mb-3">Deskripsi Course</h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{course.deskripsi}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Course Info Card - iOS Glass */}
        <Card className="ios-glass-card border-border/30 rounded-2xl sm:rounded-3xl">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Informasi Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            {/* Instructor */}
            <div className="flex items-center gap-2 p-2 rounded-xl ios-glass-inset sm:gap-3 sm:p-3">
              <Avatar className="h-9 w-9 border-2 border-background sm:h-11 sm:w-11">
                <AvatarImage src={course.guru?.foto || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs sm:text-sm">
                  {course.guru?.nama
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium sm:text-base">{course.guru?.nama}</p>
                <p className="text-xs text-muted-foreground">Pengajar</p>
              </div>
              {isTeacherOrAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-lg"
                  title="Edit Guru Pengampu"
                  onClick={() => setEditTeacherOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-xl ios-glass-inset p-3 text-center sm:p-4">
                <div className="flex items-center justify-center gap-1.5 text-primary mb-0.5 sm:gap-2 sm:mb-1">
                  <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xl font-bold sm:text-2xl">{filteredMateri?.length || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Materi</p>
              </div>
              <div className="rounded-xl ios-glass-inset p-3 text-center sm:p-4">
                <div className="flex items-center justify-center gap-1.5 text-primary mb-0.5 sm:gap-2 sm:mb-1">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xl font-bold sm:text-2xl">{filteredAsesmen.length}</span>
                </div>
                <p className="text-xs text-muted-foreground">Asesmen</p>
              </div>
            </div>

            {user?.role === "SISWA" && (
              <div className="space-y-1.5 p-2 rounded-xl ios-glass-inset sm:space-y-2 sm:p-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Progress Belajar</span>
                  <span className="font-semibold">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5 sm:h-2" />
                <p className="text-xs text-muted-foreground">
                  {completedCount} dari {filteredMateri?.length || 0} materi selesai
                </p>
              </div>
            )}

            {isTeacherOrAdmin && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 p-2 rounded-xl ios-glass-inset sm:gap-2 sm:p-3">
                  <Users className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">
                    {isLoadingStudents ? "Memuat..." : `${enrollments.length} siswa terdaftar`}
                  </span>
                </div>
                <Button className="w-full rounded-xl" size="sm" asChild>
                  <Link href={`/courses/${course.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Course
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs - iOS Style */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        setTabKey(prev => prev + 1)
      }} className="space-y-4 sm:space-y-6">
        <div className="overflow-visible">
          <TabsList className="ios-tab-list">
            <TabsTrigger value="materials" className="ios-tab-trigger">
              <BookOpen className="ios-tab-icon" />
              <span className="ios-tab-text">Materi</span>
            </TabsTrigger>
            <TabsTrigger value="assessments" className="ios-tab-trigger">
              <FileText className="ios-tab-icon" />
              <span className="ios-tab-text">Asesmen</span>
            </TabsTrigger>
            {isTeacherOrAdmin && (
              <TabsTrigger value="students" className="ios-tab-trigger">
                <Users className="ios-tab-icon" />
                <span className="ios-tab-text">Siswa</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Materials Tab */}
        <TabsContent value="materials" key={`materials-${tabKey}`} className="space-y-3 sm:space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <h2 className="text-base font-semibold sm:text-lg">Materi Pembelajaran</h2>
            {isTeacherOrAdmin && (
              <Button size="sm" className="w-full sm:w-auto rounded-xl" asChild>
                <Link href={`/courses/${course.id}/new?type=materi`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Materi
                </Link>
              </Button>
            )}
          </div>
          <div className="space-y-2 sm:space-y-3">
            {(filteredMateri && filteredMateri.length > 0) ? filteredMateri.map((material, index) => (
              <Link key={material.id} href={`/courses/${course.id}/${material.id}`} className="block">
              <Card className="ios-glass-card border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer group rounded-2xl">
                <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-4">
                  <div className="hidden items-center justify-center text-xs font-medium text-muted-foreground sm:flex sm:h-10 sm:w-10 sm:text-sm">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap sm:gap-2">
                      <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors sm:text-base">{material.judul}</h4>
                      {/* Show enrollment badges */}
                      {material.kelasTarget && material.kelasTarget.length > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          {material.kelasTarget.length} kelas enrolled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Semua siswa
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 sm:text-sm">{material.deskripsi}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground sm:mt-1.5 sm:gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(material.tgl_unggah).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {material.kelasTarget && material.kelasTarget.length > 0 && (
                        <span className="hidden sm:block text-xs">
                          Enrolled: {material.kelasTarget.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0 sm:gap-2" onClick={(e) => e.preventDefault()}>
                    {/* Dropdown Menu for Edit/Delete */}
                    {isTeacherOrAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/courses/${course.id}/${material.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Materi
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
                </CardContent>
              </Card>
              </Link>
            )) : (
              <Card className="border-dashed border-border/30 ios-glass-card rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center sm:py-12">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 sm:h-14 sm:w-14">
                    <BookOpen className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold sm:text-base">Belum ada materi</h3>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground sm:mt-1.5 sm:text-sm">
                    Materi untuk course ini akan muncul di sini
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" key={`assessments-${tabKey}`} className="space-y-3 sm:space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <h2 className="text-base font-semibold sm:text-lg">Daftar Asesmen</h2>
            {isTeacherOrAdmin && (
              <Button size="sm" className="w-full sm:w-auto rounded-xl" asChild>
                <Link href={`/courses/${course.id}/new?type=asesmen`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Asesmen
                </Link>
              </Button>
            )}
          </div>
          {assessments.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {filteredAsesmen.map((assessment) => (
                <Link key={assessment.id} href={`/courses/${course.id}/${assessment.id}`} className="block">
                <Card className="ios-glass-card border-border/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group rounded-2xl">
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap sm:gap-2 mb-1">
                          <CardTitle className="text-sm group-hover:text-primary transition-colors sm:text-base">{assessment.nama}</CardTitle>
                          {/* Show enrollment badges */}
                          {assessment.kelasTarget && assessment.kelasTarget.length > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {assessment.kelasTarget.length} kelas enrolled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Semua siswa
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                          {assessment.deskripsi}
                        </CardDescription>
                        {assessment.kelasTarget && assessment.kelasTarget.length > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Enrolled: {assessment.kelasTarget.slice(0, 2).join(", ")}
                            {assessment.kelasTarget.length > 2 && ` +${assessment.kelasTarget.length - 2} kelas lainnya`}
                          </div>
                        )}
                      </div>
                      {isTeacherOrAdmin && (
                        <div onClick={(e) => e.preventDefault()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/courses/${course.id}/${assessment.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Asesmen
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
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Badge variant={assessment.tipe === 'KUIS' ? 'default' : 'secondary'}>
                        {assessment.tipe === 'KUIS' ? 'Kuis' : 'Tugas'}
                      </Badge>
                      {assessment.tgl_selesai && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(assessment.tgl_selesai).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border/30 ios-glass-card rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center sm:py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 sm:h-14 sm:w-14">
                  <FileText className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <h3 className="mt-4 text-sm font-semibold sm:text-base">Belum ada asesmen</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground sm:mt-1.5 sm:text-sm">
                  Asesmen untuk course ini akan muncul di sini
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Students Tab (Teachers/Admin only) */}
        {isTeacherOrAdmin && (
          <TabsContent value="students" key={`students-${tabKey}`} className="space-y-3 sm:space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold sm:text-lg">Siswa Terdaftar</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs rounded-lg">
                  {enrollments.length} Siswa
                </Badge>
                <Button size="sm" className="gap-2 rounded-xl" onClick={() => setAddStudentOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Tambah Siswa</span>
                </Button>
              </div>
            </div>
            <Card className="ios-glass-card border-border/30 rounded-2xl">
              <CardContent className="p-0">
                {isLoadingStudents ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Memuat data siswa...
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Belum ada siswa yang terdaftar di course ini
                    </p>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setAddStudentOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Tambah Siswa Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {groupedEnrollments.map((group) => (
                      <div key={group.kelas}>
                        {/* Class Header */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border/50 sm:px-5 sm:py-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                            <span className="text-xs font-semibold text-foreground sm:text-sm">{group.kelas}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {group.students.length} siswa
                          </Badge>
                        </div>
                        {/* Students in this class */}
                        <div className="divide-y divide-border/50">
                          {group.students.map((enrollment) => (
                            <div
                              key={enrollment.id}
                              className="flex items-center justify-between p-3 sm:p-4 hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="rounded-lg p-1 hover:bg-accent/70 transition-colors">
                                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer">
                                        <AvatarImage
                                          src={enrollment.siswa.foto || undefined}
                                          alt={enrollment.siswa.nama}
                                        />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                                          {enrollment.siswa.nama
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent side="right" align="start" className="w-72 p-0" sideOffset={8}>
                                    <div className="p-4 space-y-3">
                                      {/* Student Profile Header */}
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                                          <AvatarImage
                                            src={enrollment.siswa.foto || undefined}
                                            alt={enrollment.siswa.nama}
                                          />
                                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                            {enrollment.siswa.nama
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold truncate">{enrollment.siswa.nama}</p>
                                          <div className="flex items-center gap-1 mt-0.5">
                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground truncate">{enrollment.siswa.email}</p>
                                          </div>
                                          {enrollment.siswa.kelas && (
                                            <Badge variant="secondary" className="mt-1 text-xs">
                                              {enrollment.siswa.kelas}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      {/* Stats */}
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-lg bg-muted/50 p-2 text-center">
                                          <p className="text-sm font-semibold text-primary">{enrollment.progress}%</p>
                                          <p className="text-xs text-muted-foreground">Progress</p>
                                        </div>
                                        <div className="rounded-lg bg-muted/50 p-2 text-center">
                                          <p className="text-sm font-semibold text-primary">{enrollment.averageGrade}%</p>
                                          <p className="text-xs text-muted-foreground">Rata-rata Nilai</p>
                                        </div>
                                      </div>
                                      {/* View Profile Button */}
                                      <Button size="sm" className="w-full gap-2 rounded-lg" asChild>
                                        <Link href={`/profile/${enrollment.siswa.id}`}>
                                          <Eye className="h-4 w-4" />
                                          Lihat Profil
                                        </Link>
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium sm:text-base truncate">
                                    {enrollment.siswa.nama}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 sm:gap-2 sm:mt-1">
                                    <Progress
                                      value={enrollment.progress}
                                      className="h-1 w-16 sm:h-1.5 sm:w-24"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {enrollment.progress}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-primary sm:text-base">
                                    {enrollment.averageGrade}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">Nilai</p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleRemoveStudent(
                                          enrollment.siswa.id,
                                          enrollment.siswa.nama
                                        )
                                      }
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Hapus dari Course
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Add Student Dialog */}
    </div>
  )
}
