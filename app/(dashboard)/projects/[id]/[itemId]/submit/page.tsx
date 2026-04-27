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
  const [userGroup, setUserGroup] = useState<any>(null)

  // Set custom breadcrumb
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
      label: asesmen?.judul || 'Loading...', 
      href: `/projects/${courseId}/${asesmenId}`,
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
    if (user.role !== 'SISWA') { router.push(`/projects/${courseId}/${asesmenId}`); return }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/asesmen/${asesmenId}`)
        if (response.ok) {
          const data = await response.json()
          const asesmenData = data.asesmen

          if (asesmenData.tgl_mulai && new Date(asesmenData.tgl_mulai) > new Date()) {
            showError("Belum Dimulai", "Tugas ini belum bisa dikumpulkan karena belum dimulai")
            router.push(`/projects/${courseId}/${asesmenId}`)
            return
          }

          if (asesmenData.tgl_selesai && new Date(asesmenData.tgl_selesai) < new Date()) {
            showError("Deadline Terlewat", "Tugas ini sudah melewati deadline")
            router.push(`/projects/${courseId}/${asesmenId}`)
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
            // Check if student belongs to a pre-defined group
            const myGroup = asesmenData.kelompok?.find((k: any) => 
              k.anggota.some((a: any) => a.siswaId === user.id)
            )
            
            if (myGroup) {
              setUserGroup(myGroup)
              setNamaKelompok(myGroup.nama)
              // If we already have a submission, it will overwrite these
            }

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
          router.push(`/projects/${courseId}`)
        }
      } catch (error) {
        console.error('Error fetching asesmen:', error)
        router.push(`/projects/${courseId}`)
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
            router.push(`/projects/${courseId}/${asesmenId}`)
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
    <div className="w-full py-6 sm:py-8 space-y-8 max-w-5xl mx-auto">
      <AlertComponent />
      <ActionFeedback />

      {/* Header - iOS Glass Style */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-1">
          <Badge variant="outline" className="mb-2 border-primary/20 bg-primary/5 text-primary">
            {isKelompok ? <Users className="mr-1 h-3 w-3" /> : <UserIcon className="mr-1 h-3 w-3" />}
            {isKelompok ? "Tugas Kelompok" : "Tugas Individu"}
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {existingSubmission ? 'Perbarui' : 'Kirim'} Jawaban
          </h1>
          <p className="text-muted-foreground">{asesmen.nama}</p>
        </div>
        
        {asesmen.tgl_selesai && (
          <div className="flex items-center gap-3 p-3 rounded-2xl ios-glass-inset text-sm">
            <Clock className={`h-4 w-4 ${isDeadlinePassed ? 'text-destructive' : 'text-primary'}`} />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Batas Waktu</p>
              <p className={`font-semibold ${isDeadlinePassed ? 'text-destructive' : ''}`}>
                {new Date(asesmen.tgl_selesai).toLocaleString('id-ID', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Deadline Warning */}
      {isDeadlinePassed && (
        <Alert variant="destructive" className="rounded-2xl border-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Masa pengumpulan telah berakhir. Anda tidak dapat mengirimkan atau memperbarui jawaban lagi.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Submission Form */}
          <Card className="ios-glass-card border-border/30 rounded-3xl overflow-hidden shadow-xl">
            <CardHeader className="bg-primary/5 border-b border-border/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lembar Pengerjaan</CardTitle>
                  <CardDescription>Pilih salah satu metode pengumpulan di bawah ini</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                <Tabs value={submitMode} onValueChange={(v) => setSubmitMode(v as "file" | "compiler")} className="w-full">
                  <TabsList className="ios-tab-list w-full max-w-md mx-auto mb-8">
                    <TabsTrigger value="file" className="ios-tab-trigger">
                      <FileText className="ios-tab-icon" />
                      <span className="ios-tab-text">Upload File</span>
                    </TabsTrigger>
                    <TabsTrigger value="compiler" className="ios-tab-trigger">
                      <Code className="ios-tab-icon" />
                      <span className="ios-tab-text">Compiler</span>
                    </TabsTrigger>
                  </TabsList>

                  <AnimatePresence mode="wait">
                    <TabsContent value="file" key="file-tab" className="mt-0 focus-visible:outline-none">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-4"
                      >
                        <div className="p-8 border-2 border-dashed border-border/50 rounded-3xl bg-muted/20 hover:bg-muted/30 transition-colors">
                          <FileUploadField
                            label=""
                            value={fileUrl}
                            onChange={setFileUrl}
                            description={
                              isDeadlinePassed
                                ? "Deadline sudah lewat"
                                : "Seret file ke sini atau klik untuk memilih file (PDF, Gambar, atau Dokumen)"
                            }
                          />
                        </div>
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="compiler" key="compiler-tab" className="mt-0 focus-visible:outline-none">
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Terminal className="h-4 w-4 text-primary" />
                              <Label className="font-bold">Python Workspace</Label>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={handleRunCode}
                              disabled={isRunning || !sourceCode.trim()}
                              className="rounded-xl gap-2 shadow-sm border border-primary/20"
                            >
                              {isRunning ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Menjalankan...</>
                              ) : (
                                <><Play className="h-3.5 w-3.5 fill-primary text-primary" />Run Code</>
                              )}
                            </Button>
                          </div>
                          
                          <div className="border border-border/30 rounded-2xl overflow-hidden shadow-inner">
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
                                padding: { top: 16, bottom: 16 },
                                readOnly: isDeadlinePassed,
                                borderRadius: 16,
                              }}
                            />
                          </div>
                        </div>

                        {compilerOutput && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Terminal Output</Label>
                            <div className="bg-zinc-950 text-emerald-400 p-5 rounded-2xl font-mono text-sm whitespace-pre-wrap max-h-[250px] overflow-y-auto border border-emerald-500/20 shadow-lg">
                              {compilerOutput}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </TabsContent>
                  </AnimatePresence>
                </Tabs>

                <Separator className="bg-border/30" />

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || isDeadlinePassed}
                    size="lg"
                    className="flex-1 rounded-2xl h-14 text-base font-bold shadow-lg shadow-primary/20"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sedang Mengirim...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        {existingSubmission ? 'Perbarui Jawaban' : (isKelompok ? 'Kirim sebagai Kelompok' : 'Kirim Jawaban')}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    asChild
                    className="rounded-2xl h-14 px-8"
                  >
                    <Link href={`/projects/${courseId}/${asesmenId}`}>
                      Batal
                    </Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-8">
          {/* Context Info */}
          <Card className="ios-glass-card border-border/30 rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Informasi Tugas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                <p className="text-sm mt-1 leading-relaxed">{asesmen.deskripsi || 'Selesaikan tugas ini sesuai instruksi yang diberikan.'}</p>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tipe Penugasan:</span>
                <span className="font-bold">{isKelompok ? "Kerjasama Kelompok" : "Pengerjaan Mandiri"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Group Specific UI */}
          {isKelompok && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="ios-glass-card border-primary/20 bg-primary/5 rounded-3xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-primary/10">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                    <Users className="h-5 w-5" /> Struktur Kelompok
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {userGroup ? (
                    /* Pre-assigned Group View */
                    <div className="space-y-6">
                      <div className="text-center p-4 rounded-2xl bg-primary/10 border border-primary/20">
                        <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">Nama Kelompok</p>
                        <h3 className="text-lg font-extrabold">{userGroup.nama}</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                          <UserIcon className="h-3 w-3" /> Anggota Tim ({userGroup.anggota.length})
                        </Label>
                        <div className="space-y-3">
                          {userGroup.anggota.map((a: any) => (
                            <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-background/50 transition-colors">
                              <Avatar className="h-9 w-9 border border-primary/20">
                                <AvatarImage src={a.siswa.foto} />
                                <AvatarFallback className="bg-primary/5 text-primary text-xs">
                                  {a.siswa.nama?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{a.siswa.nama}</p>
                                <p className="text-[10px] text-muted-foreground">Siswa Enrollment</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Alert className="bg-primary/10 border-none rounded-xl">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-xs text-primary/80">
                          Anda mengirim atas nama kelompok ini. Cukup satu orang yang mengumpulkan.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : enrolledStudents.length > 0 ? (
                    /* Self-form Group View (if no pre-assigned) */
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="namaKelompok" className="text-xs font-bold text-primary">Nama Kelompok</Label>
                        <Input
                          id="namaKelompok"
                          value={namaKelompok}
                          onChange={(e) => setNamaKelompok(e.target.value)}
                          placeholder="Contoh: Tim Alpha"
                          className="rounded-xl border-primary/20 bg-background/50 h-11"
                          disabled={isDeadlinePassed}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-primary">Ketua (Pilih satu)</Label>
                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
                          {enrolledStudents.map((student) => {
                            const isSelected = selectedKetua === student.id
                            return (
                              <button
                                key={`ketua-${student.id}`}
                                type="button"
                                onClick={() => selectKetua(student.id)}
                                disabled={isDeadlinePassed}
                                className={`flex items-center gap-3 p-2 rounded-xl border transition-all text-left ${
                                  isSelected
                                    ? 'border-primary bg-primary/20 shadow-sm'
                                    : 'border-border/30 hover:border-primary/50'
                                }`}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={student.foto} />
                                  <AvatarFallback className="text-[10px]">
                                    {student.nama?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-xs font-bold truncate flex-1">{student.nama}</p>
                                {isSelected && <Crown className="h-3 w-3 text-primary" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-primary">Anggota</Label>
                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
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
                                  className={`flex items-center gap-3 p-2 rounded-xl border transition-all text-left ${
                                    isSelected
                                      ? 'border-primary bg-primary/10 shadow-sm'
                                      : 'border-border/30 hover:border-primary/50'
                                  }`}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={student.foto} />
                                    <AvatarFallback className="text-[10px]">
                                      {student.nama?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <p className="text-xs font-medium truncate flex-1">{student.nama}</p>
                                  {isSelected && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                </button>
                              )
                            })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Text Input Fallback */
                    <div className="space-y-4">
                      <Input
                        value={namaKelompok}
                        onChange={(e) => setNamaKelompok(e.target.value)}
                        placeholder="Nama Kelompok"
                        className="rounded-xl border-primary/20 h-10"
                      />
                      <Input
                        value={ketua}
                        onChange={(e) => setKetua(e.target.value)}
                        placeholder="Nama Ketua"
                        className="rounded-xl border-primary/20 h-10"
                      />
                      <Textarea
                        value={anggota}
                        onChange={(e) => setAnggota(e.target.value)}
                        placeholder="Nama Anggota (koma)"
                        className="rounded-xl border-primary/20"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Individual Confirmation Badge */}
          {!isKelompok && (
            <Card className="ios-glass-card border-green-500/20 bg-green-500/5 rounded-3xl overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h4 className="font-bold text-green-700 dark:text-green-400">Pengiriman Mandiri</h4>
                  <p className="text-xs text-muted-foreground mt-1 px-4">Jawaban Anda akan dikirimkan secara individual dan hanya dapat diakses oleh Anda dan pengajar.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
