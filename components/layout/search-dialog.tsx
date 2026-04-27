"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { useAuth } from "@/lib/auth-context"
import { useDebounce } from "@/hooks/use-debounce"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
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
  GraduationCap,
  BookMarked,
  CheckSquare,
  ClipboardList,
  UserCircle,
  Loader2,
} from "lucide-react"

interface SearchItem {
  id: string
  title: string
  description?: string
  url: string
  icon: React.ReactNode
  category: string
  keywords?: string[]
  badge?: string
}

interface SearchDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SearchDialog({ open: controlledOpen, onOpenChange }: SearchDialogProps = {}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [apiResults, setApiResults] = React.useState<any>(null)
  const [isRecent, setIsRecent] = React.useState(false)
  const router = useRouter()
  const { t } = useAutoTranslate()
  const { user } = useAuth()
  const isMobile = useIsMobile()

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  // Fetch from API
  React.useEffect(() => {
    if (!open) return

    const fetchResults = async () => {
      setIsLoading(true)
      try {
        const url = debouncedSearch
          ? `/api/search?q=${encodeURIComponent(debouncedSearch)}`
          : `/api/search`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setApiResults(data.results || null)
          setIsRecent(data.isRecent || false)
        }
      } catch (error) {
        console.error('Error fetching search:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedSearch, open])

  // Build searchable items - static navigation + API results
  const searchItems: SearchItem[] = React.useMemo(() => {
    const items: SearchItem[] = [
      {
        id: "dashboard",
        title: t("Dashboard"),
        description: t("Halaman utama"),
        url: "/dashboard",
        icon: <LayoutDashboard className="h-4 w-4 text-muted-foreground" />,
        category: t("Navigasi"),
        keywords: ["dashboard", "home", "beranda", "utama", "main"],
      },
      {
        id: "courses",
        title: t("Kursus"),
        description: t("Lihat semua kursus"),
        url: "/courses",
        icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
        category: t("Navigasi"),
        keywords: ["courses", "kursus", "pelajaran", "class", "kelas"],
      },
      {
        id: "assignments",
        title: t("Asesmen"),
        description: t("Lihat tugas dan kuis"),
        url: "/asesmen",
        icon: <CheckSquare className="h-4 w-4 text-muted-foreground" />,
        category: t("Navigasi"),
        keywords: ["assignments", "tugas", "homework", "asesmen", "kuis", "quiz"],
      },
      {
        id: "projects",
        title: t("PBL"),
        description: t("Kelola project based learning"),
        url: "/projects",
        icon: <FolderOpen className="h-4 w-4 text-muted-foreground" />,
        category: t("Navigasi"),
        keywords: ["projects", "proyek", "project", "pbl", "project based learning"],
      },
      {
        id: "schedule",
        title: t("Jadwal"),
        description: t("Lihat jadwal kelas"),
        url: "/schedule",
        icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
        category: t("Navigasi"),
        keywords: ["schedule", "jadwal", "calendar", "kalender", "time", "waktu"],
      },
      {
        id: "users",
        title: t("Pengguna"),
        description: t("Kelola pengguna sistem"),
        url: "/users",
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        category: t("Navigasi"),
        keywords: ["users", "pengguna", "student", "siswa", "teacher", "guru", "admin"],
      },
      {
        id: "profile",
        title: t("Profil"),
        description: t("Lihat dan edit profil"),
        url: "/profile",
        icon: <User className="h-4 w-4 text-muted-foreground" />,
        category: t("Akun"),
        keywords: ["profile", "profil", "account", "akun"],
      },
    ]

    // Add settings only on desktop (not mobile)
    if (!isMobile) {
      items.push({
        id: "settings",
        title: t("Pengaturan"),
        description: t("Kelola pengaturan akun"),
        url: "/settings",
        icon: <Settings className="h-4 w-4 text-muted-foreground" />,
        category: t("Akun"),
        keywords: ["settings", "pengaturan", "config", "konfigurasi"],
      })
    }

    items.push({
      id: "compiler",
      title: t("Python Compiler"),
      description: t("Jalankan kode Python"),
      url: "/compiler",
      icon: <Code className="h-4 w-4 text-muted-foreground" />,
      category: t("Alat"),
      keywords: ["compiler", "python", "code", "kode", "editor", "run"],
    })

    // Add dynamic API results
    if (apiResults) {
      const courseCategory = isRecent ? t("Kursus Terbaru") : t("Kursus")
      apiResults.courses?.forEach((course: any) => {
        items.push({
          id: `course-${course.id}`,
          title: course.judul,
          description: course.kategori,
          url: `/courses/${course.id}`,
          icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
          category: courseCategory,
          badge: course.kategori,
        })
      })

      const materiCategory = isRecent ? t("Materi Terbaru") : t("Materi")
      apiResults.materi?.forEach((materi: any) => {
        const enrollmentInfo = materi.kelasTarget && materi.kelasTarget.length > 0 
          ? ` • ${materi.kelasTarget.length} kelas enrolled` 
          : " • Semua siswa"
        
        items.push({
          id: `materi-${materi.id}`,
          title: materi.judul,
          description: `${materi.course.judul}${enrollmentInfo}`,
          url: `/courses/${materi.courseId || materi.course.id}/${materi.id}`,
          icon: <BookMarked className="h-4 w-4 text-muted-foreground" />,
          category: materiCategory,
        })
      })

      const asesmenCategory = isRecent ? t("Asesmen Terbaru") : t("Asesmen Ditemukan")
      apiResults.asesmen?.forEach((asesmen: any) => {
        const tipeLabel = asesmen.tipe === 'KUIS' ? 'Kuis' : 'Tugas'
        const enrollmentInfo = asesmen.kelasTarget && asesmen.kelasTarget.length > 0 
          ? ` • ${asesmen.kelasTarget.length} kelas enrolled` 
          : " • Semua siswa"
        
        items.push({
          id: `asesmen-${asesmen.id}`,
          title: asesmen.nama,
          description: `${asesmen.course.judul} • ${tipeLabel}${enrollmentInfo}`,
          url: `/courses/${asesmen.courseId || asesmen.course.id}/${asesmen.id}`,
          icon: asesmen.tipe === 'KUIS' ? <FileText className="h-4 w-4 text-muted-foreground" /> : <ClipboardList className="h-4 w-4 text-muted-foreground" />,
          category: asesmenCategory,
          badge: tipeLabel,
        })
      })

      apiResults.schedules?.forEach((schedule: any) => {
        items.push({
          id: `schedule-${schedule.id}`,
          title: schedule.judul,
          description: `${schedule.guru.nama}`,
          url: `/projects/${schedule.id}`,
          icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
          category: t("Jadwal"),
        })
      })

      apiResults.users?.forEach((u: any) => {
        const roleLabel = u.role === 'ADMIN' ? 'Admin' : u.role === 'GURU' ? 'Guru' : 'Siswa'
        items.push({
          id: `user-${u.id}`,
          title: u.nama,
          description: `${u.email} • ${roleLabel}`,
          url: `/users`,
          icon: <UserCircle className="h-4 w-4 text-muted-foreground" />,
          category: t("Pengguna"),
          badge: roleLabel,
        })
      })
    }

    return items
  }, [t, apiResults, isRecent])

  // Filter items berdasarkan role ADMIN
  const ADMIN_RESTRICTED_PATHS = ['/courses', '/compiler', '/projects']
  const roleFilteredItems = user?.role === 'ADMIN'
    ? searchItems.filter(item => !ADMIN_RESTRICTED_PATHS.some(path => item.url.startsWith(path)))
    : searchItems

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, setOpen])

  const handleSelect = (url: string) => {
    setOpen(false)
    setSearchQuery("")
    router.push(url)
  }

  // Filter items based on search query (for static nav items)
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return roleFilteredItems
    }

    const query = searchQuery.toLowerCase()
    return roleFilteredItems.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(query)
      const descriptionMatch = item.description?.toLowerCase().includes(query)
      const keywordMatch = item.keywords?.some(keyword => 
        keyword.toLowerCase().includes(query)
      )
      const badgeMatch = item.badge?.toLowerCase().includes(query)
      return titleMatch || descriptionMatch || keywordMatch || badgeMatch
    })
  }, [searchQuery, roleFilteredItems])

  // Group items by category
  const groupedItems = React.useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, SearchItem[]>)
  }, [filteredItems])

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={setOpen}
    >
      <CommandInput 
        placeholder={t("Ketik untuk mencari...")} 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList className="max-h-[60vh]">
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">{t("Mencari")}...</span>
          </div>
        )}
        <CommandEmpty>{t("Tidak ada hasil ditemukan.")}</CommandEmpty>
        {Object.entries(groupedItems).map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.id} ${item.title} ${item.description || ''} ${item.keywords?.join(' ') || ''}`}
                onSelect={() => handleSelect(item.url)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

// Export a hook to open the search dialog
export function useSearchDialog() {
  const [open, setOpen] = React.useState(false)

  return {
    open,
    setOpen,
    openSearch: () => setOpen(true),
    closeSearch: () => setOpen(false),
  }
}
