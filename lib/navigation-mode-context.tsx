"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type NavigationMode = "sidebar" | "dock"

interface NavigationModeContextType {
  navigationMode: NavigationMode
  setNavigationMode: (mode: NavigationMode) => void
  toggleNavigationMode: () => void
}

const NavigationModeContext = createContext<NavigationModeContextType | undefined>(undefined)

export function NavigationModeProvider({ children }: { children: React.ReactNode }) {
  const [navigationMode, setNavigationModeState] = useState<NavigationMode>("dock")

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("navigation-mode") as NavigationMode
    if (saved && (saved === "sidebar" || saved === "dock")) {
      setNavigationModeState(saved)
    }
  }, [])

  const setNavigationMode = (mode: NavigationMode) => {
    setNavigationModeState(mode)
    localStorage.setItem("navigation-mode", mode)
  }

  const toggleNavigationMode = () => {
    const newMode = navigationMode === "sidebar" ? "dock" : "sidebar"
    setNavigationMode(newMode)
  }

  return (
    <NavigationModeContext.Provider
      value={{
        navigationMode,
        setNavigationMode,
        toggleNavigationMode,
      }}
    >
      {children}
    </NavigationModeContext.Provider>
  )
}

export function useNavigationMode() {
  const context = useContext(NavigationModeContext)
  if (context === undefined) {
    throw new Error("useNavigationMode must be used within a NavigationModeProvider")
  }
  return context
}
