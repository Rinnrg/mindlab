"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Dockbar } from "./dockbar"
import { Header } from "./header"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { SmartBreadcrumb } from "./smart-breadcrumb"
import { FloatingBackButton } from "@/components/ui/floating-back-button"
import { PageTransition } from "./page-transition"
import { useNavigationMode } from "@/lib/navigation-mode-context"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { navigationMode } = useNavigationMode()
  const pathname = usePathname()

  // Check if current page is settings
  const isSettingsPage = pathname === "/settings"

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop navigation - conditional rendering berdasarkan mode */}
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

      <div className={cn(
        "flex min-h-screen flex-col",
        !isMobile && navigationMode === "sidebar" && "transition-all duration-300 ease-out",
        !isMobile && navigationMode === "sidebar" && (isCollapsed ? "ml-[70px]" : "ml-[260px]"),
      )}>
        <Header onMenuClick={() => {}} isMobile={isMobile} />
        <main 
          className={cn(
            "flex-1",
            // Full width for settings page, normal padding for others
            !isSettingsPage && "px-4 pt-2 sm:px-6 sm:pt-3 md:px-8 md:pt-4",
            isMobile ? "pb-24" : navigationMode === "dock" ? "pb-32" : "pb-6"
          )}
        >
          {/* Desktop only breadcrumb - hide on settings page */}
          {!isSettingsPage && <SmartBreadcrumb showMobile={false} />}
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile floating back button */}
      {isMobile && <FloatingBackButton />}
      
      {/* Mobile bottom navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  )
}
