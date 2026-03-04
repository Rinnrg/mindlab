"use client"

import { useAuth } from "@/lib/auth-context"
import { StatsCard } from "@/components/ui/stats-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { redirect } from "next/navigation"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  BookOpen,
  FileText,
  TrendingUp,
  Users,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId, enUS } from "date-fns/locale"
import { DashboardSkeleton } from "@/components/ui/loading-skeletons"
import { fetchJSON } from "@/lib/fetch-cache"

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  // FIX: Rename 'locale' menjadi 'currentLocale' untuk menghindari konflik nama variabel
  const { t, locale: currentLocale } = useAutoTranslate()
  
  // FIX: Tentukan objek locale date-fns berdasarkan currentLocale string
  const dateFnsLocale = currentLocale === 'id' ? localeId : enUS

  // State untuk data dari API
  const [stats, setStats] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [scheduleEvents, setScheduleEvents] = useState<any[]>([])
  const [asesmenList, setAsesmenList] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  const fetchDashboardData = useCallback(async () => {
    if (!user) return

    // Abort previous request if still running
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      setLoading(true)
      
      // Fetch semua data secara paralel dengan client-side caching (60s TTL)
      const [statsData, coursesData, scheduleData, asesmenData, activityData] = await Promise.all([
        fetchJSON(`/api/stats?userId=${user.id}&role=${user.role}`, 60000),
        user.role === 'SISWA' 
          ? fetchJSON(`/api/courses?siswaId=${user.id}`, 300000)
          : user.role === 'GURU'
          ? fetchJSON(`/api/courses?guruId=${user.id}`, 300000)
          : fetchJSON('/api/courses', 300000),
        fetchJSON(`/api/schedule?userId=${user.id}&role=${user.role}`, 180000),
        user.role === 'GURU'
          ? fetchJSON(`/api/asesmen?guruId=${user.id}`, 120000)
          : fetchJSON('/api/asesmen', 120000),
        fetchJSON(`/api/activity?userId=${user.id}&role=${user.role}`, 60000),
      ])

      // Set semua state in one batch
      setStats(statsData.stats)
      setCourses(coursesData.courses || [])
      setScheduleEvents(scheduleData.schedule || [])
      setAsesmenList(asesmenData.asesmen || [])
      setActivities(activityData.activities || [])

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchDashboardData()
    return () => { abortRef.current?.abort() }
  }, [fetchDashboardData])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Redirect to login if not authenticated (after auth is loaded)
  if (!authLoading && !user) {
    redirect("/login")
  }

  // Add safety check - this should not happen due to redirect above
  if (!user) {
    return null
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t("Selamat Pagi")
    if (hour < 18) return t("Selamat Siang")
    return t("Selamat Malam")
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return currentLocale === 'id' ? 'Baru saja' : 'Just now'
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return currentLocale === 'id' ? `${minutes} menit lalu` : `${minutes}m ago`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return currentLocale === 'id' ? `${hours} jam lalu` : `${hours}h ago`
    }
    const days = Math.floor(diffInSeconds / 86400)
    if (days === 1) return t("Kemarin")
    if (days < 7) return currentLocale === 'id' ? `${days} hari lalu` : `${days} days ago`
    if (days < 30) {
      const weeks = Math.floor(days / 7)
      return currentLocale === 'id' ? `${weeks} minggu lalu` : `${weeks} weeks ago`
    }
    return format(date, "d MMM yyyy", { locale: dateFnsLocale })
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">{greeting()}</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">{user.nama.split(" ")[0]}</h1>
          <p className="max-w-md text-xs text-muted-foreground sm:text-[15px]">
            {user.role === "SISWA" && t("Pantau perkembangan belajar Anda")}
            {user.role === "GURU" && t("Kelola kursus dan materi pembelajaran")}
            {user.role === "ADMIN" && t("Ringkasan Sistem")}
          </p>
        </div>
        {user.role === "GURU" && (
          <Button asChild className="w-full sm:w-fit" size="sm">
            <Link href="/courses/add">
              {t("Buat Kursus")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {user.role === "SISWA" && stats && (
          <>
            <StatsCard
              title={t("Kursus Diikuti")}
              value={stats.coursesCount || 0}
              icon={BookOpen}
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title={t("Selesai")}
              value={stats.asesmenCount || 0}
              icon={CheckCircle2}
              iconColor="bg-success/10"
            />
            <StatsCard
              title={t("Tertunda")}
              value={stats.proyekCount || 0}
              icon={AlertCircle}
              iconColor="bg-warning/10"
            />
            <StatsCard
              title={t("Nilai Rata-rata")}
              value={`${Math.round(stats.avgNilai || 0)}%`}
              icon={TrendingUp}
              trend={{ value: 5, isPositive: true }}
            />
          </>
        )}
        {user.role === "GURU" && stats && (
          <>
            <StatsCard
              title={t("Kursus Aktif")}
              value={stats.coursesCount || 0}
              icon={BookOpen}
            />
            <StatsCard title={t("Siswa")} value={stats.studentsCount || 0} icon={Users} />
            <StatsCard
              title={t("Menunggu Review")}
              value={stats.proyekCount || 0}
              icon={FileText}
              iconColor="bg-warning/10"
            />
            <StatsCard
              title={t("Asesmen")}
              value={stats.asesmenCount || 0}
              icon={GraduationCap}
            />
          </>
        )}
        {user.role === "ADMIN" && stats && (
          <>
            <StatsCard
              title={t("Total Pengguna")}
              value={stats.usersCount || 0}
              icon={Users}
              trend={{ value: 8, isPositive: true }}
            />
            <StatsCard
              title={t("Kursus")}
              value={stats.coursesCount || 0}
              icon={BookOpen}
            />
            <StatsCard
              title={t("Siswa Aktif")}
              value={stats.usersByRole?.SISWA || 0}
              icon={GraduationCap}
            />
            <StatsCard
              title={t("Instruktur")}
              value={stats.usersByRole?.GURU || 0}
              icon={Users}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <div className="space-y-3 sm:space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold sm:text-lg">
                {user.role === "SISWA" ? t("Lanjutkan Belajar") : t("Kursus Anda")}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {user.role === "SISWA" ? t("Ambil di mana Anda tinggalkan") : t("Baru Diperbarui")}
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/courses">
                {t("Lihat Semua")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {courses.slice(0, 3).map((course, index) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group flex gap-3 rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-border hover:shadow-sm sm:gap-4 sm:p-4"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-20 sm:w-32">
                  <img
                    src={course.gambar || "/placeholder.svg?height=80&width=128&query=course"}
                    alt={course.judul}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {user.role === "SISWA" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
                      <Play
                        className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100 sm:h-8 sm:w-8"
                        fill="white"
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium leading-snug group-hover:text-primary line-clamp-1 sm:text-base">
                        {course.judul}
                      </h3>
                      <Badge variant="secondary" className="shrink-0 text-[10px] hidden sm:flex">
                        {course.kategori}
                      </Badge>
                    </div>
                    {course.guru && (
                      <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{course.guru.nama}</p>
                    )}
                  </div>
                  {user.role === "SISWA" && (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Progress value={course.progress || (30 + index * 20)} className="h-1 flex-1 sm:h-1.5" />
                      <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                        {course.progress || (30 + index * 20)}%
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <Card className="border-border/50 p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h3 className="text-sm font-semibold sm:text-base">{t("Mendatang")}</h3>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-6 text-[10px] text-muted-foreground sm:h-7 sm:text-xs"
              >
                <Link href="/schedule">{t("Lihat Kalender")}</Link>
              </Button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {scheduleEvents.slice(0, 4).map((event) => (
                <div key={event.id} className="flex items-start gap-2 sm:gap-3">
                  <div
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2 ${
                      event.type === 'assessment' ? 'bg-indigo-500' : 
                      event.type === 'project' ? 'bg-emerald-500' : 
                      'bg-muted-foreground'
                    }`}
                  />
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <p className="text-xs font-medium leading-tight sm:text-sm line-clamp-1">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground sm:text-xs">
                      {format(new Date(event.date), "d MMM, HH:mm", { locale: dateFnsLocale })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {(user.role === "ADMIN" || user.role === "GURU" || user.role === "SISWA") && (
            <Card className="border-border/50 p-3 sm:p-5">
              <h3 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
                {user.role === "SISWA" ? t("Siap Dikerjakan") : t("Asesmen Terbaru")}
              </h3>
              <div className="space-y-2">
                {asesmenList.slice(0, 3).map((asesmen) => {
                  // Determine status for siswa
                  const isOverdue = asesmen.tgl_selesai && new Date(asesmen.tgl_selesai) < new Date()
                  const isCompleted = asesmen.isCompleted || false // This should come from API
                  
                  // Calculate border and background color based on status
                  let borderColor = 'border-border/50'
                  let bgColor = 'bg-muted/30'
                  let statusLabel = ''
                  
                  if (user.role === "SISWA") {
                    if (isCompleted) {
                      borderColor = 'border-green-500/50'
                      bgColor = 'bg-green-50 dark:bg-green-950/20'
                      statusLabel = ''
                    } else if (isOverdue) {
                      borderColor = 'border-red-500'
                      bgColor = 'bg-muted/30'
                      statusLabel = t("Terlambat")
                    }
                  }
                  
                  return (
                    <div
                      key={asesmen.id}
                      className={`flex items-center justify-between gap-2 rounded-lg border ${borderColor} ${bgColor} p-2 transition-colors hover:bg-muted/50 sm:gap-3 sm:p-3`}
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-xs sm:text-sm">
                          <span className="font-medium">{asesmen.nama}</span>{" "}
                          <span className="text-muted-foreground line-clamp-1">
                            {asesmen.course?.judul || asesmen.course?.kategori}
                          </span>
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground sm:gap-2 sm:text-xs">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {asesmen.durasi}m<span className="text-border">•</span>
                          {asesmen.jml_soal} {t("Soal")}
                          {statusLabel && user.role === "SISWA" && (
                            <>
                              <span className="text-border">•</span>
                              <span className="text-red-500 font-medium">{statusLabel}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={user.role === "SISWA" ? (isCompleted ? "outline" : "default") : "ghost"}
                        className="h-6 text-[10px] shrink-0 sm:h-7 sm:text-xs"
                        asChild
                      >
                        <Link href={`/courses/${asesmen.courseId}/asesmen/${asesmen.id}`}>
                          {user.role === "SISWA" ? (isCompleted ? t("Lihat") : t("Mulai")) : t("Edit")}
                        </Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Activity - Full width */}
      {(user.role === "ADMIN" || user.role === "GURU" || user.role === "SISWA") && (
        <Card className="border-border/50 p-3 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">{t("Aktivitas Terbaru")}</h3>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {activities.slice(0, 4).map((activity, index) => (
              <div key={index} className="flex items-start gap-2 rounded-lg bg-muted/30 p-2 sm:gap-3 sm:p-3">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs sm:text-sm">
                    <span className="font-medium capitalize">{activity.action}</span>{" "}
                    <span className="text-muted-foreground line-clamp-1">{activity.item}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">
                    {formatTimeAgo(activity.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}