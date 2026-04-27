"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface SmartBreadcrumbProps {
  className?: string
  showMobile?: boolean
}

// Simple static segment mapping
const segmentConfig: { [key: string]: string } = {
  'dashboard': 'Dashboard',
  'courses': 'Kursus',
  'projects': 'PBL',
  'proyek': 'Proyek Saya',
  'users': 'Pengguna',
  'schedule': 'Jadwal',
  'profile': 'Profil',
  'settings': 'Pengaturan',
  'compiler': 'Compiler',
  'add': 'Tambah',
  'new': 'Tambah',
  'edit': 'Edit',
  'submit': 'Kumpulkan',
  'kuis': 'Kuis',
  'students': 'Siswa',
  'add-materi': 'Tambah Materi',
}

// Helper: detect whether a segment is a dynamic ID
function isIdSegment(seg: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(seg)          // MongoDB ObjectId
    || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/.test(seg) // UUID prefix
    || /^[a-zA-Z0-9]{15,}$/.test(seg)              // Generic long ID
    || /^[0-9]+$/.test(seg)                        // Pure numeric ID
    || /^c[a-z0-9]{24,}$/i.test(seg)              // cuid style
    || /^[a-z0-9_-]{20,}$/i.test(seg)             // Generic long ID
}

// Cache untuk menyimpan nama yang sudah di-fetch
const nameCache = new Map<string, string>()

export function SmartBreadcrumb({ className, showMobile = true }: SmartBreadcrumbProps) {
  const pathname = usePathname()
  const [names, setNames] = useState<Record<string, string>>({})

  // Parse segments from pathname
  const segments = pathname.split('/').filter(Boolean)

  // Fetch names for IDs
  useEffect(() => {
    let isMounted = true
    
    const fetchNames = async () => {
      const newNames: Record<string, string> = {}
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        const prevSegment = segments[i - 1]
        
        if (isIdSegment(segment)) {
          // Check cache first
          if (nameCache.has(segment)) {
            newNames[segment] = nameCache.get(segment)!
            continue
          }
          
          try {
            // Determine what type of ID this is based on context
            if (prevSegment === 'courses') {
              // This is a course ID
              const res = await fetch(`/api/courses/${segment}`)
              if (res.ok) {
                const data = await res.json()
                const name = data.course?.judul || data.judul || 'Kursus'
                newNames[segment] = name
                nameCache.set(segment, name)
              }
            } else if (prevSegment && isIdSegment(prevSegment)) {
              // This is likely materi or asesmen ID after courseId
              // Try materi first
              let found = false
              try {
                const materiRes = await fetch(`/api/materi/${segment}`)
                if (materiRes.ok) {
                  const data = await materiRes.json()
                  const name = data.materi?.judul || data.judul || 'Materi'
                  newNames[segment] = name
                  nameCache.set(segment, name)
                  found = true
                }
              } catch {
                // Try asesmen
              }
              
              if (!found) {
                try {
                  const asesmenRes = await fetch(`/api/asesmen/${segment}`)
                  if (asesmenRes.ok) {
                    const data = await asesmenRes.json()
                    const name = data.asesmen?.nama || data.nama || 'Asesmen'
                    newNames[segment] = name
                    nameCache.set(segment, name)
                  }
                } catch {
                  newNames[segment] = 'Detail'
                  nameCache.set(segment, 'Detail')
                }
              }
            } else {
              newNames[segment] = 'Detail'
            }
          } catch {
            newNames[segment] = 'Detail'
          }
        }
      }
      
      if (isMounted && Object.keys(newNames).length > 0) {
        setNames(prev => ({ ...prev, ...newNames }))
      }
    }

    fetchNames()
    
    return () => {
      isMounted = false
    }
  }, [pathname])

  // Generate breadcrumb items
  const items: Array<{ label: string; href?: string }> = []
  
  // Always start with Dashboard
  items.push({
    label: 'Dashboard',
    href: '/dashboard'
  })

  let currentPath = ''
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += '/' + segment

    // Skip dashboard since we already added it
    if (segment === 'dashboard') continue

    if (isIdSegment(segment)) {
      // Use fetched name or fallback
      const name = names[segment] || nameCache.get(segment) || 'Loading...'
      items.push({
        label: name,
        href: currentPath
      })
    } else {
      // Static segment
      const label = segmentConfig[segment]
      if (label) {
        items.push({
          label,
          href: currentPath
        })
      }
    }
  }

  if (!showMobile && items.length <= 1) {
    return null
  }

  return (
    <div className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <BreadcrumbSeparator>
                  <span className="mx-1">/</span>
                </BreadcrumbSeparator>
              )}
              <BreadcrumbItem>
                {index === items.length - 1 ? (
                  <BreadcrumbPage className="font-medium text-foreground">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      href={item.href || '#'} 
                      className="hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}

export default SmartBreadcrumb
