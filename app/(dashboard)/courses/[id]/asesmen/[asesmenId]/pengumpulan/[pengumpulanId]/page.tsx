"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
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
  Download, Calendar, User, Users, FileText, Loader2, Save,
  ExternalLink, Eye, CheckCircle2, XCircle, MessageSquare,
  Terminal, Code, ShieldCheck, RotateCcw, Award,
} from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string; asesmenId: string; pengumpulanId: string }>
}

export default function PengumpulanDetailPage({ params }: PageProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const resolvedParams = use(params)
  const { id: courseId, asesmenId, pengumpulanId } = resolvedParams
  const { error: showError, confirm, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const [pengumpulan, setPengumpulan] = useState<any>(null)
  const [asesmen, setAsesmen] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nilai, setNilai] = useState<string>('')
  const [feedback, setFeedback] = useState<string>('')
  const [catatan, setCatatan] = useState<string>('')
  const [showFileViewer, setShowFileViewer] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    fetchData()
  }, [user, authLoading, pengumpulanId, asesmenId])

  const fetchData = async () => {
    try {
      const pengumpulanRes = await fetch(`/api/pengumpulan/${pengumpulanId}`)
      if (!pengumpulanRes.ok) throw new Error('Failed to fetch')
      const pengumpulanData = await pengumpulanRes.json()
      setPengumpulan(pengumpulanData.pengumpulan)
      setNilai(pengumpulanData.pengumpulan.nilai?.toString() || '')
      setFeedback(pengumpulanData.pengumpulan.feedback || '')
      setCatatan(pengumpulanData.pengumpulan.catatan || '')

      const asesmenRes = await fetch(`/api/asesmen/${asesmenId}`)
      if (asesmenRes.ok) {
        const asesmenData = await asesmenRes.json()
        setAsesmen(asesmenData.asesmen)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      showError("Error", "Gagal mengambil data pengumpulan")
    } finally { setLoading(false) }
  }

  const handleValidate = async (status: 'VALIDATED' | 'REVISION') => {
    if (!nilai && status === 'VALIDATED') {
      showError("Error", "Nilai wajib diisi untuk validasi")
      return
    }
    const nilaiNum = nilai ? parseFloat(nilai) : undefined
    if (nilaiNum !== undefined && (nilaiNum < 0 || nilaiNum > 100)) {
      showError("Error", "Nilai harus antara 0-100")
      return
    }

    const statusLabel = status === 'VALIDATED' ? 'Validasi' : 'Minta Revisi'
    const confirmed = await confirm(`${statusLabel} Pengumpulan`, {
      description: status === 'VALIDATED' 
        ? `Validasi pengumpulan ini dengan nilai ${nilaiNum}? Project akan muncul di profil siswa sebagai portofolio.`
        : `Minta revisi untuk pengumpulan ini? Siswa akan diminta untuk memperbaiki tugasnya.`,
      confirmText: statusLabel,
      cancelText: "Batal",
      type: status === 'VALIDATED' ? "info" : "warning",
    })
    if (!confirmed) return

    await execute(
      async () => {
        const response = await fetch(`/api/pengumpulan/${pengumpulanId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nilai: nilaiNum,
            feedback,
            catatan,
            status,
            validatedBy: user?.id,
          }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to save')
        }
      },
      {
        loadingMessage: status === 'VALIDATED' ? "Memvalidasi..." : "Menyimpan...",
        successTitle: "Berhasil!",
        successDescription: status === 'VALIDATED'
          ? "Pengumpulan berhasil divalidasi dan akan muncul di portofolio siswa"
          : "Permintaan revisi berhasil dikirim",
        errorTitle: "Gagal",
        autoCloseMs: 2000,
        onSuccess: () => setTimeout(() => router.push(`/courses/${courseId}/asesmen/${asesmenId}`), 1500),
      }
    )
  }

  const handleSaveNilai = async () => {
    if (!nilai) { showError("Error", "Nilai wajib diisi"); return }
    const nilaiNum = parseFloat(nilai)
    if (nilaiNum < 0 || nilaiNum > 100) { showError("Error", "Nilai harus antara 0-100"); return }

    const confirmed = await confirm("Simpan Nilai & Feedback", {
      description: `Simpan nilai ${nilaiNum} untuk pengumpulan ini?`,
      confirmText: "Simpan", cancelText: "Batal", type: "warning",
    })
    if (!confirmed) return

    await execute(
      async () => {
        const response = await fetch(`/api/pengumpulan/${pengumpulanId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nilai: nilaiNum, feedback, catatan }),
        })
        if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed') }
      },
      {
        loadingMessage: "Menyimpan nilai...",
        successTitle: "Berhasil!",
        successDescription: "Nilai dan feedback berhasil disimpan",
        errorTitle: "Gagal", autoCloseMs: 1500,
        onSuccess: () => setTimeout(() => router.push(`/courses/${courseId}/asesmen/${asesmenId}`), 1000),
      }
    )
  }

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!pengumpulan || !asesmen) return null
  const isTeacher = user && (user.role === 'GURU' || user.role === 'ADMIN')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALIDATED': return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" />Tervalidasi</Badge>
      case 'REVISION': return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"><RotateCcw className="h-3 w-3 mr-1" />Perlu Revisi</Badge>
      default: return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1" />Menunggu Review</Badge>
    }
  }

  return (
    <div className="w-full py-6 sm:py-8 space-y-6">
      <AlertComponent />
      <ActionFeedback />
      
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Detail Pengumpulan</h1>
            <p className="text-muted-foreground">{asesmen.nama}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(pengumpulan.status || 'PENDING')}
          </div>
        </div>
      </div>

      {/* Submission Info */}
      <Card>
        <CardHeader><CardTitle>Informasi Pengumpulan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {asesmen.tipePengerjaan === 'KELOMPOK' && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nama Kelompok</Label>
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{pengumpulan.namaKelompok || '-'}</span></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Ketua Kelompok</Label>
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-yellow-500" /><span className="font-medium">{pengumpulan.ketua || '-'}</span><Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">Ketua</Badge></div>
                </div>
              </div>
              {pengumpulan.anggota && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Anggota</Label>
                  <div className="flex flex-wrap gap-2">
                    {pengumpulan.anggota.split(',').map((name: string, i: number) => (
                      <Badge key={i} variant="secondary" className="py-1 px-3">{name.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <Separator />
            </>
          )}

          {asesmen.tipePengerjaan === 'INDIVIDU' && pengumpulan.siswa && (
            <><div className="space-y-2">
              <Label className="text-muted-foreground">Siswa</Label>
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">{pengumpulan.siswa.nama}</p><p className="text-sm text-muted-foreground">{pengumpulan.siswa.email}</p></div></div>
            </div><Separator /></>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tanggal Upload</Label>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{new Date(pengumpulan.tgl_unggah).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Status</Label>
              <div>{getStatusBadge(pengumpulan.status || 'PENDING')}</div>
            </div>
          </div>

          {/* File attachment */}
          {pengumpulan.fileUrl && (
            <><Separator /><div className="space-y-3">
              <Label className="text-muted-foreground">File</Label>
              <div className="flex items-center gap-2">
                {(pengumpulan.fileUrl.startsWith('data:application/pdf') || pengumpulan.fileUrl.endsWith('.pdf')) && (
                  <Button variant="outline" size="sm" onClick={() => setShowFileViewer(!showFileViewer)}>
                    <Eye className="mr-2 h-4 w-4" />{showFileViewer ? 'Sembunyikan' : 'Lihat File'}
                  </Button>
                )}
                {pengumpulan.fileUrl.startsWith('data:') ? (
                  <Button variant="outline" size="sm" asChild><a href={pengumpulan.fileUrl} download={`submission-${pengumpulan.id}`}><Download className="mr-2 h-4 w-4" />Unduh</a></Button>
                ) : (
                  <Button variant="outline" size="sm" asChild><a href={pengumpulan.fileUrl} target="_blank" rel="noopener noreferrer">{pengumpulan.fileUrl.startsWith('http') ? <><ExternalLink className="mr-2 h-4 w-4" />Buka Link</> : <><Download className="mr-2 h-4 w-4" />Unduh</>}</a></Button>
                )}
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${showFileViewer ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {pengumpulan.fileUrl.startsWith('data:application/pdf') && (
                  <div className="border rounded-lg overflow-hidden bg-muted mt-3"><div className="aspect-[3/4] w-full"><iframe src={pengumpulan.fileUrl} title="File" className="w-full h-full" /></div></div>
                )}
              </div>
            </div></>
          )}

          {/* Source Code */}
          {pengumpulan.sourceCode && (
            <><Separator /><div className="space-y-3">
              <Label className="text-muted-foreground flex items-center gap-2"><Code className="h-4 w-4" />Source Code</Label>
              <div className="border rounded-lg overflow-hidden">
                <Editor height="250px" language="python" value={pengumpulan.sourceCode} theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 13, readOnly: true, lineNumbers: "on", scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 8, bottom: 8 } }} />
              </div>
            </div></>
          )}

          {/* Output */}
          {pengumpulan.output && (
            <><Separator /><div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2"><Terminal className="h-4 w-4" />Output Compiler</Label>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">{pengumpulan.output}</div>
            </div></>
          )}

          {/* Existing Feedback from Guru */}
          {pengumpulan.feedback && !isTeacher && (
            <><Separator /><div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Feedback dari Guru</Label>
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg"><p className="text-sm whitespace-pre-wrap">{pengumpulan.feedback}</p></div>
            </div></>
          )}
        </CardContent>
      </Card>

      {/* Validation & Grading (Only for Teachers) */}
      {isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Penilaian & Validasi</CardTitle>
            <CardDescription>Berikan nilai, feedback, dan validasi pengumpulan ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nilai">Nilai (0-100) *</Label>
                <Input id="nilai" type="number" min="0" max="100" value={nilai} onChange={(e) => setNilai(e.target.value)} placeholder="0-100" />
              </div>
              <div className="space-y-2">
                <Label>Status Saat Ini</Label>
                <div className="h-10 flex items-center">{getStatusBadge(pengumpulan.status || 'PENDING')}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Feedback untuk Siswa</Label>
              <Textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Berikan feedback untuk siswa tentang tugasnya..." rows={4} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan Internal (untuk guru)</Label>
              <Textarea id="catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan internal..." rows={2} />
            </div>

            <Separator />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => handleValidate('VALIDATED')} className="flex-1 bg-green-600 hover:bg-green-700 gap-2" disabled={!nilai}>
                <CheckCircle2 className="h-4 w-4" />Validasi & Tampilkan di Portofolio
              </Button>
              <Button onClick={() => handleValidate('REVISION')} variant="outline" className="flex-1 gap-2 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20">
                <RotateCcw className="h-4 w-4" />Minta Revisi
              </Button>
              <Button onClick={handleSaveNilai} variant="secondary" className="gap-2">
                <Save className="h-4 w-4" />Simpan Saja
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
