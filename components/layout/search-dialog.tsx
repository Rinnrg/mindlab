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
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useDebounce } from "@/hooks/use-debounce"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  BookMarked,
  BookOpen,
  Calendar,
  CheckSquare,
  Code,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Loader2,
  Settings,
  User,
  Users,
} from "lucide-react"

interface SearchItem {
  id: string
  title: string
  description?: string
  url: string
  icon: React.ReactNode
  category: string
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
  const { user } = useAuth()
  const isMobile = useIsMobile()

  const debouncedSearch = useDebounce(searchQuery, 300)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  React.useEffect(() => {
    if (!open) return

    const fetchResults = async () => {
      setIsLoading(true)
      try {
        const url = debouncedSearch ? `/api/search?q=${encodeURIComponent(debouncedSearch)}` : `/api/search`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setApiResults(data.results || null)
          setIsRecent(data.isRecent || false)
        }
      } catch (error) {
        console.error("Error fetching search:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedSearch, open])

  const items: SearchItem[] = React.useMemo(() => {
    const base: SearchItem[] = [
      {
        id: "dashboard",
        title: "Dashboard",
        description: "Halaman utama",
        url: "/dashboard",
        icon: <LayoutDashboard className="h-4 w-4 text-muted-foreground" />,
        category: "Navigasi",
      },
      {
        id: "courses",
        title: "Kursus",
        description: "Lihat semua kursus",
        url: "/courses",
        icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
        category: "Navigasi",
      },
      {
        id: "asesmen",
        title: "Asesmen",
        description: "Lihat tugas dan kuis",
        url: "/asesmen",
        icon: <CheckSquare className="h-4 w-4 text-muted-foreground" />,
        category: "Navigasi",
      },
      {
        id: "projects",
        title: "PBL",
        description: "Kelola project based learning",
        url: "/projects",
        icon: <FolderOpen className="h-4 w-4 text-muted-foreground" />,
        category: "Navigasi",
      },
      {
        id: "schedule",
        title: "Jadwal",
        description: "Lihat jadwal kelas",
        url: "/schedule",
        icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
        category: "Navigasi",
      },
      {
        id: "users",
        title: "Pengguna",
        description: "Kelola pengguna sistem",
        url: "/users",
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        category: "Navigasi",
      },
      {
        id: "profile",
        title: "Profil",
        description: "Lihat dan edit profil",
        url: "/profile",
        icon: <User className="h-4 w-4 text-muted-foreground" />,
        category: "Akun",
      },
    ]

    if (!isMobile) {
      base.push({
        id: "settings",
        title: "Pengaturan",
        description: "Kelola pengaturan akun",
        url: "/settings",
        icon: <Settings className="h-4 w-4 text-muted-foreground" />,
        category: "Akun",
      })
    }

    base.push({
      id: "compiler",
      title: "Python Compiler",
      description: "Jalankan kode Python",
      url: "/compiler",
      icon: <Code className="h-4 w-4 text-muted-foreground" />,
      category: "Alat",
    })

    if (apiResults) {
      const courseCategory = isRecent ? "Kursus Terbaru" : "Kursus"
      apiResults.courses?.forEach((course: any) => {
        base.push({
          id: `course-${course.id}`,
          title: course.judul,
          description: course.kategori,
          url: `/courses/${course.id}`,
          icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
          category: courseCategory,
          badge: course.kategori,
        })
      })

      const materiCategory = isRecent ? "Materi Terbaru" : "Materi"
      apiResults.materi?.forEach((materi: any) => {
        base.push({
          id: `materi-${materi.id}`,
          title: materi.judul,
          description: materi.course?.judul ?? "Materi",
          url: `/courses/${materi.courseId || materi.course?.id}/${materi.id}`,
          icon: <BookMarked className="h-4 w-4 text-muted-foreground" />,
          category: materiCategory,
          badge: materi.course?.judul,
        })
      })

      const asesmenCategory = isRecent ? "Asesmen Terbaru" : "Asesmen Ditemukan"
      apiResults.asesmen?.forEach((asesmen: any) => {
        base.push({
          id: `asesmen-${asesmen.id}`,
          title: asesmen.nama,
          description: asesmen.course?.judul ?? "Asesmen",
          url: `/courses/${asesmen.courseId || asesmen.course?.id}/asesmen/${asesmen.id}`,
          icon: <FileText className="h-4 w-4 text-muted-foreground" />,
          category: asesmenCategory,
          badge: asesmen.tipe,
        })
      })
    }

    return base.filter((it) => {
      if (!user) return false
      if (String(it.url).startsWith("/users")) return user.role === "ADMIN"
      return true
    })
  }, [apiResults, isRecent, isMobile, user])

  const filteredItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => `${it.title} ${it.description ?? ""} ${it.category}`.toLowerCase().includes(q))
  }, [items, searchQuery])

  const handleSelect = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Ketik untuk mencari..." value={searchQuery} onValueChange={setSearchQuery} />
      <CommandList>
        {isLoading && (
          <div className="flex items-center gap-2 px-3 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Mencari...</span>
          </div>
        )}

        <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>

        {(() => {
          const groups = new Map<string, SearchItem[]>()
          filteredItems.forEach((it) => {
            const arr = groups.get(it.category) ?? []
            arr.push(it)
            groups.set(it.category, arr)
          })

          return Array.from(groups.entries()).map(([category, groupItems]) => (
            <CommandGroup key={category} heading={category}>
              {groupItems.map((it) => (
                <CommandItem key={it.id} value={it.title} onSelect={() => handleSelect(it.url)}>
                  <div className="flex items-center gap-2 flex-1">
                    {it.icon}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{it.title}</span>
                      {it.description && <span className="text-xs text-muted-foreground">{it.description}</span>}
                    </div>
                  </div>
                  {it.badge && (
                    <Badge variant="secondary" className="ml-2">
                      {it.badge}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))
        })()}
      </CommandList>
    </CommandDialog>
  )
}
