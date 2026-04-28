"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardFooter, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Search, Award, Star, Calendar, ExternalLink, Code, BookOpen, Mail, User, Users, Clock, Trophy, Settings, Camera, Shield, Palette, Globe, Check, Pencil } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as idLocale, enUS } from "date-fns/locale"
import { AnimateIn } from "@/components/ui/animate-in"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { useTheme } from "next-themes"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { AvatarCropDialog } from "@/components/ui/avatar-crop-dialog"
import { uploadProfilePhoto } from "../settings/actions"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { t, locale, setLocale } = useAutoTranslate()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { confirm, error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const [activeTab, setActiveTab] = useState(user?.role === "GURU" ? "courses" : "showcase")
  const [tabKey, setTabKey] = useState(0) // For re-render animation
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState("profile")
  const [settingsTabKey, setSettingsTabKey] = useState(0)

  // Settings state
  const [nama, setNama] = useState(user?.nama || "")
  const [email, setEmail] = useState(user?.email || "")
  const [bio, setBio] = useState("")
  const [saved, setSaved] = useState(false)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [showcases, setShowcases] = useState<any[]>([])
  const [showcasesLoading, setShowcasesLoading] = useState(true)
  // Showcase details are now shown in a dedicated page: `/profile/showcase/[id]`.
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dateLocale = locale === 'id' ? idLocale : enUS

  // Fetch real courses data
  useEffect(() => {
    if (!user) return
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true)
        const url =
          user.role === "SISWA"
            ? `/api/courses?siswaId=${user.id}`
            : user.role === "GURU"
            ? `/api/courses?guruId=${user.id}`
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
    // Fetch real showcase data
    const fetchShowcases = async () => {
      try {
        setShowcasesLoading(true)
        const res = await fetch(`/api/profile/showcase?siswaId=${user.id}`)
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
    if (user.role === "SISWA") fetchShowcases()
    else setShowcasesLoading(false)
  }, [user])

  // Settings handlers
  const handleSave = async () => {
    setSaved(true)
    await execute(
      async () => { /* profile save logic */ },
      {
        loadingMessage: t("Menyimpan profil..."),
        successTitle: t("Berhasil!"),
        successDescription: t("Profil berhasil disimpan"),
        skipSuccessDialog: false,
      }
    )
    setTimeout(() => setSaved(false), 2000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showError("File Terlalu Besar", "Ukuran file maksimal 2MB")
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setSelectedImage(reader.result as string)
        setCropDialogOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async (blob: Blob) => {
    if (!user?.id) return
    setUploading(true)
    await execute(
      async () => {
        const formData = new FormData()
        formData.append('photo', blob, 'profile.jpg')
        const result = await uploadProfilePhoto(user.id, formData)
        if (!result.success) {
          throw new Error(result.error || t("Terjadi kesalahan saat mengupload foto"))
        }
        await refreshUser()
        router.refresh()
      },
      {
        loadingMessage: t("Mengupload foto..."),
        successTitle: t("Berhasil!"),
        successDescription: t("Foto profil berhasil diperbarui"),
        errorTitle: t("Gagal Upload"),
      }
    )
    setUploading(false)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpdatePassword = async () => {
    const confirmed = await confirm(t("Perbarui Kata Sandi"), {
      description: t("Anda yakin ingin memperbarui kata sandi?"),
      confirmText: t("Perbarui"),
      cancelText: t("Batal"),
      type: "question",
    })
    if (confirmed) {
      await execute(
        async () => { /* password update logic */ },
        {
          loadingMessage: t("Memperbarui kata sandi..."),
          successTitle: t("Berhasil!"),
          successDescription: t("Kata sandi berhasil diperbarui"),
        }
      )
    }
  }

  const themeItems = [
    { value: "light", label: t("Terang"), icon: "☀️" },
    { value: "dark", label: t("Gelap"), icon: "🌙" },
    { value: "system", label: t("Sistem"), icon: "💻" },
  ]

  // Get user's showcases (real data)
  const userShowcases = showcases
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

  // Stats from real data
  const totalShowcases = showcases.length
  const averageGrade =
    totalShowcases > 0
      ? Math.round(
          showcases.reduce((acc: number, s: any) => acc + s.nilai, 0) / totalShowcases,
        )
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
        return t("Admin")
      case "GURU":
        return t("Guru")
      case "SISWA":
        return t("Siswa")
      default:
        return role
    }
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <AlertComponent />
      <ActionFeedback />

      <AnimateIn stagger={0}>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg sm:h-24 sm:w-24">
                <AvatarImage src={user?.foto || "/placeholder.svg"} />
                <AvatarFallback className="text-xl sm:text-2xl">
                  {user?.nama
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row">
                  <h1 className="text-xl font-bold sm:text-2xl">{user?.nama}</h1>
                  <Badge className={getRoleBadgeColor(user?.role || "")}>{getRoleLabel(user?.role || "")}</Badge>
                </div>
                <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:text-sm">
                  <span className="flex items-center justify-center gap-1 sm:justify-start">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="truncate">{user?.email}</span>
                  </span>
                  <span className="flex items-center justify-center gap-1 sm:justify-start">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />@{user?.username}
                  </span>
                  <span className="flex items-center justify-center gap-1 sm:justify-start">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {t("Bergabung")} {user?.createdAt ? format(user.createdAt, "MMMM yyyy", { locale: dateLocale }) : "-"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-initial bg-transparent gap-2"
                  onClick={() => {
                    setShowSettings(!showSettings)
                    setSettingsTab("profile")
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  {t("Edit Profil")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-initial bg-transparent gap-2"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="h-4 w-4" />
                  {t("Pengaturan")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimateIn>

      {/* Settings Section - Collapsible */}
      {showSettings && (
        <AnimateIn stagger={1}>
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">{t("Pengaturan")}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t("Kelola preferensi akun dan pengaturan Anda")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)} className="text-xs">
                  {t("Tutup")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={settingsTab} onValueChange={(value) => {
                setSettingsTab(value)
                setSettingsTabKey(prev => prev + 1)
              }} className="space-y-4 sm:space-y-6">
                <div className="overflow-visible">
                  <TabsList className="ios-tab-list">
                    <TabsTrigger value="profile" className="ios-tab-trigger">
                      <User className="ios-tab-icon" />
                      <span className="ios-tab-text">{t("Edit Profil")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="ios-tab-trigger">
                      <Palette className="ios-tab-icon" />
                      <span className="ios-tab-text">{t("Tampilan")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="ios-tab-trigger">
                      <Shield className="ios-tab-icon" />
                      <span className="ios-tab-text">{t("Keamanan")}</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Profile Edit Tab */}
                <TabsContent value="profile" key={`profile-${settingsTabKey}`} className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300 space-y-4 sm:space-y-6">
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                    <div className="relative">
                      <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                        <AvatarImage src={user?.foto || "/placeholder.svg"} />
                        <AvatarFallback className="text-xl sm:text-2xl">
                          {user?.nama
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        aria-label="Upload profile photo"
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full sm:h-8 sm:w-8"
                        onClick={handleAvatarClick}
                        disabled={uploading}
                      >
                        <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold">{user?.nama}</h3>
                      <p className="text-xs text-muted-foreground sm:text-sm">{user?.email}</p>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-xs sm:text-sm"
                        onClick={handleAvatarClick}
                        disabled={uploading}
                      >
                        {uploading ? t("Mengupload...") : t("Ubah Avatar")}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="nama" className="text-xs sm:text-sm">{t("Nama Lengkap")}</Label>
                      <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} className="h-9 sm:h-10" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm">{t("Email")}</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 sm:h-10" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="username" className="text-xs sm:text-sm">{t("Username")}</Label>
                      <Input id="username" defaultValue={user?.username || ""} className="h-9 sm:h-10" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="role" className="text-xs sm:text-sm">{t("Peran")}</Label>
                      <Input id="role" value={user?.role === "SISWA" ? t("Siswa") : user?.role === "GURU" ? t("Guru") : t("Admin")} disabled className="h-9 sm:h-10" />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="bio" className="text-xs sm:text-sm">{t("Bio")}</Label>
                    <Textarea id="bio" placeholder={t("Ceritakan tentang diri Anda...")} value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="text-sm" />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} size="sm" className="w-full sm:w-auto">
                      {saved ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          {t("Tersimpan")}
                        </>
                      ) : (
                        t("Simpan Perubahan")
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" key={`appearance-${settingsTabKey}`} className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300 space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm">{t("Tema")}</Label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      {themeItems.map((item) => (
                        <Button
                          key={item.value}
                          variant={theme === item.value ? "default" : "outline"}
                          className={`h-auto flex-col gap-1.5 py-3 sm:gap-2 sm:py-4 ${theme !== item.value ? "bg-transparent" : ""}`}
                          onClick={() => setTheme(item.value)}
                        >
                          <span className="text-xl sm:text-2xl">{item.icon}</span>
                          <span className="text-xs sm:text-sm">{item.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <Label className="text-sm">{t("Bahasa")}</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
                      <Button
                        variant={locale === 'id' ? "default" : "outline"}
                        size="sm"
                        className={`sm:size-auto ${locale !== "id" ? "bg-transparent" : ""}`}
                        onClick={() => setLocale("id")}
                      >
                        🇮🇩 Indonesia
                      </Button>
                      <Button
                        variant={locale === 'en' ? "default" : "outline"}
                        size="sm"
                        className={`sm:size-auto ${locale !== "en" ? "bg-transparent" : ""}`}
                        onClick={() => setLocale("en")}
                      >
                        🇬🇧 English
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" key={`security-${settingsTabKey}`} className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300 space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="current-password" className="text-xs sm:text-sm">{t("Kata Sandi Saat Ini")}</Label>
                      <Input id="current-password" type="password" placeholder={t("Masukkan kata sandi saat ini")} className="h-9 sm:h-10" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="new-password" className="text-xs sm:text-sm">{t("Kata Sandi Baru")}</Label>
                      <Input id="new-password" type="password" placeholder={t("Masukkan kata sandi baru")} className="h-9 sm:h-10" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="confirm-password" className="text-xs sm:text-sm">{t("Konfirmasi Kata Sandi")}</Label>
                      <Input id="confirm-password" type="password" placeholder={t("Konfirmasi kata sandi baru")} className="h-9 sm:h-10" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" className="w-full sm:w-auto" onClick={handleUpdatePassword}>
                      {t("Perbarui Kata Sandi")}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </AnimateIn>
      )}

      {user?.role === "SISWA" && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <AnimateIn stagger={1}>
            <Card>
              <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                  <BookOpen className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">{t("Total Kursus")}</p>
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
                  <p className="text-xs text-muted-foreground sm:text-sm">{t("Portofolio")}</p>
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
                  <p className="text-xs text-muted-foreground sm:text-sm">{t("Rata-rata")}</p>
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
                  <p className="text-xs text-muted-foreground sm:text-sm">{t("Tertinggi")}</p>
                  <p className="text-xl font-bold sm:text-2xl">{highestGrade}</p>
                </div>
              </CardContent>
            </Card>
          </AnimateIn>
        </div>
      )}

      <AnimateIn stagger={5}>
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value)
          setTabKey(prev => prev + 1) // Trigger re-render for animation
        }} className="space-y-4 sm:space-y-6">
          <div className="overflow-visible">
            <TabsList className="ios-tab-list">
              {user?.role !== "GURU" && (
                <TabsTrigger value="showcase" className="ios-tab-trigger">
                  <Award className="ios-tab-icon" />
                  <span className="ios-tab-text">{t("Portofolio")}</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="courses" className="ios-tab-trigger">
                <BookOpen className="ios-tab-icon" />
                <span className="ios-tab-text">{t("Kursus Saya")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Showcase Tab */}
          <TabsContent value="showcase" key={`showcase-${tabKey}`} className="space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("Cari proyek...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 sm:h-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 w-full sm:h-10 sm:w-[150px]">
                  <SelectValue placeholder={t("Urutkan")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("Terbaru")}</SelectItem>
                  <SelectItem value="highest">{t("Nilai Tertinggi")}</SelectItem>
                  <SelectItem value="alphabetical">{t("Abjad")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userShowcases.length > 0 ? (
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
                            {t("Lihat Detail")}
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
                <h3 className="mt-4 text-sm font-semibold sm:text-base">{t("Belum ada proyek")}</h3>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  {searchQuery ? t("Coba kata kunci lain") : t("Proyek terbaik Anda akan ditampilkan di sini")}
                </p>
              </Card>
            )}
          </TabsContent>

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
                          {t("Instruktur")}: {course.guru?.nama}
                        </p>
                      </CardContent>
                      <CardFooter className="border-t p-3 sm:p-4">
                        <Button asChild className="w-full bg-transparent" variant="outline" size="sm">
                          <Link href={`/courses/${course.id}`}>{t("Lihat Kursus")}</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </AnimateIn>
                ))}
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
                <BookOpen className="h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
                <h3 className="mt-4 text-sm font-semibold sm:text-base">{t("Belum ada kursus")}</h3>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  {user?.role === "GURU" ? t("Anda belum membuat kursus") : t("Anda belum terdaftar di kursus manapun")}
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </AnimateIn>

      {/* Avatar Crop Dialog */}
      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
      />

    </div>
  )
}
