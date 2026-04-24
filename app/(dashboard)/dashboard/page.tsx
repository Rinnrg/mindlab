"use client"

import { useAuth } from "@/lib/auth-context"
import { StatsCard } from "@/components/ui/stats-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AnimateIn } from "@/components/ui/animate-in"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { DashboardSkeleton } from "@/components/ui/loading-skeletons"
import { useTransitionRouter } from "@/hooks/use-transition-router"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
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
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeId, enUS } from "date-fns/locale"
// Globe feature removed

export default function DashboardPage() {
  const { user } = useAuth()
  const { t, locale: currentLocale } = useAutoTranslate()
  const dateLocale = currentLocale === 'id' ? localeId : enUS
  const router = useTransitionRouter()

  // State untuk data dari API
  const [stats, setStats] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [scheduleEvents, setScheduleEvents] = useState<any[]>([])
  const [asesmenList, setAsesmenList] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Globe feature removed

  // Update jam real-time setiap detik
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch semua data secara paralel untuk performa optimal
        const [statsRes, coursesRes, scheduleRes, asesmenRes, activityRes] = await Promise.all([
          fetch(`/api/stats?userId=${user.id}&role=${user.role}`, { 
            next: { revalidate: 60 } 
          }),
          user.role === 'ADMIN'
            ? Promise.resolve(new Response(JSON.stringify({ courses: [] }), { status: 200 }))
            : user.role === 'SISWA' 
            ? fetch(`/api/courses?siswaId=${user.id}`, { next: { revalidate: 300 } })
            : user.role === 'GURU'
            ? fetch(`/api/courses?guruId=${user.id}`, { next: { revalidate: 300 } })
            : fetch('/api/courses', { next: { revalidate: 300 } }),
          fetch(`/api/schedule?userId=${user.id}&role=${user.role}`, { 
            next: { revalidate: 180 } 
          }),
          user.role === 'ADMIN'
            ? Promise.resolve(new Response(JSON.stringify({ asesmen: [] }), { status: 200 }))
            : user.role === 'GURU'
            ? fetch(`/api/asesmen?guruId=${user.id}`, { next: { revalidate: 120 } })
            : user.role === 'SISWA'
            ? fetch(`/api/asesmen?siswaId=${user.id}`, { next: { revalidate: 120 } })
            : fetch('/api/asesmen', { next: { revalidate: 120 } }),
          fetch(`/api/activity?userId=${user.id}&role=${user.role}`, { 
            next: { revalidate: 60 } 
          }),
        ])

        // Parse semua response secara paralel dengan error handling
        const [statsData, coursesData, scheduleData, asesmenData, activityData] = await Promise.all([
          statsRes.ok ? statsRes.json() : { stats: null },
          coursesRes.ok ? coursesRes.json() : { courses: [] },
          scheduleRes.ok ? scheduleRes.json() : { schedule: [] },
          asesmenRes.ok ? asesmenRes.json() : { asesmen: [] },
          activityRes.ok ? activityRes.json() : { activities: [] },
        ])

        // Set semua state
        setStats(statsData.stats)
        setCourses(coursesData.courses || [])
        setScheduleEvents(scheduleData.schedule || [])
        setAsesmenList(asesmenData.asesmen || [])
        setActivities(activityData.activities || [])

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  // Show loading while checking auth or fetching data
  if (!user || loading) {
    return <DashboardSkeleton />
  }

  const greeting = () => {
    const hour = currentTime.getHours()
    if (hour >= 5 && hour < 11) return t("Selamat Pagi")
    if (hour >= 11 && hour < 15) return t("Selamat Siang")
    if (hour >= 15 && hour < 18) return t("Selamat Sore")
    return t("Selamat Malam")
  }

  // Warna berdasarkan waktu untuk welcome card
  const getTimeBasedColors = () => {
    const hour = currentTime.getHours()
    if (hour >= 5 && hour < 11) {
      return {
        text: "text-yellow-600 dark:text-yellow-400",
        gradient: "from-yellow-400 to-orange-500",
        cardBg: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20",
        cardBorder: "border-yellow-200 dark:border-yellow-800",
      }
    }
    if (hour >= 11 && hour < 15) {
      return {
        text: "text-blue-600 dark:text-blue-400",
        gradient: "from-blue-400 to-cyan-500",
        cardBg: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
        cardBorder: "border-blue-200 dark:border-blue-800",
      }
    }
    if (hour >= 15 && hour < 18) {
      return {
        text: "text-orange-600 dark:text-orange-400",
        gradient: "from-orange-400 to-red-500",
        cardBg: "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20",
        cardBorder: "border-orange-200 dark:border-orange-800",
      }
    }
    return {
      text: "text-indigo-600 dark:text-indigo-400",
      gradient: "from-indigo-400 to-purple-500",
      cardBg: "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20",
      cardBorder: "border-indigo-200 dark:border-indigo-800",
    }
  }

  // Posisi matahari/bulan berdasarkan waktu (arc movement)
  const getCelestialPosition = () => {
    const hour = currentTime.getHours()
    const minute = currentTime.getMinutes()
    const totalMinutes = hour * 60 + minute

    let position = { x: 0, y: 0 }

    if (hour >= 5 && hour < 18) {
      const sunStart = 5 * 60
      const sunEnd = 18 * 60
      const elapsed = totalMinutes - sunStart
      const progress = elapsed / (sunEnd - sunStart)
      const angle = Math.PI * progress
      position.x = Math.sin(angle) * 50
      position.y = -Math.sin(angle) * 40
    } else {
      let moonMinutes = totalMinutes
      if (hour < 5) moonMinutes = totalMinutes + 24 * 60
      const moonStart = 18 * 60
      const moonEnd = 29 * 60
      const elapsed = moonMinutes - moonStart
      const progress = elapsed / (moonEnd - moonStart)
      const angle = Math.PI * progress
      position.x = Math.sin(angle) * 50
      position.y = -Math.sin(angle) * 40
    }

    return position
  }

  const timeColors = getTimeBasedColors()
  const celestialPos = getCelestialPosition()
  const isSunTime = currentTime.getHours() >= 5 && currentTime.getHours() < 18

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
    return format(date, "d MMM yyyy", { locale: dateLocale })
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 md:space-y-8 pb-16 sm:pb-8">
      {/* Welcome Card dengan Animasi Matahari/Bulan */}
      <AnimateIn stagger={1}>
        <Card className={`${timeColors.cardBg} border-2 ${timeColors.cardBorder} transition-all duration-1000 ease-in-out relative overflow-hidden`}>
          {/* Sky Background */}
          <div className={`absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none ${
            isSunTime
              ? currentTime.getHours() < 11
                ? 'bg-gradient-to-b from-yellow-100 via-orange-50 to-yellow-50 dark:from-yellow-900/30 dark:via-orange-900/20 dark:to-yellow-800/20'
                : currentTime.getHours() < 15
                ? 'bg-gradient-to-b from-sky-400 via-blue-300 to-cyan-200 dark:from-sky-900/40 dark:via-blue-800/30 dark:to-cyan-700/20'
                : 'bg-gradient-to-b from-orange-400 via-orange-300 to-yellow-200 dark:from-orange-900/40 dark:via-orange-800/30 dark:to-yellow-700/20'
              : 'bg-gradient-to-b from-slate-900 via-indigo-950 to-blue-950 dark:from-slate-950/60 dark:via-indigo-950/50 dark:to-blue-950/40'
          }`} />

          {/* Fade gradient overlay - konten di kiri terlihat, animasi di kanan */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent dark:from-background/90 dark:via-background/70 dark:to-transparent transition-all duration-1000 ease-in-out pointer-events-none" />

          {/* Horizon */}
          <div className={`absolute bottom-0 left-0 right-0 h-1/3 transition-all duration-1000 ease-in-out pointer-events-none ${
            isSunTime
              ? 'bg-gradient-to-t from-green-300/50 via-green-200/30 to-transparent dark:from-green-900/40 dark:via-green-800/20 dark:to-transparent'
              : 'bg-gradient-to-t from-slate-800/50 via-slate-700/30 to-transparent dark:from-slate-950/50 dark:via-slate-900/30 dark:to-transparent'
          }`} />

          {/* Celestial/Globe removed */}

          {/* Clouds (siang hari saja) ☁️ */}
          {isSunTime && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <div className="absolute top-6 right-6 md:top-10 md:right-14 w-14 h-5 md:w-20 md:h-8 rounded-full blur-md bg-white/60 dark:bg-gray-300/30" />
              <div className="absolute top-14 right-14 md:top-20 md:right-28 w-10 h-4 md:w-16 md:h-7 rounded-full blur-md bg-white/50 dark:bg-gray-300/25" />
              <div className="absolute bottom-10 right-10 md:bottom-16 md:right-20 w-16 h-6 md:w-24 md:h-10 rounded-full blur-md bg-white/55 dark:bg-gray-300/28" />
            </div>
          )}

          {/* Content */}
          <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6 relative z-10 px-4 md:px-6">
            <div className="flex flex-col items-start space-y-1.5 md:space-y-2.5">
              {/* Tanggal & Waktu */}
              <div className="flex items-center space-x-1.5 md:space-x-2 text-foreground animate-slide-in-left">
                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                <p className="text-xs md:text-sm font-medium">
                  {currentTime.toLocaleDateString(currentLocale === 'id' ? "id-ID" : "en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  - {currentTime.toLocaleTimeString(currentLocale === 'id' ? "id-ID" : "en-US")}
                </p>
              </div>

              {/* Greeting */}
              <p className="text-lg md:text-2xl lg:text-3xl text-foreground font-bold animate-scale-in">
                {greeting()}, {user.nama.split(" ")[0]}!
              </p>

              {/* Subtitle */}
              <p className="text-xs md:text-sm text-muted-foreground max-w-md">
                {user.role === "SISWA" && t("Pantau perkembangan belajar Anda")}
                {user.role === "GURU" && t("Kelola kursus dan materi pembelajaran")}
                {user.role === "ADMIN" && t("Ringkasan Sistem")}
              </p>

              {/* Role Badge */}
              <div className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-full ${timeColors.cardBg} border ${timeColors.cardBorder} animate-slide-in-left`} style={{ animationDelay: "0.1s" }}>
                <span className={`text-[10px] md:text-xs font-semibold ${timeColors.text} uppercase tracking-wide`}>
                  {user.role === "SISWA" ? t("Siswa") : user.role === "GURU" ? t("Guru") : t("Administrator")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimateIn>

      {/* Stats Cards */}
      <AnimateIn stagger={2}>
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
              <StatsCard
                title={t("Siswa")}
                value={stats.studentsCount || 0}
                icon={Users}
              />
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
                title={t("Semua Kursus")}
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
      </AnimateIn>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {user.role !== "ADMIN" && (
        <AnimateIn stagger={3} className="space-y-3 sm:space-y-4 lg:col-span-3">
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
        </AnimateIn>
        )}

        <div className={cn("space-y-4 sm:space-y-6", user.role === "ADMIN" ? "lg:col-span-5" : "lg:col-span-2")}>
          <AnimateIn stagger={4}>
            <Card className="border-border/50 p-3 sm:p-5">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <h3 className="text-sm font-semibold sm:text-base">{t("Proyek Mendatang")}</h3>
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
                        {format(new Date(event.date), "d MMM, HH:mm", { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </AnimateIn>

          {(user.role === "GURU" || user.role === "SISWA") && (
            <AnimateIn stagger={5}>
              <Card className="border-border/50 p-3 sm:p-5 mb-4 sm:mb-0">
                <h3 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
                  {user.role === "SISWA" ? t("Siap Dikerjakan") : t("Asesmen Terbaru")}
                </h3>
                <div className="space-y-2">
                  {asesmenList.slice(0, 3).map((asesmen) => (
                    <div
                      key={asesmen.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/30 p-2 transition-colors hover:bg-muted/50 sm:gap-3 sm:p-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-medium sm:text-sm line-clamp-1">{asesmen.nama}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground sm:gap-2 sm:text-xs">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {asesmen.durasi}m<span className="text-border">•</span>
                          {asesmen.jml_soal} {t("Soal")}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={user.role === "SISWA" ? "default" : "ghost"}
                        className="h-6 text-[10px] shrink-0 sm:h-7 sm:text-xs"
                        asChild
                      >
                        <Link href={`/courses/${asesmen.courseId}/${asesmen.id}`}>
                          {user.role === "SISWA" ? t("Mulai") : t("Edit")}
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </AnimateIn>
          )}
        </div>
      </div>

      {(user.role === "ADMIN" || user.role === "GURU" || user.role === "SISWA") && (
        <AnimateIn stagger={6}>
          <Card className="border-border/50 p-3 sm:p-5 mb-20 sm:mb-8">
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
        </AnimateIn>
      )}

      {/* Globe View - Seamless transition dari matahari/bulan */}
          {/* Globe removed */}
    </div>
  )
}
