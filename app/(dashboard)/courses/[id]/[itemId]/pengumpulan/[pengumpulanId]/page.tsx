"use client"

// Ensure this route is always resolved dynamically in production.
// This helps avoid weird RSC prefetch/caching edge cases where params can be missing.
export const dynamic = "force-dynamic"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Download,
  Eye,
  Save,
  CheckCircle2,
  Star,
  Trophy,
  Loader2,
  FileText,
  Code,
} from "lucide-react"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { motion, AnimatePresence } from "framer-motion"

interface PageProps {
  params: {
    id: string
    itemId: string
  pengumpulanId?: string
  }
}

export default function CoursePengumpulanDetailPage({ params }: PageProps) {
  const { id: courseId, itemId: asesmenId } = params
  // Some production RSC edge-cases have been observed where the typed param isn't present.
  // Fall back to reading the last path segment on client.
  const pengumpulanId = React.useMemo(() => {
    const direct = (params as any)?.pengumpulanId
    if (direct) return String(direct)
    if (typeof window === "undefined") return ""
    const parts = window.location.pathname.split("/").filter(Boolean)
    return parts[parts.length - 1] || ""
  }, [params])

  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { confirm, error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()

  const [loading, setLoading] = React.useState(true)
  const [pengumpulan, setPengumpulan] = React.useState<any>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [showPdf, setShowPdf] = React.useState(true)

  const [nilai, setNilai] = React.useState<string>("")
  const [catatan, setCatatan] = React.useState<string>("")
  const [feedback, setFeedback] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    // Canonicalize URL: /courses/[courseId]/[asesmenId]/[pengumpulanId]
    // Keep this legacy route working via redirect.
    if (typeof window !== "undefined") {
      const should = `/courses/${courseId}/${asesmenId}/${pengumpulanId}`
      if (window.location.pathname !== should) {
        router.replace(should)
        return
      }
    }

    if (!pengumpulanId || pengumpulanId === "undefined" || pengumpulanId === "null") {
      setLoadError("ID pengumpulan tidak valid")
      setLoading(false)
      return
    }

    if (isLoading) return
    if (!user) {
      router.push("/login")
      return
    }
    if (user.role !== "GURU" && user.role !== "ADMIN") {
      router.push(`/courses/${courseId}/${asesmenId}`)
      return
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/pengumpulan/${pengumpulanId}`)
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || "Gagal mengambil data pengumpulan")
        setPengumpulan(data?.pengumpulan)
        setNilai(data?.pengumpulan?.nilai?.toString?.() || "")
        setCatatan(data?.pengumpulan?.catatan || "")
        setFeedback(data?.pengumpulan?.feedback || "")
      } catch (e) {
  const msg = e instanceof Error ? e.message : "Gagal mengambil data"
  setLoadError(msg)
  showError("Gagal", msg)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, isLoading, courseId, asesmenId, pengumpulanId, router])

  const fileHref = React.useMemo(() => {
    if (!pengumpulan) return null
    const db = (pengumpulan as any)?.fileData ? `/api/pengumpulan/${pengumpulan.id}/file` : null
    return db || pengumpulan.fileUrl || null
  }, [pengumpulan])

  const onSave = async (validated: boolean) => {
    if (!nilai) {
      showError("Gagal", "Nilai wajib diisi")
      return
    }

    const n = parseFloat(nilai)
    if (Number.isNaN(n) || n < 0 || n > 100) {
      showError("Gagal", "Nilai harus berupa angka antara 0-100")
      return
    }

    if (validated) {
      const ok = await confirm("Validasi & Masukkan ke Showcase?", {
        description:
          "Tugas ini akan divalidasi dan otomatis muncul di Showcase profil siswa. Pastikan nilai dan feedback sudah sesuai.",
        confirmText: "Validasi",
        cancelText: "Batal",
        type: "success",
      })
      if (!ok) return
    }

    setIsSubmitting(true)
    await execute(
      async () => {
        const res = await fetch(`/api/pengumpulan/${pengumpulanId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nilai: n,
              catatan,
              feedback,
              status: validated ? "VALIDATED" : "DINILAI",
              validatedBy: user?.nama,
            }),
          }
        )
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || "Gagal menyimpan")
        setPengumpulan(data?.pengumpulan)
      },
      {
        loadingMessage: validated ? "Memvalidasi..." : "Menyimpan...",
        successTitle: "Berhasil",
        successDescription: validated ? "Tugas divalidasi & masuk Showcase" : "Nilai berhasil disimpan",
        errorTitle: "Gagal",
      }
    )
    setIsSubmitting(false)
  }

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-full py-8 max-w-3xl mx-auto space-y-4">
        <AlertComponent />
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat detail pengumpulan</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Button asChild variant="outline">
              <Link href={`/courses/${courseId}/${asesmenId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
              </Link>
            </Button>
            <Button onClick={() => location.reload()}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!pengumpulan) {
    return (
      <div className="w-full py-8 max-w-3xl mx-auto space-y-4">
        <AlertComponent />
        <Card>
          <CardHeader>
            <CardTitle>Data pengumpulan tidak ditemukan</CardTitle>
            <CardDescription>
              Pengumpulan dengan ID <span className="font-mono">{pengumpulanId}</span> tidak ada atau Anda tidak punya akses.
            </CardDescription>
          </CardHeader>
          <CardContent>
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

  const status = pengumpulan.status as string | undefined
  const isValidated = status === "VALIDATED"

  return (
    <div className="w-full py-6 sm:py-8 space-y-6 max-w-6xl mx-auto">
      <AlertComponent />
      <ActionFeedback />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/courses/${courseId}/${asesmenId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
              </Link>
            </Button>
            {isValidated ? (
              <Badge className="bg-yellow-400/10 text-yellow-700 border-yellow-400/20">
                <Trophy className="mr-1 h-3 w-3" /> Ter-showcase
              </Badge>
            ) : (
              <Badge variant="outline">Belum divalidasi</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">Detail Pengumpulan</h1>
          <p className="text-sm text-muted-foreground">
            {pengumpulan?.siswa?.nama || pengumpulan?.ketua || "Siswa"} • {pengumpulan?.siswa?.email || ""}
          </p>
        </div>

        {pengumpulan?.siswaId && (
          <Button asChild variant="outline">
            <Link href={`/profile/${pengumpulan.siswaId}`}>
              <Star className="mr-2 h-4 w-4" /> Profil Showcase
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Hasil Tugas
                  </CardTitle>
                  <CardDescription>
                    File / kode yang dikumpulkan siswa
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {fileHref && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={fileHref} download>
                        <Download className="mr-2 h-4 w-4" /> Unduh
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowPdf(!showPdf)}>
                    <Eye className="mr-2 h-4 w-4" /> {showPdf ? "Sembunyikan" : "Lihat"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                {showPdf && fileHref ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="aspect-[4/5] w-full bg-muted/50">
                      <iframe
                        src={`${fileHref}#toolbar=0`}
                        className="w-full h-full border-0"
                        title="Submission Preview"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Preview dinonaktifkan atau file tidak tersedia.
                  </div>
                )}
              </AnimatePresence>

              {pengumpulan.sourceCode && (
                <div className="p-6 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="h-4 w-4" />
                    <h4 className="font-semibold text-sm">Source Code / Teks Jawaban</h4>
                  </div>
                  <pre className="p-4 rounded-xl bg-background border overflow-x-auto text-sm font-mono leading-relaxed">
                    <code>{pengumpulan.sourceCode}</code>
                  </pre>
                </div>
              )}

              {pengumpulan.output && (
                <div className="p-6 border-t bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-4 w-4" />
                    <h4 className="font-semibold text-sm">Output</h4>
                  </div>
                  <pre className="p-4 rounded-xl bg-background border overflow-x-auto text-sm font-mono leading-relaxed whitespace-pre-wrap">
                    <code>{pengumpulan.output}</code>
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Penilaian</CardTitle>
              <CardDescription>Input nilai dan feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nilai (0-100)</Label>
                <Input
                  value={nilai}
                  onChange={(e) => setNilai(e.target.value)}
                  placeholder="contoh: 85"
                  type="number"
                  min={0}
                  max={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Feedback (muncul di Showcase)</Label>
                <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} />
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Button onClick={() => onSave(false)} disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" /> Simpan Nilai
                </Button>
                <Button onClick={() => onSave(true)} disabled={isSubmitting} variant={isValidated ? "secondary" : "default"}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> {isValidated ? "Sudah divalidasi" : "Validasi & Masukkan Showcase"}
                </Button>
              </div>

              {isValidated && (
                <Alert>
                  <AlertDescription>
                    Setelah divalidasi, nilai akan muncul di profil siswa sebagai Showcase.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
