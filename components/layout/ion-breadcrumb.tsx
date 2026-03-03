/**
 * Ion-style Breadcrumb Component for React/Next.js
 * Based on @rdlabo/ionic-theme-ios26 breadcrumbs design
 */

"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IonBreadcrumbProps {
  href?: string
  children: React.ReactNode
  active?: boolean
  className?: string
}

function IonBreadcrumb({ href, children, active = false, className }: IonBreadcrumbProps) {
  const baseClasses = cn(
    "inline-flex items-center px-2 py-1 text-sm transition-colors duration-200",
    "hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
    active 
      ? "text-gray-900 font-medium cursor-default" 
      : "text-blue-500 hover:text-blue-700",
    className
  )

  if (active || !href) {
    return <span className={baseClasses}>{children}</span>
  }

  return (
    <Link href={href} className={baseClasses}>
      {children}
    </Link>
  )
}

interface IonBreadcrumbsProps {
  children: React.ReactNode
  className?: string
  separator?: React.ReactNode
}

function IonBreadcrumbs({ 
  children, 
  className, 
  separator = <ChevronRight className="h-4 w-4 text-gray-400" />
}: IonBreadcrumbsProps) {
  const childArray = React.Children.toArray(children)
  
  return (
    <nav 
      className={cn("flex items-center space-x-1 text-sm", className)}
      aria-label="Breadcrumb"
    >
      {childArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < childArray.length - 1 && (
            <span className="mx-2" aria-hidden="true">
              {separator}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// Example usage component based on the tema pattern
interface IonStyleBreadcrumbProps {
  className?: string
}

export function IonStyleBreadcrumb({ className }: IonStyleBreadcrumbProps) {
  const pathname = usePathname()
  
  // Don't show breadcrumb on login page or root dashboard
  if (pathname === '/login' || pathname === '/' || pathname === '/dashboard') {
    return null
  }

  const pathSegments = pathname.split('/').filter(Boolean)
  
  // Create breadcrumb items
  const breadcrumbItems: { label: string; href?: string; active: boolean }[] = []

  // Build path progressively
  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isActive = index === pathSegments.length - 1
    
    // Skip dashboard
    if (segment === 'dashboard') return
    
    // Map common segments to readable names
    const segmentLabels: { [key: string]: string } = {
      'courses': 'Kursus',
      'projects': 'Proyek',
      'proyek': 'Proyek Saya', 
      'users': 'Pengguna',
      'schedule': 'Jadwal',
      'profile': 'Profil',
      'settings': 'Pengaturan',
      'materi': 'Materi',
      'asesmen': 'Asesmen',
      'compiler': 'Compiler',
      'add': 'Tambah',
      'new': 'Tambah',
      'edit': 'Edit',
      'submit': 'Kumpulkan',
      'kuis': 'Kuis',
      'kelompok': 'Kelompok',
      'students': 'Siswa',
      'nilai': 'Nilai',
      'pengumpulan': 'Pengumpulan',
      'activity': 'Aktivitas',
      'stats': 'Statistik',
      'search': 'Pencarian',
      'sintaks_1': 'Sintaks 1',
      'sintaks_2': 'Sintaks 2',
      'sintaks_3': 'Sintaks 3',
      'sintaks_4': 'Sintaks 4',
      'sintaks_5': 'Sintaks 5',
      'sintaks_6': 'Sintaks 6',
      'sintaks_7': 'Sintaks 7',
      'sintaks_8': 'Sintaks 8',
    }

    // Skip dynamic IDs
    if (/^[0-9a-fA-F]{24}$/.test(segment) || /^[0-9a-fA-Z]{15,}$/.test(segment) || /^[0-9]+$/.test(segment)) {
      return
    }
    
    const label = segmentLabels[segment] || 
                 segment.charAt(0).toUpperCase() + segment.slice(1)
    
    breadcrumbItems.push({
      label,
      href: isActive ? undefined : currentPath,
      active: isActive
    })
  })

  return (
    <div className={cn("mb-6 hidden md:block", className)}>
      <IonBreadcrumbs>
        {breadcrumbItems.map((item, index) => (
          <IonBreadcrumb
            key={index}
            href={item.href}
            active={item.active}
          >
            {item.label}
          </IonBreadcrumb>
        ))}
      </IonBreadcrumbs>
    </div>
  )
}

export { IonBreadcrumb, IonBreadcrumbs }
