"use client"

// Simple no-op hook for breadcrumb - completely static to avoid any issues
export function useBreadcrumbPage(_title?: string, _breadcrumbs?: any) {
  // This is a no-op function - breadcrumbs are handled automatically by SmartBreadcrumb component
  // based on URL structure, so we don't need to do anything here
}

// For backwards compatibility
export function useBreadcrumb() {
  return {
    breadcrumbs: [],
    setBreadcrumbs: () => {},
    addBreadcrumb: () => {},
    resetBreadcrumbs: () => {}
  }
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

// Provider is not needed anymore since breadcrumbs are auto-generated
export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
