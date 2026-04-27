"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Dockbar } from "./dockbar"
import { Header } from "./header"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { FloatingBackButton } from "@/components/ui/floating-back-button"
import { PageTransition } from "./page-transition"
import { SmartBreadcrumb } from "./smart-breadcrumb"
import { useNavigationMode } from "@/lib/navigation-mode-context"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { navigationMode, mobileNavigationMode } = useNavigationMode()
  const pathname = usePathname()

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    let rafId: number

    const checkMobile = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const mobile = window.innerWidth < 768
        setIsMobile(mobile)
        if (mobile) setIsCollapsed(true)
      })
    }

    checkMobile()
    window.addEventListener("resize", checkMobile, { passive: true })
    return () => {
      window.removeEventListener("resize", checkMobile)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // Derive which mobile nav to show
  const showMobileSidebar = isMobile && mobileNavigationMode === "sidebar"
  const showMobileBottomNav = isMobile && mobileNavigationMode === "bottom-nav"
  
  // Header selalu tampil (baik desktop maupun mobile)
  const showHeader = true

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop navigation */}
      {!isMobile && (
        <>
          {navigationMode === "sidebar" ? (
            <Sidebar
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              isMobile={false}
            />
          ) : (
            <Dockbar />
          )}
        </>
      )}

      {/* Mobile sidebar via Sheet — only when mobile nav mode is sidebar */}
      {showMobileSidebar && (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[280px] gap-0 [&>button]:hidden">
            <VisuallyHidden.Root asChild>
              <SheetTitle>Navigation Menu</SheetTitle>
            </VisuallyHidden.Root>
            <VisuallyHidden.Root asChild>
              <SheetDescription>Main navigation sidebar</SheetDescription>
            </VisuallyHidden.Root>
            <Sidebar
              isCollapsed={false}
              setIsCollapsed={() => {}}
              isMobile={true}
              onNavClick={() => setMobileSidebarOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      <div className={cn(
        "flex min-h-screen flex-col",
        !isMobile && navigationMode === "sidebar" && "transition-all duration-300 ease-out",
        !isMobile && navigationMode === "sidebar" && (isCollapsed ? "ml-[70px]" : "ml-[260px]"),
      )}>
        {showHeader && (
          <Header
            onMenuClick={() => setMobileSidebarOpen(true)}
            isMobile={isMobile}
            isMobileSidebar={showMobileSidebar}
          />
        )}
        <main 
          className={cn(
            "flex-1",
            "px-4 pt-2 sm:px-6 sm:pt-3 md:px-8 md:pt-4",
            isMobile
              ? (showMobileBottomNav ? "pb-24" : "pb-6")
              : navigationMode === "dock" ? "pb-32" : "pb-6"
          )}
        >
          <SmartBreadcrumb />
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile floating back button - only show in sidebar mode */}
      {showMobileSidebar && <FloatingBackButton />}
      
      {/* Mobile bottom navigation — only when mobile nav mode is bottom-nav */}
      {showMobileBottomNav && <MobileBottomNav />}
    </div>
  )
}
