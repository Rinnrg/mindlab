"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { Loader2, Users } from "lucide-react"
import Link from "next/link"
import { FileUploadField } from "@/components/file-upload-field"
import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"

interface AddMateriFormProps {
  courseId: string
  courseTitle: string
}

export default function AddMateriForm({ courseId, courseTitle }: AddMateriFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    lampiran: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.judul) {
      showError("Error", "Judul wajib diisi")
      return
    }

    if (!user?.id) {
      showError("Error", "User tidak terautentikasi")
      return
    }

    setIsLoading(true)
    await execute(
      async () => {
        // Prepare the data to send
        let bodyData: any = {
          judul: formData.judul.trim(),
          deskripsi: formData.deskripsi?.trim() || null,
          kelasTarget: kelasTarget,
          courseId: courseId,
          lampiran: null,
          fileData: null,
          fileName: null,
          fileType: null,
          fileSize: null,
        }

        // Check if lampiran is a data URL (uploaded file)
        if (formData.lampiran && formData.lampiran.trim()) {
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
            }
          } else {
            // It's a URL
            bodyData.lampiran = formData.lampiran
          }
        }

        const response = await fetch('/api/materi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create materi')
        }
      },
      {
        loadingMessage: "Menambahkan materi...",
        successTitle: "Berhasil!",
        successDescription: "Materi berhasil ditambahkan",
        errorTitle: "Gagal",
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

  return (
    <>
      <AlertComponent />
      <ActionFeedback />
      
      <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Informasi Materi</CardTitle>
          <CardDescription>
            {courseTitle ? `Tambah materi baru untuk course ${courseTitle}` : 'Tambah materi baru untuk course ini'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="judul">Judul Materi *</Label>
            <Input
              id="judul"
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              placeholder="Masukkan judul materi"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Masukkan deskripsi materi"
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label>Enrollment Kelas</Label>
            <p className="text-sm text-muted-foreground">
              Pilih kelas yang dapat mengakses materi ini berdasarkan siswa yang terdaftar di course. Kosongkan untuk semua siswa.
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
                            id={`materi-kelas-${kelas}`}
                            checked={kelasTarget.includes(kelas)}
                            onCheckedChange={(checked) => handleKelasChange(kelas, checked as boolean)}
                          />
                          <Label htmlFor={`materi-kelas-${kelas}`} className="text-sm font-normal cursor-pointer">
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

          <FileUploadField
            label="Link / URL Materi"
            value={formData.lampiran}
            onChange={(value) => setFormData({ ...formData, lampiran: value })}
            accept="*/*"
            description="Upload file atau masukkan link YouTube, Google Drive, PDF, atau resource eksternal lainnya"
          />

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
                  Menambahkan...
                </>
              ) : (
                'Tambah Materi'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
    </>
  )
}
