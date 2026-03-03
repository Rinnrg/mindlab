"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, X, ImageIcon, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { useAutoTranslate } from "@/lib/auto-translate-context"

const categoriesMap = {
  id: ["Programming", "Database", "Design", "Networking", "Security", "DevOps"],
  en: ["Programming", "Database", "Design", "Networking", "Security", "DevOps"],
}

interface CourseData {
  id: string
  judul: string
  deskripsi?: string | null
  kategori: string
  gambar: string | null
}

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const { t, locale } = useAutoTranslate()
  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  
  // Store original values to check if there are changes
  const [originalTitle, setOriginalTitle] = useState("")
  const [originalDescription, setOriginalDescription] = useState("")
  const [originalCategory, setOriginalCategory] = useState("")
  const [originalThumbnail, setOriginalThumbnail] = useState<string | null>(null)

  const categories = categoriesMap[locale]
  
  // Check if there are any changes
  const hasChanges = 
    title !== originalTitle || 
    description !== originalDescription ||
    category !== originalCategory || 
    thumbnail !== originalThumbnail

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/courses/${courseId}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error("API Error:", errorData)
          throw new Error(errorData.error || "Failed to fetch course")
        }
        
        const data = await response.json()
        console.log("Course data:", data)
        const course = data.course
        
        if (!course) {
          throw new Error("Course not found")
        }
        
        // Set current values
        setTitle(course.judul || "")
        setDescription(course.deskripsi || "")
        setCategory(course.kategori || "")
        setThumbnail(course.gambar || null)
        
        // Set original values
        setOriginalTitle(course.judul || "")
        setOriginalDescription(course.deskripsi || "")
        setOriginalCategory(course.kategori || "")
        setOriginalThumbnail(course.gambar || null)
      } catch (err: any) {
        console.error("Error fetching course:", err)
        showError(t("Error"), err.message || t("Gagal memuat data kursus"))
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchCourse()
    }
  }, [courseId, t, showError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!title.trim()) {
      showError(t("Error"), t("Judul kursus tidak boleh kosong"))
      return
    }
    
    if (!category) {
      showError(t("Error"), t("Kategori harus dipilih"))
      return
    }
    
    try {
      setSaving(true)
      
      const courseData = {
        judul: title.trim(),
        deskripsi: description.trim() || null,
        kategori: category,
        gambar: thumbnail || "/placeholder.svg",
      }

      await execute(
        async () => {
          const response = await fetch(`/api/courses/${courseId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(courseData),
          })

          const responseData = await response.json()

          if (!response.ok) {
            throw new Error(responseData.error || "Failed to update course")
          }
        },
        {
          loadingMessage: t("Menyimpan kursus..."),
          successTitle: t("Berhasil!"),
          successDescription: t("Kursus berhasil diperbarui"),
          errorTitle: t("Gagal"),
          onSuccess: () => {
            setTimeout(() => {
              router.push("/courses")
              router.refresh()
            }, 1000)
          },
        }
      )
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // TODO: Implement actual file upload
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnail(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <AlertComponent />
      <ActionFeedback />

      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/courses/${courseId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("Kembali ke Detail Kursus")}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("Edit Kursus")}</CardTitle>
              <CardDescription>{t("Perbarui informasi kursus Anda")}</CardDescription>
            </div>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                {t("Belum Disimpan")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label>{t("Gambar Kursus")}</Label>
              {thumbnail ? (
                <div className="relative aspect-video overflow-hidden rounded-lg border">
                  <img
                    src={thumbnail || "/placeholder.svg"}
                    alt={t("Gambar kursus")}
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={() => setThumbnail(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50"
                  htmlFor="thumbnail-upload"
                >
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">{t("Klik untuk upload gambar")}</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG {t("maksimal")} 5MB</p>
                  <input
                    id="thumbnail-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t("Judul Kursus")}</Label>
              <Input
                id="title"
                placeholder={t("Contoh: Pengenalan Web Development")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("Deskripsi Kursus")}</Label>
              <Textarea
                id="description"
                placeholder={t("Jelaskan apa yang akan dipelajari siswa dalam kursus ini...")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">{t("Kategori")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Pilih kategori")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:flex-1" 
                onClick={() => router.back()}
                disabled={saving}
              >
                {t("Batal")}
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:flex-1 gap-2" 
                disabled={saving || !hasChanges}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("Menyimpan...")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {hasChanges ? t("Simpan Perubahan") : t("Tidak Ada Perubahan")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
