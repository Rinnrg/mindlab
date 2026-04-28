"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Star,
  Trophy,
  User,
  Users,
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

type Showcase = any

export default function ProfileShowcaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const showcaseId = params.id as string
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [showcase, setShowcase] = React.useState<Showcase | null>(null)
  const [activeView, setActiveView] = React.useState<"pdf" | "code">("pdf")

  React.useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push("/login")
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/profile/showcase/${showcaseId}`)
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || "Gagal memuat detail showcase")
        setShowcase(data.showcase)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat detail showcase")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [isLoading, user, router, showcaseId])

  if (loading || isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !showcase) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4">
        <Button asChild variant="ghost">
          <Link href="/profile">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Detail Showcase</CardTitle>
            <CardDescription>{error || "Showcase tidak ditemukan"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const p = showcase.pengumpulanProyek
  const a = p?.asesmen
  const courseTitle = a?.course?.judul
  const fileHref = (p as any)?.fileData ? `/api/pengumpulan/${p.id}/file` : p?.fileUrl
  const hasPdf = Boolean(fileHref)
  const hasCode = Boolean(p?.sourceCode)
  const dateLocale = idLocale
  const isKelompok = Boolean(p?.namaKelompok)

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="ghost">
          <Link href={user?.role === "SISWA" ? "/profile" : `/profile/${showcase.siswaId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <Badge className="bg-yellow-400/10 text-yellow-700 border-yellow-400/20">
                <Trophy className="mr-1 h-3 w-3" /> Showcase
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl">{showcase.judul}</CardTitle>
              {showcase.deskripsi && (
                <CardDescription className="text-sm sm:text-base">{showcase.deskripsi}</CardDescription>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-xl font-bold text-primary">
              <Star className="h-5 w-5 fill-primary" />
              {showcase.nilai}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={showcase.siswa?.foto || ""} alt={showcase.siswa?.nama || "Siswa"} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{showcase.siswa?.nama}</p>
                {courseTitle && <p className="text-xs text-muted-foreground">{courseTitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(showcase.tanggalDinilai), "d MMMM yyyy", { locale: dateLocale })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />

          {/* Quick info */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Tugas / Proyek</p>
              <p className="text-sm font-medium">{a?.nama || "-"}</p>
            </div>
            <div className="rounded-2xl border p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Guru</p>
              <p className="text-sm font-medium">{a?.guru?.nama || "-"}</p>
            </div>
            <div className="rounded-2xl border p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Tipe</p>
              <p className="text-sm font-medium">{a?.tipePengerjaan || a?.tipe || "-"}</p>
            </div>
            {isKelompok && (
              <div className="rounded-2xl border p-4 space-y-1 sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Kelompok
                </p>
                <p className="text-sm font-medium">{p?.namaKelompok || "-"}</p>
                {Array.isArray(p?.anggota) && p.anggota.length > 0 && (
                  <p className="text-xs text-muted-foreground">Anggota: {p.anggota.join(", ")}</p>
                )}
              </div>
            )}
          </div>

          {/* Viewer switch */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant={activeView === "pdf" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveView("pdf")}
                disabled={!hasPdf}
              >
                <FileText className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button
                variant={activeView === "code" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveView("code")}
                disabled={!hasCode}
              >
                <FileText className="mr-2 h-4 w-4" /> Kode
              </Button>
            </div>

            {hasPdf && (
              <Button variant="outline" size="sm" asChild>
                <a href={fileHref} download>
                  <Download className="mr-2 h-4 w-4" /> Unduh
                </a>
              </Button>
            )}
          </div>

          <div className="rounded-2xl border overflow-hidden bg-muted/20">
            {activeView === "pdf" && hasPdf && (
              <div className="aspect-[4/5] w-full bg-muted/50">
                <iframe
                  src={`${fileHref}#toolbar=0`}
                  className="w-full h-full border-0"
                  title="Showcase PDF"
                />
              </div>
            )}

            {activeView === "code" && hasCode && (
              <div className="p-6">
                <pre className="p-4 rounded-xl bg-background border overflow-x-auto text-sm font-mono leading-relaxed max-h-[520px]">
                  <code>{p.sourceCode}</code>
                </pre>
                {p?.output && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Output</p>
                    <pre className="p-4 rounded-xl bg-background border overflow-x-auto text-sm font-mono leading-relaxed max-h-[280px] whitespace-pre-wrap">
                      <code>{p.output}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}

            {!hasPdf && !hasCode && (
              <div className="p-12 text-center text-muted-foreground">
                Tidak ada konten untuk ditampilkan.
              </div>
            )}
          </div>

          {p?.feedback && (
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-sm font-semibold mb-2">Feedback Guru</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
