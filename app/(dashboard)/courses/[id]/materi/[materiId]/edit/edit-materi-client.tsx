"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useBreadcrumbPage } from "@/hooks/use-breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { Loader2, ArrowLeft, Trash2, BookOpen, FileText, Pencil, Users } from "lucide-react"
import Link from "next/link"
import { FileUploadField } from "@/components/file-upload-field"
import { useAsyncAction } from "@/hooks/use-async-action"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface MateriData {
  id: string
  judul: string
  deskripsi: string | null
  kelasTarget: string[] | null
  lampiran: string | null
  fileName: string | null
  fileType: string | null
  fileSize: number | null
  tgl_unggah: Date
  courseId: string
  course: {
    id: string
    judul: string
  }
  // Flag to indicate if file exists instead of binary data
  hasFile: boolean
}

interface EditMateriClientProps {
  materi: MateriData
}

export default function EditMateriClient({ materi }: EditMateriClientProps) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { error: showError, confirm, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    judul: materi.judul,
    deskripsi: materi.deskripsi || "",
    lampiran: materi.hasFile && materi.fileType 
      ? `/api/materi/${materi.id}/file`
      : materi.lampiran || "",
  })
  const [kelasTarget, setKelasTarget] = useState<string[]>(materi.kelasTarget || [])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [availableKelas, setAvailableKelas] = useState<string[]>([])
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true)
  
  // Fetch enrollments untuk mendapatkan kelas yang ada di course
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setIsLoadingEnrollments(true)
        const response = await fetch(`/api/courses/${materi.courseId}/enrollments`)
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
  }, [materi.courseId])

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

  // Set custom breadcrumb with useMemo to prevent re-renders
  const breadcrumbItems = useMemo(() => [
    {
      label: 'Kursus',
      href: '/courses',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: materi.course.judul,
      href: `/courses/${materi.courseId}`,
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: materi.judul,
      href: `/courses/${materi.courseId}/materi/${materi.id}`,
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />
    }
  ], [materi.course.judul, materi.judul, materi.courseId, materi.id])

  useBreadcrumbPage('Edit Materi', breadcrumbItems)

  // Check authentication and authorization
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      showError("Tidak Terautentikasi", "Silakan login terlebih dahulu")
      router.push('/login')
      return
    }

    if (user.role !== 'GURU' && user.role !== 'ADMIN') {
      showError("Akses Ditolak", "Hanya guru dan admin yang dapat mengedit materi")
      router.push(`/courses/${materi.course.id}`)
      return
    }
  }, [user, authLoading, router, showError, materi.course.id])

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
          } else if (!formData.lampiran.startsWith('/api/')) {
            // It's a URL (not the existing file API path)
            bodyData.lampiran = formData.lampiran
          }
          // If it's /api/materi/[id]/file, we keep the existing file (no changes)
        }

        const response = await fetch(`/api/materi/${materi.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update materi')
        }
      },
      {
        loadingMessage: "Menyimpan materi...",
        successTitle: "Berhasil!",
        successDescription: "Materi berhasil diperbarui",
        errorTitle: "Gagal",
        onSuccess: () => {
          setTimeout(() => {
            router.push(`/courses/${materi.course.id}`)
            router.refresh()
          }, 1500)
        },
      }
    )
    setIsLoading(false)
  }

  const handleDelete = async () => {
    const confirmed = await confirm("Hapus Materi?", {
      description: "Tindakan ini tidak dapat dibatalkan!",
      type: "warning",
      confirmText: "Ya, Hapus!",
      cancelText: "Batal",
    })

    if (!confirmed) return

    setIsDeleting(true)
    await execute(
      async () => {
        const response = await fetch(`/api/materi/${materi.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete materi')
        }
      },
      {
        loadingMessage: "Menghapus materi...",
        successTitle: "Berhasil!",
        successDescription: "Materi berhasil dihapus",
        errorTitle: "Gagal",
        onSuccess: () => {
          setTimeout(() => {
            router.push(`/courses/${materi.course.id}`)
            router.refresh()
          }, 1500)
        },
      }
    )
    setIsDeleting(false)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user || (user.role !== 'GURU' && user.role !== 'ADMIN')) {
    return null
  }

  return (
    <>
      <AlertComponent />
      <ActionFeedback />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                asChild
              >
                <Link href={`/courses/${materi.course.id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali
                </Link>
              </Button>
            </div>
            <CardTitle>Edit Materi</CardTitle>
            <CardDescription>
              Update materi untuk course {materi.course.judul}
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
                              id={`edit-materi-kelas-${kelas}`}
                              checked={kelasTarget.includes(kelas)}
                              onCheckedChange={(checked) => handleKelasChange(kelas, checked as boolean)}
                            />
                            <Label htmlFor={`edit-materi-kelas-${kelas}`} className="text-sm font-normal cursor-pointer">
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

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading || isDeleting}
                className="w-full sm:w-auto"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Materi
                  </>
                )}
              </Button>
              
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/courses/${materi.course.id}`)}
                  disabled={isLoading || isDeleting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading || isDeleting}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memperbarui...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  )
}
