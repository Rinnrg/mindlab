"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useBreadcrumbPage } from "@/hooks/use-breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Upload, 
  Clock, 
  Calendar,
  User,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Download,
  Plus,
  Loader2,
  Eye,
  ClipboardList,
  BookOpen,
} from "lucide-react"
import Link from "next/link"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { ForumDiskusiAsesmen } from "@/components/forum-diskusi-asesmen"

interface AsesmenDetailClientProps {
  courseId: string
  asesmenId: string
}

export default function AsesmenDetailClient({ courseId, asesmenId }: AsesmenDetailClientProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [asesmen, setAsesmen] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [studentNilai, setStudentNilai] = useState<any>(null)
  const [studentPengumpulan, setStudentPengumpulan] = useState<any>(null)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [activeTab, setActiveTab] = useState("info")
  const [tabKey, setTabKey] = useState(0) // For re-render animation
  const { confirm, AlertComponent } = useAdaptiveAlert()

  const [rosterByKelas, setRosterByKelas] = useState<Record<string, any[]> | null>(null)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterError, setRosterError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    // Fetch asesmen data with optimized query
    const fetchAsesmen = async () => {
      try {
        // Build optimized query URL with user context
        const queryParams = new URLSearchParams({
          userId: user.id,
          userRole: user.role,
        })
        
        console.log(`Fetching asesmen ${asesmenId} for user ${user.id} (${user.role})`)
        
        const response = await fetch(`/api/asesmen/${asesmenId}?${queryParams}`)
        
        console.log('Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          const asesmenData = data.asesmen
          
          console.log('Asesmen data received:', asesmenData)
          
          // Check permission untuk guru - only for teachers
          if (user.role === 'GURU' && asesmenData.guruId !== user.id) {
            console.log('Teacher not authorized for this asesmen')
            router.push(`/courses/${courseId}`)
            return
          }
          
          // For students, no additional permission check needed
          // Enrollment is already validated by API
          
          setAsesmen(asesmenData)
          
          // For students, extract their data from the response
          if (user.role === 'SISWA') {
            // Extract nilai from the response (already filtered by API)
            if (asesmenData.nilai && asesmenData.nilai.length > 0) {
              setStudentNilai(asesmenData.nilai[0])
              console.log('Student nilai found:', asesmenData.nilai[0])
            }
            
            // Extract pengumpulan from the response (already filtered by API)
            if (asesmenData.pengumpulanProyek && asesmenData.pengumpulanProyek.length > 0) {
              setStudentPengumpulan(asesmenData.pengumpulanProyek[0])
              console.log('Student submission found:', asesmenData.pengumpulanProyek[0])
            }
          }
        } else {
          const errorData = await response.json()
          console.error('Failed to fetch asesmen:', response.status, errorData)
          
          // Show error message based on status
          if (response.status === 403) {
            alert(errorData.error || 'Anda tidak memiliki akses ke asesmen ini')
          } else if (response.status === 404) {
            alert('Asesmen tidak ditemukan')
          } else {
            alert('Gagal mengambil data asesmen')
          }
          
          router.push(`/courses/${courseId}`)
        }
      } catch (error) {
        console.error('Error fetching asesmen:', error)
        alert('Terjadi kesalahan saat mengambil data asesmen')
        router.push(`/courses/${courseId}`)
      } finally {
        setLoading(false)
      }
    }

    fetchAsesmen()
  }, [user, authLoading, router, asesmenId, courseId])

  useEffect(() => {
    if (!user || !asesmen || !isTeacherOrAdmin) return
    if (asesmen.tipe !== 'KUIS') return

    const fetchRoster = async () => {
      try {
        setRosterLoading(true)
        setRosterError(null)
        const res = await fetch(`/api/asesmen/${asesmenId}/roster?userId=${user.id}&userRole=${user.role}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Gagal mengambil roster')
        setRosterByKelas(data.grouped || {})
      } catch (e: any) {
        setRosterError(e?.message || 'Gagal mengambil roster')
      } finally {
        setRosterLoading(false)
      }
    }

    fetchRoster()
  }, [user, asesmen, isTeacherOrAdmin, asesmenId])

  // Keep hooks order stable: breadcrumb hook must be called on every render
  const breadcrumbItems = useMemo(() => {
    if (!asesmen?.course) return []

    return [
      {
        label: 'Kursus',
        href: '/courses',
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        label: asesmen.course.judul,
        href: `/courses/${courseId}`,
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        label: asesmen.nama,
        icon: <FileText className="h-4 w-4" />,
      },
    ]
  }, [asesmen, courseId])

  useBreadcrumbPage(asesmen?.nama || 'Asesmen', breadcrumbItems)

  if (authLoading || loading) {
    return (
      <div className="w-full py-6 sm:py-8 space-y-6">
        <div className="space-y-4">
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!asesmen) {
    return null
  }

  // Check if student has submitted
  const hasSubmitted = user && user.role === 'SISWA' 
    ? asesmen.pengumpulanProyek?.some((p: any) => p.siswaId === user.id)
    : false

  const isDeadlinePassed = asesmen.tgl_selesai 
    ? new Date(asesmen.tgl_selesai) < new Date() 
    : false

  // Check if asesmen has started
  const hasStarted = asesmen.tgl_mulai
    ? new Date(asesmen.tgl_mulai) <= new Date()
    : true // If no start time, assume it has started

  const isTeacherOrAdmin = user && (user.role === 'GURU' || user.role === 'ADMIN')
  const isStudent = user && user.role === 'SISWA'

  return (
    <div className="w-full py-6 sm:py-8 space-y-6">
      <AlertComponent />
      
      {/* Header - iOS Glass */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">{asesmen.nama}</h1>
              <Badge variant={asesmen.tipe === 'KUIS' ? 'default' : 'secondary'} className="rounded-lg">
                {asesmen.tipe === 'KUIS' ? (
                  <><FileText className="mr-1 h-3 w-3" /> Kuis</>
                ) : (
                  <><Upload className="mr-1 h-3 w-3" /> Tugas</>
                )}
              </Badge>
              {isDeadlinePassed && (
                <Badge variant="destructive" className="rounded-lg">
                  <XCircle className="mr-1 h-3 w-3" /> Ditutup
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {asesmen.course?.judul} • {asesmen.course?.kategori}
              {asesmen.tipe === 'TUGAS' && asesmen.tipePengerjaan && (
                <> • {asesmen.tipePengerjaan === 'KELOMPOK' ? 'Kelompok' : 'Individu'}</>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {isStudent && asesmen.tipe === 'TUGAS' && (
              <>
                {hasSubmitted ? (
                  <Button 
                    disabled
                    className="bg-green-600 hover:bg-green-600 cursor-not-allowed opacity-90"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Sudah Diserahkan
                  </Button>
                ) : !hasStarted ? (
                  <Button 
                    disabled
                    variant="secondary"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Belum Dimulai
                  </Button>
                ) : isDeadlinePassed ? (
                  <Button 
                    disabled
                    variant="secondary"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Deadline Terlewat
                  </Button>
                ) : (
          <Button asChild>
            <Link href={`/courses/${courseId}/${asesmenId}/submit`}>
                      <Upload className="mr-2 h-4 w-4" />
                      Kumpulkan Tugas
                    </Link>
                  </Button>
                )}
              </>
            )}
            {isStudent && asesmen.tipe === 'KUIS' && (
              (asesmen.soal && asesmen.soal.length > 0) || 
              (asesmen._count && asesmen._count.soal > 0) ||
              asesmen.soalCount > 0
            ) && (
              <>
                {studentNilai ? (
                  <Button 
                    disabled
                    className="bg-green-600 hover:bg-green-600 cursor-not-allowed opacity-90"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Kuis sudah dikerjakan
                  </Button>
                ) : !hasStarted ? (
                  <Button 
                    disabled
                    variant="secondary"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Kuis Belum Bisa Dimulai
                  </Button>
                ) : isDeadlinePassed ? (
                  <Button 
                    disabled
                    variant="secondary"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Kuis Sudah Ditutup
                  </Button>
                ) : (
                  <Button onClick={async () => {
                    const confirmed = await confirm(
                      "Mulai Kerjakan Kuis?",
                      {
                        description: `Anda akan memulai kuis "${asesmen.nama}".${asesmen.durasi ? ` Durasi: ${asesmen.durasi} menit.` : ''} Pastikan Anda siap sebelum memulai. ${asesmen.antiCurang ? '\n\n⚠️ Anti-curang aktif: Anda tidak diperbolehkan meninggalkan jendela kuis selama pengerjaan. Kuis akan otomatis dikumpulkan jika Anda meninggalkan jendela lebih dari 30 detik.' : ''}`,
                        confirmText: "Mulai Kuis",
                        cancelText: "Batal",
                        type: "warning",
                      }
                    )
                    if (confirmed) {
                      router.push(`/courses/${courseId}/${asesmenId}/kuis`)
                    }
                  }}>
                    <FileText className="mr-2 h-4 w-4" />
                    Kerjakan Kuis
                  </Button>
                )}
              </>
            )}
            {isTeacherOrAdmin && (
              <Button variant="outline" asChild>
                <Link href={`/courses/${courseId}/${asesmenId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Alert jika belum dimulai - untuk SISWA */}
      {isStudent && !hasStarted && asesmen.tgl_mulai && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Belum Dimulai:</strong> {asesmen.tipe === 'KUIS' ? 'Kuis' : 'Tugas'} ini akan dimulai pada{' '}
            {new Date(asesmen.tgl_mulai).toLocaleString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards - For KUIS - iOS Glass */}
      {asesmen.tipe === 'KUIS' && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="ios-glass-card border-border/30 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Soal</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {asesmen._count?.soal ?? asesmen.soal?.length ?? asesmen.soalCount ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="ios-glass-card border-border/30 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durasi</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{asesmen.durasi || 0} menit</div>
            </CardContent>
          </Card>
          <Card className="ios-glass-card border-border/30 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bobot</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(asesmen.soal && Array.isArray(asesmen.soal)) 
                  ? asesmen.soal.reduce((acc: number, s: any) => acc + (s.bobot || 0), 0) 
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards - For TUGAS - iOS Glass */}
      {asesmen.tipe === 'TUGAS' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="ios-glass-card border-border/30 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipe Pengerjaan</CardTitle>
              {asesmen.tipePengerjaan === 'KELOMPOK' ? (
                <Users className="h-4 w-4 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {asesmen.tipePengerjaan === 'KELOMPOK' ? 'Kelompok' : 'Individu'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dikerjakan secara {asesmen.tipePengerjaan?.toLowerCase()}
              </p>
            </CardContent>
          </Card>
          <Card className="ios-glass-card border-border/30 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deadline</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {asesmen.tgl_selesai ? (
                <>
                  <div className="text-2xl font-bold">
                    {new Date(asesmen.tgl_selesai).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(asesmen.tgl_selesai).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </>
              ) : (
                <div className="text-xl font-medium text-muted-foreground">Tidak ada deadline</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Description - iOS Glass */}
      <Card className="ios-glass-card border-border/30 rounded-2xl">
        <CardHeader>
          <CardTitle>Deskripsi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground whitespace-pre-wrap">
            {asesmen.deskripsi || 'Tidak ada deskripsi'}
          </p>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Dibuat oleh:</span>
              <span className="ml-2 font-medium">{asesmen.guru.nama}</span>
            </div>
            {asesmen.tgl_mulai && (
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Mulai:</span>
                <span className="ml-2 font-medium">
                  {new Date(asesmen.tgl_mulai).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
            {asesmen.tgl_selesai && (
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Selesai:</span>
                <span className="ml-2 font-medium">
                  {new Date(asesmen.tgl_selesai).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lampiran Section - iOS Glass */}
      {(asesmen.lampiran || asesmen.fileData) && (
        <Card className="ios-glass-card border-border/30 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lampiran & Dokumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ios-glass-inset rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 sm:p-3 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="font-medium">
                    {asesmen.fileData
                      ? `File: ${asesmen.fileName || 'dokumen'}`
                      : asesmen.lampiran.startsWith('data:') 
                      ? `Lampiran ${asesmen.nama}.${asesmen.lampiran.split(';')[0].split('/')[1]}`
                      : asesmen.lampiran.startsWith('http') ? 'Link External' : 'Lampiran'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {asesmen.fileData
                      ? `Disimpan di database (${asesmen.fileType})`
                      : asesmen.lampiran.startsWith('data:') 
                      ? 'File tersimpan (base64)'
                      : asesmen.lampiran.startsWith('http') ? 'Link ke sumber external' : 'Dokumen lampiran'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {/* Tombol Lihat Lampiran - untuk PDF, video, dan YouTube */}
                {((asesmen.fileData && (asesmen.fileType === 'application/pdf' || asesmen.fileType?.startsWith('video/'))) ||
                  (asesmen.lampiran && (
                    asesmen.lampiran.startsWith('data:application/pdf') || 
                    (asesmen.lampiran.endsWith('.pdf') && !asesmen.lampiran.startsWith('data:')) ||
                    asesmen.lampiran.includes("youtube.com") || 
                    asesmen.lampiran.includes("youtu.be")
                  ))) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPdfViewer(!showPdfViewer)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {showPdfViewer ? 'Sembunyikan' : 'Lihat Lampiran'}
                  </Button>
                )}
                
                {/* Tombol Unduh/Buka */}
                {asesmen.fileData ? (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/api/asesmen/${asesmen.id}/file`}
                      download={asesmen.fileName || 'lampiran'}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Unduh
                    </a>
                  </Button>
                ) : asesmen.lampiran.startsWith('data:') ? (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={asesmen.lampiran}
                      download={`lampiran-${asesmen.nama}.${asesmen.lampiran.split(';')[0].split('/')[1]}`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Unduh
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <a href={asesmen.lampiran} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      {asesmen.lampiran.startsWith('http') ? 'Buka Link' : 'Unduh'}
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* PDF/Video Preview dengan animasi slide */}
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showPdfViewer ? 'max-h-[500px] sm:max-h-[650px] lg:max-h-[850px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              {/* PDF Preview for database files */}
              {asesmen.fileData && asesmen.fileType === 'application/pdf' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Preview PDF</p>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a 
                        href={`/api/asesmen/${asesmen.id}/file`}
                        download={asesmen.fileName || 'document.pdf'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </a>
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-muted h-[800px]">
                    <object
                      data={`/api/asesmen/${asesmen.id}/file`}
                      type="application/pdf"
                      className="w-full h-full min-h-[800px]"
                    >
                      <iframe
                        src={`/api/asesmen/${asesmen.id}/file#toolbar=0&navpanes=0&scrollbar=1`}
                        title={`Lampiran ${asesmen.nama}`}
                        className="w-full h-full border-0 min-h-[800px]"
                      >
                        <p className="p-4">
                          Browser Anda tidak mendukung tampilan PDF. 
                          <a 
                            href={`/api/asesmen/${asesmen.id}/file`}
                            className="text-primary underline ml-1"
                            download
                          >
                            Klik di sini untuk download
                          </a>
                        </p>
                      </iframe>
                    </object>
                  </div>
                </div>
              )}

              {/* Video Preview for database video files */}
              {asesmen.fileData && asesmen.fileType?.startsWith('video/') && (
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <div className="aspect-video w-full">
                    <video
                      src={`/api/asesmen/${asesmen.id}/file`}
                      controls
                      className="w-full h-full"
                    >
                      Browser Anda tidak mendukung tag video.
                    </video>
                  </div>
                </div>
              )}

              {/* PDF Preview for base64 PDF */}
              {!asesmen.fileData && asesmen.lampiran && asesmen.lampiran.startsWith('data:application/pdf') && (
                <div className="border rounded-lg overflow-hidden bg-muted h-[800px]">
                  <object
                    data={asesmen.lampiran}
                    type="application/pdf"
                    className="w-full h-full min-h-[800px]"
                  >
                    <iframe
                      src={`${asesmen.lampiran}#toolbar=0&navpanes=0&scrollbar=1`}
                      title={`Lampiran ${asesmen.nama}`}
                      className="w-full h-full border-0 min-h-[800px]"
                    >
                      <p className="p-4">
                        Browser Anda tidak mendukung tampilan PDF.
                      </p>
                    </iframe>
                  </object>
                </div>
              )}

              {/* PDF Preview for URL PDF */}
              {!asesmen.fileData && asesmen.lampiran && asesmen.lampiran.endsWith('.pdf') && !asesmen.lampiran.startsWith('data:') && (
                <div className="border rounded-lg overflow-hidden bg-muted h-[800px]">
                  <object
                    data={asesmen.lampiran}
                    type="application/pdf"
                    className="w-full h-full min-h-[800px]"
                  >
                    <iframe
                      src={`${asesmen.lampiran}#toolbar=0&navpanes=0&scrollbar=1`}
                      title={`Lampiran ${asesmen.nama}`}
                      className="w-full h-full border-0 min-h-[800px]"
                    >
                      <p className="p-4">
                        Browser Anda tidak mendukung tampilan PDF.
                        <a 
                          href={asesmen.lampiran}
                          className="text-primary underline ml-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Klik di sini untuk membuka
                        </a>
                      </p>
                    </iframe>
                  </object>
                </div>
              )}

              {/* YouTube Embed if it's a YouTube link */}
              {!asesmen.fileData && asesmen.lampiran && (asesmen.lampiran.includes("youtube.com") || asesmen.lampiran.includes("youtu.be")) && (
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <div className="aspect-video w-full">
                    <iframe
                      src={asesmen.lampiran.replace("watch?v=", "embed/")}
                      title={asesmen.nama}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Penilaian untuk Siswa - iOS Glass */}
      {isStudent && (
        <Card className="ios-glass-card border-border/30 rounded-2xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Status Penilaian
            </CardTitle>
            <CardDescription>
              Informasi mengenai penilaian {asesmen.tipe === 'KUIS' ? 'kuis' : 'tugas'} Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status untuk KUIS */}
            {asesmen.tipe === 'KUIS' && (
              <>
                {studentNilai ? (
                  // Sudah ada nilai
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Tanggal Pengerjaan</p>
                        <p className="font-medium">
                          {new Date(studentNilai.tanggal).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm text-muted-foreground">Nilai Anda</p>
                        <div className="text-3xl font-bold">
                          <Badge 
                            variant={studentNilai.skor >= 75 ? 'default' : 'secondary'}
                            className="text-xl px-4 py-2"
                          >
                            {studentNilai.skor}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {studentNilai.skor >= 75 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium text-green-700">Selamat! Anda Lulus</p>
                          <p className="text-sm text-muted-foreground">
                            Nilai Anda memenuhi standar kelulusan (≥75)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Belum ada nilai
                  <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg mb-2">Belum Ada Nilai</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                      Anda belum mengerjakan kuis ini
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Status untuk TUGAS */}
            {asesmen.tipe === 'TUGAS' && (
              <>
                {console.log('Student Pengumpulan State:', studentPengumpulan)}
                {studentPengumpulan ? (
                  // Sudah mengumpulkan
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-muted rounded-lg space-y-1">
                        <p className="text-sm text-muted-foreground">Tanggal Pengumpulan</p>
                        <p className="font-medium">
                          {new Date(studentPengumpulan.tgl_unggah).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg space-y-1">
                        <p className="text-sm text-muted-foreground">Status Pengumpulan</p>
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Sudah Dikumpulkan
                        </Badge>
                      </div>
                    </div>

                    {studentPengumpulan.namaKelompok && (
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="text-sm text-muted-foreground">Informasi Kelompok</p>
                        <div className="space-y-1">
                          <p className="font-medium">Nama Kelompok: {studentPengumpulan.namaKelompok}</p>
                          {studentPengumpulan.ketua && (
                            <p className="text-sm">Ketua: {studentPengumpulan.ketua}</p>
                          )}
                          {studentPengumpulan.anggota && (
                            <p className="text-sm">Anggota: {studentPengumpulan.anggota}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">Status Penilaian</p>
                      {studentPengumpulan.nilai !== null && studentPengumpulan.nilai !== undefined ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-medium text-green-700">Sudah Dinilai oleh Guru</p>
                              <p className="text-sm text-muted-foreground">
                                Guru telah memberikan penilaian untuk tugas Anda
                              </p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-sm font-medium mb-1">Nilai Anda:</p>
                              <Badge 
                                variant={studentPengumpulan.nilai >= 75 ? 'default' : 'secondary'}
                                className="text-2xl px-4 py-2 font-bold"
                              >
                                {studentPengumpulan.nilai}
                              </Badge>
                            </div>
                            <div className="flex items-start gap-2">
                              {studentPengumpulan.nilai >= 75 ? (
                                <>
                                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                                  <div>
                                    <p className="font-medium text-green-700">Lulus</p>
                                    <p className="text-xs text-muted-foreground">
                                      Nilai memenuhi standar kelulusan
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-5 w-5 text-orange-500 mt-1" />
                                  <div>
                                    <p className="font-medium text-orange-700">Belum Lulus</p>
                                    <p className="text-xs text-muted-foreground">
                                      Nilai belum memenuhi standar kelulusan
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Catatan dari Guru */}
                          {studentPengumpulan.catatan && (
                            <>
                              <Separator />
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <p className="text-sm font-medium">Catatan dari Guru:</p>
                                </div>
                                <div className="bg-background p-3 rounded-lg border border-primary/20">
                                  <p className="text-sm whitespace-pre-wrap">{studentPengumpulan.catatan}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-blue-700">Belum Dinilai</p>
                            <p className="text-sm text-muted-foreground">
                              Tugas Anda sedang dalam proses penilaian oleh guru
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {studentPengumpulan.catatan && (
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Catatan dari Guru
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {studentPengumpulan.catatan}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Belum mengumpulkan
                  <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg mb-2">Belum Mengumpulkan Tugas</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                      Anda belum mengumpulkan tugas ini. {isDeadlinePassed ? 'Deadline sudah terlewat.' : 'Segera kumpulkan sebelum deadline.'}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs for Teacher/Admin */}
      {isTeacherOrAdmin && (
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            setActiveTab(value)
            setTabKey(prev => prev + 1) // Trigger re-render for animation
          }}
          className="space-y-4"
        >
          <TabsList className="ios-tab-list">
            <TabsTrigger value="info" className="ios-tab-trigger">
              <FileText className="ios-tab-icon" />
              <span className="ios-tab-text">Informasi</span>
            </TabsTrigger>
            <TabsTrigger value="rekap" className="ios-tab-trigger">
              <ClipboardList className="ios-tab-icon" />
              <span className="ios-tab-text">Rekap Pengumpulan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" key={`info-${tabKey}`} className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            {/* Informasi (For KUIS) — Roster per kelas + status */}
            {asesmen.tipe === 'KUIS' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daftar Siswa (berdasarkan enrollment)</CardTitle>
                  <CardDescription>
                    Status: Belum mengerjakan (biru), Sedang mengerjakan (kuning), Selesai (hijau)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {rosterLoading && (
                    <p className="text-center text-muted-foreground py-8">Memuat daftar siswa...</p>
                  )}
                  {rosterError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{rosterError}</AlertDescription>
                    </Alert>
                  )}

                  {!rosterLoading && !rosterError && rosterByKelas && Object.keys(rosterByKelas).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Belum ada siswa ter-enroll di kelas ini
                    </p>
                  )}

                  {!rosterLoading && !rosterError && rosterByKelas && Object.entries(rosterByKelas).map(([kelas, items]) => (
                    <div key={kelas} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Kelas: {kelas}</h3>
                        <Badge variant="secondary" className="rounded-lg">{items.length} siswa</Badge>
                      </div>

                      <div className="overflow-x-auto -mx-6">
                        <div className="min-w-[760px] px-6">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tanggal mengerjakan</TableHead>
                                <TableHead>Tanggal pengumpulan</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((it: any) => {
                                const status = it.status as 'BELUM' | 'SEDANG' | 'SELESAI'
                                const statusBadge =
                                  status === 'SELESAI'
                                    ? <Badge className="bg-green-600">Selesai</Badge>
                                    : status === 'SEDANG'
                                      ? <Badge className="bg-yellow-500 text-black">Sedang mengerjakan</Badge>
                                      : <Badge className="bg-blue-600">Belum mengerjakan</Badge>

                                return (
                                  <TableRow key={it.siswa.id}>
                                    <TableCell className="font-medium">{it.siswa.nama}</TableCell>
                                    <TableCell className="text-muted-foreground">{it.siswa.email}</TableCell>
                                    <TableCell>{statusBadge}</TableCell>
                                    <TableCell>
                                      {it.startedAt
                                        ? new Date(it.startedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : '-'
                                      }
                                    </TableCell>
                                    <TableCell>
                                      {it.submittedAt
                                        ? new Date(it.submittedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : '-'
                                      }
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          const ok = await confirm('Reset & izinkan mengulang?', {
                                            description: `Ini akan menghapus nilai dan jawaban siswa "${it.siswa.nama}" sehingga bisa mengerjakan ulang.`,
                                            confirmText: 'Reset',
                                            cancelText: 'Batal',
                                            type: 'warning',
                                          })
                                          if (!ok) return

                                          const res = await fetch(`/api/asesmen/${asesmenId}/reset`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ siswaId: it.siswa.id, userId: user.id, userRole: user.role }),
                                          })
                                          const data = await res.json()
                                          if (!res.ok) {
                                            alert(data?.error || 'Gagal reset')
                                            return
                                          }
                                          // refresh roster
                                          setRosterByKelas(null)
                                          setTimeout(async () => {
                                            try {
                                              setRosterLoading(true)
                                              const r = await fetch(`/api/asesmen/${asesmenId}/roster?userId=${user.id}&userRole=${user.role}`)
                                              const d = await r.json()
                                              if (r.ok) setRosterByKelas(d.grouped || {})
                                            } finally {
                                              setRosterLoading(false)
                                            }
                                          }, 200)
                                        }}
                                      >
                                        Mengulang
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rekap" key={`rekap-${tabKey}`} className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            {/* Submissions Table (For TUGAS) */}
            {asesmen.tipe === 'TUGAS' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Rekap Pengumpulan {asesmen.tipePengerjaan === 'KELOMPOK' ? '(Kelompok)' : '(Individu)'}
                      </CardTitle>
                      <CardDescription>
                        Daftar siswa yang telah mengumpulkan tugas beserta nilainya
                      </CardDescription>
                    </div>
                    {asesmen.pengumpulanProyek && asesmen.pengumpulanProyek.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/asesmen/${asesmen.id}/export-excel`)
                            if (response.ok) {
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `Rekap_Tugas_${asesmen.nama.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
                              document.body.appendChild(a)
                              a.click()
                              window.URL.revokeObjectURL(url)
                              document.body.removeChild(a)
                            } else {
                              console.error('Failed to export Excel')
                            }
                          } catch (error) {
                            console.error('Error exporting Excel:', error)
                          }
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {(!asesmen.pengumpulanProyek || asesmen.pengumpulanProyek.length === 0) ? (
                    <p className="text-center text-muted-foreground py-8">
                      Belum ada siswa yang mengumpulkan tugas
                    </p>
                  ) : (
                    <div className="overflow-x-auto -mx-6">
                    <div className="min-w-[700px] px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            {asesmen.tipePengerjaan === 'KELOMPOK' ? 'Nama Kelompok' : 'Nama Siswa'}
                          </TableHead>
                          {asesmen.tipePengerjaan === 'KELOMPOK' && (
                            <>
                              <TableHead>Ketua</TableHead>
                              <TableHead>Anggota</TableHead>
                            </>
                          )}
                          <TableHead>Tanggal Upload</TableHead>
                          <TableHead>Nilai</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {asesmen.pengumpulanProyek && asesmen.pengumpulanProyek.map((pengumpulan: any) => (
                          <TableRow key={pengumpulan.id}>
                            <TableCell>
                              {asesmen.tipePengerjaan === 'KELOMPOK' && (
                                <div className="font-medium">{pengumpulan.namaKelompok || '-'}</div>
                              )}
                              {asesmen.tipePengerjaan === 'INDIVIDU' && pengumpulan.siswa && (
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">{pengumpulan.siswa.nama}</div>
                                    <div className="text-sm text-muted-foreground">{pengumpulan.siswa.email}</div>
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            {asesmen.tipePengerjaan === 'KELOMPOK' && (
                              <>
                                <TableCell>{pengumpulan.ketua || '-'}</TableCell>
                                <TableCell>{pengumpulan.anggota || '-'}</TableCell>
                              </>
                            )}
                            <TableCell>
                              {new Date(pengumpulan.tgl_unggah).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </TableCell>
                            <TableCell>
                              {pengumpulan.nilai ? (
                                <Badge variant={pengumpulan.nilai >= 75 ? 'default' : 'secondary'}>
                                  {pengumpulan.nilai}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Belum dinilai</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/courses/${courseId}/${asesmen.id}/pengumpulan/${pengumpulan.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Lihat Detail
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Nilai Stats for KUIS */}
            {asesmen.tipe === 'KUIS' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Rekap Nilai Kuis</CardTitle>
                      <CardDescription>
                        Ringkasan nilai siswa yang sudah mengerjakan kuis
                      </CardDescription>
                    </div>
                    {asesmen.nilai && asesmen.nilai.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/asesmen/${asesmen.id}/export-excel`)
                            if (response.ok) {
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `Nilai_Kuis_${asesmen.nama.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
                              document.body.appendChild(a)
                              a.click()
                              window.URL.revokeObjectURL(url)
                              document.body.removeChild(a)
                            } else {
                              console.error('Failed to export Excel')
                            }
                          } catch (error) {
                            console.error('Error exporting Excel:', error)
                          }
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {(!asesmen.nilai || asesmen.nilai.length === 0) ? (
                    <p className="text-center text-muted-foreground py-8">
                      Belum ada siswa yang mengerjakan kuis
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Peserta</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{asesmen.nilai.length}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Nilai Tertinggi</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {Math.max(...asesmen.nilai.map((n: any) => n.skor))}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Nilai Terendah</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {Math.min(...asesmen.nilai.map((n: any) => n.skor))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="overflow-x-auto -mx-6">
                      <div className="min-w-[500px] px-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama Siswa</TableHead>
                            <TableHead>Nilai</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tanggal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {asesmen.nilai.map((nilai: any) => (
                            <TableRow key={nilai.id}>
                              <TableCell className="font-medium">{nilai.siswa.nama}</TableCell>
                              <TableCell>
                                <Badge variant={nilai.skor >= 75 ? 'default' : 'secondary'}>
                                  {nilai.skor}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {nilai.skor >= 75 ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Lulus
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Belum Lulus
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {new Date(nilai.tanggal).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Forum Diskusi - Guru/Admin selalu muncul, Siswa hanya setelah selesai mengerjakan */}
      <ForumDiskusiAsesmen
        asesmenId={asesmenId}
        userId={user.id}
        userRole={user.role}
        userName={user.nama}
        userFoto={user.foto}
        hasCompleted={
          asesmen.tipe === 'KUIS'
            ? !!studentNilai
            : !!studentPengumpulan || hasSubmitted
        }
        isTeacherOrAdmin={!!isTeacherOrAdmin}
      />
    </div>
  )
}
