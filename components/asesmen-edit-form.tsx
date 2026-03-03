"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
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
import { Loader2, Plus, Trash2, Check, X, ImagePlus, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUploadField } from "@/components/file-upload-field"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Switch } from "@/components/ui/switch"

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
  const { error: showError, success: showSuccess, AlertComponent } = useAdaptiveAlert()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState<'basic' | 'questions'>('basic')
  const [soalList, setSoalList] = useState<Soal[]>([])
  const [currentSoal, setCurrentSoal] = useState<Soal>({
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
  })
  const lastSoalRef = useRef<HTMLDivElement>(null)
  
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
    fetchData()
  }, [asesmenId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch asesmen data
      const asesmenRes = await fetch(`/api/asesmen/${asesmenId}`)
      if (!asesmenRes.ok) throw new Error('Failed to fetch asesmen')
      const asesmenData = await asesmenRes.json()
      
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
      })

      // Set kelasTarget from asesmen data
      setKelasTarget(asesmen.kelasTarget || [])

      // Load existing soal jika tipe KUIS
      if (asesmen.tipe === 'KUIS' && asesmen.soal) {
        setSoalList(asesmen.soal)
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      showError("Error", "Gagal mengambil data asesmen")
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

    // Scroll ke soal baru setelah render
    setTimeout(() => {
      lastSoalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
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

  const handleOpsiChange = (index: number, value: string) => {
    const newOpsi = [...currentSoal.opsi]
    newOpsi[index].teks = value
    setCurrentSoal({ ...currentSoal, opsi: newOpsi })
  }

  const handleCorrectAnswerChange = (index: number) => {
    const newOpsi = currentSoal.opsi.map((o, i) => ({
      ...o,
      isBenar: i === index
    }))
    setCurrentSoal({ ...currentSoal, opsi: newOpsi })
  }

  const handleNext = () => {
    if (!formData.nama || !formData.tipe || !formData.courseId) {
      showError("Error", "Nama, tipe, dan course wajib diisi")
      return
    }

    if (formData.tipe === 'KUIS') {
      setCurrentStep('questions')
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    setCurrentStep('basic')
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

  // Render step pertanyaan untuk KUIS
  if (currentStep === 'questions' && formData.tipe === 'KUIS') {
    return (
      <>
        <AlertComponent />
        <div className="space-y-6">
        {/* Daftar Soal - semua bisa diedit inline */}
        {soalList.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Daftar Soal ({soalList.length})</h3>
            {soalList.map((soal, index) => (
              <Card key={index} ref={index === soalList.length - 1 ? lastSoalRef : undefined}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Soal {index + 1}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSoal(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pertanyaan *</Label>
                    <Textarea
                      value={soal.pertanyaan}
                      onChange={(e) => handleSoalChange(index, 'pertanyaan', e.target.value)}
                      placeholder="Masukkan pertanyaan..."
                      rows={3}
                    />
                  </div>

                  {/* Upload gambar opsional */}
                  <div className="space-y-2">
                    <Label>Gambar (Opsional)</Label>
                    {soal.gambar ? (
                      <div className="relative inline-block">
                        <img
                          src={soal.gambar}
                          alt={`Gambar soal ${index + 1}`}
                          className="max-h-48 rounded-lg border object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => handleRemoveSoalImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSoalImageUpload(index, e)}
                          className="max-w-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Maks 2MB. Format: JPG, PNG, GIF
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Poin *</Label>
                    <Input
                      type="number"
                      value={soal.bobot}
                      onChange={(e) => handleSoalChange(index, 'bobot', parseInt(e.target.value) || 10)}
                      placeholder="10"
                      min="1"
                      className="max-w-[120px]"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Pilihan Jawaban *</Label>
                    <p className="text-sm text-muted-foreground">
                      Klik tombol centang untuk menandai jawaban yang benar
                    </p>
                    {soal.opsi.map((opsi, opsiIndex) => (
                      <div key={opsiIndex} className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={opsi.isBenar ? "default" : "outline"}
                          size="sm"
                          className="shrink-0"
                          onClick={() => handleCorrectAnswerInList(index, opsiIndex)}
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
            ))}
          </div>
        )}

        {/* Tombol tambah soal baru */}
        <Button
          type="button"
          onClick={handleAddSoal}
          className="w-full"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Soal
        </Button>

        {/* Tombol navigasi */}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSaving || soalList.length === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Kuis'
            )}
          </Button>
        </div>
      </div>
      </>
    )
  }

  // Render form basic info
  return (
    <>
      <AlertComponent />
      <form onSubmit={(e) => {
        e.preventDefault()
        handleNext()
      }}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Asesmen</CardTitle>
          <CardDescription>
            Perbarui informasi asesmen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Asesmen *</Label>
            <Input
              id="nama"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Masukkan nama asesmen"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Masukkan deskripsi asesmen"
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label>Enrollment Kelas</Label>
            <p className="text-sm text-muted-foreground">
              Pilih kelas yang dapat mengakses asesmen ini berdasarkan siswa yang terdaftar di course. Kosongkan untuk semua siswa.
            </p>
            
            {isLoadingEnrollments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Memuat data enrollment...</span>
              </div>
            ) : availableKelas.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableKelas.map((kelas) => {
                    const studentCount = getStudentCountForKelas(kelas)
                    return (
                      <div key={kelas} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-asesmen-kelas-${kelas}`}
                            checked={kelasTarget.includes(kelas)}
                            onCheckedChange={(checked) => handleKelasChange(kelas, checked as boolean)}
                          />
                          <Label htmlFor={`edit-asesmen-kelas-${kelas}`} className="text-sm font-normal cursor-pointer">
                            {kelas}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          {kelasTarget.includes(kelas) && (
                            <Badge variant="default" className="text-xs px-2 py-0">
                              Enrolled
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs px-2 py-0">
                            {studentCount} siswa
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {kelasTarget.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {kelasTarget.map((kelas) => (
                        <Badge key={kelas} variant="secondary" className="text-xs">
                          {kelas} ({getStudentCountForKelas(kelas)} siswa)
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-md">
                      📊 Total: {kelasTarget.length} kelas dipilih • {getTotalEnrolledStudents()} siswa akan mendapat akses
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada siswa yang terdaftar di course ini</p>
                <p className="text-xs">Tambahkan siswa terlebih dahulu untuk menggunakan enrollment kelas</p>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipe">Tipe *</Label>
              <Select
                value={formData.tipe}
                onValueChange={(value) => setFormData({ ...formData, tipe: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KUIS">Kuis</SelectItem>
                  <SelectItem value="TUGAS">Tugas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipe === 'TUGAS' && (
              <div className="space-y-2">
                <Label htmlFor="tipePengerjaan">Tipe Pengerjaan</Label>
                <Select
                  value={formData.tipePengerjaan}
                  onValueChange={(value) => setFormData({ ...formData, tipePengerjaan: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe pengerjaan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDU">Individu</SelectItem>
                    <SelectItem value="KELOMPOK">Kelompok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.tipe === 'KUIS' && (
              <div className="space-y-2">
                <Label htmlFor="durasi">Durasi (menit)</Label>
                <Input
                  id="durasi"
                  type="number"
                  value={formData.durasi}
                  onChange={(e) => setFormData({ ...formData, durasi: e.target.value })}
                  placeholder="Masukkan durasi dalam menit"
                  min="1"
                />
              </div>
            )}
          </div>

          {/* Anti-Curang Toggle - hanya untuk KUIS */}
          {formData.tipe === 'KUIS' && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="antiCurang" className="text-base font-medium">
                  Mode Anti-Curang
                </Label>
                <p className="text-sm text-muted-foreground">
                  Jika diaktifkan, siswa akan mendapat peringatan saat meninggalkan jendela kuis. 
                  Kuis akan otomatis dikumpulkan jika siswa tidak kembali dalam 30 detik.
                  Jika pelanggaran lebih dari 10 kali, kuis akan langsung dikumpulkan secara otomatis.
                </p>
              </div>
              <Switch
                id="antiCurang"
                checked={formData.antiCurang}
                onCheckedChange={(checked) => setFormData({ ...formData, antiCurang: checked })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="courseId">Course *</Label>
            <Select
              value={formData.courseId}
              onValueChange={(value) => setFormData({ ...formData, courseId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.judul}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tgl_mulai">Tanggal Mulai</Label>
              <DateTimePicker
                id="tgl_mulai"
                value={formData.tgl_mulai}
                onChange={(val) => {
                  console.log('tgl_mulai onChange:', val)
                  setFormData({ ...formData, tgl_mulai: val })
                }}
              />
              <p className="text-xs text-muted-foreground">
                Current: {formData.tgl_mulai || 'Not set'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tgl_selesai">Tanggal Selesai</Label>
              <DateTimePicker
                id="tgl_selesai"
                value={formData.tgl_selesai}
                onChange={(val) => {
                  console.log('tgl_selesai onChange:', val)
                  setFormData({ ...formData, tgl_selesai: val })
                }}
              />
              <p className="text-xs text-muted-foreground">
                Current: {formData.tgl_selesai || 'Not set'}
              </p>
            </div>
          </div>

          <FileUploadField
            label="Lampiran"
            description="Upload file atau masukkan link URL"
            value={formData.lampiran}
            onChange={(value) => setFormData({ ...formData, lampiran: value })}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
          />

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : formData.tipe === 'KUIS' ? (
                'Selanjutnya'
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
    </>
  )
}
