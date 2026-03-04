"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  FolderKanban,
  Calendar,
  Users,
  ChevronsLeft,
  ChevronsRight,
  X,
  Code,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobile?: boolean
  onNavClick?: () => void
}

export function Sidebar({ isCollapsed, setIsCollapsed, isMobile, onNavClick }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { t } = useAutoTranslate()
  const [isHovered, setIsHovered] = useState(false)

  // Blob system refs
  const navRef = useRef<HTMLDivElement>(null)
  const blobRef = useRef<HTMLDivElement>(null)
  const blobInnerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const prevActiveRef = useRef<number>(-1)

  // Constants for smooth blob animation
  const LIQUID_SETTLE = "cubic-bezier(0.23, 1, 0.32, 1)"
  const WATER_EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)"

  const menuItems = useMemo(() => [
    { title: t("Beranda"), href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "GURU", "SISWA"] },
    { title: t("Jadwal"), href: "/schedule", icon: Calendar, roles: ["GURU", "SISWA"] },
    { title: t("Kursus"), href: "/courses", icon: BookOpen, roles: ["GURU", "SISWA"] },
    { title: t("Proyek"), href: "/projects", icon: FolderKanban, roles: ["GURU", "SISWA"] },
    { title: t("Compiler"), href: "/compiler", icon: Code, roles: ["GURU", "SISWA"] },
    ...(isMobile ? [{ title: t("Pengaturan"), href: "/settings", icon: Settings, roles: ["ADMIN", "GURU", "SISWA"] }] : []),
  ], [t, isMobile])

  const adminMenuItems = useMemo(() => [
    { title: t("Manajemen Role"), href: "/users", icon: Users, roles: ["ADMIN"] },
  ], [t])

  const filteredMenu = useMemo(() => menuItems.filter((item) => user && item.roles.includes(user.role)), [menuItems, user])
  const filteredAdminMenu = useMemo(() => adminMenuItems.filter((item) => user && item.roles.includes(user.role)), [adminMenuItems, user])

  // Combine all menu items for blob positioning
  const allMenuItems = [...filteredMenu, ...filteredAdminMenu]

  // Sidebar akan expand jika tidak collapsed atau sedang di hover (tapi tidak untuk mobile)
  const isExpanded = isMobile || !isCollapsed || isHovered

  // Find active index
  const activeIndex = allMenuItems.findIndex(
    (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
  )

  /**
   * Move blob to a specific menu item index with smooth animation
   */
  const moveBlobTo = useCallback((idx: number, animate = true) => {
    const blob = blobRef.current
    const inner = blobInnerRef.current
    const nav = navRef.current
    if (!blob || !nav || idx < 0 || idx >= allMenuItems.length) return

    const targetElement = itemRefs.current[idx]
    if (!targetElement) return

    const navRect = nav.getBoundingClientRect()
    const targetRect = targetElement.getBoundingClientRect()
    
    const top = targetRect.top - navRect.top
    const height = targetRect.height

    if (animate) {
      const prevIdx = prevActiveRef.current
      const direction = idx > prevIdx ? 1 : idx < prevIdx ? -1 : 0
      const distance = Math.abs(idx - prevIdx)

      // Add delay for smooth transition
      const baseDuration = 450
      const duration = baseDuration + distance * 80

      blob.style.transition = `top ${duration}ms ${LIQUID_SETTLE}, height ${duration}ms ${LIQUID_SETTLE}, opacity 300ms ease`

      // Smooth blob morphing animation
      if (inner && direction !== 0) {
        const stretchY = 1 + distance * 0.08
        const squashX = 1 - distance * 0.04

        inner.animate([
          { transform: 'scale(1)', borderRadius: '14px', offset: 0 },
          { transform: `scale(${squashX}, ${stretchY})`, borderRadius: `${12 - distance}px ${16 + distance}px ${16 + distance}px ${12 - distance}px`, offset: 0.3 },
          { transform: `scale(${stretchY * 0.95}, ${squashX})`, borderRadius: `${16 + distance}px ${12 - distance}px ${12 - distance}px ${16 + distance}px`, offset: 0.65 },
          { transform: 'scale(1.01, 0.99)', borderRadius: '13px 15px 15px 13px', offset: 0.85 },
          { transform: 'scale(1)', borderRadius: '14px', offset: 1 },
        ], {
          duration: duration + 100,
          easing: WATER_EASING,
          fill: "forwards",
        })
      }
    } else {
      blob.style.transition = "none"
      if (inner) inner.style.transform = 'scale(1)'
    }

    blob.style.top = `${top}px`
    blob.style.height = `${height}px`
    blob.style.opacity = "1"

    prevActiveRef.current = idx
  }, [allMenuItems.length, LIQUID_SETTLE, WATER_EASING])

  // Move blob when active item changes
  useEffect(() => {
    if (activeIndex >= 0) {
      // Small delay to let layout settle
      const timer = setTimeout(() => moveBlobTo(activeIndex, true), 80)
      return () => clearTimeout(timer)
    }
  }, [activeIndex, moveBlobTo])

  // Reposition on resize
  useEffect(() => {
    const handleResize = () => {
      if (activeIndex >= 0) {
        moveBlobTo(activeIndex, false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [activeIndex, moveBlobTo])

  return (
    <aside
      onMouseEnter={() => !isMobile && isCollapsed && setIsHovered(true)}
      onMouseLeave={() => !isMobile && isCollapsed && setIsHovered(false)}
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col",
        /* Sidebar transition from tema/ion-menu.scss: --border: none, transparent bg */
        /* Transition easing: cubic-bezier(0.32, 0.72, 0, 1) from ios.transition.ts EASING */
        "transition-all duration-[540ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
        isMobile ? "w-full h-full" : "fixed left-0 top-0 z-40 h-screen",
        !isMobile && (isExpanded ? "w-[260px] shadow-lg" : "w-[70px]"),
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group overflow-hidden" onClick={onNavClick}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0">
            <img src="/logo mindlab.svg" alt="Mindlab Logo" className="h-9 w-9 object-contain" />
          </div>
          <span 
            className={cn(
              "text-base font-semibold tracking-tight text-foreground whitespace-nowrap transition-all duration-300",
              !isExpanded && !isMobile && "opacity-0 w-0"
            )}
          >
            Mindlab
          </span>
        </Link>
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={onNavClick}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scroll">
        <nav 
          ref={navRef}
          className="relative flex flex-col gap-1 px-3 py-4 min-h-full pb-4"
        >
          {/* Liquid Glass blob — flows smoothly between nav items */}
          <div
            ref={blobRef}
            className="sidebar-blob"
            style={{ top: 0, height: 0, opacity: 0 }}
          >
            <div ref={blobInnerRef} className="sidebar-blob-inner" />
          </div>

          {filteredMenu.map((item, index) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                ref={(el) => { itemRefs.current[index] = el }}
                href={item.href}
                onClick={(e) => {
                  // Smooth blob movement on click
                  moveBlobTo(index, true)
                  onNavClick?.()
                }}
                className={cn(
                  /* Nav item with outline removal */
                  "group relative flex items-center rounded-[14px] py-2.5 px-2 text-sm font-medium overflow-hidden",
                  "outline-none focus:outline-none -webkit-tap-highlight-color-transparent",
                  /* Transition from tema: transform 140ms ease-out, color 140ms ease */
                  "transition-[color,transform,box-shadow] duration-[140ms]",
                  "ease-[cubic-bezier(0.32,0.72,0,1)]",
                  "transform-gpu backface-hidden",
                  `stagger-${Math.min(index + 1, 5)}`,
                  "animate-slide-in-left",
                  isActive
                    ? "text-primary"
                    /* Hover: from ion-button :not(.ion-activated):hover opacity 0.72 pattern */
                    : "text-muted-foreground hover:text-accent-foreground active:scale-[1.03]",
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
              <div className="flex items-center justify-center min-w-[38px] w-[38px] shrink-0 relative z-10">
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-110",
                    isActive && "text-primary",
                  )}
                />
              </div>
              <span 
                className={cn(
                  "whitespace-nowrap transition-all duration-300 overflow-hidden relative z-10",
                  isExpanded || isMobile ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}
              >
                {item.title}
              </span>
            </Link>
          )
        })}

        {/* Separator and Admin Menu */}
        {filteredAdminMenu.length > 0 && (
          <>
            <div className="my-2 border-t border-sidebar-border" />
            {filteredAdminMenu.map((item, index) => {
              const globalIndex = filteredMenu.length + index
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  ref={(el) => { itemRefs.current[globalIndex] = el }}
                  href={item.href}
                  onClick={(e) => {
                    // Smooth blob movement on click
                    moveBlobTo(globalIndex, true)
                    onNavClick?.()
                  }}
                  className={cn(
                    /* Admin nav item with outline removal */
                    "group relative flex items-center rounded-[14px] py-2.5 px-2 text-sm font-medium overflow-hidden",
                    "outline-none focus:outline-none -webkit-tap-highlight-color-transparent",
                    "transition-[color,transform,box-shadow] duration-[140ms]",
                    "ease-[cubic-bezier(0.32,0.72,0,1)]",
                    "transform-gpu backface-hidden",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-accent-foreground active:scale-[1.03]",
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="flex items-center justify-center min-w-[38px] w-[38px] shrink-0 relative z-10">
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-110",
                        isActive && "text-primary",
                      )}
                    />
                  </div>
                  <span 
                    className={cn(
                      "whitespace-nowrap transition-all duration-300 overflow-hidden relative z-10",
                      isExpanded || isMobile ? "opacity-100 w-auto" : "opacity-0 w-0"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              )
            })}
          </>
        )}
        </nav>
      </div>

      {!isMobile && (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            /* Collapse button — glass pill from api.scss glass-background */
            "absolute top-5 -right-3 h-6 w-6 rounded-full border-[0.5px] border-white/70 dark:border-white/15",
            "bg-sidebar/90 backdrop-blur-[4px] backdrop-saturate-[200%]",
            "shadow-[inset_0_0_4px_0_rgba(255,255,255,0.1),0_2px_8px_-2px_rgba(0,0,0,0.1)]",
            /* Scale from ion-button.scss $scaleup-small-icon-only = 1.18, adapted */
            "hover:bg-accent hover:scale-[1.15] active:scale-[1.05]",
            /* Transition easing from tema: 140ms cubic-bezier(0.32, 0.72, 0, 1) */
            "z-50 transition-[background,transform,box-shadow] duration-[140ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
            "flex items-center justify-center"
          )}
          onClick={() => {
            setIsCollapsed(!isCollapsed)
            setIsHovered(false)
          }}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      )}
    </aside>
  )
}
