"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar,
  Clock,
  Users,
  FileText,
  Download,
  Settings,
  BookOpen,
  Code,
  TestTube,
  Rocket,
  Award
} from "lucide-react"
import Link from "next/link"
import { format, isPast, isFuture, isWithinInterval } from "date-fns"
import { id as idLocale, enUS } from "date-fns/locale"
import { AnimateIn } from "@/components/ui/animate-in"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import ProjectGroupsManagement from "@/components/project-groups-management"
import { SINTAKS_MAP, getSintaksInfo } from "@/lib/constants/project"

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
  }>
  _count: {
    kelompok: number
  }
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const { user } = useAuth()
  const { t, locale } = useAutoTranslate()
  const { error: showError, AlertComponent } = useAdaptiveAlert()
  
  const [proyek, setProyek] = useState<Proyek | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const isTeacher = user?.role === "GURU"
  const dateLocale = locale === 'id' ? idLocale : enUS

  const loadProyek = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/proyek/${projectId}`)
      const data = await response.json()

      if (response.ok) {
        setProyek(data.proyek)
      } else {
        showError(t("Gagal"), data.error || t("Gagal memuat data PBL"))
      }
    } catch (error) {
      console.error("Error loading proyek:", error)
      showError(t("Error"), t("Terjadi kesalahan saat memuat data"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProyek()
  }, [projectId])

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

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 rounded shrink-0"></div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4 max-w-[384px]"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2 max-w-[256px]"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 sm:h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 sm:h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!proyek) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("PBL tidak ditemukan")}</h3>
            <p className="text-muted-foreground mb-4">{t("PBL yang Anda cari tidak ada atau telah dihapus")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = getProjectStatus(proyek.tgl_mulai, proyek.tgl_selesai)
  const totalSiswa = proyek.kelompok.reduce((sum, k) => sum + k.anggota.length, 0)
  
  // Get active sintaks phases for this project
  const activeSintaksPhases = proyek.sintaks
    .map(sintaksKey => getSintaksInfo(sintaksKey))
  .filter((p): p is NonNullable<ReturnType<typeof getSintaksInfo>> => Boolean(p))
    .sort((a, b) => a.order - b.order)

  return (
    <div className="w-full">
      <AlertComponent />
      
      {/* Header */}
      <AnimateIn>
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl font-bold sm:text-2xl md:text-3xl line-clamp-2">{proyek.judul}</h1>
              {getStatusBadge(status)}
            </div>
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-3">{proyek.deskripsi}</p>
            
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">{format(new Date(proyek.tgl_mulai), 'dd MMM', { locale: dateLocale })} - {format(new Date(proyek.tgl_selesai), 'dd MMM yyyy', { locale: dateLocale })}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">{proyek.guru.nama}</span>
              </div>
            </div>
          </div>
          {isTeacher && (
            <div className="flex gap-2 w-full sm:w-auto">
              {proyek.lampiran && (
                <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                  <a href={proyek.lampiran} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t("Unduh Lampiran")}</span>
                  </a>
                </Button>
              )}
              <Link href={`/projects/edit/${proyek.id}`} className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("Edit PBL")}</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </AnimateIn>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8 lg:grid-cols-4">
        <AnimateIn stagger={1}>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-6">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold sm:text-2xl">{proyek._count.kelompok}</p>
                <p className="text-[10px] text-muted-foreground sm:text-sm">{t("Total Kelompok")}</p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
        <AnimateIn stagger={2}>
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
        <AnimateIn stagger={3}>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-6">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2 sm:p-3">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg font-bold sm:text-2xl">{status === "active" ? t("Aktif") : status === "completed" ? t("Selesai") : t("Menunggu")}</p>
                <p className="text-[10px] text-muted-foreground sm:text-sm">{t("Status PBL")}</p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
        <AnimateIn stagger={4}>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-6">
              <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-2 sm:p-3">
                <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-lg font-bold sm:text-2xl">{activeSintaksPhases.length}</p>
                <p className="text-[10px] text-muted-foreground sm:text-sm">{t("Tahapan Aktif")}</p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
      </div>

      {/* Main Content */}
      <AnimateIn stagger={1}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-visible">
            <TabsList className="ios-tab-list">
              <TabsTrigger value="overview" className="ios-tab-trigger">
                <BookOpen className="ios-tab-icon" />
                <span className="ios-tab-text">{t("Overview")}</span>
              </TabsTrigger>
              <TabsTrigger value="kelompok" className="ios-tab-trigger">
                <Users className="ios-tab-icon" />
                <span className="ios-tab-text">{t("Kelompok")}</span>
              </TabsTrigger>
              {activeSintaksPhases.map((phase) => (
                <TabsTrigger key={phase.key} value={phase.key} className="ios-tab-trigger">
                  {phase.icon} <span className="ios-tab-text">{t(phase.title)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Informasi PBL")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">{t("Deskripsi")}</h4>
                    <p className="text-sm text-muted-foreground">{proyek.deskripsi}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">{t("Tanggal Mulai")}</h4>
                      <p className="text-muted-foreground">
                        {format(new Date(proyek.tgl_mulai), 'dd MMMM yyyy', { locale: dateLocale })}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">{t("Tanggal Selesai")}</h4>
                      <p className="text-muted-foreground">
                        {format(new Date(proyek.tgl_selesai), 'dd MMMM yyyy', { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">{t("Guru Pengampu")}</h4>
                    <p className="text-muted-foreground">{proyek.guru.nama}</p>
                    <p className="text-sm text-muted-foreground">{proyek.guru.email}</p>
                  </div>
                  {proyek.lampiran && (
                    <div>
                      <h4 className="font-medium mb-2">{t("Lampiran")}</h4>
                      <Button variant="outline" size="sm" asChild>
                        <a href={proyek.lampiran} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          {t("Unduh File")}
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sintaks Phases */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Tahapan Aktif")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeSintaksPhases.map((phase, index) => (
                      <div 
                        key={phase.key}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setActiveTab(phase.key)}
                      >
                        <div className="rounded-lg bg-primary/10 p-2 mt-1">
                          <span className="text-base">{phase.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{t(phase.title)}</h4>
                          <p className="text-sm text-muted-foreground">{t(phase.description)}</p>
                        </div>
                        <Badge variant="outline">{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="kelompok">
            <ProjectGroupsManagement proyekId={projectId} />
          </TabsContent>

          {activeSintaksPhases.map((phase) => (
            <TabsContent key={phase.key} value={phase.key}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{phase.icon}</span>
                    {t("Tahap")} {phase.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">{phase.icon}</span>
                    <h3 className="text-lg font-semibold mb-2">{t("Tahap")} {phase.title}</h3>
                    <p className="text-muted-foreground mb-4">{t(phase.description)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("Konten untuk tahap ini akan segera tersedia")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </AnimateIn>
    </div>
  )
}
