"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Award,
  Star,
  Calendar,
  ExternalLink,
  Code,
  BookOpen,
  Mail,
  User,
  Users,
  Clock,
  Trophy,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as idLocale, enUS } from "date-fns/locale"
import { AnimateIn } from "@/components/ui/animate-in"
import { ShowcaseDetailDialog } from "@/components/profile/showcase-detail-dialog"

interface UserProfile {
  id: string
  username: string | null
  email: string
  nama: string
  role: string
  kelas: string | null
  foto: string | null
  createdAt: string
  _count: {
    course: number
    masalahDibuat: number
    asesmenDibuat: number
    nilai: number
  }
}

export default function StudentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const userId = params.id as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("showcase")
  const [tabKey, setTabKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  const [courses, setCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [showcases, setShowcases] = useState<any[]>([])
  const [showcasesLoading, setShowcasesLoading] = useState(true)
  const [selectedShowcase, setSelectedShowcase] = useState<any>(null)
  const [showcaseDialogOpen, setShowcaseDialogOpen] = useState(false)

  const dateLocale = idLocale

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/users/${userId}`)
        if (!res.ok) {
          setError("Profil pengguna tidak ditemukan")
          return
        }
        const data = await res.json()
        setProfile(data.user)

        // Set initial tab based on role
        if (data.user.role === "GURU") {
          setActiveTab("courses")
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError("Gagal memuat profil pengguna")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId])

  // Fetch courses
  useEffect(() => {
    if (!profile) return
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true)
        const url =
          profile.role === "SISWA"
            ? `/api/courses?siswaId=${profile.id}`
            : profile.role === "GURU"
            ? `/api/courses?guruId=${profile.id}`
            : `/api/courses`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setCourses(data.courses || [])
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setCoursesLoading(false)
      }
    }
    fetchCourses()
  }, [profile])

  // Fetch showcases (only for SISWA)
  useEffect(() => {
    if (!profile || profile.role !== "SISWA") {
      setShowcasesLoading(false)
      return
    }
    const fetchShowcases = async () => {
      try {
        setShowcasesLoading(true)
        const res = await fetch(`/api/profile/showcase?siswaId=${profile.id}`)
        if (res.ok) {
          const data = await res.json()
          setShowcases(data.showcases || [])
        }
      } catch (error) {
        console.error("Error fetching showcases:", error)
      } finally {
        setShowcasesLoading(false)
      }
    }
    fetchShowcases()
  }, [profile])

  const userShowcases = useMemo(() => {
    return showcases
      .filter((item: any) => {
        const matchesSearch =
          item.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch && item.isPublic
      })
      .sort((a: any, b: any) => {
        if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        if (sortBy === "highest") return b.nilai - a.nilai
        return a.judul.localeCompare(b.judul)
      })
  }, [showcases, searchQuery, sortBy])

  const totalShowcases = showcases.length
  const averageGrade =
    totalShowcases > 0
      ? Math.round(showcases.reduce((acc: number, s: any) => acc + s.nilai, 0) / totalShowcases)
      : 0
  const highestGrade =
    totalShowcases > 0 ? Math.max(...showcases.map((s: any) => s.nilai)) : 0

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "GURU":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "SISWA":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      default:
        return ""
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin"
      case "GURU":
        return "Guru"
      case "SISWA":
        return "Siswa"
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
              <Skeleton className="h-20 w-20 rounded-full sm:h-24 sm:w-24" />
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <Skeleton className="mx-auto h-7 w-48 sm:mx-0 sm:h-8" />
                <Skeleton className="mx-auto h-4 w-64 sm:mx-0" />
                <Skeleton className="mx-auto h-4 w-56 sm:mx-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="w-full space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
            <User className="h-12 w-12 text-muted-foreground sm:h-14 sm:w-14" />
            <h3 className="mt-4 text-sm font-semibold sm:text-base">{error || "Profil tidak ditemukan"}</h3>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Pengguna yang Anda cari tidak tersedia
            </p>
            <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Button>

      {/* Profile Header */}
      <AnimateIn stagger={0}>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg sm:h-24 sm:w-24">
                <AvatarImage src={profile.foto || "/placeholder.svg"} />
                <AvatarFallback className="text-xl sm:text-2xl">
                  {profile.nama
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row">
                  <h1 className="text-xl font-bold sm:text-2xl">{profile.nama}</h1>
                  <Badge className={getRoleBadgeColor(profile.role)}>{getRoleLabel(profile.role)}</Badge>
                </div>
                <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:text-sm">
                  <span className="flex items-center justify-center gap-1 sm:justify-start">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="truncate">{profile.email}</span>
                  </span>
                  {profile.username && (
                    <span className="flex items-center justify-center gap-1 sm:justify-start">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />@{profile.username}
                    </span>
                  )}
                  {profile.kelas && (
                    <span className="flex items-center justify-center gap-1 sm:justify-start">
                      <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Kelas {profile.kelas}
                    </span>
                  )}
                  <span className="flex items-center justify-center gap-1 sm:justify-start">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Bergabung {format(new Date(profile.createdAt), "MMMM yyyy", { locale: dateLocale })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimateIn>

      {/* Stats Cards */}
      {profile.role === "SISWA" && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <AnimateIn stagger={1}>
            <Card>
              <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                  <BookOpen className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Total Kursus</p>
                  <p className="text-xl font-bold sm:text-2xl">{courses.length}</p>
                </div>
              </CardContent>
            </Card>
          </AnimateIn>
          <AnimateIn stagger={2}>
            <Card>
              <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30 sm:h-12 sm:w-12">
                  <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Portofolio</p>
                  <p className="text-xl font-bold sm:text-2xl">{totalShowcases}</p>
                </div>
              </CardContent>
            </Card>
          </AnimateIn>
          <AnimateIn stagger={3}>
            <Card>
              <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 sm:h-12 sm:w-12">
                  <Star className="h-5 w-5 text-green-600 dark:text-green-400 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Rata-rata</p>
                  <p className="text-xl font-bold sm:text-2xl">{averageGrade}</p>
                </div>
              </CardContent>
            </Card>
          </AnimateIn>
          <AnimateIn stagger={4}>
            <Card>
              <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 sm:h-12 sm:w-12">
                  <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-400 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Tertinggi</p>
                  <p className="text-xl font-bold sm:text-2xl">{highestGrade}</p>
                </div>
              </CardContent>
            </Card>
          </AnimateIn>
        </div>
      )}

      {profile.role === "GURU" && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <AnimateIn stagger={1}>
            <Card>
              <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                  <BookOpen className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Kursus Dibuat</p>
                  <p className="text-xl font-bold sm:text-2xl">{profile._count.course}</p>
                </div>
              </CardContent>
            </Card>
          </AnimateIn>
          <AnimateIn stagger={2}>
            <Card>
              <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 sm:h-12 sm:w-12">
                  <Award className="h-5 w-5 text-blue-600 dark:text-blue-400 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Asesmen Dibuat</p>
                  <p className="text-xl font-bold sm:text-2xl">{profile._count.asesmenDibuat}</p>
                </div>
              </CardContent>
            </Card>
          </AnimateIn>
          <AnimateIn stagger={3}>
            <Card>
              <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 sm:h-12 sm:w-12">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Proyek Dibuat</p>
                  <p className="text-xl font-bold sm:text-2xl">{profile._count.masalahDibuat}</p>
                </div>
              </CardContent>
            </Card>
          </AnimateIn>
        </div>
      )}

      {/* Tabs: Showcase & Courses */}
      <AnimateIn stagger={5}>
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value)
          setTabKey(prev => prev + 1)
        }} className="space-y-4 sm:space-y-6">
          <div className="overflow-visible">
            <TabsList className="ios-tab-list">
              {profile.role === "SISWA" && (
                <TabsTrigger value="showcase" className="ios-tab-trigger">
                  <Award className="ios-tab-icon" />
                  <span className="ios-tab-text">Portofolio</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="courses" className="ios-tab-trigger">
                <BookOpen className="ios-tab-icon" />
                <span className="ios-tab-text">{profile.role === "GURU" ? "Kursus yang Diampu" : "Kursus Diikuti"}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Showcase Tab */}
          {profile.role === "SISWA" && (
            <TabsContent value="showcase" key={`showcase-${tabKey}`} className="space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari proyek..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 sm:h-10"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 w-full sm:h-10 sm:w-[150px]">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="highest">Nilai Tertinggi</SelectItem>
                    <SelectItem value="alphabetical">Abjad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showcasesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="aspect-video" />
                      <CardContent className="p-3 sm:p-4 space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : userShowcases.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {userShowcases.map((item: any, index: number) => (
                    <AnimateIn key={item.id} stagger={6 + index}>
                      <Card className="group overflow-hidden transition-all hover:shadow-lg">
                        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Code className="h-10 w-10 text-primary/40 sm:h-12 sm:w-12" />
                          </div>
                          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium sm:text-sm">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 sm:h-4 sm:w-4" />
                            <span>{item.nilai}</span>
                          </div>
                          {item.pengumpulanProyek?.asesmen?.course && (
                            <div className="absolute left-2 top-2">
                              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                {item.pengumpulanProyek.asesmen.course.judul}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3 sm:p-4">
                          <h3 className="text-sm font-semibold transition-colors group-hover:text-primary sm:text-base">
                            {item.judul}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{item.deskripsi}</p>
                          {item.pengumpulanProyek?.namaKelompok && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {item.pengumpulanProyek.namaKelompok}
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground sm:mt-4">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(item.tanggalDinilai), "d MMMM yyyy", { locale: dateLocale })}
                          </div>
                        </CardContent>
                        <CardFooter className="border-t p-3 sm:p-4">
                          {item.pengumpulanProyek?.asesmen && (
                            <Button
                              className="w-full bg-transparent"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                router.push(`/profile/showcase/${item.id}`)
                              }}
                            >
                              Lihat Detail
                              <ExternalLink className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </AnimateIn>
                  ))}
                </div>
              ) : (
                <Card className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
                  <Award className="h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
                  <h3 className="mt-4 text-sm font-semibold sm:text-base">Belum ada proyek</h3>
                  <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                    {searchQuery ? "Coba kata kunci lain" : "Proyek terbaik akan ditampilkan di sini"}
                  </p>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Courses Tab */}
          <TabsContent value="courses" key={`courses-${tabKey}`} className="space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            {coursesLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video animate-pulse bg-muted" />
                    <CardContent className="p-3 sm:p-4 space-y-2">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course, index) => (
                  <AnimateIn key={course.id} stagger={6 + index}>
                    <Card className="overflow-hidden transition-all hover:shadow-lg">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={course.gambar || "/placeholder.svg"}
                          alt={course.judul}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {course.kategori}
                        </Badge>
                        <h3 className="text-sm font-semibold sm:text-base">{course.judul}</h3>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                          Instruktur: {course.guru?.nama}
                        </p>
                      </CardContent>
                      <CardFooter className="border-t p-3 sm:p-4">
                        <Button asChild className="w-full bg-transparent" variant="outline" size="sm">
                          <Link href={`/courses/${course.id}`}>Lihat Kursus</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </AnimateIn>
                ))}
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
                <BookOpen className="h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
                <h3 className="mt-4 text-sm font-semibold sm:text-base">Belum ada kursus</h3>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  {profile.role === "GURU" ? "Belum membuat kursus" : "Belum terdaftar di kursus manapun"}
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </AnimateIn>

      <ShowcaseDetailDialog 
        showcase={selectedShowcase} 
        open={showcaseDialogOpen} 
        onOpenChange={setShowcaseDialogOpen} 
      />
    </div>
  )
}
