"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2, Check, X, AlertCircle, Users } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileUploadField } from "@/components/file-upload-field"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

interface AddAsesmenFormProps {
  courseId: string
  courseTitle: string
}

interface Opsi {
  teks: string
  isBenar: boolean
}

interface Soal {
  pertanyaan: string
  gambar?: string
  bobot: number
  tipeJawaban: 'PILIHAN_GANDA' | 'ISIAN'
  opsi: Opsi[]
}

export default function AddAsesmenForm({ courseId, courseTitle }: AddAsesmenFormProps) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const [isLoading, setIsLoading] = useState(false)
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
    tipe: "KUIS",
    tipePengerjaan: "INDIVIDU",
    tgl_mulai: "",
    tgl_selesai: "",
    durasi: "",
    lampiran: "",
    antiCurang: false,
  })
  const [kelasTarget, setKelasTarget] = useState<string[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [availableKelas, setAvailableKelas] = useState<string[]>([])
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true)

  // Fetch enrollments untuk mendapatkan kelas yang ada di course
  useEffect(() => {
    const fetchEnrollments = async () => {
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

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
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

  const handleSoalChange = (index: number, field: keyof Soal, value: any) => {
    const newList = [...soalList]
    newList[index] = { ...newList[index], [field]: value }
    setSoalList(newList)
  }

  const handleSoalImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran gambar terlalu besar. Maksimal 2MB",
        variant: "destructive",
      })
      e.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "File harus berupa gambar (JPG, PNG, GIF, dll)",
        variant: "destructive",
      })
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

  const handleSoalTipeChange = (index: number, value: 'PILIHAN_GANDA' | 'ISIAN') => {
    const newList = [...soalList]
    newList[index] = {
      ...newList[index],
      tipeJawaban: value,
      opsi: value === 'ISIAN' ? [] : [
        { teks: "", isBenar: false },
        { teks: "", isBenar: false },
        { teks: "", isBenar: false },
        { teks: "", isBenar: false },
      ]
    }
    setSoalList(newList)
  }

  const handleNext = () => {
    if (!formData.nama || !formData.tipe) {
      toast({
        title: "Error",
        description: "Nama dan tipe asesmen wajib diisi",
        variant: "destructive",
      })
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
    
    if (!formData.nama || !formData.tipe) {
      toast({
        title: "Error",
        description: "Nama dan tipe asesmen wajib diisi",
        variant: "destructive",
      })
      return
    }

    // Validasi user dengan lebih detail
    if (!user) {
      console.error('User is null or undefined:', user)
      toast({
        title: "Error",
        description: "Anda belum login. Silakan login terlebih dahulu.",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    if (!user.id) {
      console.error('User ID invalid:', user)
      toast({
        title: "Error",
        description: "Session tidak valid. Silakan login ulang.",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    console.log('Creating asesmen with user:', user)

    // Validasi untuk KUIS
    if (formData.tipe === 'KUIS' && soalList.length === 0) {
      toast({
        title: "Error",
        description: "Minimal harus ada 1 soal untuk kuis",
        variant: "destructive",
      })
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
        if (soal.tipeJawaban === 'PILIHAN_GANDA') {
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

    setIsLoading(true)
    await execute(
      async () => {
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
          courseId: courseId,
          guruId: user.id,
          antiCurang: formData.tipe === 'KUIS' ? formData.antiCurang : false,
        }

        // Handle file upload for TUGAS
        if (formData.tipe === 'TUGAS' && formData.lampiran) {
          if (formData.lampiran.startsWith('data:')) {
            // Extract file type from data URL
            const matches = formData.lampiran.match(/^data:(.+?);base64,(.+)$/)
            if (matches) {
              const fileType = matches[1]
              const fileData = matches[2]
              
              // Get file size from base64 string
              const fileSize = Math.round((fileData.length * 3) / 4)
              
              bodyData.fileData = fileData
              bodyData.fileType = fileType
              bodyData.fileSize = fileSize
              bodyData.fileName = `file_${Date.now()}`
              bodyData.lampiran = null
            }
          } else {
            // It's a URL
            bodyData.lampiran = formData.lampiran
          }
        } else {
          bodyData.lampiran = null
        }

        // Tambahkan soal untuk KUIS
        if (formData.tipe === 'KUIS') {
          bodyData.soal = soalList.map(s => ({
            pertanyaan: s.pertanyaan,
            gambar: s.gambar || null,
            bobot: s.bobot,
            tipeJawaban: s.tipeJawaban,
            opsi: s.tipeJawaban === 'PILIHAN_GANDA' 
              ? s.opsi.filter(o => o.teks.trim() !== "").map(o => ({
                  teks: o.teks,
                  isBenar: o.isBenar
                }))
              : []
          }))
        }

        const response = await fetch('/api/asesmen', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
        })

        const responseData = await response.json()

        if (!response.ok) {
          throw new Error(responseData.error || responseData.details || 'Failed to create asesmen')
        }
      },
      {
        loadingMessage: "Membuat asesmen...",
        successTitle: "Berhasil!",
        successDescription: "Asesmen berhasil dibuat",
        errorTitle: "Gagal Membuat Asesmen",
        onSuccess: () => {
          setTimeout(() => {
            router.push(`/courses/${courseId}`)
            router.refresh()
          }, 1500)
        },
      }
    )
    setIsLoading(false)
  }

  // Render step pertanyaan untuk KUIS
  if (currentStep === 'questions' && formData.tipe === 'KUIS') {
    return (
      <>
        <AlertComponent />
        <ActionFeedback />
        
        <div className="space-y-6">
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipe Soal *</Label>
                      <Select
                        value={soal.tipeJawaban}
                        onValueChange={(value: 'PILIHAN_GANDA' | 'ISIAN') => handleSoalTipeChange(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe soal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PILIHAN_GANDA">Pilihan Ganda</SelectItem>
                          <SelectItem value="ISIAN">Isian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Poin *</Label>
                      <Input
                        type="number"
                        value={soal.bobot}
                        onChange={(e) => handleSoalChange(index, 'bobot', parseInt(e.target.value) || 10)}
                        placeholder="10"
                        min="1"
                      />
                    </div>
                  </div>

                  {soal.tipeJawaban === 'PILIHAN_GANDA' && (
                    <>
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
                    </>
                  )}

                  {soal.tipeJawaban === 'ISIAN' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Soal isian akan dinilai secara manual oleh guru setelah siswa mengumpulkan.
                      </AlertDescription>
                    </Alert>
                  )}
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
            disabled={isLoading || soalList.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat...
              </>
            ) : (
              'Buat Kuis'
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
      <ActionFeedback />
      
      <form onSubmit={(e) => {
        e.preventDefault()
        handleNext()
      }}>
        <Card>
          <CardHeader>
          <CardTitle>Informasi Asesmen</CardTitle>
          <CardDescription>
            {courseTitle ? `Buat asesmen baru untuk course ${courseTitle}` : 'Buat asesmen baru untuk course ini'}
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
                            id={`asesmen-kelas-${kelas}`}
                            checked={kelasTarget.includes(kelas)}
                            onCheckedChange={(checked) => handleKelasChange(kelas, checked as boolean)}
                          />
                          <Label htmlFor={`asesmen-kelas-${kelas}`} className="text-sm font-normal cursor-pointer">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tgl_mulai">Tanggal Mulai</Label>
              <DateTimePicker
                id="tgl_mulai"
                value={formData.tgl_mulai}
                onChange={(val) => setFormData({ ...formData, tgl_mulai: val })}
                placeholder="Pilih tanggal & waktu mulai"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tgl_selesai">Tanggal Selesai</Label>
              <DateTimePicker
                id="tgl_selesai"
                value={formData.tgl_selesai}
                onChange={(val) => setFormData({ ...formData, tgl_selesai: val })}
                placeholder="Pilih tanggal & waktu selesai"
              />
            </div>
          </div>

          {formData.tipe === 'TUGAS' && (
            <FileUploadField
              label="Lampiran"
              description="Upload file atau masukkan link URL"
              value={formData.lampiran}
              onChange={(value) => setFormData({ ...formData, lampiran: value })}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
            />
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/courses/${courseId}`)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membuat...
                </>
              ) : formData.tipe === 'KUIS' ? (
                'Selanjutnya'
              ) : (
                'Buat Asesmen'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
    </>
  )
}
