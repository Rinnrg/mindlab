"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { useBreadcrumbPage } from "@/hooks/use-breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Clock,
  BookOpen,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { format, isPast, isFuture, isWithinInterval } from "date-fns"
import { id as idLocale, enUS } from "date-fns/locale"
import { AnimateIn } from "@/components/ui/animate-in"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { SINTAKS_MAP } from "@/lib/constants/project"

interface Proyek {
  id: string
  judul: string
  deskripsi: string
  tgl_mulai: string
  tgl_selesai: string
  lampiran?: string
  sintaks: string[]
  guru: {
    id: string
    nama: string
    email: string
  }
  kelompok: Array<{
    id: string
    nama: string
    anggota: Array<{
      siswa: {
        id: string
        nama: string
        kelas?: string
      }
    }>
    _count: {
      anggota: number
    }
  }>
  _count: {
    kelompok: number
  }
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const { t, locale } = useAutoTranslate()
  const { error: showError, confirm, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  
  // Set custom breadcrumb with useMemo to prevent re-renders
  const breadcrumbItems = useMemo(() => [
    {
      label: 'Proyek',
      icon: <BookOpen className="h-4 w-4" />
    }
  ], [])
  
  useBreadcrumbPage('Proyek', breadcrumbItems)
  
  const [proyeks, setProyeks] = useState<Proyek[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const isTeacher = user?.role === "GURU"
  const dateLocale = locale === 'id' ? idLocale : enUS

  const loadProyeks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (isTeacher && user?.id) {
        params.append('guruId', user.id)
      }

      const response = await fetch(`/api/proyek?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProyeks(data.proyek || [])
      } else {
        showError(t("Gagal"), data.error || t("Gagal memuat data proyek"))
      }
    } catch (error) {
      console.error("Error loading proyeks:", error)
      showError(t("Error"), t("Terjadi kesalahan saat memuat data"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProyeks()
  }, [user])

  const getProjectStatus = (tglMulai: string, tglSelesai: string) => {
    const now = new Date()
    const startDate = new Date(tglMulai)
    const endDate = new Date(tglSelesai)

    if (isPast(endDate)) return "completed"
    if (isFuture(startDate)) return "upcoming"
    if (isWithinInterval(now, { start: startDate, end: endDate })) return "active"
    return "upcoming"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{t("Sedang Berjalan")}</Badge>
      case "completed":
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">{t("Selesai")}</Badge>
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{t("Akan Datang")}</Badge>
      default:
        return null
    }
  }

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    const confirmed = await confirm(t("Hapus Proyek"), {
      description: t("Apakah Anda yakin ingin menghapus proyek") + ` "${projectTitle}"? ` + t("Tindakan ini tidak dapat dibatalkan."),
      confirmText: t("Hapus"),
      cancelText: t("Batal"),
      type: "warning",
    })

    if (!confirmed) return

    await execute(
      async () => {
        const response = await fetch(`/api/proyek/${projectId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || t("Gagal menghapus proyek"))
        }
      },
      {
        loadingMessage: t("Menghapus proyek..."),
        successTitle: t("Berhasil!"),
        successDescription: `"${projectTitle}" ${t("berhasil dihapus")}`,
        errorTitle: t("Gagal"),
        autoCloseMs: 1500,
        onSuccess: () => {
          loadProyeks()
          router.refresh()
        },
      }
    )
  }

  const filteredProyeks = proyeks.filter(proyek =>
    proyek.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proyek.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proyek.guru.nama.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate stats
  const totalProyeks = proyeks.length
  const activeProyeks = proyeks.filter(p => getProjectStatus(p.tgl_mulai, p.tgl_selesai) === "active").length
  const totalKelompok = proyeks.reduce((sum, p) => sum + p._count.kelompok, 0)
  const totalSiswa = proyeks.reduce((sum, p) => 
    sum + p.kelompok.reduce((kelompokSum, k) => kelompokSum + k._count.anggota, 0), 0
  )

  return (
    <div className="w-full">
      <AlertComponent />
      <ActionFeedback />
      
      {/* Header */}
      <AnimateIn>
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">{t("Proyek")}</h1>
            <p className="text-sm text-muted-foreground mt-1 sm:text-base">
              {isTeacher ? t("Kelola dan pantau proyek pembelajaran") : t("Lihat dan kerjakan proyek yang diberikan")}
            </p>
          </div>
          {isTeacher && (
            <Link href="/projects/add">
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                {t("Buat Proyek")}
              </Button>
            </Link>
          )}
        </div>
      </AnimateIn>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8 lg:grid-cols-4">
        <AnimateIn stagger={1}>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-6">
              <div className="rounded-lg bg-primary/10 p-2 sm:p-3">
                <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold sm:text-2xl">{totalProyeks}</p>
                <p className="text-[10px] text-muted-foreground sm:text-sm">{t("Total Proyek")}</p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
        <AnimateIn stagger={2}>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-6">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2 sm:p-3">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg font-bold sm:text-2xl">{activeProyeks}</p>
                <p className="text-[10px] text-muted-foreground sm:text-sm">{t("Sedang Berjalan")}</p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
        <AnimateIn stagger={3}>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-6">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold sm:text-2xl">{totalKelompok}</p>
                <p className="text-[10px] text-muted-foreground sm:text-sm">{t("Total Kelompok")}</p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
        <AnimateIn stagger={4}>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-6">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-3">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-lg font-bold sm:text-2xl">{totalSiswa}</p>
                <p className="text-[10px] text-muted-foreground sm:text-sm">{t("Siswa Terlibat")}</p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
      </div>

      {/* Search */}
      <AnimateIn>
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("Cari proyek...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </AnimateIn>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProyeks.length === 0 ? (
        <AnimateIn>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("Belum ada proyek")}</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? t("Tidak ada proyek yang cocok dengan pencarian") : 
                 isTeacher ? t("Mulai dengan membuat proyek pertama") : t("Belum ada proyek yang diberikan")}
              </p>
              {isTeacher && !searchQuery && (
                <Link href="/projects/add">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("Buat Proyek")}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </AnimateIn>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProyeks.map((proyek, index) => {
            const status = getProjectStatus(proyek.tgl_mulai, proyek.tgl_selesai)
            
            return (
              <AnimateIn key={proyek.id} stagger={index + 1}>
                <Card className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2 mb-1">{proyek.judul}</CardTitle>
                        <CardDescription className="line-clamp-2">{proyek.deskripsi}</CardDescription>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {getStatusBadge(status)}
                        {isTeacher && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/projects/${proyek.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t("Lihat Detail")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/projects/edit/${proyek.id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t("Edit")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteProject(proyek.id, proyek.judul)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("Hapus")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{format(new Date(proyek.tgl_mulai), 'dd MMM', { locale: dateLocale })} - {format(new Date(proyek.tgl_selesai), 'dd MMM yyyy', { locale: dateLocale })}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="text-xs">
                            {proyek.guru.nama.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">{proyek.guru.nama}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t gap-2">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span>{proyek._count.kelompok} {t("Kelompok")}</span>
                        <span>
                          {proyek.kelompok.reduce((sum, k) => sum + k._count.anggota, 0)} {t("Siswa")}
                        </span>
                        <span>{proyek.sintaks.length} {t("Tahapan")}</span>
                      </div>
                      <Link href={`/projects/${proyek.id}`}>
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                          {t("Lihat Detail")}
                        </Button>
                      </Link>
                    </div>

                    {/* Sintaks badges */}
                    <div className="flex flex-wrap gap-1 pt-3 border-t">
                      {proyek.sintaks.slice(0, 3).map((sintaksKey) => {
                        const sintaksInfo = SINTAKS_MAP[sintaksKey]
                        return sintaksInfo ? (
                          <Badge key={sintaksKey} variant="secondary" className="text-xs">
                            {sintaksInfo.icon} {t(sintaksInfo.title)}
                          </Badge>
                        ) : null
                      })}
                      {proyek.sintaks.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{proyek.sintaks.length - 3} {t("lagi")}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </AnimateIn>
            )
          })}
        </div>
      )}
    </div>
  )
}
