"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Eye, 
  Save, 
  CheckCircle2, 
  Star,
  User,
  Users,
  Calendar,
  Play,
  Code,
  MessageSquare,
  Trophy,
  Loader2,
  Table as TableIcon,
  Info,
  AlignLeft
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import dynamic from 'next/dynamic'

interface PengumpulanDetailClientProps {
  courseId: string
  asesmenId: string
  pengumpulan: any
}

export default function PengumpulanDetailClient({ 
  courseId, 
  asesmenId, 
  pengumpulan 
}: PengumpulanDetailClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { confirm, error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()

  const [nilai, setNilai] = React.useState<string>(pengumpulan.nilai?.toString() || "")
  const [skorK1, setSkorK1] = React.useState<number>(pengumpulan.skorK1 || 0)
  const [skorK2, setSkorK2] = React.useState<number>(pengumpulan.skorK2 || 0)
  const [skorK3, setSkorK3] = React.useState<number>(pengumpulan.skorK3 || 0)
  const [skorK4, setSkorK4] = React.useState<number>(pengumpulan.skorK4 || 0)
  const [catatan, setCatatan] = React.useState<string>(pengumpulan.catatan || "")
  const [feedback, setFeedback] = React.useState<string>(pengumpulan.feedback || "")
  const [showPdf, setShowPdf] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [pushToShowcase, setPushToShowcase] = React.useState<boolean>(pengumpulan.status === 'VALIDATED')

  const pengerjaanLabel =
    (pengumpulan as any)?.asesmen?.tipePengerjaan === 'KELOMPOK'
      ? 'Kelompok'
      : 'Individu'

  const isKelompok = (pengumpulan as any)?.asesmen?.tipePengerjaan === 'KELOMPOK'
  const kelompokNama = (pengumpulan as any)?.namaKelompok || (pengumpulan as any)?.kelompok?.nama || ""
  const kelompokKetua =
    (pengumpulan as any)?.ketua ||
    (pengumpulan as any)?.kelompok?.ketua?.nama ||
    (pengumpulan as any)?.kelompok?.ketua ||
    ""
  const kelompokAnggota =
    (pengumpulan as any)?.kelompokAnggota ||
    (pengumpulan as any)?.kelompok?.anggota ||
    (pengumpulan as any)?.asesmenKelompok?.anggota ||
    (pengumpulan as any)?.anggota ||
    []

  const anggotaNames: string[] = React.useMemo(() => {
    if (!kelompokAnggota) return []
    // Bisa berupa string "A, B" (legacy) atau array relasi
    if (typeof kelompokAnggota === "string") {
      return kelompokAnggota
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    }

    if (!Array.isArray(kelompokAnggota)) return []

    return kelompokAnggota
  .map((a: any) => a?.siswa?.nama || a?.nama || a?.siswaNama)
      .filter(Boolean)
  }, [kelompokAnggota])

  const hasSintaks = !!pengumpulan.asesmen.sintak

  // Helper to get grade predicate
  const getPredicate = (n: number) => {
    if (n >= 86) return { grade: "A", label: "Sangat Baik", color: "text-green-600 bg-green-50" }
    if (n >= 71) return { grade: "B", label: "Baik", color: "text-blue-600 bg-blue-50" }
    if (n >= 56) return { grade: "C", label: "Cukup", color: "text-yellow-600 bg-yellow-50" }
    return { grade: "D", label: "Kurang", color: "text-red-600 bg-red-50" }
  }

  // Auto calculate nilai when rubric scores change
  React.useEffect(() => {
    if (hasSintaks && (skorK1 > 0 || skorK2 > 0 || skorK3 > 0 || skorK4 > 0)) {
      const total = (skorK1 * 20) + (skorK2 * 40) + (skorK3 * 25) + (skorK4 * 15)
      const finalNilai = total / 4
      setNilai(finalNilai.toString()) // Keep as string for input
    }
  }, [skorK1, skorK2, skorK3, skorK4, hasSintaks])

  const dbFileHref = (pengumpulan as any)?.hasFileData
    ? `/api/pengumpulan/${pengumpulan.id}/file`
    : null
  const fileHref = dbFileHref || pengumpulan.fileUrl

  // Compiler state for teacher view (allow running code if source present)
  const [teacherSource, setTeacherSource] = React.useState<string>(pengumpulan.sourceCode || "# Tulis kode Python di sini\nprint('Hello from teacher view')\n")
  const [teacherOutput, setTeacherOutput] = React.useState<string>(pengumpulan.output || "")
  const [teacherRunning, setTeacherRunning] = React.useState<boolean>(false)
  const [teacherStdin, setTeacherStdin] = React.useState<string>("")
  const [showTeacherStdin, setShowTeacherStdin] = React.useState<boolean>(false)

  const Editor = React.useMemo(() => dynamic(() => import('@monaco-editor/react'), { ssr: false }), [])

  const onSaveGrade = async (isValidated: boolean = false) => {
    if (!nilai) {
      showError("Gagal", "Nilai wajib diisi")
      return
    }

    const n = parseFloat(nilai)
    if (isNaN(n) || n < 0 || n > 100) {
      showError("Gagal", "Nilai harus berupa angka antara 0-100")
      return
    }

    if (isValidated) {
      const ok = await confirm("Validasi & Masukkan ke Showcase?", {
        description: "Tugas ini akan divalidasi dan muncul di profil siswa sebagai pencapaian. Pastikan nilai dan feedback sudah sesuai.",
        confirmText: "Validasi",
        cancelText: "Batal",
        type: "success"
      })
      if (!ok) return
    }

    setIsSubmitting(true)
    await execute(
      async () => {
        const response = await fetch(`/api/pengumpulan/${pengumpulan.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nilai: n,
            catatan,
            feedback,
            status: isValidated ? "VALIDATED" : "DINILAI",
            validatedBy: user?.nama,
            skorK1: hasSintaks ? skorK1 : undefined,
            skorK2: hasSintaks ? skorK2 : undefined,
            skorK3: hasSintaks ? skorK3 : undefined,
            skorK4: hasSintaks ? skorK4 : undefined,
          })
        })
        if (!response.ok) throw new Error("Gagal menyimpan penilaian")
        return await response.json()
      },
      {
        loadingMessage: "Menyimpan penilaian...",
        successTitle: "Berhasil!",
        successDescription: isValidated ? "Tugas divalidasi dan masuk ke showcase!" : "Penilaian berhasil disimpan",
        onSuccess: () => router.refresh()
      }
    )
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <AlertComponent />
      <ActionFeedback />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Pengumpulan</h1>
            <p className="text-sm text-muted-foreground">
              {pengumpulan.asesmen.nama} • {pengumpulan.siswa.nama}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-3 rounded-lg">
            {pengerjaanLabel}
          </Badge>
          <Badge variant={pengumpulan.status === 'VALIDATED' ? 'default' : 'secondary'} className="h-8 px-3 rounded-lg">
            {pengumpulan.status === 'VALIDATED' ? (
              <><Trophy className="mr-2 h-4 w-4 text-yellow-400" /> Ter-showcase</>
            ) : pengumpulan.status === 'DINILAI' ? (
              <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Sudah Dinilai</>
            ) : (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" /> Sedang di review</>
            )}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Submission Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission Info */}
          <Card className="ios-glass-card border-border/30 rounded-2xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Hasil Tugas</CardTitle>
                </div>
                <div className="flex items-center gap-2">
          {fileHref && (
                    <Button variant="outline" size="sm" asChild>
            <a href={fileHref} download>
                        <Download className="mr-2 h-4 w-4" />
                        Unduh File
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowPdf(!showPdf)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {showPdf ? "Sembunyikan" : "Lihat"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue={fileHref ? "file" : pengumpulan.sourceCode ? "code" : "text"} className="w-full">
                <div className="px-6 py-2 border-b border-border/30 bg-muted/20">
                  <TabsList className="ios-tab-list w-full max-w-md mx-auto mb-6">
                  {fileHref && (
                    <TabsTrigger value="file" className="ios-tab-trigger">
                      <FileText className="ios-tab-icon" />
                      <span className="ios-tab-text">File Tugas</span>
                    </TabsTrigger>
                  )}
                  {pengumpulan.sourceCode && (
                    <TabsTrigger value="code" className="ios-tab-trigger">
                      <Code className="ios-tab-icon" />
                      <span className="ios-tab-text">Source Code</span>
                    </TabsTrigger>
                  )}
                  {pengumpulan.textContent && (
                    <TabsTrigger value="text" className="ios-tab-trigger">
                      <FileText className="ios-tab-icon" />
                      <span className="ios-tab-text">Ketikan Teks</span>
                    </TabsTrigger>
                  )}
                </TabsList>
                </div>

                <TabsContent value="file" className="m-0 focus-visible:outline-none">
                  <AnimatePresence mode="wait">
                    {showPdf && fileHref ? (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="aspect-[3/4] sm:aspect-[4/5] w-full bg-muted/50">
                          <iframe 
                            src={`${fileHref}#toolbar=0`}
                            className="w-full h-full border-0"
                            title="Submission Preview"
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">
                          {fileHref ? "Preview dinonaktifkan. Klik 'Lihat' untuk menampilkan." : "Tidak ada file yang diunggah."}
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="code" className="m-0 focus-visible:outline-none">
                  {pengumpulan.sourceCode ? (
                    <div className="p-6 space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold text-sm">Teks Jawaban / Source Code</h4>
                        </div>
                        <pre className="p-4 rounded-xl bg-background border border-border/50 overflow-x-auto text-sm font-mono leading-relaxed">
                          <code>{pengumpulan.sourceCode}</code>
                        </pre>
                      </div>

                      {pengumpulan.output && (
                        <div className="pt-4 border-t border-border/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Eye className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold text-sm">Output / Hasil</h4>
                          </div>
                          <div className="p-4 rounded-xl bg-background border border-border/50 text-sm whitespace-pre-wrap leading-relaxed">
                            {pengumpulan.output}
                          </div>
                        </div>
                      )}

                      {/* Teacher-side compiler: allow running the code preview for teachers */}
                      <div className="pt-4 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold text-sm">Compiler (Guru)</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowTeacherStdin(!showTeacherStdin)}
                              className={`gap-1.5 h-8 text-xs ${
                                showTeacherStdin
                                  ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <AlignLeft className="h-3 w-3" />
                              stdin
                              {teacherStdin && (
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={async () => {
                                if (!teacherSource.trim()) return
                                setTeacherRunning(true)
                                setTeacherOutput("")
                                try {
                                  const res = await fetch('/api/compiler', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ code: teacherSource, stdin: teacherStdin }),
                                  })
                                  const data = await res.json()
                                  const output = [data.stdout, data.stderr].filter(Boolean).join('\n')
                                  setTeacherOutput(output || '(no output)')
                                } catch (e) {
                                  setTeacherOutput('Error: Gagal menjalankan kode')
                                } finally {
                                  setTeacherRunning(false)
                                }
                              }}
                              disabled={teacherRunning}
                              className="gap-2 h-8"
                            >
                              {teacherRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Run
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 border border-border/30 rounded-2xl overflow-hidden">
                          {/* @ts-ignore */}
                          <Editor
                            height="220px"
                            language="python"
                            value={teacherSource}
                            onChange={(v: any) => setTeacherSource(v || '')}
                            theme="vs-dark"
                            options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true, scrollBeyondLastLine: false }}
                          />
                        </div>

                        {/* Stdin panel */}
                        {showTeacherStdin && (
                          <div className="mt-3 border border-orange-500/20 rounded-2xl overflow-hidden bg-orange-500/5">
                            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-orange-500/10">
                              <AlignLeft className="h-3 w-3 text-orange-500" />
                              <span className="text-[11px] font-semibold text-orange-500 uppercase tracking-wider">Input (stdin)</span>
                              <span className="text-[10px] text-muted-foreground ml-auto">Tulis input baris per baris</span>
                            </div>
                            <textarea
                              value={teacherStdin}
                              onChange={(e) => setTeacherStdin(e.target.value)}
                              placeholder={`Contoh:\n150000\nya`}
                              rows={3}
                              className="w-full px-4 py-2 text-sm font-mono resize-y bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40 min-h-[64px] max-h-[200px]"
                            />
                          </div>
                        )}

                        {teacherOutput && (
                          <div className="mt-3">
                            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Terminal Output</Label>
                            <div className="bg-zinc-950 text-emerald-400 p-4 rounded-2xl font-mono text-sm whitespace-pre-wrap max-h-[220px] overflow-y-auto border border-emerald-500/20 shadow-lg">
                              {teacherOutput}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                        <Code className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Tidak ada jawaban teks.</p>
                    </div>
                  )}
                </TabsContent>

                {pengumpulan.textContent && (
                  <TabsContent value="text" className="mt-0 focus-visible:outline-none">
                    <div className="ios-glass-inset rounded-2xl p-6 min-h-[400px]">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Jawaban Teks Siswa
                      </h3>
                      <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                        {pengumpulan.textContent}
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="ios-glass-card border-border/30 rounded-2xl sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                Penilaian Guru
              </CardTitle>
              <CardDescription>Berikan skor dan feedback untuk tugas ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasSintaks && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <TableIcon className="h-4 w-4" />
                      Rubrik Penilaian
                    </Label>
                    <Badge variant="outline" className="text-[10px]">PBL Sintaks {pengumpulan.asesmen.sintak}</Badge>
                  </div>

                  <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-[50px] text-[10px] uppercase">No</TableHead>
                          <TableHead className="text-[10px] uppercase">Kriteria</TableHead>
                          <TableHead className="w-[80px] text-[10px] uppercase text-center">Skor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { id: 'K1', label: 'Analisis Masalah & Logika', weight: '20%', value: skorK1, setter: setSkorK1, tooltip: 'Menilai output PBL Sintaks 1 & 2' },
                          { id: 'K2', label: 'Sintaks & Fungsionalitas', weight: '40%', value: skorK2, setter: setSkorK2, tooltip: 'Menilai output PBL Sintaks 3' },
                          { id: 'K3', label: 'Penerapan Konsep Materi', weight: '25%', value: skorK3, setter: setSkorK3, tooltip: 'Menilai output PBL Sintaks 3' },
                          { id: 'K4', label: 'Dokumentasi & Refleksi', weight: '15%', value: skorK4, setter: setSkorK4, tooltip: 'Menilai output PBL Sintaks 4 & 5' },
                        ].map((item, idx) => (
                          <TableRow key={item.id} className="hover:bg-muted/20">
                            <TableCell className="font-medium text-xs">{idx + 1}</TableCell>
                            <TableCell className="p-2">
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold">{item.label}</div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Info className="h-2.5 w-2.5" />
                                  {item.tooltip} ({item.weight})
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="p-2">
                              <Select 
                                value={item.value.toString()} 
                                onValueChange={(val) => item.setter(parseInt(val))}
                              >
                                <SelectTrigger className="h-8 w-full text-xs bg-background/50 border-border/30">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="4">4 (SB)</SelectItem>
                                  <SelectItem value="3">3 (B)</SelectItem>
                                  <SelectItem value="2">2 (C)</SelectItem>
                                  <SelectItem value="1">1 (K)</SelectItem>
                                  <SelectItem value="0">-</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic px-1">
                    Skala: 4=Sangat Baik, 3=Baik, 2=Cukup, 1=Kurang
                  </p>
                  <Separator />
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="nilai" className="text-sm font-semibold">Skor Akhir (Terhitung Otomatis)</Label>
                <div className="relative group">
                  <Input 
                    id="nilai" 
                    type="text" 
                    readOnly={hasSintaks}
                    value={nilai} 
                    onChange={(e) => !hasSintaks && setNilai(e.target.value)}
                    placeholder="Hasil hitung rubrik..."
                    className={cn(
                      "text-3xl font-bold h-16 pl-5 pr-14 rounded-2xl transition-all duration-300",
                      hasSintaks 
                        ? "bg-primary/5 border-primary/30 text-primary shadow-inner" 
                        : "bg-background border-border"
                    )}
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">
                    / 100
                  </div>
                </div>
                
                {hasSintaks && nilai && parseFloat(nilai) > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border border-current/10",
                      getPredicate(parseFloat(nilai)).color
                    )}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">Predikat</span>
                    <span className="font-bold">
                      {getPredicate(parseFloat(nilai)).grade} ({getPredicate(parseFloat(nilai)).label})
                    </span>
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="catatan" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Catatan Guru (Private)
                </Label>
                <Textarea 
                  id="catatan" 
                  value={catatan} 
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan untuk internal guru..."
                  rows={3}
                  className="rounded-xl bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Feedback untuk Siswa
                </Label>
                <Textarea 
                  id="feedback" 
                  value={feedback} 
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Berikan saran dan apresiasi untuk siswa..."
                  rows={4}
                  className="rounded-xl bg-background/50"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={pushToShowcase}
                      onCheckedChange={(v: boolean) => setPushToShowcase(v)}
                    />
                    <div className="text-sm">
                      <div className="font-semibold">Masuk ke Showcase</div>
                      <div className="text-xs text-muted-foreground">Jika aktif, saat menyimpan nilai tugas akan masuk ke profil showcase siswa.</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Status saat ini: <strong>{pengumpulan.status === 'VALIDATED' ? 'Ter-showcase' : pengumpulan.status === 'DINILAI' ? 'Sudah Dinilai' : 'Belum Dinilai'}</strong></div>
                </div>

                <Button 
                  onClick={() => onSaveGrade(pushToShowcase)} 
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl gap-2"
                >
                  <Save className="h-4 w-4" />
                  Simpan Nilai
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informasi Pengumpulan</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Siswa: <strong>{pengumpulan.siswa.nama}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Dikirim: {new Date(pengumpulan.tgl_unggah).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  {pengumpulan.namaKelompok && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Kelompok: <strong>{pengumpulan.namaKelompok}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {isKelompok && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Struktur Kelompok</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          Nama Kelompok: <strong>{kelompokNama || "-"}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          Ketua: <strong>{kelompokKetua || "-"}</strong>
                        </span>
                      </div>
                    </div>

                    {anggotaNames.length > 0 ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Anggota ({anggotaNames.length})</Label>
                        <ul className="space-y-1">
                          {anggotaNames.map((name) => (
                            <li key={name} className="text-sm text-muted-foreground">• {name}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <Alert className="rounded-xl">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          List anggota belum tersedia pada data pengumpulan. Jika seharusnya ada, pastikan API detail pengumpulan
                          menyertakan relasi <code>kelompok.anggota.siswa</code>.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
