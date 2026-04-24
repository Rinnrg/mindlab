"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useBreadcrumbPage } from "@/hooks/simple-breadcrumb"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  BookOpen, 
  PlayCircle, 
  FileText, 
  ChevronRight, 
  Download, 
  Link as LinkIcon,
  Pencil,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  Calendar,
  User,
  Eye,
  Loader2,
  EyeOff,
  Maximize2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"

interface MateriDetailClientProps {
  materi: {
    id: string
    judul: string
    deskripsi: string | null
    tgl_unggah: Date
    lampiran: string | null
    hasFileData: boolean
    fileName: string | null
    fileType: string | null
    fileSize: number | null
    courseId: string
    course: {
      id: string
      judul: string
      guru: {
        id: string
        nama: string
        email: string
        foto: string | null
      }
    }
  }
  allMateri: {
    id: string
    judul: string
    tgl_unggah: Date
  }[]
  courseId: string
}

export default function MateriDetailClient({ materi, allMateri, courseId }: MateriDetailClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { confirm, error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const [selectedMateriId, setSelectedMateriId] = useState(materi.id)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

  const isTeacherOrAdmin = user?.role === "GURU" || user?.role === "ADMIN"

  // Set custom breadcrumb with useMemo to prevent re-renders
  const breadcrumbItems = useMemo(() => [
    {
      label: 'Kursus',
      href: '/courses',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: materi.course.judul,
      href: `/courses/${courseId}`,
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: materi.judul,
      icon: <FileText className="h-4 w-4" />
    }
  ], [materi.course.judul, materi.judul, courseId])

  useBreadcrumbPage(materi.judul, breadcrumbItems)

  // Fetch PDF as blob for fast rendering
  const loadPdfBlob = useCallback(async () => {
    if (pdfBlobUrl) {
      // Already loaded, just toggle visibility
      setShowPdfViewer(true)
      return
    }
    setPdfLoading(true)
    setShowPdfViewer(true)
    try {
      const res = await fetch(`/api/materi/${materi.id}/file`)
      if (!res.ok) throw new Error("Gagal memuat file")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPdfBlobUrl(url)
    } catch (err) {
      console.error("Error loading PDF:", err)
    } finally {
      setPdfLoading(false)
    }
  }, [materi.id, pdfBlobUrl])

  const togglePdfViewer = useCallback(() => {
    if (showPdfViewer) {
      setShowPdfViewer(false)
    } else {
      loadPdfBlob()
    }
  }, [showPdfViewer, loadPdfBlob])

  const openPdfFullscreen = useCallback(() => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank')
    } else {
      window.open(`/api/materi/${materi.id}/file`, '_blank')
    }
  }, [pdfBlobUrl, materi.id])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
      }
    }
  }, [pdfBlobUrl])

  const getFileIcon = (url: string | null, mimetype?: string) => {
    // Check file from database first
    if (mimetype) {
      if (mimetype.startsWith("video/")) return <PlayCircle className="h-6 w-6" />
      if (mimetype === "application/pdf") return <FileText className="h-6 w-6" />
      return <FileText className="h-6 w-6" />
    }
    // Fallback to URL check
    if (!url) return <FileText className="h-6 w-6" />
    if (url.includes("youtube") || url.includes("youtu.be") || url.endsWith(".mp4") || url.endsWith(".webm")) {
      return <PlayCircle className="h-6 w-6" />
    }
    if (url.endsWith(".pdf")) return <FileText className="h-6 w-6" />
    return <LinkIcon className="h-6 w-6" />
  }

  const getBgColor = (url: string | null, mimetype?: string) => {
    // Check file from database first
    if (mimetype) {
      if (mimetype.startsWith("video/")) return "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
      if (mimetype === "application/pdf") return "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
      if (mimetype.startsWith("image/")) return "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
      return "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
    }
    // Fallback to URL check
    if (!url) return "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
    if (url.includes("youtube") || url.includes("youtu.be")) {
      return "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
    }
    if (url.endsWith(".pdf")) return "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
    if (url.endsWith(".mp4") || url.endsWith(".webm")) {
      return "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
    }
    return "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
  }

  const getFileType = (url: string | null, mimetype?: string, originalName?: string) => {
    // Check file from database first
    if (mimetype && originalName) {
      if (mimetype.startsWith("video/")) return `Video: ${originalName}`
      if (mimetype === "application/pdf") return `PDF: ${originalName}`
      if (mimetype.startsWith("image/")) return `Gambar: ${originalName}`
      return `File: ${originalName}`
    }
    // Fallback to URL check
    if (!url) return "Tidak ada lampiran"
    if (url.includes("youtube") || url.includes("youtu.be")) return "Video YouTube"
    if (url.endsWith(".pdf")) return "Dokumen PDF"
    if (url.endsWith(".mp4") || url.endsWith(".webm")) return "Video"
    return "Link External"
  }

  const handleDeleteMateri = async () => {
    const confirmed = await confirm("Hapus Materi", {
      description: `Apakah Anda yakin ingin menghapus materi "${materi.judul}"?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "warning",
    })

    if (!confirmed) return

    await execute(
      async () => {
        const response = await fetch(`/api/materi/${materi.id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Gagal menghapus materi")
        }
      },
      {
        loadingMessage: "Menghapus materi...",
        successTitle: "Berhasil!",
        successDescription: `Materi "${materi.judul}" berhasil dihapus`,
        errorTitle: "Gagal",
        onSuccess: () => {
          setTimeout(() => {
            router.push(`/courses/${courseId}`)
          }, 1500)
        },
      }
    )
  }

  const handleMateriChange = (materiId: string) => {
    // Clean up blob URL when switching materi
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl)
      setPdfBlobUrl(null)
    }
    setShowPdfViewer(false)
    setPdfLoading(false)
    setSelectedMateriId(materiId)
    router.push(`/courses/${courseId}/materi/${materiId}`)
  }

  const handleEditMateri = () => {
    router.push(`/courses/${courseId}/materi/${materi.id}/edit`)
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-0 lg:-m-6 xl:-m-8 relative">
      <AlertComponent />
      <ActionFeedback />

      {/* Sidebar - Materi List - iOS Glass */}
      <div className="w-80 border-r border-border/30 bg-background/50 backdrop-blur-md flex flex-col hidden lg:flex sticky top-8 h-[calc(100vh-4rem)] mt-8 relative z-0">
        <div className="p-4 sm:p-6 border-b border-border/30 shrink-0">
          <h2 className="font-semibold text-lg mb-1">Daftar Materi</h2>
          <p className="text-sm text-muted-foreground">Pilih materi untuk melihat detail</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 space-y-2">
            {allMateri.map((m, index) => (
              <button
                key={m.id}
                onClick={() => handleMateriChange(m.id)}
                className={`w-full text-left p-3 sm:p-4 rounded-xl border transition-all hover:border-primary/30 ${
                  selectedMateriId === m.id
                    ? "bg-primary/8 border-primary/30 shadow-sm"
                    : "bg-background/60 border-transparent hover:bg-accent/50"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-xs font-medium text-muted-foreground mt-0.5">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`font-medium line-clamp-2 text-sm ${selectedMateriId === m.id ? "text-primary" : ""}`}>
                      {m.judul}
                    </span>
                  </div>
                  {selectedMateriId === m.id && <ChevronRight className="h-4 w-4 text-primary shrink-0 ml-2" />}
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  {new Date(m.tgl_unggah).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Materi Detail */}
      <div className="flex-1 bg-background mt-8 relative z-0">
        <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8">

          {/* Header Section - iOS Glass */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 rounded-lg">
                    Materi Pembelajaran
                  </Badge>
                  <Badge variant="secondary" className="gap-1 rounded-lg">
                    <Calendar className="h-3 w-3" />
                    {new Date(materi.tgl_unggah).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {materi.judul}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Oleh: {materi.course.guru.nama}</span>
                </div>
              </div>

              {isTeacherOrAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEditMateri}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Materi
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={handleDeleteMateri}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <Separator />

            {/* Description - iOS Glass */}
            {materi.deskripsi && (
              <div className="prose dark:prose-invert max-w-none">
                <div className="p-4 sm:p-6 rounded-2xl ios-glass-inset border border-border/30">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Deskripsi Materi
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {materi.deskripsi}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Lampiran Section */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Lampiran & Sumber Belajar
            </h3>

            {(materi.hasFileData || materi.lampiran) ? (
              <div className="grid gap-4">
                <Card className="group ios-glass-card border-border/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 rounded-2xl">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start gap-4">
                    <div className={`p-3 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${
                      materi.hasFileData 
                        ? getBgColor(null, materi.fileType || undefined)
                        : getBgColor(materi.lampiran)
                    }`}>
                      {materi.hasFileData 
                        ? getFileIcon(null, materi.fileType || undefined)
                        : getFileIcon(materi.lampiran)
                      }
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">
                        {materi.hasFileData 
                          ? getFileType(null, materi.fileType || undefined, materi.fileName || undefined)
                          : getFileType(materi.lampiran)
                        }
                      </h4>
                      {materi.hasFileData ? (
                        <>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <FileText className="h-3 w-3 shrink-0" />
                            <span>{((materi.fileSize || 0) / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Klik tombol di samping untuk membuka atau mengunduh file
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <LinkIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate">{materi.lampiran}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Klik tombol di samping untuk membuka lampiran external
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {/* Tombol Lihat untuk PDF dan Video */}
                      {((materi.hasFileData && (materi.fileType === 'application/pdf' || materi.fileType?.startsWith('video/'))) ||
                        (materi.lampiran && (materi.lampiran.includes("youtube.com") || materi.lampiran.includes("youtu.be")))) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={materi.hasFileData && materi.fileType === 'application/pdf' ? togglePdfViewer : () => setShowPdfViewer(!showPdfViewer)}
                          disabled={pdfLoading}
                        >
                          {pdfLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : showPdfViewer ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          {pdfLoading ? 'Memuat...' : showPdfViewer ? 'Sembunyikan' : 'Lihat Lampiran'}
                        </Button>
                      )}
                      
                      {/* Tombol Unduh/Buka */}
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        asChild
                      >
                        <a 
                          href={materi.hasFileData ? `/api/materi/${materi.id}/file` : materi.lampiran || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          download={materi.hasFileData ? materi.fileName || undefined : undefined}
                        >
                          {materi.hasFileData ? (
                            <>
                              <Download className="h-4 w-4" />
                              Unduh
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4" />
                              Buka
                            </>
                          )}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview Section */}
                {showPdfViewer && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* YouTube Embed */}
                    {materi.lampiran && (materi.lampiran.includes("youtube.com") || materi.lampiran.includes("youtu.be")) && (
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                            <iframe
                              src={materi.lampiran.replace("watch?v=", "embed/")}
                              title={materi.judul}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* PDF Preview - uses blob URL for fast rendering */}
                    {materi.hasFileData && materi.fileType === 'application/pdf' && (
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-muted-foreground">Preview PDF</p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={openPdfFullscreen}
                              >
                                <Maximize2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Layar Penuh</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <a
                                  href={pdfBlobUrl || `/api/materi/${materi.id}/file`}
                                  download={materi.fileName || 'document.pdf'}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </a>
                              </Button>
                            </div>
                          </div>
                          {pdfLoading ? (
                            <div className="w-full h-[400px] sm:h-[500px] lg:h-[700px] rounded-lg bg-muted border flex flex-col items-center justify-center gap-3">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">Memuat PDF...</p>
                            </div>
                          ) : pdfBlobUrl ? (
                            <div className="w-full h-[400px] sm:h-[500px] lg:h-[700px] rounded-lg overflow-hidden bg-muted border">
                              <embed
                                src={`${pdfBlobUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                type="application/pdf"
                                className="w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-[200px] rounded-lg bg-muted border flex flex-col items-center justify-center gap-3">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Gagal memuat PDF</p>
                              <Button variant="outline" size="sm" onClick={togglePdfViewer}>
                                Coba Lagi
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Video Preview */}
                    {materi.hasFileData && materi.fileType?.startsWith('video/') && (
                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                            <video
                              src={`/api/materi/${materi.id}/file`}
                              controls
                              className="w-full h-full"
                            >
                              Browser Anda tidak mendukung tag video.
                            </video>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center border border-dashed border-border/30 rounded-2xl ios-glass-inset">
                <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Belum ada lampiran</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Pengajar tidak menyertakan file lampiran untuk materi ini
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Course Info Card - iOS Glass */}
          <Card className="ios-glass-card border-border/30 rounded-2xl">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Informasi Kursus
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">Nama Kursus</p>
                  <p className="font-semibold text-base">{materi.course.judul}</p>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">Pengajar</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {materi.course.guru.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-base">{materi.course.guru.nama}</p>
                      <p className="text-sm text-muted-foreground">{materi.course.guru.email}</p>
                    </div>
                  </div>
                </div>
                <Separator />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
