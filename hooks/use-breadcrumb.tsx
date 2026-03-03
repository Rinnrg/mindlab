"use client"

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: ReactNode
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

  const addBreadcrumb = useCallback((breadcrumb: BreadcrumbItem) => {
    setBreadcrumbs(prev => [...prev, breadcrumb])
  }, [])

  const resetBreadcrumbs = useCallback(() => {
    setBreadcrumbs([])
  }, [])

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

// Hook untuk mengatur breadcrumb khusus halaman
// Accepts title and optional breadcrumbs array
export function useBreadcrumbPage(title: string, breadcrumbs?: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useBreadcrumb()
  const serialized = useRef('')

  useEffect(() => {
    // Serialize to prevent infinite re-render loops
    const key = JSON.stringify(breadcrumbs?.map(b => ({ label: b.label, href: b.href })) ?? title)
    if (serialized.current === key) return
    serialized.current = key

    if (breadcrumbs) {
      setBreadcrumbs(breadcrumbs)
    } else {
      // Untuk single page tanpa parent, tidak perlu breadcrumb
      setBreadcrumbs([])
    }

    return () => {
      setBreadcrumbs([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, breadcrumbs])
}
