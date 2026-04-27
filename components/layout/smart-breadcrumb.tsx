'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, House, BookOpen, Users, Calendar, User, Settings, Code, Activity, BarChart3, Search as SearchIcon, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'

interface SmartBreadcrumbProps {
  className?: string
}

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

// Segment label/icon mapping
const segmentConfig: { [key: string]: { label: string; icon?: React.ReactNode } } = {
  'dashboard': { label: 'Dashboard', icon: <House className="h-4 w-4" /> },
  'courses': { label: 'Kursus', icon: <BookOpen className="h-4 w-4" /> },
  'asesmen': { label: 'Asesmen', icon: <FileText className="h-4 w-4" /> },
  'projects': { label: 'PBL', icon: <BookOpen className="h-4 w-4" /> },
  'proyek': { label: 'Proyek Saya', icon: <BookOpen className="h-4 w-4" /> },
  'users': { label: 'Pengguna', icon: <Users className="h-4 w-4" /> },
  'schedule': { label: 'Jadwal', icon: <Calendar className="h-4 w-4" /> },
  'profile': { label: 'Profil', icon: <User className="h-4 w-4" /> },
  'settings': { label: 'Pengaturan', icon: <Settings className="h-4 w-4" /> },
  'compiler': { label: 'Compiler', icon: <Code className="h-4 w-4" /> },
  'materi': { label: 'Materi', icon: <FileText className="h-4 w-4" /> },
  'add': { label: 'Tambah' },
  'new': { label: 'Tambah' },
  'edit': { label: 'Edit' },
  'submit': { label: 'Kumpulkan' },
  'kuis': { label: 'Kuis' },
  'kelompok': { label: 'Kelompok', icon: <Users className="h-4 w-4" /> },
  'nilai': { label: 'Nilai', icon: <BarChart3 className="h-4 w-4" /> },
  'pengumpulan': { label: 'Pengumpulan', icon: <BookOpen className="h-4 w-4" /> },
  'activity': { label: 'Aktivitas', icon: <Activity className="h-4 w-4" /> },
  'stats': { label: 'Statistik', icon: <BarChart3 className="h-4 w-4" /> },
  'search': { label: 'Pencarian', icon: <SearchIcon className="h-4 w-4" /> },
  'students': { label: 'Siswa', icon: <Users className="h-4 w-4" /> },
}

// Helper: detect whether a segment is a dynamic ID
function isIdSegment(seg: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(seg)          // MongoDB ObjectId
    || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/.test(seg) // UUID prefix
    || /^[a-zA-Z0-9]{15,}$/.test(seg)              // Generic long alphanumeric ID
    || /^[0-9]+$/.test(seg)                        // Pure numeric ID
    || /^c[a-z0-9]{24,}$/i.test(seg)              // cuid style
    || /^[a-z0-9_-]{20,}$/i.test(seg)             // Generic long ID
}

// Global cache for fetched names
const nameCache = new Map<string, string>()

// Hook untuk fetch nama berdasarkan ID
function useFetchNames(pathname: string): { names: Record<string, string>; loading: boolean } {
  const [names, setNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const fetchNames = useCallback(async () => {
    const segments = pathname.split('/').filter(Boolean)
    const toFetch: Array<{id: string, type: string}> = []

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const prevSegment = segments[i - 1]
      const prevPrevSegment = segments[i - 2]
      
      if (isIdSegment(segment) && !nameCache.has(segment)) {
        if (prevSegment === 'courses') {
          toFetch.push({id: segment, type: 'course'})
        } else if (prevSegment === 'materi') {
          toFetch.push({id: segment, type: 'materi'})
        } else if (prevSegment === 'asesmen') {
          toFetch.push({id: segment, type: 'asesmen'})
        } else if (prevPrevSegment === 'courses' || prevPrevSegment === 'projects') {
          // This is an item ID directly under a course/project (pattern: /courses/[courseId]/[itemId])
          toFetch.push({id: segment, type: 'course-item'})
          // Also fetch the parent if we don't have it
          const parentId = segments[i - 1]
          if (isIdSegment(parentId) && !nameCache.has(parentId)) {
            const parentType = prevPrevSegment === 'courses' ? 'course' : 'proyek'
            toFetch.push({id: parentId, type: parentType})
          }
        } else if (prevSegment === 'proyek' || prevSegment === 'projects') {
          toFetch.push({id: segment, type: 'proyek'})
        } else if (prevSegment === 'users') {
          toFetch.push({id: segment, type: 'user'})
        }
      }
    }

    if (toFetch.length === 0) {
      // Load from cache
      const cached: Record<string, string> = {}
      for (const seg of segments) {
        if (isIdSegment(seg) && nameCache.has(seg)) {
          cached[seg] = nameCache.get(seg)!
        }
      }
      setNames(cached)
      return
    }

    setLoading(true)

    try {
      const results = await Promise.allSettled(
        toFetch.map(async (item) => {
          try {
            let name = 'Detail'
            let response

            switch (item.type) {
              case 'course':
                response = await fetch(`/api/courses/${item.id}`)
                if (response.ok) {
                  const data = await response.json()
                  name = data.course?.judul || 'Kursus'
                }
                break
              case 'materi':
                response = await fetch(`/api/materi/${item.id}`)
                if (response.ok) {
                  const data = await response.json()
                  name = data.materi?.judul || data.judul || data.pbl?.judul || 'Materi'
                }
                break
              case 'asesmen':
                response = await fetch(`/api/asesmen/${item.id}`)
                if (response.ok) {
                  const data = await response.json()
                  name = data.asesmen?.nama || data.nama || 'Asesmen'
                }
                break
              case 'course-item':
                // Try to fetch as materi first, then asesmen
                response = await fetch(`/api/asesmen/${item.id}`)
                if (response.ok) {
                  const data = await response.json()
                  name = data.asesmen?.nama || data.nama || 'Asesmen'
                } else {
                  response = await fetch(`/api/materi/${item.id}`)
                  if (response.ok) {
                    const data = await response.json()
                    name = data.materi?.judul || data.judul || data.pbl?.judul || 'Materi'
                  }
                }
                break
              case 'proyek':
                response = await fetch(`/api/proyek/${item.id}`)
                if (response.ok) {
                  const data = await response.json()
                  // Handle both { proyek } and { pbl } responses
                  name = data.proyek?.judul || data.pbl?.judul || data.judul || 'PBL'
                }
                break
              case 'user':
                response = await fetch(`/api/users/${item.id}`)
                if (response.ok) {
                  const data = await response.json()
                  name = data.user?.nama || data.nama || 'User'
                }
                break
            }
            return { id: item.id, name }
          } catch {
            return { id: item.id, name: 'Detail' }
          }
        })
      )

      const newNames: Record<string, string> = {}
      // Add cached names
      for (const seg of segments) {
        if (isIdSegment(seg) && nameCache.has(seg)) {
          newNames[seg] = nameCache.get(seg)!
        }
      }
      // Add new results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          newNames[result.value.id] = result.value.name
          nameCache.set(result.value.id, result.value.name)
        }
      }

      setNames(newNames)
    } catch (error) {
      console.error('Error fetching names:', error)
    } finally {
      setLoading(false)
    }
  }, [pathname])

  useEffect(() => {
    fetchNames()
  }, [fetchNames])

  return { names, loading }
}

