"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUploadField } from "@/components/file-upload-field"
import { DatePicker } from "@/components/ui/date-time-picker"
import { Edit } from "lucide-react"
import Link from "next/link"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { AnimateIn } from "@/components/ui/animate-in"
import { useAsyncAction } from "@/hooks/use-async-action"
import { SINTAKS_MAP, SINTAKS_KEYS, SintaksKey } from "@/lib/constants/project"

interface Proyek {
  id: string
  judul: string
  deskripsi: string
  tgl_mulai: string
  tgl_selesai: string
  lampiran?: string
  sintaks: string[]
  guru: {
    id: string
    nama: string
    email: string
  }
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const { user } = useAuth()
  const { t } = useAutoTranslate()
  const router = useRouter()
  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()

  const [proyek, setProyek] = useState<Proyek | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    tgl_mulai: "",
    tgl_selesai: "",
    lampiran: "",
    sintaks: [] as SintaksKey[]
  })

  useEffect(() => {
    const loadProyek = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/proyek/${projectId}`)
        const data = await response.json()

        if (response.ok) {
          const proyekData = data.proyek
          setProyek(proyekData)
          setFormData({
            judul: proyekData.judul,
            deskripsi: proyekData.deskripsi,
            tgl_mulai: new Date(proyekData.tgl_mulai).toISOString().split('T')[0],
            tgl_selesai: new Date(proyekData.tgl_selesai).toISOString().split('T')[0],
            lampiran: proyekData.lampiran || "",
            sintaks: proyekData.sintaks || []
          })
        } else {
          showError(t("Gagal"), data.error || t("Gagal memuat data proyek"))
          router.push("/projects")
        }
      } catch (error) {
        console.error("Error loading proyek:", error)
        showError(t("Error"), t("Terjadi kesalahan saat memuat data"))
        router.push("/projects")
      } finally {
        setLoading(false)
      }
    }

    loadProyek()
  }, [projectId, router, showError, t])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.judul.trim()) {
      showError(t("Validasi"), t("Judul proyek harus diisi"))
      return
    }

    if (!formData.deskripsi.trim()) {
      showError(t("Validasi"), t("Deskripsi proyek harus diisi"))
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
          const response = await fetch(`/api/proyek/${projectId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || t("Gagal mengupdate proyek"))
          }
        },
        {
          loadingMessage: t("Menyimpan perubahan..."),
          successTitle: t("Berhasil"),
          successDescription: t("Proyek berhasil diupdate"),
          errorTitle: t("Gagal"),
          onSuccess: () => {
            setTimeout(() => {
              router.push(`/projects/${projectId}`)
              router.refresh()
            }, 1500)
          },
        }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-96"></div>
              <div className="h-4 bg-gray-100 rounded w-64"></div>
            </div>
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!proyek) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Edit className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("Proyek tidak ditemukan")}</h3>
            <p className="text-muted-foreground mb-4">{t("Proyek yang ingin Anda edit tidak ada.")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is the owner or has permission to edit
  if (user?.role !== "ADMIN" && proyek.guru.id !== user?.id) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Edit className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("Tidak ada akses")}</h3>
            <p className="text-muted-foreground mb-4">{t("Anda tidak memiliki izin untuk mengedit proyek ini.")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      <AlertComponent />
      <ActionFeedback />
      
      {/* Header */}
      <AnimateIn>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t("Edit Proyek")}</h1>
            <p className="text-sm text-muted-foreground mt-1 sm:text-base">
              {t("Ubah detail proyek")} "{proyek.judul}"
            </p>
          </div>
        </div>
      </AnimateIn>

      <AnimateIn stagger={1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {t("Detail Proyek")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Judul Proyek */}
              <div className="space-y-2">
                <Label htmlFor="judul" className="text-sm font-medium">
                  {t("Judul Proyek")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="judul"
                  name="judul"
                  type="text"
                  placeholder={t("Masukkan judul proyek...")}
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
                  placeholder={t("Jelaskan tujuan dan detail proyek...")}
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
                    min={formData.tgl_mulai}
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
                  {t("Pilih tahapan-tahapan yang akan dijalankan dalam proyek ini")}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SINTAKS_KEYS.map((sintaksKey) => {
                    const sintaksInfo = SINTAKS_MAP[sintaksKey]
                    return (
                      <div key={sintaksKey} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={`edit-${sintaksKey}`}
                          checked={formData.sintaks.includes(sintaksKey)}
                          onCheckedChange={(checked) => handleSintaksChange(sintaksKey, checked === true)}
                          className="mt-1"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`edit-${sintaksKey}`}
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
                  placeholder={t("Upload file pendukung proyek")}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                <Link href={`/projects/${projectId}`}>
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    {t("Batal")}
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? t("Menyimpan...") : t("Update Proyek")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </AnimateIn>
    </div>
  )
}
