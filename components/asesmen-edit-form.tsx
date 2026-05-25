"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { Loader2, Plus, Trash2, Check, X, ImagePlus, Users, ArrowUp, ArrowDown, FileUp, FileDown, Type, Code } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUploadField } from "@/components/file-upload-field"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import AsesmenGroupsManagement from "@/components/asesmen-groups-management"

interface AsesmenEditFormProps {
  asesmenId: string
  courseId?: string
}

interface Opsi {
  id?: string
  teks: string
  isBenar: boolean
}

interface Soal {
  id?: string
  pertanyaan: string
  gambar?: string
  bobot: number
  tipeJawaban?: 'PILIHAN_GANDA' | 'ISIAN'
  opsi: Opsi[]
}

function isDataUrl(value?: string) {
  return typeof value === 'string' && value.startsWith('data:')
}

async function uploadPublicFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: form,
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error || 'Gagal upload file')
  if (!json?.url) throw new Error('Upload berhasil tapi URL tidak ditemukan')
  return String(json.url)
}

export function AsesmenEditForm({ asesmenId, courseId }: AsesmenEditFormProps) {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { error: showError, success: showSuccess, AlertComponent } = useAdaptiveAlert()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [soalList, setSoalList] = useState<Soal[]>([])
  const lastSoalRef = useRef<HTMLDivElement>(null)
  const [activeSoalIndex, setActiveSoalIndex] = useState(0)
  const dragFromIndexRef = useRef<number | null>(null)
  const importExcelRef = useRef<HTMLInputElement>(null)
  const [importExcelLoading, setImportExcelLoading] = useState(false)
  const [importExcelResult, setImportExcelResult] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
    tipe: "",
    tipePengerjaan: "",
    tgl_mulai: "",
    tgl_selesai: "",
    durasi: "",
    lampiran: "",
    courseId: "",
    antiCurang: false,
    acakSoal: false,
    acakJawaban: false,
    submissionComponents: [] as ("UPLOAD_FILE" | "COMPILER" | "TEXT")[],
  })
  const [kelasTarget, setKelasTarget] = useState<string[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [availableKelas, setAvailableKelas] = useState<string[]>([])
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true)
  
  // Fetch enrollments untuk mendapatkan kelas yang ada di course
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!courseId) return
      
      try {
        setIsLoadingEnrollments(true)
        const response = await fetch(`/api/courses/${courseId}/enrollments`)
        if (response.ok) {
          const data = await response.json()
          setEnrollments(data)
          
          // Extract unique kelas dari enrollments
          const kelasSet = new Set<string>()
          data.forEach((enrollment: any) => {
            if (enrollment.siswa?.kelas) {
              kelasSet.add(enrollment.siswa.kelas)
            }
          })
          setAvailableKelas(Array.from(kelasSet).sort())
        }
      } catch (error) {
        console.error('Error fetching enrollments:', error)
      } finally {
        setIsLoadingEnrollments(false)
      }
    }

    fetchEnrollments()
  }, [courseId])

  const handleKelasChange = (kelas: string, checked: boolean) => {
    if (checked) {
      setKelasTarget(prev => [...prev, kelas])
    } else {
      setKelasTarget(prev => prev.filter(k => k !== kelas))
    }
  }

  // Get student count per kelas
  const getStudentCountForKelas = (kelas: string) => {
    return enrollments.filter(enrollment => enrollment.siswa?.kelas === kelas).length
  }

  // Get total enrolled students for selected kelas
  const getTotalEnrolledStudents = () => {
    return kelasTarget.reduce((total, kelas) => {
      return total + getStudentCountForKelas(kelas)
    }, 0)
  }

  useEffect(() => {
    // tunggu auth siap supaya userId/userRole bisa dikirim ke API
    if (isAuthLoading) return
    if (!user) return
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId, isAuthLoading, user?.id, user?.role])

  const scrollToLastSoal = useCallback(() => {
    setTimeout(() => {
      lastSoalRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 60)
  }, [])

  const moveSoal = useCallback((from: number, direction: -1 | 1) => {
    setSoalList((prev) => {
      const to = from + direction
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

  const moveSoalToIndex = useCallback((from: number, to: number) => {
    setSoalList((prev) => {
      if (from === to) return prev
      if (from < 0 || from >= prev.length) return prev
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      if (!user) {
        throw new Error('Unauthenticated')
      }
      
      // Fetch asesmen data
      const query = new URLSearchParams({
        userId: user.id,
        userRole: user.role,
      })
      const asesmenRes = await fetch(`/api/asesmen/${asesmenId}?${query.toString()}`)
      const asesmenText = await asesmenRes.text()
      const asesmenData = asesmenText ? JSON.parse(asesmenText) : null
      if (!asesmenRes.ok) {
        throw new Error(asesmenData?.error || 'Failed to fetch asesmen')
      }
      
      // Fetch courses
      const coursesRes = await fetch('/api/courses')
      if (!coursesRes.ok) throw new Error('Failed to fetch courses')
      const coursesData = await coursesRes.json()
      setCourses(coursesData.courses || [])
      
      // Set form data
      const asesmen = asesmenData.asesmen
      
      // Helper: format Date ke string datetime-local (waktu lokal, bukan UTC)
      const toLocalDatetimeString = (dateStr: string) => {
        const d = new Date(dateStr)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }
      
      const tglMulaiFormatted = asesmen.tgl_mulai 
        ? toLocalDatetimeString(asesmen.tgl_mulai) 
        : ""
      const tglSelesaiFormatted = asesmen.tgl_selesai 
        ? toLocalDatetimeString(asesmen.tgl_selesai) 
        : ""
      
      setFormData({
        nama: asesmen.nama || "",
        deskripsi: asesmen.deskripsi || "",
        tipe: asesmen.tipe || "",
        tipePengerjaan: asesmen.tipePengerjaan || "",
        tgl_mulai: tglMulaiFormatted,
        tgl_selesai: tglSelesaiFormatted,
        durasi: asesmen.durasi?.toString() || "",
        lampiran: asesmen.lampiran || "",
        courseId: asesmen.courseId || "",
        antiCurang: !!asesmen.antiCurang,
        acakSoal: !!asesmen.acakSoal,
        acakJawaban: !!asesmen.acakJawaban,
        submissionComponents: Array.isArray(asesmen.submissionComponents) 
          ? asesmen.submissionComponents 
          : (asesmen.tipe === 'TUGAS' ? ['UPLOAD_FILE'] : []),
      })

      // Set kelasTarget from asesmen data
      setKelasTarget(asesmen.kelasTarget || [])

      // Load existing soal jika tipe KUIS
      if (asesmen.tipe === 'KUIS' && asesmen.soal) {
        setSoalList(asesmen.soal)
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      const message = error instanceof Error ? error.message : 'Gagal mengambil data asesmen'
      showError("Error", message === 'Unauthenticated' ? 'Silakan login ulang.' : message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSoal = () => {
    // Langsung tambahkan soal kosong baru ke list tanpa validasi
    setSoalList([...soalList, {
      pertanyaan: "",
      gambar: "",
      bobot: 10,
      tipeJawaban: 'PILIHAN_GANDA',
      opsi: [
        { teks: "", isBenar: false },
        { teks: "", isBenar: false },
        { teks: "", isBenar: false },
        { teks: "", isBenar: false },
      ]
    }])

    scrollToLastSoal()
  }

  const handleRemoveSoal = (index: number) => {
    setSoalList(soalList.filter((_, i) => i !== index))
  }

  const handleImportExcel = async (file: File) => {
    setImportExcelLoading(true)
    setImportExcelResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/asesmen/${asesmenId}/soal/import-excel`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        // Re-fetch soal list dari server agar data terupdate
        const soalRes = await fetch(`/api/asesmen/${asesmenId}/soal`)
        if (soalRes.ok) {
          const soalData = await soalRes.json()
          setSoalList(soalData.soal || [])
        }
        const hasWarnings = data.warnings && data.warnings.length > 0
        setImportExcelResult({
          message: `${data.message}${data.skipped > 0 ? ` (${data.skipped} baris dilewati)` : ''}${hasWarnings ? ` — ada ${data.warnings.length} peringatan` : ''}`,
          type: hasWarnings ? 'warning' : 'success',
        })
        scrollToLastSoal()
      } else {
        const detailMsg = data.details && data.details.length > 0
          ? `\n• ${data.details.slice(0, 5).join('\n• ')}${data.details.length > 5 ? `\n...dan ${data.details.length - 5} lainnya` : ''}`
          : ''
        setImportExcelResult({
          message: (data.error || 'Gagal mengimport') + detailMsg,
          type: 'error',
        })
      }
    } catch {
      setImportExcelResult({ message: 'Terjadi kesalahan jaringan', type: 'error' })
    } finally {
      setImportExcelLoading(false)
    }
  }

  const handleSoalChange = (index: number, field: keyof Soal, value: any) => {
    const newList = [...soalList]
    newList[index] = { ...newList[index], [field]: value }
    setSoalList(newList)
  }

  const handleSoalImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target
    const file = target.files?.[0]
    if (!file) return

    // Max 10MB (samakan dengan /api/upload)
    if (file.size > 10 * 1024 * 1024) {
      showError("Error", "Ukuran gambar terlalu besar. Maksimal 10MB")
      e.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      showError("Error", "File harus berupa gambar (JPG, PNG, WebP, AVIF, GIF, dll)")
      e.target.value = ''
      return
    }

    try {
      const url = await uploadPublicFile(file)
      const newList = [...soalList]
      newList[index] = { ...newList[index], gambar: url }
      setSoalList(newList)
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : 'Gagal upload gambar')
    } finally {
      target.value = ''
    }
  }

  const handleRemoveSoalImage = (index: number) => {
    const newList = [...soalList]
    newList[index] = { ...newList[index], gambar: "" }
    setSoalList(newList)
  }

  const handleOpsiChangeInList = (soalIndex: number, opsiIndex: number, value: string) => {
    const newList = [...soalList]
    const newOpsi = [...newList[soalIndex].opsi]
    newOpsi[opsiIndex] = { ...newOpsi[opsiIndex], teks: value }
    newList[soalIndex] = { ...newList[soalIndex], opsi: newOpsi }
    setSoalList(newList)
  }

  const handleCorrectAnswerInList = (soalIndex: number, opsiIndex: number) => {
    const newList = [...soalList]
    const newOpsi = newList[soalIndex].opsi.map((o, i) => ({
      ...o,
      isBenar: i === opsiIndex
    }))
    newList[soalIndex] = { ...newList[soalIndex], opsi: newOpsi }
    setSoalList(newList)
  }

  const handleAddOpsi = (soalIndex: number) => {
    const newList = [...soalList]
    newList[soalIndex].opsi.push({ teks: "", isBenar: false })
    setSoalList(newList)
  }

  const handleRemoveOpsi = (soalIndex: number, opsiIndex: number) => {
    const newList = [...soalList]
    newList[soalIndex].opsi = newList[soalIndex].opsi.filter((_, i) => i !== opsiIndex)
    setSoalList(newList)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!formData.nama || !formData.tipe || !formData.courseId) {
      showError("Error", "Nama, tipe, dan course wajib diisi")
      return
    }

    // Validasi untuk KUIS
    if (formData.tipe === 'KUIS' && soalList.length === 0) {
      showError("Error", "Minimal harus ada 1 soal untuk kuis")
      return
    }

    // Validasi setiap soal sebelum submit
    if (formData.tipe === 'KUIS') {
      for (let i = 0; i < soalList.length; i++) {
        const soal = soalList[i]
        if (!soal.pertanyaan.trim()) {
          showError("Error", `Soal ${i + 1}: Pertanyaan wajib diisi`)
          return
        }
        if (soal.tipeJawaban === 'PILIHAN_GANDA' || !soal.tipeJawaban) {
          const filledOpsi = soal.opsi.filter(o => o.teks.trim() !== "")
          if (filledOpsi.length < 2) {
            showError("Error", `Soal ${i + 1}: Minimal 2 pilihan jawaban harus diisi`)
            return
          }
          const hasCorrectAnswer = soal.opsi.some(o => o.isBenar)
          if (!hasCorrectAnswer) {
            showError("Error", `Soal ${i + 1}: Harus ada minimal 1 jawaban yang benar`)
            return
          }
        }
      }
    }

    setIsSaving(true)
    try {
      // Konversi datetime-local string ke ISO string agar timezone client terkirim dengan benar
      const toISOWithTimezone = (dtLocal: string) => {
        if (!dtLocal) return null
        const d = new Date(dtLocal)
        return isNaN(d.getTime()) ? null : d.toISOString()
      }

      const bodyData: any = {
        nama: formData.nama,
        deskripsi: formData.deskripsi || null,
        kelasTarget: kelasTarget,
        tipe: formData.tipe,
  tipePengerjaan: formData.tipe === 'TUGAS' ? (formData.tipePengerjaan || 'INDIVIDU') : null,
        tgl_mulai: toISOWithTimezone(formData.tgl_mulai),
        tgl_selesai: toISOWithTimezone(formData.tgl_selesai),
        durasi: formData.durasi ? parseInt(formData.durasi) : null,
        lampiran: formData.lampiran || null,
        courseId: formData.courseId,
        antiCurang: formData.tipe === 'KUIS' ? formData.antiCurang : false,
        submissionComponents: formData.tipe === 'TUGAS' ? formData.submissionComponents : [],
      }

      // Tambahkan soal untuk KUIS
      if (formData.tipe === 'KUIS') {
        bodyData.soal = soalList.map(s => ({
          pertanyaan: s.pertanyaan,
          gambar: s.gambar || null,
          bobot: s.bobot,
          tipeJawaban: s.tipeJawaban || 'PILIHAN_GANDA',
          opsi: (s.tipeJawaban === 'PILIHAN_GANDA' || !s.tipeJawaban)
            ? s.opsi.filter(o => o.teks.trim() !== "").map(o => ({
                teks: o.teks,
                isBenar: o.isBenar
              }))
            : []
        }))
      }

      const response = await fetch(`/api/asesmen/${asesmenId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      })

      if (!response.ok) {
        throw new Error('Failed to update asesmen')
      }

      await showSuccess("Berhasil!", "Asesmen berhasil diperbarui")

      // Redirect kembali ke course detail
      if (courseId) {
        router.push(`/courses/${courseId}`)
      } else {
        router.push('/asesmen')
      }
      router.refresh()
    } catch (error) {
      console.error('Error updating asesmen:', error)
      showError("Error", "Gagal memperbarui asesmen")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // UI disamakan dengan Add Asesmen (single page, 3 kolom)
  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <AlertComponent />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr_380px] gap-6 items-start">
          {/* Left: Panel nomor soal (sticky) */}
          <div className="lg:sticky lg:top-20 space-y-4">
            {/* Judul & Deskripsi Card (Moved to Left) */}
            <Card className="ios-glass-card border-border/30 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Judul</CardTitle>
                <CardDescription>Judul dan deskripsi asesmen.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-3">
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Judul asesmen (contoh: Kuis 1)"
                  className="text-lg sm:text-xl font-semibold h-11"
                />
                <Textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Deskripsi (opsional)"
                  rows={2}
                  className="min-h-[64px]"
                />
              </CardContent>
            </Card>

            {formData.tipe === "KUIS" && (
              <Card className="ios-glass-card border-border/30 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Panel Soal</CardTitle>
                  <CardDescription>Drag untuk ubah urutan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {soalList.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      draggable
                      onClick={() => {
                        setActiveSoalIndex(i)
                        document.getElementById(`soal-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }}
                      onDragStart={() => {
                        dragFromIndexRef.current = i
                      }}
                      onDragOver={(ev) => ev.preventDefault()}
                      onDrop={(ev) => {
                        ev.preventDefault()
                        const from = dragFromIndexRef.current
                        dragFromIndexRef.current = null
                        if (from === null) return
                        moveSoalToIndex(from, i)
                        setActiveSoalIndex(i)
                        setTimeout(() => {
                          document.getElementById(`soal-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }, 50)
                      }}
                      className={
                        "w-full flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition " +
                        (i === activeSoalIndex
                          ? "bg-primary/10 border-primary/30 text-foreground"
                          : "bg-background/30 hover:bg-background/50 border-border/30 text-muted-foreground")
                      }
                      aria-label={`Soal ${i + 1}`}
                      title="Drag untuk pindah"
                    >
                      <span className="font-medium">Soal {i + 1}</span>
                      <span className="text-xs">↕</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Middle: Builder utama */}
          <div className="space-y-6">
            {formData.tipe === "KUIS" && (
              <div className="space-y-4">
                {/* Import Excel Card — Diletakkan di atas daftar soal */}
                <Card className="ios-glass-card border-border/30 rounded-2xl border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-sm">Import Soal dari Excel</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Download template, isi soal &amp; jawaban, lalu import sekaligus
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* Download Template */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const a = document.createElement('a')
                            a.href = `/api/asesmen/${asesmenId}/soal/template-excel`
                            a.download = 'Template_Soal_Kuis.xlsx'
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                          }}
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Download Template
                        </Button>

                        {/* Import Excel */}
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          disabled={importExcelLoading}
                          onClick={() => importExcelRef.current?.click()}
                        >
                          {importExcelLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <FileUp className="mr-2 h-4 w-4" />
                          )}
                          {importExcelLoading ? 'Mengimport...' : 'Import Excel'}
                        </Button>

                        {/* Hidden file input */}
                        <input
                          ref={importExcelRef}
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          onChange={async (e) => {
                            const target = e.target
                            const file = target.files?.[0]
                            if (!file) return
                            target.value = ''
                            await handleImportExcel(file)
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  {importExcelResult && (
                    <CardContent className="pt-0">
                      <Alert
                        variant={importExcelResult.type === 'error' ? 'destructive' : 'default'}
                        className={
                          importExcelResult.type === 'success'
                            ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : importExcelResult.type === 'warning'
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                            : ''
                        }
                      >
                        <AlertDescription className="whitespace-pre-wrap text-sm">
                          {importExcelResult.message}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  )}
                </Card>

                {soalList.map((soal, index) => (
                  <div
                    key={index}
                    id={`soal-${index}`}
                    ref={index === soalList.length - 1 ? lastSoalRef : undefined}
                  >
                    <Card className="ios-glass-card border-border/30 rounded-2xl">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="rounded-lg">Soal {index + 1}</Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSoal(index, -1)}
                              disabled={index === 0}
                              aria-label="Pindah ke atas"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSoal(index, 1)}
                              disabled={index === soalList.length - 1}
                              aria-label="Pindah ke bawah"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSoal(index)}
                              className="text-muted-foreground"
                              aria-label="Hapus soal"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Pertanyaan *</Label>
                          <Textarea
                            value={soal.pertanyaan}
                            onChange={(e) => handleSoalChange(index, 'pertanyaan', e.target.value)}
                            placeholder="Tulis pertanyaan/soal di sini..."
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tipe Jawaban *</Label>
                          <Select
                            value={soal.tipeJawaban || 'PILIHAN_GANDA'}
                            onValueChange={(v) => handleSoalChange(index, 'tipeJawaban', v)}
                          >
                            <SelectTrigger className="max-w-[200px]">
                              <SelectValue placeholder="Pilih tipe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PILIHAN_GANDA">Pilihan Ganda</SelectItem>
                              <SelectItem value="ISIAN">Essay / Isian</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Gambar Soal (opsional)</Label>
                          <Input
                            value={soal.gambar || ""}
                            onChange={(e) => handleSoalChange(index, 'gambar', e.target.value)}
                            placeholder="Tempel link gambar (https://...)"
                          />

                          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <Input type="file" accept="image/*" onChange={(e) => void handleSoalImageUpload(index, e)} />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleRemoveSoalImage(index)}
                              disabled={!soal.gambar}
                            >
                              Hapus gambar
                            </Button>
                          </div>

                          {!!soal.gambar && isDataUrl(soal.gambar) && (
                            <p className="text-xs text-destructive">
                              Format data URL/base64 tidak didukung. Gunakan upload atau URL publik.
                            </p>
                          )}

                          {!!soal.gambar && !isDataUrl(soal.gambar) && (
                            <div className="rounded-xl border p-3 bg-background/30">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={soal.gambar}
                                alt={`Gambar soal ${index + 1}`}
                                className="max-h-60 w-auto rounded-lg"
                                onError={(e) => {
                                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Bisa tempel URL atau upload gambar. Disimpan sebagai URL (maks 255 karakter).
                          </p>
                        </div>

                        {/* Poin dihitung otomatis */}

                        <Separator />

                        <div className="space-y-3">
                          {soal.tipeJawaban === 'ISIAN' ? (
                            <div className="rounded-xl border p-4 bg-muted/30 border-dashed">
                              <p className="text-sm font-medium">Tipe Essay</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Jawaban siswa akan berupa teks bebas. Penilaian dilakukan secara manual oleh guru setelah kuis dikumpulkan.
                              </p>
                            </div>
                          ) : (
                            <>
                              <Label>Pilihan Jawaban *</Label>
                              <p className="text-xs text-muted-foreground">
                                Klik tombol centang untuk menandai jawaban yang benar.
                              </p>
                              {soal.opsi.map((opsi, opsiIndex) => (
                                <div key={opsiIndex} className="flex items-center gap-2 group">
                                  <Button
                                    type="button"
                                    variant={opsi.isBenar ? "default" : "outline"}
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => handleCorrectAnswerInList(index, opsiIndex)}
                                    aria-label={`Tandai jawaban benar opsi ${opsiIndex + 1}`}
                                  >
                                    {opsi.isBenar ? <Check className="h-4 w-4" /> : <span className="h-4 w-4" />}
                                  </Button>
                                  <Input
                                    value={opsi.teks}
                                    onChange={(e) => handleOpsiChangeInList(index, opsiIndex, e.target.value)}
                                    placeholder={`Pilihan ${opsiIndex + 1}`}
                                    className={opsi.isBenar ? "border-green-500" : ""}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveOpsi(index, opsiIndex)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                    disabled={soal.opsi.length <= 2}
                                    aria-label="Hapus pilihan"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="w-fit mx-auto flex mt-2 px-6"
                                onClick={() => handleAddOpsi(index)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Pilihan
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                <div className="flex justify-center py-2">
                  <Button type="button" onClick={handleAddSoal} className="w-fit px-10" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Soal
                  </Button>
                </div>
              </div>
            )}

            {formData.tipe === 'TUGAS' && (
              <div className="space-y-6">
                <Card className="ios-glass-card border-border/30 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Mode Pengerjaan
                    </CardTitle>
                    <CardDescription>Pilih apakah tugas dikerjakan individu atau per kelompok.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipe Pengerjaan</Label>
                      <Select
                        value={formData.tipePengerjaan || 'INDIVIDU'}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            tipePengerjaan: v as any,
                          }))
                        }
                      >
                        <SelectTrigger className="max-w-[260px]">
                          <SelectValue placeholder="Pilih tipe pengerjaan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INDIVIDU">Individu</SelectItem>
                          <SelectItem value="KELOMPOK">Kelompok</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Jika dipilih <b>Kelompok</b>, siswa akan submit sebagai kelompok dan guru bisa mengatur anggota kelompok di bawah.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {formData.tipePengerjaan === 'KELOMPOK' && (
                  <Card className="ios-glass-card border-border/30 rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Manajemen Kelompok</CardTitle>
                      <CardDescription>Buat, ubah, dan atur anggota kelompok untuk tugas ini.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AsesmenGroupsManagement asesmenId={asesmenId} courseId={courseId || formData.courseId} />
                    </CardContent>
                  </Card>
                )}

                <Card className="ios-glass-card border-border/30 rounded-2xl overflow-hidden shadow-xl">
                  <CardHeader className="bg-muted/30 border-b border-border/30 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      Komponen Pengumpulan
                    </CardTitle>
                    <CardDescription>
                      Tentukan apa saja yang harus dikumpulkan oleh siswa.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[400px]">
                      {/* Toolbox */}
                      <div className="p-4 bg-muted/20 border-r border-border/30 space-y-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                          Toolbox
                        </div>
                        <div className="space-y-2">
                          {[
                            { id: "UPLOAD_FILE", label: "Upload File", icon: FileUp, desc: "Siswa mengunggah file atau link" },
                            { id: "COMPILER", label: "Python Compiler", icon: Code, desc: "Editor kode Python langsung" },
                            { id: "TEXT", label: "Input Teks", icon: Type, desc: "Kolom teks untuk jawaban/laporan" },
                          ].map((item) => {
                            const isAdded = formData.submissionComponents.includes(item.id as any)
                            return (
                              <button
                                key={item.id}
                                type="button"
                                disabled={isAdded}
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  submissionComponents: [...prev.submissionComponents, item.id as any]
                                }))}
                                className={`w-full text-left p-3 rounded-xl border transition-all group ${
                                  isAdded 
                                    ? "bg-muted/50 border-border/50 opacity-50 cursor-not-allowed" 
                                    : "bg-background border-border/50 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${isAdded ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"}`}>
                                    <item.icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold">{item.label}</p>
                                    <p className="text-[9px] text-muted-foreground line-clamp-1">{item.desc}</p>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Canvas */}
                      <div className="p-6 bg-background/50 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Canvas Pengumpulan ({formData.submissionComponents.length})
                          </div>
                          {formData.submissionComponents.length === 0 && (
                            <Badge variant="destructive" className="animate-pulse">Kosong</Badge>
                          )}
                        </div>

                        {formData.submissionComponents.length === 0 ? (
                          <div className="h-[300px] border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-muted/5">
                            <div className="p-4 rounded-full bg-muted/50 mb-4">
                              <Plus className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Belum ada komponen</p>
                            <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
                              Pilih komponen dari toolbox di sebelah kiri untuk mulai membangun form pengumpulan.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {formData.submissionComponents.map((compId, idx) => {
                              const config = {
                                UPLOAD_FILE: { label: "Upload File", icon: FileUp, color: "blue" },
                                COMPILER: { label: "Python Compiler", icon: Code, color: "emerald" },
                                TEXT: { label: "Input Teks", icon: Type, color: "purple" },
                              }[compId] || { label: compId, icon: FileUp, color: "gray" }

                              return (
                                <div 
                                  key={compId}
                                  className="flex items-center gap-4 p-4 bg-background border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                                >
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                    {idx + 1}
                                  </div>
                                  <div className={`p-2.5 rounded-xl bg-${config.color}-500/10 text-${config.color}-500`}>
                                    <config.icon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-bold">{config.label}</p>
                                    <p className="text-[10px] text-muted-foreground italic">Komponen ini akan muncul sebagai tab di halaman siswa.</p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setFormData(prev => ({
                                      ...prev,
                                      submissionComponents: prev.submissionComponents.filter(id => id !== compId)
                                    }))}
                                    className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all rounded-full"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right: Settings sticky */}
          <div className="lg:sticky lg:top-20 space-y-4">
            <Card className="ios-glass-card border-border/30 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Informasi</CardTitle>
                <CardDescription>Pengaturan tanggal, durasi, kelas target, dan opsi lainnya.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.tipe === 'KUIS' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <Checkbox
                            checked={formData.antiCurang}
                            onCheckedChange={(v) => setFormData({ ...formData, antiCurang: Boolean(v) })}
                          />
                          <span className="text-sm">Anti Curang</span>
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                              aria-label="Info Anti Curang"
                            >
                              Info
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-80">
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Anti Curang</div>
                              <p className="text-xs text-muted-foreground">
                                Jika diaktifkan, siswa akan mendapat peringatan saat meninggalkan tab/jendela kuis.
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <Checkbox
                            checked={formData.acakSoal}
                            onCheckedChange={(v) => setFormData({ ...formData, acakSoal: Boolean(v) })}
                          />
                          <span className="text-sm">Acak Soal</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <Checkbox
                            checked={formData.acakJawaban}
                            onCheckedChange={(v) => setFormData({ ...formData, acakJawaban: Boolean(v) })}
                          />
                          <span className="text-sm">Acak Jawaban</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tglMulai">Tanggal Mulai (opsional)</Label>
                    <Input
                      id="tglMulai"
                      type="datetime-local"
                      value={formData.tgl_mulai}
                      onChange={(e) => setFormData({ ...formData, tgl_mulai: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tglSelesai">Tanggal Selesai (opsional)</Label>
                    <Input
                      id="tglSelesai"
                      type="datetime-local"
                      value={formData.tgl_selesai}
                      onChange={(e) => setFormData({ ...formData, tgl_selesai: e.target.value })}
                    />
                  </div>
                </div>

                {formData.tipe === "KUIS" && (
                  <div className="space-y-2">
                    <Label htmlFor="durasi">Durasi (menit, opsional)</Label>
                    <Input
                      id="durasi"
                      type="number"
                      min={0}
                      value={formData.durasi}
                      onChange={(e) => setFormData({ ...formData, durasi: e.target.value })}
                    />
                  </div>
                )}

                {/* Enrollment Kelas (reuse existing UI) */}
                <div className="space-y-2">
                  <Label>Enrollment Kelas</Label>
                  <p className="text-xs text-muted-foreground">
                    Pilih kelas yang dapat mengakses asesmen ini. Kosongkan untuk semua siswa.
                  </p>
                  {isLoadingEnrollments ? (
                    <div className="text-sm text-muted-foreground">Memuat data enrollment...</div>
                  ) : availableKelas.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {availableKelas.map((kelas) => (
                        <label key={kelas} className="flex items-center justify-between gap-2 rounded-lg border p-3 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`edit-asesmen-kelas-${kelas}`}
                              checked={kelasTarget.includes(kelas)}
                              onCheckedChange={(checked) => handleKelasChange(kelas, checked as boolean)}
                            />
                            <span className="text-sm">{kelas}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs px-2 py-0">
                            {getStudentCountForKelas(kelas)} siswa
                          </Badge>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Belum ada siswa yang terdaftar di course ini.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="min-w-[200px]" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </div>
      </form>
    </div>
  )

}
