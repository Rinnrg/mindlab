"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type NavigationMode = "sidebar" | "dock"
export type MobileNavigationMode = "sidebar" | "bottom-nav"

interface NavigationModeContextType {
  navigationMode: NavigationMode
  toggleNavigationMode: () => void
  mobileNavigationMode: MobileNavigationMode
  setMobileNavigationMode: (mode: MobileNavigationMode) => void
}

const NavigationModeContext = createContext<NavigationModeContextType>({
  navigationMode: "dock",
  toggleNavigationMode: () => {},
  mobileNavigationMode: "sidebar",
  setMobileNavigationMode: () => {},
})

export function NavigationModeProvider({ children }: { children: React.ReactNode }) {
  const [navigationMode, setNavigationMode] = useState<NavigationMode>("dock")
  const [mobileNavigationMode, setMobileNavMode] = useState<MobileNavigationMode>("sidebar")

  useEffect(() => {
    const savedMode = localStorage.getItem("navigationMode") as NavigationMode
    if (savedMode) {
      setNavigationMode(savedMode)
    }
  }, [])

  useEffect(() => {
    // Reset localStorage untuk memastikan fresh start
    localStorage.removeItem("mobileNavigationMode")
    setMobileNavMode("sidebar")
    localStorage.setItem("mobileNavigationMode", "sidebar")
  }, [])

  const toggleNavigationMode = () => {
    const newMode = navigationMode === "sidebar" ? "dock" : "sidebar"
    setNavigationMode(newMode)
    localStorage.setItem("navigationMode", newMode)
  }

  const setMobileNavigationMode = (mode: MobileNavigationMode) => {
    setMobileNavMode(mode)
    localStorage.setItem("mobileNavigationMode", mode)
  }

  const contextValue = {
    navigationMode,
    toggleNavigationMode,
    mobileNavigationMode,
    setMobileNavigationMode,
  }

  return (
    <NavigationModeContext.Provider value={contextValue}>
      {children}
    </NavigationModeContext.Provider>
  )
}

export function useNavigationMode() {
  const context = useContext(NavigationModeContext)
  
  if (context === undefined) {
    throw new Error("useNavigationMode must be used within a NavigationModeProvider")
  }
  
  // Fallback untuk memastikan function tersedia
  return {
    navigationMode: context.navigationMode || "dock",
    toggleNavigationMode: context.toggleNavigationMode || (() => {}),
    mobileNavigationMode: context.mobileNavigationMode || "sidebar", 
    setMobileNavigationMode: context.setMobileNavigationMode || (() => {
      console.warn("setMobileNavigationMode not available")
    }),
  }
}
