"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface PageProps {
  params: {
    id: string
    itemId: string
  }
}

export default function CoursePengumpulanIndexPage({ params }: PageProps) {
  const { id: courseId, itemId: asesmenId } = params
  const router = useRouter()

  React.useEffect(() => {
    // This route shouldn't be hit in normal flow (needs pengumpulanId).
    // Keep it user-friendly and prevent a hard 404.
    const t = setTimeout(() => {
      router.replace(`/courses/${courseId}/${asesmenId}`)
    }, 1200)
    return () => clearTimeout(t)
  }, [router, courseId, asesmenId])

  return (
    <div className="w-full py-8 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Pengumpulan tidak dipilih</CardTitle>
          <CardDescription>
            Link ini harusnya mengarah ke detail pengumpulan (memerlukan ID pengumpulan).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button asChild variant="outline">
            <Link href={`/courses/${courseId}/${asesmenId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