function generateBreadcrumbs(pathname: string, names: Record<string, string>): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Check context
  const courseIndex = segments.indexOf('courses')
  const isInCourse = courseIndex !== -1 && courseIndex + 1 < segments.length

  const projectIndex = segments.indexOf('projects')
  const isInProject = projectIndex !== -1 && projectIndex + 1 < segments.length

  // Always add base breadcrumb when in dynamic context
  if (isInCourse) {
    breadcrumbs.push({
      label: 'Kursus',
      href: '/courses',
      icon: <BookOpen className="h-4 w-4" />,
    })
  } else if (isInProject) {
    breadcrumbs.push({
      label: 'PBL',
      href: '/projects',
      icon: <BookOpen className="h-4 w-4" />,
    })
  }

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const prevSegment = segments[i - 1]
    const isLast = i === segments.length - 1
    const builtPath = '/' + segments.slice(0, i + 1).join('/')

    // Skip dashboard
    if (segment === 'dashboard') continue

    // Skip literal 'courses' and 'projects' segments as we handle them specially
    if (segment === 'courses' || segment === 'projects') continue;

    // Handle dynamic IDs
    if (isIdSegment(segment)) {
      const name = names[segment]
      if (name) {
        let icon = undefined
        let href = isLast ? undefined : builtPath

        if (prevSegment === 'courses') {
          // This is a course ID - show course name
          icon = <BookOpen className="h-4 w-4" />
          href = isLast ? undefined : `/courses/${segment}`
        } else if (segments[i - 2] === 'courses' || segments[i - 2] === 'projects') {
          // This is an item ID under a course or project
          icon = <FileText className="h-4 w-4" />
          // Don't provide href for last item
          href = isLast ? undefined : builtPath
        } else if (prevSegment === 'proyek' || prevSegment === 'projects') {
          icon = <BookOpen className="h-4 w-4" />
          href = isLast ? undefined : builtPath
        } else if (prevSegment === 'users') {
          icon = <Users className="h-4 w-4" />
        }

        breadcrumbs.push({
          label: name,
          href,
          icon,
        })
      }
      continue
    }

    // Handle regular segments
    const cfg = segmentConfig[segment]
    const label = cfg?.label || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    const icon = cfg?.icon

    breadcrumbs.push({
      label,
      href: isLast ? undefined : builtPath,
      icon,
    })
  }

  return breadcrumbs
}

export function SmartBreadcrumb({ className }: SmartBreadcrumbProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { names, loading } = useFetchNames(pathname)
  
  // Don't show on special pages
  if (pathname === '/login' || pathname === '/' || pathname === '/dashboard') {
    return null
  }

  const breadcrumbs = generateBreadcrumbs(pathname, names)

  // Don't show if no breadcrumbs or loading
  if (breadcrumbs.length === 0 || loading) {
    return null
  }

  return (
    <div className={cn('mb-8 pb-4 border-b border-border/30', className)}>
      {/* Desktop & Tablet Breadcrumb */}
      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={`${crumb.href || crumb.label}-${index}`}>
              <BreadcrumbItem>
                {!crumb.href ? (
                  <BreadcrumbPage className="flex items-center gap-2 text-blue-600 font-semibold">
                    {crumb.icon}
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      href={crumb.href} 
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors text-muted-foreground hover:font-medium"
                    >
                      {crumb.icon}
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile - Show back button and current page title */}
      <div className="block md:hidden">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.back()}
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700",
              "text-white shadow-lg",
              "transition-all duration-200 ease-in-out",
              "hover:scale-105 active:scale-95",
              "flex-shrink-0"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Kembali</span>
          </Button>
          
          <div className="flex flex-col min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">
              {breadcrumbs.slice(0, -1).map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className="truncate">{crumb.label}</span>
                  {idx < breadcrumbs.length - 2 && <span>/</span>}
                </React.Fragment>
              ))}
            </div>
            <div className="flex items-center gap-2 text-lg font-bold text-blue-600 truncate">
              {breadcrumbs[breadcrumbs.length - 1]?.icon}
              <span className="truncate">{breadcrumbs[breadcrumbs.length - 1]?.label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}