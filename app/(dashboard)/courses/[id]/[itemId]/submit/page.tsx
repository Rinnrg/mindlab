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
  CheckCircle2,
  X,
  BookOpen,
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
  const { id: courseId, asesmenId } = resolvedParams
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
  const [existingSubmission, setExistingSubmission] = useState<any>(null)

  // Compiler state
  const [submitMode, setSubmitMode] = useState<"file" | "compiler">("file")
  const [sourceCode, setSourceCode] = useState("# Tulis kode Python kamu di sini\nprint('Hello, World!')\n")
  const [compilerOutput, setCompilerOutput] = useState("")
  const [isRunning, setIsRunning] = useState(false)

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

          // Check if student already submitted
          const submission = asesmenData.pengumpulanProyek?.find(
            (p: any) => p.siswaId === user.id
          )

          if (submission) {
            setExistingSubmission(submission)
            setNamaKelompok(submission.namaKelompok || "")
            setKetua(submission.ketua || "")
            setAnggota(submission.anggota || "")
            setFileUrl(submission.fileUrl || "")
            if (submission.sourceCode) {
              setSourceCode(submission.sourceCode)
              setSubmitMode("compiler")
            }
            if (submission.output) {
              setCompilerOutput(submission.output)
            }
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

    const hasFile = submitMode === "file" && fileUrl
    const hasCode = submitMode === "compiler" && sourceCode.trim()

    if (!hasFile && !hasCode) {
      showError("Error", submitMode === "file"
        ? "Silakan upload file tugas terlebih dahulu"
        : "Silakan tulis kode terlebih dahulu")
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

    const confirmed = await confirm(
      existingSubmission ? "Perbarui Pengumpulan?" : "Kumpulkan Tugas?",
      {
        description: existingSubmission
          ? "Apakah Anda yakin ingin memperbarui pengumpulan tugas ini?"
          : "Apakah Anda yakin ingin mengumpulkan tugas ini?",
        confirmText: existingSubmission ? "Perbarui" : "Kumpulkan",
        cancelText: "Batal",
        type: "info",
      }
    )

    if (!confirmed) return

    await execute(
      async () => {
        const payload: Record<string, any> = {
          siswaId: user?.id,
          namaKelompok: isKelompok ? finalNamaKelompok : null,
          ketua: isKelompok ? finalKetua : null,
          anggota: isKelompok ? finalAnggota : null,
        }

        if (submitMode === "file") {
          payload.fileUrl = fileUrl
        } else {
          payload.sourceCode = sourceCode
          payload.output = compilerOutput
        }

        const response = await fetch(`/api/asesmen/${asesmenId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const responseData = await response.json()
        if (!response.ok) throw new Error(responseData.error || "Gagal mengumpulkan tugas")
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
          setTimeout(() => {
            router.push(`/courses/${courseId}/${asesmenId}`)
          }, 1500)
        },
      }
    )
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

      {/* Deadline Warning */}
      {isDeadlinePassed && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Deadline pengumpulan sudah lewat. Anda tidak dapat mengumpulkan tugas.
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
      {isKelompok && (
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
            <Tabs value={submitMode} onValueChange={(v) => setSubmitMode(v as "file" | "compiler")}>
              <TabsList className="ios-tab-list">
                <TabsTrigger value="file" className="ios-tab-trigger">
                  <FileText className="ios-tab-icon" />
                  <span className="ios-tab-text">Upload File</span>
                </TabsTrigger>
                <TabsTrigger value="compiler" className="ios-tab-trigger">
                  <Code className="ios-tab-icon" />
                  <span className="ios-tab-text">Python Compiler</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="mt-4 space-y-4">
                <FileUploadField
                  label="File Tugas"
                  value={fileUrl}
                  onChange={setFileUrl}
                  description={
                    isDeadlinePassed
                      ? "Deadline sudah lewat"
                      : "Upload file tugas atau berikan link ke file (Google Drive, OneDrive, dll)"
                  }
                />
              </TabsContent>

              <TabsContent value="compiler" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Kode Python</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleRunCode}
                      disabled={isRunning || !sourceCode.trim()}
                      className="gap-2"
                    >
                      {isRunning ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Running...</>
                      ) : (
                        <><Play className="h-3.5 w-3.5" />Run Code</>
                      )}
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Editor
                      height="300px"
                      language="python"
                      value={sourceCode}
                      onChange={(val) => setSourceCode(val || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 8, bottom: 8 },
                        readOnly: isDeadlinePassed,
                      }}
                    />
                  </div>
                </div>

                {compilerOutput && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />Output
                    </Label>
                    <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                      {compilerOutput}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={submitting || isDeadlinePassed}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {existingSubmission ? 'Memperbarui...' : 'Mengumpulkan...'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {existingSubmission ? 'Perbarui Tugas' : 'Kumpulkan Tugas'}
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
