"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { useAuth } from "@/lib/auth-context"
import { 
  FileText, 
  BookOpen, 
  Users, 
  Calendar, 
  Settings, 
  LayoutDashboard,
  Code,
  FolderOpen,
  User,
  Search,
  CheckSquare,
  BookMarked,
  ClipboardList,
  Sparkles,
  UserCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchItem {
  id: string
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  category: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

interface SearchResults {
  courses: Array<{
    id: string
    judul: string
    kategori: string
    gambar: string
  }>
  materi: Array<{
    id: string
    judul: string
    deskripsi: string | null
    tgl_unggah: Date
    courseId: string
    course: {
      id: string
      judul: string
      kategori: string
    }
  }>
  asesmen: Array<{
    id: string
    nama: string
    deskripsi: string | null
    tipe: string
    tgl_selesai: Date | null
    courseId: string
    course: {
      id: string
      judul: string
    }
    _count: {
      soal: number
    }
  }>
  schedules: Array<{
    id: string
    judul: string
    deskripsi: string
    tgl_mulai: Date
    tgl_selesai: Date
    guru: {
      nama: string
    }
  }>
  users: Array<{
    id: string
    nama: string
    email: string
    role: string
    foto: string | null
  }>
}

export function SearchDropdown() {
  const router = useRouter()
  const { t } = useAutoTranslate()
  const { user } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isRecent, setIsRecent] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<SearchResults>({
    courses: [],
    materi: [],
    asesmen: [],
    schedules: [],
    users: [],
  })
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const debouncedSearch = useDebounce(search, 300)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 0)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Fetch search results from API (only when dropdown is open)
  React.useEffect(() => {
    if (!open) return

    const fetchSearchResults = async () => {
      setIsLoading(true)
      try {
        const url = debouncedSearch 
          ? `/api/search?q=${encodeURIComponent(debouncedSearch)}`
          : `/api/search`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setIsRecent(data.isRecent || false)
          setSearchResults(data.results || {
            courses: [],
            materi: [],
            asesmen: [],
            schedules: [],
            users: [],
          })
        }
      } catch (error) {
        console.error('Error fetching search results:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSearchResults()
  }, [debouncedSearch, open])

  const searchItems: SearchItem[] = React.useMemo(() => {
    const items: SearchItem[] = [
      // Navigation items (static)
      {
        id: "dashboard",
        title: t("Dashboard"),
        description: t("Lihat ringkasan aktivitas Anda"),
        icon: LayoutDashboard,
        href: "/dashboard",
        category: t("Navigasi"),
      },
      {
        id: "courses-page",
        title: t("Kursus"),
        description: t("Jelajahi semua kursus yang tersedia"),
        icon: BookOpen,
        href: "/courses",
        category: t("Navigasi"),
      },
      {
        id: "projects",
        title: t("PBL"),
        description: t("Kelola project based learning"),
        icon: FolderOpen,
        href: "/projects",
        category: t("Navigasi"),
      },
      {
        id: "asesmen-page",
        title: t("Asesmen"),
        description: t("Lihat tugas dan kuis"),
        icon: CheckSquare,
        href: "/asesmen",
        category: t("Navigasi"),
      },
      {
        id: "schedule",
        title: t("Jadwal"),
        description: t("Lihat jadwal dan kalender Anda"),
        icon: Calendar,
        href: "/schedule",
        category: t("Navigasi"),
      },
      {
        id: "users",
        title: t("Pengguna"),
        description: t("Kelola pengguna sistem"),
        icon: Users,
        href: "/users",
        category: t("Navigasi"),
      },
      {
        id: "compiler",
        title: t("Compiler Python"),
        description: t("Editor dan compiler kode Python"),
        icon: Code,
        href: "/compiler",
        category: t("Tools"),
      },
      {
        id: "profile",
        title: t("Profil"),
        description: t("Lihat dan edit profil Anda"),
        icon: User,
        href: "/profile",
        category: t("Pengaturan"),
      },
      {
        id: "settings",
        title: t("Pengaturan"),
        description: t("Kelola preferensi akun Anda"),
        icon: Settings,
        href: "/settings",
        category: t("Pengaturan"),
      },
    ]

    // Add courses from search results
    const courseCategory = isRecent ? t("Kursus Terbaru") : t("Kursus")
    searchResults.courses.forEach((course) => {
      items.push({
        id: `course-${course.id}`,
        title: course.judul,
        description: course.kategori,
        icon: BookOpen,
        href: `/courses/${course.id}`,
        category: courseCategory,
        badge: course.kategori,
      })
    })

    // Add materi from search results
    const materiCategory = isRecent ? t("Materi Terbaru") : t("Materi")
    searchResults.materi.forEach((materi) => {
      const enrollmentBadge = materi.kelasTarget && materi.kelasTarget.length > 0 
        ? `${materi.kelasTarget.length} kelas enrolled` 
        : "Semua siswa"
      
      items.push({
        id: `materi-${materi.id}`,
        title: materi.judul,
        description: `${materi.course.judul} • ${materi.deskripsi?.substring(0, 50) || ''}`,
        icon: BookMarked,
        href: `/courses/${materi.courseId || materi.course.id}/materi/${materi.id}`,
        category: materiCategory,
        badge: enrollmentBadge,
      })
    })

    // Add asesmen from search results
    const asesmenCategory = isRecent ? t("Asesmen Terbaru") : t("Asesmen")
    searchResults.asesmen.forEach((asesmen) => {
      const tipeLabel = asesmen.tipe === 'KUIS' ? 'Kuis' : 'Tugas'
      const soalBadge = asesmen.tipe === 'KUIS' ? `${asesmen._count.soal} soal` : tipeLabel
      const enrollmentInfo = asesmen.kelasTarget && asesmen.kelasTarget.length > 0 
        ? ` • ${asesmen.kelasTarget.length} kelas enrolled` 
        : " • Semua siswa"
      
      items.push({
        id: `asesmen-${asesmen.id}`,
        title: asesmen.nama,
        description: `${asesmen.course.judul} • ${asesmen.deskripsi?.substring(0, 50) || tipeLabel}${enrollmentInfo}`,
        icon: asesmen.tipe === 'KUIS' ? FileText : ClipboardList,
        href: `/courses/${asesmen.courseId || asesmen.course.id}/asesmen/${asesmen.id}`,
        category: asesmenCategory,
        badge: soalBadge,
        badgeVariant: asesmen.tipe === 'KUIS' ? 'default' : 'secondary',
      })
    })

    // Add schedules/projects from search results
    searchResults.schedules.forEach((schedule) => {
      items.push({
        id: `schedule-${schedule.id}`,
        title: schedule.judul,
        description: `${schedule.guru.nama} • ${schedule.deskripsi.substring(0, 50)}`,
        icon: Calendar,
        href: `/projects/${schedule.id}`,
        category: t("Jadwal"),
        badge: new Date(schedule.tgl_selesai).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        }),
      })
    })

    // Add users from search results
    if (searchResults.users && searchResults.users.length > 0) {
      const roleLabel = (role: string) => {
        switch (role) {
          case 'ADMIN': return 'Admin'
          case 'GURU': return 'Guru'
          case 'SISWA': return 'Siswa'
          default: return role
        }
      }
      searchResults.users.forEach((u) => {
        items.push({
          id: `user-${u.id}`,
          title: u.nama,
          description: u.email,
          icon: UserCircle,
          href: `/users`,
          category: t("Pengguna"),
          badge: roleLabel(u.role),
          badgeVariant: 'outline',
        })
      })
    }

    // Filter items berdasarkan role ADMIN
    const ADMIN_RESTRICTED_PATHS = ['/courses', '/compiler', '/projects']
    const filteredByRole = user?.role === 'ADMIN' 
      ? items.filter(item => !ADMIN_RESTRICTED_PATHS.some(path => item.href.startsWith(path)))
      : items

    return filteredByRole
  }, [t, searchResults, user, isRecent])

  const filteredItems = React.useMemo(() => {
    if (!search) {
      // Show navigation items + recent/suggested items from API
      return searchItems.slice(0, 30)
    }

    const searchLower = search.toLowerCase()
    const filtered = searchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.badge?.toLowerCase().includes(searchLower)
    )
    
    return filtered.slice(0, 30)
  }, [search, searchItems])

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, SearchItem[]> = {}
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })
    return groups
  }, [filteredItems])

  const handleSelect = (href: string) => {
    setOpen(false)
    setSearch("")
    router.push(href)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={t("Cari")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="h-9 w-full pl-9 pr-16"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 z-50">
          <div className="max-h-[400px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  {t("Mencari")}...
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {search ? t("Tidak ada hasil ditemukan") : t("Mulai ketik untuk mencari...")}
              </div>
            ) : (
              <>
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.href)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                              "hover:bg-accent hover:text-accent-foreground",
                              "focus:bg-accent focus:text-accent-foreground focus:outline-none"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="flex flex-1 flex-col items-start gap-0.5 text-left min-w-0">
                              <div className="flex items-center gap-2 w-full">
                                <span className="font-medium truncate">{item.title}</span>
                                {item.badge && (
                                  <Badge variant={item.badgeVariant || "secondary"} className="shrink-0 text-[10px] px-1.5 py-0">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {search && filteredItems.length > 0 && (
                  <div className="border-t mt-2 pt-2 px-3 py-2 text-xs text-muted-foreground text-center">
                    {t("Menampilkan")} {filteredItems.length} {t("dari")} {searchItems.length} {t("hasil")}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
