"use client"

import { usePathname } from "next/navigation"
import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { useTransitionRouter } from "@/hooks/use-transition-router"
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  Calendar,
  Code,
  Users,
} from "lucide-react"

/* ---- Scale keyframes from tema/src/index.ts registerTabBarEffect ---- */
/* From tema: small: scale(1.1, 1), medium: scale(1.2), large: scale(1.3), xlarge: scale(1.15, 1.4) */
const SCALES = {
  small:  "scale(1.1, 1)",
  medium: "scale(1.2)",
  large:  "scale(1.3)",
  xlarge: "scale(1.15, 1.4)",
}

/* From tema/src/transition/ios.transition.ts: EASING = cubic-bezier(0.32,0.72,0,1) */
const SPRING_EASING = "cubic-bezier(0.32, 0.72, 0, 1)"
/* Water surface tension easing — smooth liquid flow */
const WATER_EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
/* Viscous liquid settling — from sheets-of-glass getScaleAnimation ease-out */
const LIQUID_SETTLE = "cubic-bezier(0.23, 1, 0.32, 1)"

interface MobileBottomNavProps {
  className?: string
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useTransitionRouter()
  const { user } = useAuth()
  const { t } = useAutoTranslate()

  const barRef = useRef<HTMLDivElement>(null)
  const blobRef = useRef<HTMLDivElement>(null)
  const blobInnerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])

  // Gesture state (refs to avoid re-renders during drag)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const lastVelocity = useRef(0)
  const maxVelocity = useRef(0)
  const lastTimestamp = useRef(0)
  const lastPointerX = useRef(0)
  const dragTarget = useRef<number>(-1)
  // Track previous active for morphing direction
  const prevActiveRef = useRef<number>(-1)

  const menuItems = useMemo(() => [
    { title: t("Beranda"), href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "GURU", "SISWA"] },
    { title: t("Jadwal"), href: "/schedule", icon: Calendar, roles: ["ADMIN", "GURU", "SISWA"] },
    { title: t("Kursus"), href: "/courses", icon: BookOpen, roles: ["GURU", "SISWA"] },
    { title: t("PBL"), href: "/projects", icon: FolderKanban, roles: ["GURU", "SISWA"] },
    { title: t("Compiler"), href: "/compiler", icon: Code, roles: ["GURU", "SISWA"] },
    { title: t("Kelola"), href: "/users", icon: Users, roles: ["ADMIN"] },
  ], [t])

  const filteredMenu = menuItems.filter((item) => user && item.roles.includes(user.role)).slice(0, 5)

  const activeIndex = filteredMenu.findIndex(
    (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
  )

  /* ---- helpers ---- */
  const getItemRect = (idx: number) => {
    const el = itemRefs.current[idx]
    if (!el) return null
    return el.getBoundingClientRect()
  }

  const getBarRect = () => barRef.current?.getBoundingClientRect() ?? null

  /**
   * Move blob to a specific tab index with Water-Glass Fluid Morphing
   * The blob flows like water between tabs — stretching, compressing,
   * with border-radius morphing to simulate liquid surface tension
   */
  const moveBlobTo = useCallback((idx: number, animate = true) => {
    const blob = blobRef.current
    const inner = blobInnerRef.current
    const rect = getItemRect(idx)
    const barRect = getBarRect()
    if (!blob || !rect || !barRect) return

    const left = rect.left - barRect.left
    const width = rect.width

    if (animate) {
      const prevIdx = prevActiveRef.current
      const direction = idx > prevIdx ? 1 : idx < prevIdx ? -1 : 0
      const distance = Math.abs(idx - prevIdx)

      const baseDuration = 400
      const duration = baseDuration + distance * 60

      blob.style.transition = `left ${duration}ms ${LIQUID_SETTLE}, width ${duration}ms ${LIQUID_SETTLE}, opacity 200ms ease`

      // Click/navigate (not drag) — blob morphs at default size, settles to scale(1)
      if (inner && direction !== 0) {
        const stretchX = 1 + distance * 0.06
        const squashY = 1 - distance * 0.03

        inner.animate([
          { transform: 'scale(1)', borderRadius: '32px', offset: 0 },
          { transform: `scale(${stretchX}, ${squashY})`, borderRadius: `${28 - distance}px ${34 + distance}px ${34 + distance}px ${28 - distance}px`, offset: 0.25 },
          { transform: `scale(${squashY}, ${stretchX * 0.95})`, borderRadius: `${34 + distance}px ${28 - distance}px ${28 - distance}px ${34 + distance}px`, offset: 0.55 },
          { transform: 'scale(1.02, 0.99)', borderRadius: '31px 33px 33px 31px', offset: 0.8 },
          { transform: 'scale(1)', borderRadius: '32px', offset: 1 },
        ], {
          duration: duration + 100,
          easing: WATER_EASING,
          fill: "forwards",
        })
      }
    } else {
      blob.style.transition = "none"
      // Ensure blob is at default scale when not animated
      if (inner) inner.style.transform = 'scale(1)'
    }

    blob.style.left = `${left}px`
    blob.style.width = `${width}px`
    blob.style.opacity = "1"

    prevActiveRef.current = idx
  }, [])

  /** Move blob to an absolute X position (during drag) */
  const moveBlobToX = (x: number) => {
    const blob = blobRef.current
    const barRect = getBarRect()
    if (!blob || !barRect) return

    const blobWidth = blob.offsetWidth
    const relX = x - barRect.left - blobWidth / 2
    const clamped = Math.max(2, Math.min(relX, barRect.width - blobWidth - 2))

    blob.style.transition = "none"
    blob.style.left = `${clamped}px`
  }

  /**
   * Animate blob inner scale based on velocity — Water Surface Dynamics
   * Simulates water surface tension: liquid deforms based on force,
   * then surface tension pulls it back with dampened oscillation
   */
  const animateBlobScale = (type: "slowly" | "moveRight" | "moveLeft" | "settle" | "zoomIn") => {
    const inner = blobInnerRef.current
    if (!inner) return

    if (type === "zoomIn") {
      // Drag started — zoom blob from default scale(1) to large
      inner.animate([
        { transform: 'scale(1)', borderRadius: '32px' },
        { transform: SCALES.large, borderRadius: '32px' },
      ], {
        duration: 250,
        easing: LIQUID_SETTLE,
        fill: "forwards",
      })
      return
    }

    if (type === "settle") {
      // Drag ended — shrink blob back from large to default scale(1)
      inner.animate([
        { transform: inner.style.transform || SCALES.large, borderRadius: '32px' },
        { transform: "scale(1.06, 1.08)", borderRadius: '30px 34px 34px 30px', offset: 0.25 },
        { transform: "scale(0.98, 1.01)", borderRadius: '33px 31px 31px 33px', offset: 0.6 },
        { transform: 'scale(1)', borderRadius: '32px' },
      ], {
        duration: 400,
        easing: LIQUID_SETTLE,
        fill: "forwards",
      })
      return
    }

    // During drag — blob stays at large scale range, morphs fluidly
    const keyframes: Record<string, Keyframe[]> = {
      moveRight: [
        { transform: SCALES.large, borderRadius: '32px', offset: 0 },
        { transform: SCALES.small, borderRadius: '26px 36px 36px 26px', offset: 0.3 },
        { transform: SCALES.xlarge, borderRadius: '36px 26px 26px 36px', offset: 0.6 },
        { transform: SCALES.large, borderRadius: '32px', offset: 1 },
      ],
      moveLeft: [
        { transform: SCALES.large, borderRadius: '32px', offset: 0 },
        { transform: SCALES.xlarge, borderRadius: '36px 26px 26px 36px', offset: 0.1 },
        { transform: SCALES.small, borderRadius: '26px 36px 36px 26px', offset: 0.5 },
        { transform: SCALES.large, borderRadius: '32px', offset: 1 },
      ],
      slowly: [
        { transform: SCALES.large, borderRadius: '32px', offset: 0 },
        { transform: SCALES.medium, borderRadius: '30px 34px 34px 30px', offset: 0.4 },
        { transform: SCALES.large, borderRadius: '32px', offset: 1 },
      ],
    }

    inner.animate(keyframes[type], { duration: 800, easing: WATER_EASING, fill: "forwards" })
  }

  /** Find which tab the pointer is over */
  const getTabAtX = (x: number): number => {
    for (let i = 0; i < filteredMenu.length; i++) {
      const rect = getItemRect(i)
      if (rect && x >= rect.left && x <= rect.right) return i
    }
    return -1
  }

  /* ---- Pointer event handlers (gesture system) ---- */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    lastPointerX.current = e.clientX
    lastTimestamp.current = e.timeStamp
    lastVelocity.current = 0
    maxVelocity.current = 0

    const idx = getTabAtX(e.clientX)
    if (idx >= 0) dragTarget.current = idx

    // Adaptive Layering: water-glass bar lifts with fluid spring (from tema ion-tabs scale 1.038)
    if (barRef.current) {
      barRef.current.style.transition = `transform 240ms ${LIQUID_SETTLE}`
      barRef.current.style.transform = "scale(1.038) translateZ(0)"
    }

    // Show blob at touched tab and zoom it in instantly (no animation)
    if (idx >= 0) {
      moveBlobTo(idx, false) // Immediately move blob with no delay
      animateBlobScale("zoomIn")
    }

    // Capture pointer for reliable tracking
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [moveBlobTo])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return

    // Velocity tracking
    const dt = e.timeStamp - lastTimestamp.current
    if (dt > 0) {
      lastVelocity.current = (e.clientX - lastPointerX.current) / dt
    }
    lastPointerX.current = e.clientX
    lastTimestamp.current = e.timeStamp

    const absV = Math.abs(lastVelocity.current)
    if (absV > maxVelocity.current) maxVelocity.current = absV

    // Refractive Motion: liquid scale effect based on velocity
    if (absV > 0.2) {
      animateBlobScale("slowly")
    }
    if (maxVelocity.current > 0.2 && absV < 0.15 && Math.abs(e.clientX - startX.current) > 60) {
      animateBlobScale(lastVelocity.current > 0 ? "moveRight" : "moveLeft")
      maxVelocity.current = 0
    }

    // Move blob to follow finger
    moveBlobToX(e.clientX)

    // Detect tab under pointer — turn it blue, revert old one
    const idx = getTabAtX(e.clientX)
    if (idx >= 0 && idx !== dragTarget.current) {
      // Revert old tab color to default
      if (dragTarget.current >= 0) {
        const oldEl = itemRefs.current[dragTarget.current]
        if (oldEl) {
          oldEl.style.color = ''
          oldEl.style.transition = `color 200ms ease`
        }
      }
      // Set new tab color to blue (accent)
      const newEl = itemRefs.current[idx]
      if (newEl) {
        newEl.style.transition = `color 150ms ease`
        newEl.style.color = `rgb(var(--ios26-accent-rgb))`
      }
      dragTarget.current = idx
    }
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    isDragging.current = false

    // Water-glass settle: bar smoothly flows back to rest
    if (barRef.current) {
      barRef.current.style.transition = `transform 380ms ${LIQUID_SETTLE}`
      barRef.current.style.transform = "translateZ(0)"
    }

    // Clear all inline colors from drag
    itemRefs.current.forEach(el => {
      if (el) {
        el.style.color = ''
        el.style.transition = ''
      }
    })

    // Determine final tab
    let targetIdx = getTabAtX(e.clientX)
    if (targetIdx < 0) targetIdx = dragTarget.current
    if (targetIdx < 0) targetIdx = activeIndex >= 0 ? activeIndex : 0

    // Fluid Transformation: morph blob to final position with spring
    animateBlobScale("settle")
    moveBlobTo(targetIdx, true)

    // Navigate
    if (targetIdx >= 0 && targetIdx < filteredMenu.length) {
      router.navigate(filteredMenu[targetIdx].href)
    }

    dragTarget.current = -1
    maxVelocity.current = 0
  }, [activeIndex, filteredMenu, moveBlobTo, router])

  /* ---- Position blob on active tab when pathname changes ---- */
  useEffect(() => {
    const idx = activeIndex >= 0 ? activeIndex : 0
    // Immediate blob movement when route changes
    moveBlobTo(idx, false)
  }, [activeIndex, moveBlobTo, filteredMenu.length])

  // Also reposition on resize
  useEffect(() => {
    const handleResize = () => {
      const idx = activeIndex >= 0 ? activeIndex : 0
      moveBlobTo(idx, false)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [activeIndex, moveBlobTo])

  return (
    <nav
      className={cn("fixed z-50 ios26-tab-bar-wrapper", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "none" }}
    >
      <div ref={barRef} className="ios26-tab-bar">
        {/* Liquid Glass blob — flows like water with OVERFLOW beyond bar background
            From tema/ion-tabs.scss: ion-tab-button.ion-cloned-element uses glass-background
            and is positioned absolutely with transform-origin: center
            The blob scales BEYOND the container like ion-segment's indicator */}
        <div
          ref={blobRef}
          className="ios26-blob"
          style={{ left: 0, width: 0, opacity: 0 }}
        >
          <div ref={blobInnerRef} className="ios26-blob-inner" />
        </div>

        {/* Tab buttons with Adaptive Layering — icon morphs on select */}
        {filteredMenu.map((item, index) => {
          const isActive = index === activeIndex

          return (
            <a
              key={item.href}
              ref={(el) => { itemRefs.current[index] = el }}
              href={item.href}
              onClick={(e) => {
                e.preventDefault()
                if (!isDragging.current) {
                  moveBlobTo(index, false) // Immediate blob movement for click
                  router.navigate(item.href)
                }
              }}
              className={cn(
                "ios26-tab-button",
                isActive && "ios26-tab-selected"
              )}
              draggable={false}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
                touchAction: 'manipulation'
              }}
            >
              <item.icon
                className={cn(
                  "ios26-tab-icon",
                  /* Refractive Motion: icon animates on active */
                  isActive && "ios26-tab-icon-active"
                )}
                strokeWidth={isActive ? 2.0 : 1.7}
              />
              <span className={cn(
                "ios26-tab-label",
                isActive && "ios26-tab-label-active"
              )}>{item.title}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
