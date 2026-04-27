"use client"

import { useEffect, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useBreadcrumbPage } from "@/hooks/use-breadcrumb"
import { AsesmenEditForm } from "@/components/asesmen-edit-form"
import { Loader2, BookOpen, FileText, Pencil } from "lucide-react"

interface PageProps {
  params: Promise<{ 
    id: string
  itemId: string
  }>
}

export default function EditAsesmenPage({ params }: PageProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const resolvedParams = use(params)
  const { id: courseId, itemId: asesmenId } = resolvedParams

  // Set custom breadcrumb - we'll need to fetch course and asesmen names
  const breadcrumbItems = useMemo(() => [
    {
      label: 'PBL',
      href: '/projects',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: 'Loading...', // Will be replaced by smart-breadcrumb
      href: `/projects/${courseId}?tab=assessments`,
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: 'Loading...', // Will be replaced by smart-breadcrumb  
      href: `/projects/${courseId}/${asesmenId}`,
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />
    }
  ], [courseId, asesmenId])

  useBreadcrumbPage('Edit Asesmen', breadcrumbItems)

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'GURU' && user.role !== 'ADMIN') {
      router.push('/courses')
      return
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="w-full py-6 sm:py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold sm:text-3xl">Edit Asesmen</h1>
        <p className="text-muted-foreground">
          Perbarui informasi asesmen
        </p>
      </div>

      <AsesmenEditForm asesmenId={asesmenId} courseId={courseId} />
    </div>
  )
}
