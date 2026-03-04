"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransitionRouter } from '@/hooks/use-transition-router'
import { ChevronRight, ChevronLeft, Home, BookOpen, Users, Calendar, User, Settings, Code, Activity, BarChart3, Search as SearchIcon, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { useBreadcrumb, type BreadcrumbItem as BreadcrumbItemType } from '@/hooks/use-breadcrumb'

const LIQUID_SETTLE = 'cubic-bezier(0.23, 1, 0.32, 1)'
const SPRING = 'cubic-bezier(0.32, 0.72, 0, 1)'

interface SmartBreadcrumbProps {
  className?: string
  showMobile?: boolean
}

// Segment label/icon mapping — keyed by segment name
const segmentConfig: { [key: string]: { label: string; icon?: React.ReactNode } } = {
  'dashboard':    { label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
  'courses':      { label: 'Kursus', icon: <BookOpen className="h-4 w-4" /> },
  'asesmen':      { label: 'Asesmen', icon: <FileText className="h-4 w-4" /> },
  'projects':     { label: 'Proyek', icon: <BookOpen className="h-4 w-4" /> },
  'proyek':       { label: 'Proyek Saya', icon: <BookOpen className="h-4 w-4" /> },
  'users':        { label: 'Pengguna', icon: <Users className="h-4 w-4" /> },
  'schedule':     { label: 'Jadwal', icon: <Calendar className="h-4 w-4" /> },
  'profile':      { label: 'Profil', icon: <User className="h-4 w-4" /> },
  'settings':     { label: 'Pengaturan', icon: <Settings className="h-4 w-4" /> },
  'compiler':     { label: 'Compiler', icon: <Code className="h-4 w-4" /> },
  'materi':       { label: 'Materi', icon: <FileText className="h-4 w-4" /> },
  'add':          { label: 'Tambah' },
  'new':          { label: 'Tambah' },
  'edit':         { label: 'Edit' },
  'submit':       { label: 'Kumpulkan' },
  'kuis':         { label: 'Kuis' },
  'kelompok':     { label: 'Kelompok', icon: <Users className="h-4 w-4" /> },
  'nilai':        { label: 'Nilai', icon: <BarChart3 className="h-4 w-4" /> },
  'pengumpulan':  { label: 'Pengumpulan', icon: <BookOpen className="h-4 w-4" /> },
  'activity':     { label: 'Aktivitas', icon: <Activity className="h-4 w-4" /> },
  'stats':        { label: 'Statistik', icon: <BarChart3 className="h-4 w-4" /> },
  'search':       { label: 'Pencarian', icon: <SearchIcon className="h-4 w-4" /> },
  'students':     { label: 'Siswa', icon: <Users className="h-4 w-4" /> },
  'sintaks_1':    { label: 'Sintaks 1: Orientasi Masalah' },
  'sintaks_2':    { label: 'Sintaks 2: Organisasi Belajar' },
  'sintaks_3':    { label: 'Sintaks 3: Investigasi' },
  'sintaks_4':    { label: 'Sintaks 4: Pengembangan' },
  'sintaks_5':    { label: 'Sintaks 5: Analisis & Evaluasi' },
  'sintaks_6':    { label: 'Sintaks 6: Refleksi' },
  'sintaks_7':    { label: 'Sintaks 7: Assessment' },
  'sintaks_8':    { label: 'Sintaks 8: Closure' },
}

// Helper: detect whether a segment is a dynamic ID (MongoDB ObjectId, UUID, or numeric)
function isIdSegment(seg: string): boolean {
  // More comprehensive ID detection
  return /^[0-9a-fA-F]{24}$/.test(seg)          // MongoDB ObjectId (24 char hex)
    || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/.test(seg) // UUID prefix
    || /^[a-zA-Z0-9]{15,}$/.test(seg)              // Generic long alphanumeric ID (like cuid/nanoid)
    || /^[0-9]+$/.test(seg)                        // Pure numeric ID
    || /^c[a-z0-9]{24,}$/i.test(seg)              // cuid style (starts with c)
    || seg.match(/^[a-z0-9_-]{20,}$/i)            // Generic long ID with common chars
}

// Hook untuk fetch nama berdasarkan ID dan context
function useFetchBreadcrumbNames(pathname: string) {
  const [nameCache, setNameCache] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const fetchNames = useCallback(async () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const namesToFetch: Array<{id: string, type: string, path: string}> = []

    // Analyze path untuk menentukan ID apa yang perlu di-fetch
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      const prevSegment = pathSegments[i - 1]
      
      if (isIdSegment(segment)) {
        const path = '/' + pathSegments.slice(0, i + 1).join('/')
        
        // Tentukan type berdasarkan context
        if (prevSegment === 'courses') {
          namesToFetch.push({id: segment, type: 'course', path})
        } else if (prevSegment === 'materi') {
          namesToFetch.push({id: segment, type: 'materi', path})
        } else if (prevSegment === 'asesmen') {
          namesToFetch.push({id: segment, type: 'asesmen', path})
        } else if (prevSegment === 'proyek' || prevSegment === 'projects') {
          namesToFetch.push({id: segment, type: 'proyek', path})
        } else if (prevSegment === 'users') {
          namesToFetch.push({id: segment, type: 'user', path})
        }
      }
    }

    if (namesToFetch.length === 0) {
      setLoading(false)
      return
    }

    setLoading(true)

    // Fetch names yang belum ada di cache
    const newCache: Record<string, string> = {}
    
    for (const item of namesToFetch) {
      try {
        let response
        let name = 'Loading...'

        switch (item.type) {
          case 'course':
            response = await fetch(`/api/courses/${item.id}`)
            if (response.ok) {
              const data = await response.json()
              name = data.course?.judul || 'Kursus'
            } else {
              name = 'Kursus'
            }
            break
            
          case 'materi':
            response = await fetch(`/api/materi/${item.id}`)
            if (response.ok) {
              const data = await response.json()
              name = data.materi?.judul || data.judul || 'Materi'
            } else {
              name = 'Materi'
            }
            break
            
          case 'asesmen':
            response = await fetch(`/api/asesmen/${item.id}`)
            if (response.ok) {
              const data = await response.json()
              name = data.asesmen?.nama || data.nama || 'Asesmen'
            } else {
              name = 'Asesmen'
            }
            break
            
          case 'proyek':
            response = await fetch(`/api/proyek/${item.id}`)
            if (response.ok) {
              const data = await response.json()
              name = data.proyek?.judul || data.judul || 'Proyek'
            } else {
              name = 'Proyek'
            }
            break
            
          case 'user':
            response = await fetch(`/api/users/${item.id}`)
            if (response.ok) {
              const data = await response.json()
              name = data.user?.nama || data.nama || 'User'
            } else {
              name = 'User'
            }
            break
            
          default:
            name = 'Detail'
        }
        
        newCache[item.id] = name
      } catch (error) {
        console.warn(`Failed to fetch name for ${item.type} ${item.id}:`, error)
        newCache[item.id] = item.type === 'course' ? 'Kursus' :
                             item.type === 'materi' ? 'Materi' :
                             item.type === 'asesmen' ? 'Asesmen' :
                             item.type === 'proyek' ? 'Proyek' :
                             item.type === 'user' ? 'User' : 'Detail'
      }
    }

    setNameCache(newCache)
    setLoading(false)
  }, [pathname])

  useEffect(() => {
    fetchNames()
  }, [fetchNames])

  return { nameCache, loading }
}

