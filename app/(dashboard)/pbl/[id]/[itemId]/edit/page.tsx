"use client"

import { useEffect, use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useBreadcrumbPage } from "@/hooks/use-breadcrumb"
import { AsesmenEditForm } from "@/components/asesmen-edit-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  const { id: courseId, itemId } = resolvedParams

  const [mode, setMode] = useState<"loading" | "materi" | "asesmen" | "notfound">("loading")
  const [materiLoading, setMateriLoading] = useState(false)
  const [materiError, setMateriError] = useState<string | null>(null)
  const [materi, setMateri] = useState<any>(null)

  const [judul, setJudul] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [lampiran, setLampiran] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)

  // Set custom breadcrumb - we'll need to fetch course and asesmen names
  const breadcrumbItems = useMemo(() => [
    {
      label: 'PBL',
      href: '/pbl',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: 'Loading...', // Will be replaced by smart-breadcrumb
      href: `/pbl/${courseId}?tab=assessments`,
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: 'Loading...', // Will be replaced by smart-breadcrumb  
      href: `/pbl/${courseId}/${itemId}`,
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />
    }
  ], [courseId, itemId])

  useBreadcrumbPage(mode === "materi" ? "Edit Materi" : "Edit", breadcrumbItems)

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

  useEffect(() => {
    if (isLoading) return
    if (!user) return
    if (user.role !== "GURU" && user.role !== "ADMIN") return

    let cancelled = false
    const detectType = async () => {
      try {
        // Try materi first
        const materiRes = await fetch(`/api/materi/${itemId}`)
        if (materiRes.ok) {
          const data = await materiRes.json()
          if (cancelled) return
          setMode("materi")
          setMateri(data?.materi)
          setJudul(data?.materi?.judul || "")
          setDeskripsi(data?.materi?.deskripsi || "")
          setLampiran(data?.materi?.lampiran || "")
          return
        }

        const asesmenRes = await fetch(`/api/asesmen/${itemId}`)
        if (asesmenRes.ok) {
          if (cancelled) return
          setMode("asesmen")
          return
        }

        if (!cancelled) setMode("notfound")
      } catch {
        if (!cancelled) setMode("notfound")
      }
    }

    detectType()
    return () => {
      cancelled = true
    }
  }, [user, isLoading, itemId])

  const handleSaveMateri = async () => {
    setMateriError(null)
    setMateriLoading(true)
    try {
      let fileData: string | undefined
      let fileName: string | undefined
      let fileType: string | undefined
      let fileSize: number | undefined

      if (file) {
        fileName = file.name
        fileType = file.type
        fileSize = file.size
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result || ""))
          reader.onerror = () => reject(new Error("Gagal membaca file"))
          reader.readAsDataURL(file)
        })
      }

      const res = await fetch(`/api/materi/${itemId}` , {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          judul,
          deskripsi,
          lampiran: lampiran || null,
          ...(fileData ? { fileData, fileName, fileType, fileSize } : {}),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Gagal mengupdate materi")
      }

      router.push(`/pbl/${courseId}/${itemId}`)
      router.refresh()
    } catch (e: any) {
      setMateriError(e?.message || "Gagal mengupdate materi")
    } finally {
      setMateriLoading(false)
    }
  }

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

  if (mode === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (mode === "notfound") {
    return (
      <div className="w-full py-6 sm:py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Item tidak ditemukan</h1>
          <p className="text-muted-foreground">Materi/asesmen tidak ditemukan atau Anda tidak punya akses.</p>
        </div>
      </div>
    )
  }

  if (mode === "asesmen") {
    return (
      <div className="w-full py-6 sm:py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Edit Asesmen</h1>
          <p className="text-muted-foreground">Perbarui informasi asesmen</p>
        </div>

        <AsesmenEditForm asesmenId={itemId} courseId={courseId} />
      </div>
    )
  }

  return (
    <div className="w-full py-6 sm:py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold sm:text-3xl">Edit Materi</h1>
        <p className="text-muted-foreground">Perbarui informasi materi</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {materiError ? (
            <p className="text-sm text-destructive">{materiError}</p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="judul">Judul</Label>
            <Input id="judul" value={judul} onChange={(e) => setJudul(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea id="deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={6} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lampiran">Lampiran (URL) (opsional)</Label>
            <Input id="lampiran" value={lampiran} onChange={(e) => setLampiran(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Ganti File (opsional)</Label>
            <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {materi?.fileName ? (
              <p className="text-xs text-muted-foreground">File saat ini: {materi.fileName}</p>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()} disabled={materiLoading}>
              Batal
            </Button>
            <Button onClick={handleSaveMateri} disabled={materiLoading || !judul.trim()}>
              {materiLoading ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Menyimpan...</span>
              ) : (
                "Simpan"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
