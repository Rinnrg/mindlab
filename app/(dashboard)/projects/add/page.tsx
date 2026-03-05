"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useAutoTranslate } from "            throw new Error(data.error || t("Gagal membuat PBL"))
          }
        },
        {
          loadingMessage: t("Membuat PBL..."),
          successTitle: t("Berhasil!"),
          successDescription: t("PBL berhasil dibuat"),uto-translate-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { FileUploadField } from "@/components/file-upload-field"
import { DatePicker } from "@/components/ui/date-time-picker"
import { Plus, GraduationCap, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { AnimateIn } from "@/components/ui/animate-in"
import { useAsyncAction } from "@/hooks/use-async-action"
import { SINTAKS_MAP, SINTAKS_KEYS, SintaksKey } from "@/lib/constants/project"

interface ClassInfo {
  kelas: string
  total: number
  studentIds: string[]
}

export default function AddProjectPage() {
  const { user } = useAuth()
  const { t } = useAutoTranslate()
  const router = useRouter()
  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()

  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    tgl_mulai: "",
    tgl_selesai: "",
    lampiran: "",
    sintaks: [] as SintaksKey[]
  })

  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [classData, setClassData] = useState<ClassInfo[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSintaksChange = (sintaksKey: SintaksKey, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sintaks: checked 
        ? [...prev.sintaks, sintaksKey]
        : prev.sintaks.filter(s => s !== sintaksKey)
    }))
  }

  const handleFileUpload = (url: string | null) => {
    setFormData(prev => ({
      ...prev,
      lampiran: url || ""
    }))
  }

  // Fetch class data for enrollment
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true)
        const response = await fetch("/api/users?role=SISWA")
        if (!response.ok) return
        const data = await response.json()
        const students = data.users || data || []

        // Group by class
        const classMap: Record<string, ClassInfo> = {}
        for (const student of students) {
          const kelas = student.kelas
          if (!kelas) continue
          if (!classMap[kelas]) {
            classMap[kelas] = { kelas, total: 0, studentIds: [] }
          }
          classMap[kelas].total++
          classMap[kelas].studentIds.push(student.id)
        }

        const sorted = Object.values(classMap).sort((a, b) => a.kelas.localeCompare(b.kelas))
        setClassData(sorted)
      } catch (error) {
        console.error("Error fetching classes:", error)
      } finally {
        setLoadingClasses(false)
      }
    }

    fetchClasses()
  }, [])

  const handleToggleClass = (kelas: string) => {
    setSelectedClasses(prev =>
      prev.includes(kelas)
        ? prev.filter(k => k !== kelas)
        : [...prev, kelas]
    )
  }

  const handleSelectAllClasses = () => {
    if (selectedClasses.length === classData.length) {
      setSelectedClasses([])
    } else {
      setSelectedClasses(classData.map(c => c.kelas))
    }
  }

  const totalSelectedStudents = classData
    .filter(c => selectedClasses.includes(c.kelas))
    .reduce((sum, c) => sum + c.total, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      showError(t("Error"), t("User tidak ditemukan"))
      return
    }

    // Validation
    if (!formData.judul.trim()) {
      showError(t("Validasi"), t("Judul PBL harus diisi"))
      return
    }

    if (!formData.deskripsi.trim()) {
      showError(t("Validasi"), t("Deskripsi PBL harus diisi"))
      return
    }

    if (!formData.tgl_mulai) {
      showError(t("Validasi"), t("Tanggal mulai harus diisi"))
      return
    }

    if (!formData.tgl_selesai) {
      showError(t("Validasi"), t("Tanggal selesai harus diisi"))
      return
    }

    if (formData.sintaks.length === 0) {
      showError(t("Validasi"), t("Pilih minimal satu tahapan sintaks"))
      return
    }

    if (new Date(formData.tgl_mulai) >= new Date(formData.tgl_selesai)) {
      showError(t("Validasi"), t("Tanggal selesai harus lebih besar dari tanggal mulai"))
      return
    }

    try {
      setIsSubmitting(true)
      
      await execute(
        async () => {
          const response = await fetch("/api/proyek", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...formData,
              guruId: user.id,
              selectedClasses: selectedClasses.length > 0 ? selectedClasses : undefined,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || t("Gagal membuat PBL"))
          }
        },
        {
          loadingMessage: t("Membuat PBL..."),
          successTitle: t("Berhasil"),
          successDescription: t("PBL berhasil dibuat"),
          errorTitle: t("Gagal"),
          onSuccess: () => {
            setTimeout(() => {
              router.push("/projects")
              router.refresh()
            }, 1500)
          },
        }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div className="w-full">
      <AlertComponent />
      <ActionFeedback />
      
      {/* Header */}
      <AnimateIn>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t("Buat PBL Baru")}</h1>
            <p className="text-sm text-muted-foreground mt-1 sm:text-base">
              {t("Buat project based learning untuk siswa")}
            </p>
          </div>
        </div>
      </AnimateIn>

      <AnimateIn stagger={1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t("Detail PBL")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Judul Masalah */}
              <div className="space-y-2">
                <Label htmlFor="judul" className="text-sm font-medium">
                  {t("Judul Masalah")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="judul"
                  name="judul"
                  type="text"
                  placeholder={t("Masukkan judul masalah...")}
                  value={formData.judul}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-2">
                <Label htmlFor="deskripsi" className="text-sm font-medium">
                  {t("Deskripsi")} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="deskripsi"
                  name="deskripsi"
                  placeholder={t("Jelaskan tujuan dan detail masalah...")}
                  value={formData.deskripsi}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full resize-none"
                />
              </div>

              {/* Tanggal */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tgl_mulai" className="text-sm font-medium">
                    {t("Tanggal Mulai")} <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    id="tgl_mulai"
                    name="tgl_mulai"
                    value={formData.tgl_mulai}
                    onChange={(val) => setFormData(prev => ({ ...prev, tgl_mulai: val }))}
                    min={minDate}
                    required
                    placeholder={t("Pilih tanggal mulai")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tgl_selesai" className="text-sm font-medium">
                    {t("Tanggal Selesai")} <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    id="tgl_selesai"
                    name="tgl_selesai"
                    value={formData.tgl_selesai}
                    onChange={(val) => setFormData(prev => ({ ...prev, tgl_selesai: val }))}
                    min={formData.tgl_mulai || minDate}
                    required
                    placeholder={t("Pilih tanggal selesai")}
                  />
                </div>
              </div>

              {/* Tahapan Sintaks */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  {t("Tahapan Sintaks")} <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("Pilih tahapan-tahapan masalah yang akan dijalankan")}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SINTAKS_KEYS.map((sintaksKey) => {
                    const sintaksInfo = SINTAKS_MAP[sintaksKey]
                    return (
                      <div key={sintaksKey} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={sintaksKey}
                          checked={formData.sintaks.includes(sintaksKey)}
                          onCheckedChange={(checked) => handleSintaksChange(sintaksKey, checked === true)}
                          className="mt-1"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={sintaksKey}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                          >
                            <span className="text-base">{sintaksInfo.icon}</span>
                            {t(sintaksInfo.title)}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {t(sintaksInfo.description)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("Lampiran")} <span className="text-muted-foreground">({t("Opsional")})</span>
                </Label>
                <FileUploadField
                  onFileUpload={handleFileUpload}
                  currentFile={formData.lampiran}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
                  maxSizeMB={10}
                  placeholder={t("Upload file pendukung masalah")}
                />
              </div>

              {/* Enrollment - Pilih Kelas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      {t("Enrollment Siswa")} <span className="text-muted-foreground">({t("Opsional")})</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("Pilih kelas untuk mendaftarkan siswa ke dalam masalah ini")}
                    </p>
                  </div>
                  {totalSelectedStudents > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {totalSelectedStudents} {t("siswa")}
                    </Badge>
                  )}
                </div>

                {loadingClasses ? (
                  <div className="flex items-center justify-center py-8 border rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">{t("Memuat data kelas...")}</span>
                  </div>
                ) : classData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 border rounded-lg text-center">
                    <GraduationCap className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">{t("Tidak ada kelas yang tersedia")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Select All */}
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id="select-all-classes"
                        checked={selectedClasses.length === classData.length && classData.length > 0}
                        onCheckedChange={handleSelectAllClasses}
                      />
                      <label
                        htmlFor="select-all-classes"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {t("Pilih Semua")} ({classData.length} {t("kelas")})
                      </label>
                    </div>

                    {/* Class List */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {classData.map((cls) => {
                        const isChecked = selectedClasses.includes(cls.kelas)
                        return (
                          <div
                            key={cls.kelas}
                            className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
                              isChecked
                                ? "bg-primary/5 border-primary/30"
                                : "hover:bg-accent/50"
                            }`}
                          >
                            <Checkbox
                              id={`class-${cls.kelas}`}
                              checked={isChecked}
                              onCheckedChange={() => handleToggleClass(cls.kelas)}
                            />
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                              <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            <label
                              htmlFor={`class-${cls.kelas}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">{cls.kelas}</p>
                                <Badge variant="secondary" className="text-xs">
                                  {cls.total} {t("siswa")}
                                </Badge>
                              </div>
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                <Link href="/projects">
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    {t("Batal")}
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? t("Menyimpan...") : t("Buat Masalah")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </AnimateIn>
    </div>
  )
}