function generateAutoBreadcrumbs(pathname: string, nameCache: Record<string, string>): BreadcrumbItemType[] {
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItemType[] = []

  // Walk through every segment and build the trail
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]
    const prevSegment = pathSegments[i - 1]
    const isLast = i === pathSegments.length - 1
    const builtPath = '/' + pathSegments.slice(0, i + 1).join('/')

    // Skip the "dashboard" segment — tidak perlu ditampilkan
    if (segment === 'dashboard') continue

    // Handle dynamic IDs - sekarang kita tampilkan dengan nama yang sudah di-fetch
    if (isIdSegment(segment)) {
      const name = nameCache[segment]
      
      if (name && name !== 'Loading...') {
        // Tentukan icon berdasarkan context
        let icon = undefined
        if (prevSegment === 'courses') {
          icon = <BookOpen className="h-4 w-4" />
        } else if (prevSegment === 'materi') {
          icon = <FileText className="h-4 w-4" />
        } else if (prevSegment === 'asesmen') {
          icon = <FileText className="h-4 w-4" />
        } else if (prevSegment === 'proyek' || prevSegment === 'projects') {
          icon = <BookOpen className="h-4 w-4" />
        } else if (prevSegment === 'users') {
          icon = <Users className="h-4 w-4" />
        }

        breadcrumbs.push({
          label: name,
          href: isLast ? undefined : builtPath,
          icon,
        })
      }
      continue
    }

    // Lookup a human-readable label / icon untuk segment biasa
    const cfg = segmentConfig[segment]
    const label = cfg?.label
      ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ').replace(/_/g, ' ')
    const icon = cfg?.icon

    breadcrumbs.push({
      label,
      href: isLast ? undefined : builtPath,
      icon,
    })
  }

  return breadcrumbs
}

