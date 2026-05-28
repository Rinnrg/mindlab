"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  AlertCircle, 
  Save, 
  Loader2,
  Check,
  X,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"

interface KuisGradingClientProps {
  courseId: string
  asesmenId: string
  attempt: any
  moduleType: "pbl" | "courses"
}

export default function KuisGradingClient({ courseId, asesmenId, attempt, moduleType }: KuisGradingClientProps) {
  const router = useRouter()
  const { success: showSuccess, error: showError, AlertComponent } = useAdaptiveAlert()
  const [isSaving, setIsSaving] = React.useState(false)
  
  // State to track manual grades for Essay questions
  // Initial state from existing skorDidapat
  const [localGrades, setLocalGrades] = React.useState<Record<string, 'BENAR' | 'SETENGAH' | 'SALAH' | null>>(() => {
    const grades: Record<string, 'BENAR' | 'SETENGAH' | 'SALAH' | null> = {}
    attempt.nilai[0].jawabanSiswa.forEach((j: any) => {
      if (j.soal.tipeJawaban === 'ISIAN') {
        if (j.skorDidapat === j.soal.bobot) grades[j.id] = 'BENAR'
        else if (j.skorDidapat === j.soal.bobot / 2) grades[j.id] = 'SETENGAH'
        else if (j.skorDidapat === 0 && j.isBenar === false) grades[j.id] = 'SALAH'
        else grades[j.id] = null
      }
    })
    return grades
  })

  const handleGradeChange = (jawabanId: string, type: 'BENAR' | 'SETENGAH' | 'SALAH') => {
    setLocalGrades(prev => ({ ...prev, [jawabanId]: type }))
  }

  const handleSave = async () => {
    // Collect only changed/graded ISIAN questions
    const scores = Object.entries(localGrades)
      .filter(([_, type]) => type !== null)
      .map(([jawabanId, type]) => ({ jawabanId, type }))

    if (scores.length === 0) {
      showError("Info", "Tidak ada perubahan nilai yang disimpan.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/grading/${attempt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores })
      })

      if (res.ok) {
        showSuccess("Berhasil", "Nilai kuis telah diperbarui.")
        router.refresh()
      } else {
        const data = await res.json()
        showError("Gagal", data.error || "Gagal menyimpan nilai.")
      }
    } catch (err) {
      showError("Error", "Terjadi kesalahan jaringan.")
    } finally {
      setIsSaving(false)
    }
  }

  const backUrl = moduleType === 'pbl' 
    ? `/pbl/${courseId}/${asesmenId}` 
    : `/courses/${courseId}/${asesmenId}`

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <AlertComponent />
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(backUrl)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detail Jawaban Kuis</h1>
            <p className="text-muted-foreground">{attempt.asesmen.nama}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="rounded-xl shadow-lg">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan Penilaian
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info Siswa & Skor Akhir */}
        <div className="space-y-6">
          <Card className="ios-glass-card border-border/30 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Profil Siswa</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold">{attempt.siswa.nama}</p>
                  <p className="text-xs text-muted-foreground">{attempt.siswa.email}</p>
                </div>
              </div>
              <Separator className="opacity-50" />
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    Waktu Selesai
                  </div>
                  <span className="font-medium">
                    {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Benar
                  </div>
                  <span className="font-medium">
                    {(() => {
                      const counts = (attempt.nilai && attempt.nilai[0] && Array.isArray(attempt.nilai[0].jawabanSiswa))
                        ? attempt.nilai[0].jawabanSiswa.reduce((acc: any, j: any) => {
                            if (j.isBenar === true) acc.benar += 1
                            else if (j.isBenar === false) acc.salah += 1
                            return acc
                          }, { benar: 0, salah: 0 })
                        : { benar: 0, salah: 0 }

                      return counts.benar
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <X className="mr-2 h-4 w-4 text-red-600" />
                    Salah
                  </div>
                  <span className="font-medium">
                    {(() => {
                      const counts = (attempt.nilai && attempt.nilai[0] && Array.isArray(attempt.nilai[0].jawabanSiswa))
                        ? attempt.nilai[0].jawabanSiswa.reduce((acc: any, j: any) => {
                            if (j.isBenar === true) acc.benar += 1
                            else if (j.isBenar === false) acc.salah += 1
                            return acc
                          }, { benar: 0, salah: 0 })
                        : { benar: 0, salah: 0 }

                      return counts.salah
                    })()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="ios-glass-card border-border/30 rounded-2xl overflow-hidden bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-primary">Skor Akhir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-primary">
                {attempt.nilai[0].skor}
              </div>
              <p className="text-xs text-primary/70 mt-2 font-medium">Skor dihitung otomatis berdasarkan bobot jawaban.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right: List Jawaban */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Review Jawaban
          </h2>
          
          {attempt.nilai[0].jawabanSiswa.map((j: any, idx: number) => {
            const isIsian = j.soal.tipeJawaban === 'ISIAN'
            const currentGrade = localGrades[j.id]

            return (
              <Card key={j.id} className={`ios-glass-card border-border/30 rounded-2xl transition-all ${isIsian && !currentGrade ? 'border-yellow-500/50 bg-yellow-50/10 dark:bg-yellow-900/10' : ''}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-lg h-6">Soal {idx + 1}</Badge>
                      {isIsian ? (
                        <Badge variant="outline" className="text-purple-500 border-purple-200 bg-purple-50">Essay</Badge>
                      ) : (
                        <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Pilihan Ganda</Badge>
                      )}
                    </div>
                    {!isIsian && (
                      <div className="flex items-center">
                        {j.isBenar ? (
                          <div className="flex items-center text-green-600 text-xs font-bold">
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            BENAR
                          </div>
                        ) : (
                          <div className="flex items-center text-destructive text-xs font-bold">
                            <XCircle className="mr-1 h-4 w-4" />
                            SALAH
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="font-medium text-sm leading-relaxed whitespace-pre-wrap">
                      {j.soal.pertanyaan}
                    </div>

                    {/* Multiple Choice Options */}
                    {!isIsian && (
                      <div className="grid grid-cols-1 gap-2 pl-2 border-l-2 border-muted">
                        {j.soal.opsi.map((o: any) => {
                          const isSelected = j.jawaban === o.id
                          const isCorrect = o.isBenar
                          return (
                            <div 
                              key={o.id} 
                              className={`text-xs p-2 rounded-lg flex items-center justify-between ${
                                isSelected 
                                  ? (isCorrect ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20')
                                  : (isCorrect ? 'bg-green-500/5 text-green-600/70' : 'text-muted-foreground')
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {isSelected && (isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />)}
                                {o.teks}
                              </span>
                              {isCorrect && <Badge variant="outline" className="text-[9px] h-4 py-0 border-green-200 text-green-600">Kunci</Badge>}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Student Answer */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Jawaban Siswa:</p>
                      <div className={`p-3 rounded-xl border ${isIsian ? 'bg-muted/30 border-border/50 italic text-sm' : 'bg-muted/10 border-transparent text-xs'}`}>
                        {isIsian ? (j.jawaban || <span className="text-muted-foreground font-normal">Tidak ada jawaban</span>) : (
                          j.soal.opsi.find((o: any) => o.id === j.jawaban)?.teks || <span className="text-destructive">Tidak dijawab</span>
                        )}
                      </div>
                    </div>

                    {/* Grading Section for ISIAN */}
                    {isIsian && (
                      <div className="pt-2 space-y-3">
                        <Separator className="opacity-50" />
                        <div className="flex flex-col gap-3">
                          <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            BERI NILAI:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant={currentGrade === 'BENAR' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleGradeChange(j.id, 'BENAR')}
                              className={`rounded-full h-8 ${currentGrade === 'BENAR' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50 text-green-600 border-green-200'}`}
                            >
                              <Check className="mr-1.5 h-3.5 w-3.5" />
                              Benar
                            </Button>
                            <Button
                              type="button"
                              variant={currentGrade === 'SETENGAH' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleGradeChange(j.id, 'SETENGAH')}
                              className={`rounded-full h-8 ${currentGrade === 'SETENGAH' ? 'bg-yellow-500 hover:bg-yellow-600' : 'hover:bg-yellow-50 text-yellow-600 border-yellow-200'}`}
                            >
                              <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                              Setengah Benar
                            </Button>
                            <Button
                              type="button"
                              variant={currentGrade === 'SALAH' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleGradeChange(j.id, 'SALAH')}
                              className={`rounded-full h-8 ${currentGrade === 'SALAH' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 text-red-600 border-red-200'}`}
                            >
                              <X className="mr-1.5 h-3.5 w-3.5" />
                              Salah
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
