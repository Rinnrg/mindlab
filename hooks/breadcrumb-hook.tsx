"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
  addBreadcrumb: (breadcrumb: BreadcrumbItem) => void
  resetBreadcrumbs: () => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  const addBreadcrumb = (breadcrumb: BreadcrumbItem) => {
    setBreadcrumbs(prev => [...prev, breadcrumb])
  }

  const resetBreadcrumbs = () => {
    setBreadcrumbs([])
  }

  return (
    <BreadcrumbContext.Provider value={{
      breadcrumbs,
      setBreadcrumbs,
      addBreadcrumb,
      resetBreadcrumbs
    }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider')
  }
  return context
}

// Simple no-op hook - breadcrumbs are now handled by SmartBreadcrumb component automatically
// This hook is kept for backwards compatibility but does nothing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useBreadcrumbPage(_title: string, _breadcrumbs?: BreadcrumbItem[]) {
  // No-op - breadcrumbs are generated from URL by SmartBreadcrumb
  // This prevents circular reference issues completely
}