export function SmartBreadcrumb({ className, showMobile = false }: SmartBreadcrumbProps) {
  const pathname = usePathname()
  const router = useTransitionRouter()
  const { breadcrumbs: manualBreadcrumbs } = useBreadcrumb()
  const { nameCache, loading } = useFetchBreadcrumbNames(pathname)
  
  // Don't show breadcrumb on login page or root dashboard
  if (pathname === '/login' || pathname === '/' || pathname === '/dashboard') {
    return null
  }

  // Use manual breadcrumbs if available (highest priority), 
  // otherwise generate automatically with names
  const breadcrumbs = manualBreadcrumbs.length > 0 
    ? manualBreadcrumbs 
    : generateAutoBreadcrumbs(pathname, nameCache)

  // Don't show breadcrumb if no breadcrumbs, or if auto breadcrumbs are loading
  if (breadcrumbs.length === 0 || (manualBreadcrumbs.length === 0 && loading)) {
    return null
  }

  // Check if current page is compiler (has its own back button)
  const isCompilerPage = pathname.includes('/compiler')

  return (
    <div className={cn('mb-4 mt-1 overflow-visible relative z-10', className)}>
      {/* Desktop & Tablet Breadcrumb */}
      <Breadcrumb className={cn('hidden md:block', showMobile && 'block')}>
        <BreadcrumbList className="flex-wrap">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={`${crumb.href || crumb.label}-${index}`}>
              <BreadcrumbItem className="flex items-center">
                {!crumb.href ? (
                  <BreadcrumbPage className="flex items-center gap-1.5 text-foreground font-medium text-sm">
                    {crumb.icon}
                    <span>{crumb.label}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      href={crumb.href} 
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors text-muted-foreground text-sm"
                    >
                      {crumb.icon}
                      <span>{crumb.label}</span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile — Liquid Glass Sticky Back Button */}
      {showMobile && !isCompilerPage && (
        <MobileStickyBackButton
          breadcrumbs={breadcrumbs}
          onBack={() => router.navigateBack()}
        />
      )}
    </div>
  )
}

/**
 * MobileStickyBackButton — Floating back button that:
 * - At top of page: floats above content (normal flow)
 * - On scroll down: transitions to sticky at top with liquid glass morphing
 * - Uses IntersectionObserver for performance
 */
function MobileStickyBackButton({
  breadcrumbs,
  onBack,
}: {
  breadcrumbs: BreadcrumbItemType[]
  onBack: () => void
}) {
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const barRef = React.useRef<HTMLDivElement>(null)
  const [isSticky, setIsSticky] = React.useState(false)

  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // Animate liquid morph on sticky change
  React.useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    if (isSticky) {
      // Morphing INTO sticky — liquid glass blob expand
      bar.animate([
        { transform: 'scale(1) translateY(0)', borderRadius: '24px', opacity: 1, backdropFilter: 'blur(0px)' },
        { transform: 'scale(1.06, 0.94) translateY(-2px)', borderRadius: '20px', opacity: 0.95, offset: 0.2 },
        { transform: 'scale(0.98, 1.02) translateY(0)', borderRadius: '22px', opacity: 1, offset: 0.5 },
        { transform: 'scale(1) translateY(0)', borderRadius: '22px', opacity: 1, backdropFilter: 'blur(20px)' },
      ], {
        duration: 450,
        easing: LIQUID_SETTLE,
        fill: 'forwards',
      })
    } else {
      // Morphing OUT of sticky — settle back
      bar.animate([
        { transform: 'scale(1) translateY(0)', borderRadius: '22px', backdropFilter: 'blur(20px)' },
        { transform: 'scale(1.03, 0.97)', borderRadius: '24px', offset: 0.3 },
        { transform: 'scale(0.99, 1.01)', borderRadius: '24px', offset: 0.6 },
        { transform: 'scale(1) translateY(0)', borderRadius: '24px', backdropFilter: 'blur(0px)' },
      ], {
        duration: 380,
        easing: LIQUID_SETTLE,
        fill: 'forwards',
      })
    }
  }, [isSticky])

  const currentPage = breadcrumbs[breadcrumbs.length - 1]

  return (
    <div className="block md:hidden">
      {/* Sentinel — when this scrolls out of view, bar becomes sticky */}
      <div ref={sentinelRef} className="h-0 w-full" />

      <div
        ref={barRef}
        className={cn(
          'flex items-center gap-3 py-2 px-1 transition-none',
          'transform-gpu backface-hidden will-change-[transform,border-radius,backdrop-filter]',
          isSticky && [
            /* Sticky mode — glass pill at top */
            'sticky top-0 z-50 -mx-4 px-4 py-3',
            'bg-background/72 dark:bg-background/68',
            'backdrop-blur-[20px] backdrop-saturate-[360%]',
            'shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.4),0_1px_3px_0_rgba(0,0,0,0.06),0_4px_12px_-2px_rgba(0,0,0,0.08)]',
            'dark:shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.06),0_1px_3px_0_rgba(0,0,0,0.2),0_4px_12px_-2px_rgba(0,0,0,0.3)]',
            'border-b border-border/30 dark:border-white/5',
          ],
        )}
      >
        {/* Liquid Glass Back Button */}
        <Button
          onClick={onBack}
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full flex-shrink-0 relative overflow-hidden",
            // Liquid glass effect
            "bg-primary/15 hover:bg-primary/25",
            "backdrop-blur-md border border-white/20",
            "text-primary",
            "shadow-[0_2px_8px_-2px_rgba(var(--ios26-accent-rgb,59,130,246),0.25),inset_0_0.5px_0_0_rgba(255,255,255,0.3)]",
            "dark:shadow-[0_2px_8px_-2px_rgba(var(--ios26-accent-rgb,59,130,246),0.3),inset_0_0.5px_0_0_rgba(255,255,255,0.06)]",
            // Liquid transitions
            "transition-[transform,box-shadow,background,filter] duration-[350ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
            "hover:scale-110 hover:shadow-[0_4px_16px_-2px_rgba(var(--ios26-accent-rgb,59,130,246),0.35),inset_0_0.5px_0_0_rgba(255,255,255,0.4)]",
            "active:scale-95 active:brightness-[0.96]",
            "transform-gpu backface-hidden",
          )}
        >
          <ChevronLeft className="h-5 w-5 relative z-10" />
          <span className="sr-only">Kembali</span>
        </Button>
        
        {/* Current page title */}
        <div className={cn(
          "flex items-center gap-2 text-base font-semibold text-foreground",
          "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
        )}>
          {currentPage?.icon}
          <span>{currentPage?.label}</span>
        </div>
      </div>
    </div>
  )
}
