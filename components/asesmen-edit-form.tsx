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
import { Loader2, Plus, Trash2, Check, X, ImagePlus, Users, ArrowUp, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUploadField } from "@/components/file-upload-field"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

  const handleSoalChange = (index: number, field: keyof Soal, value: any) => {
    const newList = [...soalList]
    newList[index] = { ...newList[index], [field]: value }
    setSoalList(newList)
  }

  const handleSoalImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Max 2MB for images
    if (file.size > 2 * 1024 * 1024) {
      showError("Error", "Ukuran gambar terlalu besar. Maksimal 2MB")
      e.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      showError("Error", "File harus berupa gambar (JPG, PNG, GIF, dll)")
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const newList = [...soalList]
      newList[index] = { ...newList[index], gambar: reader.result as string }
      setSoalList(newList)
    }
    reader.readAsDataURL(file)
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
        tipePengerjaan: formData.tipe === 'TUGAS' ? formData.tipePengerjaan : null,
        tgl_mulai: toISOWithTimezone(formData.tgl_mulai),
        tgl_selesai: toISOWithTimezone(formData.tgl_selesai),
        durasi: formData.durasi ? parseInt(formData.durasi) : null,
        lampiran: formData.lampiran || null,
        courseId: formData.courseId,
        antiCurang: formData.tipe === 'KUIS' ? formData.antiCurang : false,
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
    <div className="container mx-auto p-6 space-y-6">
      <AlertComponent />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_380px] gap-6 items-start">
          {/* Left: Panel nomor soal (sticky) */}
          <div className="lg:sticky lg:top-20 space-y-4">
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
              <div className="space-y-4">
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
                          <Label>Poin *</Label>
                          <Input
                            type="number"
                            value={soal.bobot}
                            onChange={(e) => handleSoalChange(index, 'bobot', parseInt(e.target.value) || 10)}
                            min={1}
                            className="max-w-[140px]"
                          />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <Label>Pilihan Jawaban *</Label>
                          <p className="text-xs text-muted-foreground">
                            Klik tombol centang untuk menandai jawaban yang benar.
                          </p>
                          {soal.opsi.map((opsi, opsiIndex) => (
                            <div key={opsiIndex} className="flex items-center gap-2">
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
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                <Button type="button" onClick={handleAddSoal} className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Soal
                </Button>
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

        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Perubahan"
          )}
        </Button>
      </form>
    </div>
  )

}
