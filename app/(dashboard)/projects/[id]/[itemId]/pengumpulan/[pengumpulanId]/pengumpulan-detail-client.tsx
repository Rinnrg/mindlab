"use client"

import * as React from "react"
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
  Calendar,
  Code,
  MessageSquare,
  Trophy,
  Loader2
} from "lucide-react"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { motion, AnimatePresence } from "framer-motion"

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
  const [catatan, setCatatan] = React.useState<string>(pengumpulan.catatan || "")
  const [feedback, setFeedback] = React.useState<string>(pengumpulan.feedback || "")
  const [showPdf, setShowPdf] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

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
            validatedBy: user?.nama
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
                  {pengumpulan.fileUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={pengumpulan.fileUrl} download>
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
              <AnimatePresence mode="wait">
                {showPdf && pengumpulan.fileUrl ? (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="aspect-[3/4] sm:aspect-[4/5] w-full bg-muted/50">
                      <iframe 
                        src={`${pengumpulan.fileUrl}#toolbar=0`}
                        className="w-full h-full border-0"
                        title="Submission Preview"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Preview dinonaktifkan atau file tidak tersedia.</p>
                  </div>
                )}
              </AnimatePresence>

              {pengumpulan.sourceCode && (
                <div className="p-6 border-t border-border/30 bg-black/5 dark:bg-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Source Code / Teks Jawaban</h4>
                  </div>
                  <pre className="p-4 rounded-xl bg-background border border-border/50 overflow-x-auto text-sm font-mono leading-relaxed">
                    <code>{pengumpulan.sourceCode}</code>
                  </pre>
                </div>
              )}

              {pengumpulan.output && (
                <div className="p-6 border-t border-border/30 bg-primary/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Output / Hasil</h4>
                  </div>
                  <div className="p-4 rounded-xl bg-background border border-border/50 text-sm whitespace-pre-wrap leading-relaxed">
                    {pengumpulan.output}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Grading Form */}
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
              <div className="space-y-2">
                <Label htmlFor="nilai">Skor Akhir (0-100)</Label>
                <div className="relative">
                  <Input 
                    id="nilai" 
                    type="number" 
                    min={0} 
                    max={100}
                    value={nilai} 
                    onChange={(e) => setNilai(e.target.value)}
                    placeholder="Contoh: 85"
                    className="text-2xl font-bold h-14 pl-4 pr-12 bg-primary/5 border-primary/20 rounded-xl"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                    / 100
                  </div>
                </div>
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
                <Button 
                  onClick={() => onSaveGrade(false)} 
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl gap-2"
                >
                  <Save className="h-4 w-4" />
                  Simpan Nilai
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => onSaveGrade(true)} 
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl gap-2 border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary"
                >
                  <Trophy className="h-4 w-4" />
                  Validasi & Showcase
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
