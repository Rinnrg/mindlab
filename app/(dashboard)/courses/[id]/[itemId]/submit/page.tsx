"use client"

import { useEffect, useState, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useBreadcrumbPage } from "@/hooks/use-breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { FileUploadField } from "@/components/file-upload-field"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import dynamic from "next/dynamic"

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px] bg-muted/20 rounded-lg">
      <div className="animate-pulse text-sm text-muted-foreground">Loading editor...</div>
    </div>
  ),
})
import {
  Upload,
  Loader2,
  FileText,
  Users,
  User as UserIcon,
  AlertCircle,
  Play,
  Terminal,
  Code,
  Crown,
  Clock,
  CheckCircle2,
  X,
  BookOpen,
  CalendarClock,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PageProps {
  params: Promise<{
    id: string
    itemId: string
  }>
}

export default function SubmitAsesmenPage({ params }: PageProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const resolvedParams = use(params)
  const { id: courseId, itemId: asesmenId } = resolvedParams
  const { confirm, error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()

  const [asesmen, setAsesmen] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [namaKelompok, setNamaKelompok] = useState("")
  const [ketua, setKetua] = useState("")
  const [anggota, setAnggota] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [catatan, setCatatan] = useState("")
  const [existingSubmission, setExistingSubmission] = useState<any>(null)

  // Compiler state
  const [sourceCode, setSourceCode] = useState("# Tulis kode Python kamu di sini\nprint('Hello, World!')\n")
  const [compilerOutput, setCompilerOutput] = useState("")
  const [isRunning, setIsRunning] = useState(false)

  // Text state
  const [textContent, setTextContent] = useState("")

  const [activeTab, setActiveTab] = useState<string>("file")

  // Scheduled upload state
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")

  // Students for group selection
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
  const [selectedKetua, setSelectedKetua] = useState<string | null>(null)
  const [selectedAnggota, setSelectedAnggota] = useState<string[]>([])

  // Set custom breadcrumb
  const breadcrumbItems = useMemo(() => [
    {
      label: 'Kursus',
      href: '/courses',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: 'Loading...', // Will be replaced by smart-breadcrumb
      href: `/courses/${courseId}?tab=assessments`,
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: asesmen?.judul || 'Loading...', 
      href: `/courses/${courseId}/${asesmenId}`,
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: 'Submit',
      icon: <Upload className="h-4 w-4" />
    }
  ], [courseId, asesmenId, asesmen?.judul])

  useBreadcrumbPage('Submit Asesmen', breadcrumbItems)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'SISWA') { router.push(`/courses/${courseId}/${asesmenId}`); return }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/asesmen/${asesmenId}`)
        if (response.ok) {
          const data = await response.json()
          const asesmenData = data.asesmen

          if (asesmenData.tgl_mulai && new Date(asesmenData.tgl_mulai) > new Date()) {
            showError("Belum Dimulai", "Tugas ini belum bisa dikumpulkan karena belum dimulai")
            router.push(`/courses/${courseId}/${asesmenId}`)
            return
          }

          if (asesmenData.tgl_selesai && new Date(asesmenData.tgl_selesai) < new Date()) {
            showError("Deadline Terlewat", "Tugas ini sudah melewati deadline")
            router.push(`/courses/${courseId}/${asesmenId}`)
            return
          }

          setAsesmen(asesmenData)

          // Check if student already submitted or is assigned to a group
          let submission: any = null
          if (asesmenData.tipePengerjaan === 'KELOMPOK') {
            const myKelompok = asesmenData.kelompok?.find((k: any) =>
              (k.anggota || []).some((a: any) => a.siswaId === user.id)
            )
            
            if (myKelompok) {
              setNamaKelompok(myKelompok.nama || "")
              // Check if we have a ketuaId from the new system
              if (myKelompok.ketuaId) {
                setSelectedKetua(myKelompok.ketuaId)
              }
              // Set members
              const memberIds = (myKelompok.anggota || []).map((a: any) => a.siswaId)
              setSelectedAnggota(memberIds.filter((id: string) => id !== (myKelompok.ketuaId || "")))
              
              submission = asesmenData.pengumpulanProyek?.find((p: any) => p.kelompokId === myKelompok.id) || null
            } else {
              submission = asesmenData.pengumpulanProyek?.find((p: any) => p.siswaId === user.id) || null
            }
          } else {
            submission = asesmenData.pengumpulanProyek?.find((p: any) => p.siswaId === user.id) || null
          }

          if (submission) {
            setExistingSubmission(submission)
            setNamaKelompok(submission.namaKelompok || "")
            setKetua(submission.ketua || "")
            setAnggota(submission.anggota || "")
            setFileUrl(submission.fileUrl || "")
            setCatatan(submission.catatan || "")
            if (submission.sourceCode) {
              setSourceCode(submission.sourceCode)
            }
            if (submission.output) {
              setCompilerOutput(submission.output)
            }
            if (submission.textContent) {
              setTextContent(submission.textContent)
            }
            if (submission.tgl_unggah && new Date(submission.tgl_unggah) > new Date()) {
              setIsScheduled(true)
              const d = new Date(submission.tgl_unggah)
              const tzOffset = d.getTimezoneOffset() * 60000
              const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
              setScheduledDate(localISOTime)
            }
          }

          // Determine initial active tab based on components
          const components = Array.isArray(asesmenData.submissionComponents) 
            ? asesmenData.submissionComponents 
            : ['UPLOAD_FILE']
          
          if (components.length > 0) {
            if (components.includes('UPLOAD_FILE')) setActiveTab('file')
            else if (components.includes('COMPILER')) setActiveTab('code')
            else if (components.includes('TEXT')) setActiveTab('text')
          }



          // Fetch enrolled students for group selection
          if (asesmenData.tipePengerjaan === 'KELOMPOK') {
            try {
              const studentsRes = await fetch(`/api/courses/${courseId}/students`)
              if (studentsRes.ok) {
                const students = await studentsRes.json()
                setEnrolledStudents(students)
              }
            } catch (err) {
              console.error('Error fetching students:', err)
            }
          }
        } else {
          router.push(`/courses/${courseId}`)
        }
      } catch (error) {
        console.error('Error fetching asesmen:', error)
        router.push(`/courses/${courseId}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, authLoading, router, asesmenId, courseId])

  const handleRunCode = async () => {
    if (!sourceCode.trim()) return
    setIsRunning(true)
    setCompilerOutput("")
    try {
      const res = await fetch("/api/compiler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sourceCode }),
      })
      const data = await res.json()
      const output = [data.stdout, data.stderr].filter(Boolean).join("\n")
      setCompilerOutput(output || "(no output)")
    } catch (err) {
      setCompilerOutput("Error: Gagal menjalankan kode")
    } finally {
      setIsRunning(false)
    }
  }

  const toggleAnggota = (studentId: string) => {
    if (studentId === selectedKetua) return // Can't be both ketua and anggota
    setSelectedAnggota(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const selectKetua = (studentId: string) => {
    setSelectedKetua(studentId)
    setSelectedAnggota(prev => prev.filter(id => id !== studentId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const hasFile = (fileUrl || uploadedFile)
    const hasCode = sourceCode.trim()
    const hasText = textContent.trim()

    if (!hasFile && !hasCode && !hasText) {
      showError("Error", "Silakan isi salah satu komponen pengumpulan (File, Code, atau Teks)")
      return
    }

    const isKelompok = asesmen.tipePengerjaan === 'KELOMPOK'

    // Determine final ketua/anggota values
    let finalKetua = ketua
    let finalAnggota = anggota
    let finalNamaKelompok = namaKelompok

    if (isKelompok && enrolledStudents.length > 0) {
      const ketuaStudent = enrolledStudents.find(s => s.id === selectedKetua)
      const anggotaStudents = enrolledStudents.filter(s => selectedAnggota.includes(s.id))
      if (ketuaStudent) finalKetua = ketuaStudent.nama
      if (anggotaStudents.length > 0) finalAnggota = anggotaStudents.map((s: any) => s.nama).join(", ")
    }

    if (isKelompok) {
      if (!finalNamaKelompok || !finalKetua) {
        showError("Error", "Silakan lengkapi informasi kelompok (nama kelompok dan ketua)")
        return
      }
    }

    if (isScheduled && !scheduledDate) {
      showError("Gagal", "Silakan pilih tanggal dan waktu untuk upload terjadwal.")
      return
    }

    if (isScheduled && scheduledDate) {
      const selected = new Date(scheduledDate)
      const now = new Date()
      if (selected <= now) {
        showError("Waktu Tidak Valid", "Waktu terjadwal harus di masa depan.")
        return
      }
      if (asesmen?.tgl_selesai && selected > new Date(asesmen.tgl_selesai)) {
        showError("Waktu Tidak Valid", "Waktu terjadwal tidak boleh melewati deadline.")
        return
      }
    }

    const confirmed = await confirm(
      existingSubmission ? "Perbarui Pengumpulan?" : (isScheduled ? "Jadwalkan Pengumpulan?" : "Kumpulkan Tugas?"),
      {
        description: existingSubmission
          ? "Apakah Anda yakin ingin memperbarui pengumpulan tugas ini?"
          : (isScheduled ? "Tugas akan otomatis terkumpul pada jadwal yang ditentukan." : "Apakah Anda yakin ingin mengumpulkan tugas ini?"),
        confirmText: existingSubmission ? "Perbarui" : (isScheduled ? "Jadwalkan" : "Kumpulkan"),
        cancelText: "Batal",
        type: "info",
      }
    )

    if (!confirmed) return

    setSubmitting(true)
    await execute(
      async () => {
        const endpoint = `/api/asesmen/${asesmenId}/submit`
        
        const scheduledAtISO = isScheduled && scheduledDate ? new Date(scheduledDate).toISOString() : undefined

        const response = await (async () => {
            if (uploadedFile) {
              const form = new FormData()
              form.append('siswaId', user?.id || '')
              if (isKelompok) {
                form.append('namaKelompok', finalNamaKelompok || '')
                form.append('ketua', finalKetua || '')
                form.append('anggota', finalAnggota || '')
              }
              if (catatan) form.append('catatan', catatan)
              if (fileUrl) form.append('fileUrl', fileUrl)
              if (sourceCode) form.append('sourceCode', sourceCode)
              if (compilerOutput) form.append('output', compilerOutput)
              if (textContent) form.append('textContent', textContent)
              if (scheduledAtISO) form.append('scheduledAt', scheduledAtISO)
              form.append('file', uploadedFile)

              return fetch(endpoint, {
                method: 'POST',
                body: form,
              })
            }

          const payload: Record<string, any> = {
            siswaId: user?.id,
            namaKelompok: isKelompok ? finalNamaKelompok : null,
            ketua: isKelompok ? finalKetua : null,
            anggota: isKelompok ? finalAnggota : null,
            catatan,
            fileUrl,
            sourceCode,
            output: compilerOutput,
            textContent,
            scheduledAt: scheduledAtISO,
          }

          return fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        })()

        const responseText = await response.text()
        let responseData: any = null
        try {
          responseData = responseText ? JSON.parse(responseText) : null
        } catch {
          responseData = null
        }
        if (!response.ok) {
          const message = responseData?.error || responseText || "Gagal mengumpulkan tugas"
          const details = responseData?.details
          throw new Error(details ? `${message} (${details})` : message)
        }
      },
      {
        loadingMessage: existingSubmission ? "Memperbarui tugas..." : "Mengumpulkan tugas...",
        successTitle: "Berhasil!",
        successDescription: existingSubmission
          ? "Tugas berhasil diperbarui"
          : "Tugas berhasil dikumpulkan",
        errorTitle: "Gagal",
        autoCloseMs: 1500,
        onSuccess: () => {
          setUploadedFile(null)
          setTimeout(() => {
            router.push(`/courses/${courseId}/${asesmenId}`)
          }, 1500)
        },
      }
    ).finally(() => {
      setSubmitting(false)
    })
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!asesmen) return null

  const isDeadlinePassed = asesmen.tgl_selesai
    ? new Date(asesmen.tgl_selesai) < new Date()
    : false

  const isKelompok = asesmen.tipePengerjaan === 'KELOMPOK'
  const submissionComponents = Array.isArray(asesmen.submissionComponents)
    ? (asesmen.submissionComponents as string[])
    : null
  const allowFile = !submissionComponents || submissionComponents.includes('UPLOAD_FILE')
  const allowCompiler = !submissionComponents || submissionComponents.includes('COMPILER')

  const isMyOwnSubmission = existingSubmission?.siswaId === user?.id
  const submittedByName = existingSubmission?.siswa?.nama || existingSubmission?.ketua
  const groupAlreadySubmittedByOther = isKelompok && existingSubmission && !isMyOwnSubmission

  const existingSubmissionFileHref = existingSubmission?.fileData
    ? `/api/pengumpulan/${existingSubmission.id}/file`
    : null

  return (
    <div className="w-full py-6 sm:py-8 space-y-6">
      <AlertComponent />
      <ActionFeedback />

      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {existingSubmission ? 'Edit' : 'Kumpulkan'} Tugas
          </h1>
          <p className="text-muted-foreground mt-2">{asesmen.nama}</p>
        </div>
      </div>

      {!submissionComponents || submissionComponents.length === 0 ? (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">Perhatian:</span> Guru belum mengatur komponen pengumpulan untuk asesmen ini. 
            Silakan hubungi guru pengampu untuk mengkonfigurasi metode pengumpulan (File, Code, atau Teks).
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Deadline Warning */}
      {isDeadlinePassed && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Deadline pengumpulan sudah lewat. Anda tidak dapat mengumpulkan tugas.
          </AlertDescription>
        </Alert>
      )}

      {groupAlreadySubmittedByOther && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Tugas kelompok sudah dikumpulkan oleh <span className="font-medium">{submittedByName || 'anggota lain'}</span>.
            Anda tidak bisa mengumpulkan ulang.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {isKelompok ? (
              <><Users className="h-5 w-5" />Tugas Kelompok</>
            ) : (
              <><UserIcon className="h-5 w-5" />Tugas Individu</>
            )}
          </CardTitle>
          <CardDescription>
            {asesmen.deskripsi || 'Tidak ada deskripsi'}
          </CardDescription>
        </CardHeader>
        {asesmen.tgl_selesai && (
          <CardContent>
            <div className="text-sm">
              <span className="text-muted-foreground">Deadline: </span>
              <span className="font-medium">
                {new Date(asesmen.tgl_selesai).toLocaleString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </CardContent>
        )}
      </Card>

  {/* Kelompok Selection Card */}
  {isKelompok && !groupAlreadySubmittedByOther && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />Informasi Kelompok
            </CardTitle>
            <CardDescription>Lengkapi informasi kelompok Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="namaKelompok">Nama Kelompok <span className="text-destructive">*</span></Label>
              <Input
                id="namaKelompok"
                value={namaKelompok}
                onChange={(e) => setNamaKelompok(e.target.value)}
                placeholder="Masukkan nama kelompok"
                required
                disabled={isDeadlinePassed}
              />
            </div>

            {enrolledStudents.length > 0 ? (
              <>
                {/* Ketua Selection */}
                <div className="space-y-2">
                  <Label>Ketua Kelompok <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {enrolledStudents.map((student) => {
                      const isSelected = selectedKetua === student.id
                      return (
                        <button
                          key={`ketua-${student.id}`}
                          type="button"
                          onClick={() => selectKetua(student.id)}
                          disabled={isDeadlinePassed}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                            isSelected
                              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 ring-1 ring-yellow-500'
                              : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.foto} />
                            <AvatarFallback className="text-xs">
                              {student.nama?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{student.nama}</p>
                            {student.kelas && <p className="text-xs text-muted-foreground">{student.kelas}</p>}
                          </div>
                          {isSelected && <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Anggota Selection */}
                <div className="space-y-2">
                  <Label>Anggota Kelompok</Label>
                  {selectedAnggota.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedAnggota.map(id => {
                        const s = enrolledStudents.find(st => st.id === id)
                        return s ? (
                          <Badge key={id} variant="secondary" className="gap-1 py-1 px-2">
                            {s.nama}
                            <button type="button" onClick={() => toggleAnggota(id)} className="ml-1 hover:text-destructive" title="Hapus anggota">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {enrolledStudents
                      .filter(s => s.id !== selectedKetua)
                      .map((student) => {
                        const isSelected = selectedAnggota.includes(student.id)
                        return (
                          <button
                            key={`anggota-${student.id}`}
                            type="button"
                            onClick={() => toggleAnggota(student.id)}
                            disabled={isDeadlinePassed}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                            }`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.foto} />
                              <AvatarFallback className="text-xs">
                                {student.nama?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{student.nama}</p>
                              {student.kelas && <p className="text-xs text-muted-foreground">{student.kelas}</p>}
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                          </button>
                        )
                      })}
                  </div>
                </div>
              </>
            ) : (
              /* Fallback to text inputs if no enrolled students */
              <>
                <div className="space-y-2">
                  <Label htmlFor="ketua">Nama Ketua <span className="text-destructive">*</span></Label>
                  <Input
                    id="ketua"
                    value={ketua}
                    onChange={(e) => setKetua(e.target.value)}
                    placeholder="Masukkan nama ketua kelompok"
                    required
                    disabled={isDeadlinePassed}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anggota">Nama Anggota <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="anggota"
                    value={anggota}
                    onChange={(e) => setAnggota(e.target.value)}
                    placeholder="Masukkan nama anggota (pisahkan dengan koma)"
                    rows={3}
                    required
                    disabled={isDeadlinePassed}
                  />
                  <p className="text-xs text-muted-foreground">
                    Contoh: Ahmad, Budi, Citra
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Form Pengumpulan</CardTitle>
          <CardDescription>
            Pilih metode pengumpulan: upload file atau gunakan compiler Python
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {submissionComponents && submissionComponents.length > 0 && (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="ios-tab-list mb-4">
                  {submissionComponents.includes('UPLOAD_FILE') && (
                    <TabsTrigger value="file" className="ios-tab-trigger">
                      <FileUp className="ios-tab-icon" />
                      <span className="ios-tab-text">Upload File</span>
                    </TabsTrigger>
                  )}
                  {submissionComponents.includes('COMPILER') && (
                    <TabsTrigger value="code" className="ios-tab-trigger">
                      <Code className="ios-tab-icon" />
                      <span className="ios-tab-text">Python Code</span>
                    </TabsTrigger>
                  )}
                  {submissionComponents.includes('TEXT') && (
                    <TabsTrigger value="text" className="ios-tab-trigger">
                      <FileText className="ios-tab-icon" />
                      <span className="ios-tab-text">Ketikan Teks</span>
                    </TabsTrigger>
                  )}
                </TabsList>

                {submissionComponents.includes('UPLOAD_FILE') && (
                  <TabsContent value="file" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-4">
                      {existingSubmissionFileHref && (
                        <Alert className="bg-primary/5 border-primary/20">
                          <AlertDescription className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            File tersimpan di sistem:{' '}
                            <a
                              className="font-medium underline hover:text-primary transition-colors"
                              href={existingSubmissionFileHref}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Download / Lihat File
                            </a>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <FileUploadField
                        label="Link Tugas (Optional)"
                        value={fileUrl}
                        onChange={setFileUrl}
                        description={
                          isDeadlinePassed
                            ? "Deadline sudah lewat"
                            : "Berikan link ke file (Google Drive, OneDrive, dll)"
                        }
                      />

                      <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-muted/30">
                        <Label className="text-sm font-semibold">Upload File Langsung</Label>
                        <Input
                          type="file"
                          className="bg-background"
                          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.py,.ipynb,.txt"
                          onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                          disabled={isDeadlinePassed}
                        />
                        {uploadedFile && (
                          <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 p-2 rounded-lg">
                            <FileUp className="h-3 w-3" />
                            <span>File dipilih: <strong>{uploadedFile.name}</strong> ({Math.round(uploadedFile.size / 1024)} KB)</span>
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground italic">
                          * Mendukung format PDF, Docx, Zip, Gambar (WebP, JPG, PNG), dll. Maksimal 10MB.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                )}

                {submissionComponents.includes('COMPILER') && (
                  <TabsContent value="code" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Python Compiler</Label>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleRunCode}
                          disabled={isRunning || !sourceCode.trim()}
                          className="gap-2 h-8"
                        >
                          {isRunning ? (
                            <><Loader2 className="h-3 w-3 animate-spin" />Running...</>
                          ) : (
                            <><Play className="h-3 w-3" />Run Code</>
                          )}
                        </Button>
                      </div>
                      <div className="border rounded-xl overflow-hidden shadow-inner bg-[#1e1e1e]">
                        <Editor
                          height="350px"
                          language="python"
                          value={sourceCode}
                          onChange={(val) => setSourceCode(val || "")}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 12, bottom: 12 },
                            readOnly: isDeadlinePassed,
                            fontFamily: "JetBrains Mono, Menlo, Monaco, 'Courier New', monospace",
                          }}
                        />
                      </div>
                      {compilerOutput && (
                        <div className="space-y-2 animate-in zoom-in-95 duration-200">
                          <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Terminal className="h-3 w-3" />Output Console
                          </Label>
                          <div className="bg-zinc-950 text-emerald-400 p-4 rounded-xl font-mono text-sm whitespace-pre-wrap border border-emerald-500/20 shadow-lg">
                            {compilerOutput}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}

                {submissionComponents.includes('TEXT') && (
                  <TabsContent value="text" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Jawaban Ketikan</Label>
                      <Textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Tuliskan jawaban atau laporan Anda di sini..."
                        className="min-h-[300px] text-sm leading-relaxed rounded-xl focus-visible:ring-primary/20 transition-all border-border/50 bg-background/50"
                        disabled={isDeadlinePassed}
                      />
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground italic px-1">
                        <p>* Jawaban Anda akan tersimpan secara otomatis saat menekan tombol kumpulkan.</p>
                        <p>{textContent.length} karakter</p>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            )}

            {/* Scheduled Upload Toggle */}
            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-4 my-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Upload Terjadwal
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tugas akan otomatis terkumpul pada waktu yang ditentukan.
                  </p>
                </div>
                <Switch
                  checked={isScheduled}
                  onCheckedChange={setIsScheduled}
                  disabled={isDeadlinePassed}
                />
              </div>
              
              {isScheduled && (
                <div className="pt-2 animate-in slide-in-from-top-2">
                  <Label className="mb-2 block">Pilih Tanggal & Waktu</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    disabled={isDeadlinePassed}
                    className="max-w-md"
                  />
                  {asesmen?.tgl_selesai && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Maksimal: {new Date(asesmen.tgl_selesai).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={submitting || isDeadlinePassed || groupAlreadySubmittedByOther}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {existingSubmission ? 'Memperbarui...' : (isScheduled ? 'Menjadwalkan...' : 'Mengumpulkan...')}
                  </>
                ) : (
                  <>
                    {isScheduled ? <CalendarClock className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isScheduled ? 'Jadwalkan Pengumpulan' : (existingSubmission ? 'Perbarui Tugas' : 'Kumpulkan Tugas')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <Link href={`/courses/${courseId}/${asesmenId}`}>
                  Batal
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
