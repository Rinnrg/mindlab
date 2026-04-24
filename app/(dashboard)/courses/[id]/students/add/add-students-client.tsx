"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useBreadcrumbPage } from "@/hooks/simple-breadcrumb"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GraduationCap, UserPlus, Users, Loader2, BookOpen } from "lucide-react"
import Link from "next/link"

interface ClassInfo {
  kelas: string
  total: number
  enrolled: number
  available: number
  studentIds: string[]
}

interface AddStudentsClientProps {
  course: {
    id: string
    judul: string
  }
  classData: ClassInfo[]
  totalAvailable: number
}

export default function AddStudentsClient({
  course,
  classData,
  totalAvailable,
}: AddStudentsClientProps) {
  const router = useRouter()
  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set custom breadcrumb
  const breadcrumbItems = useMemo(() => [
    {
      label: 'Kursus',
      href: '/courses',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: course.judul,
      href: `/courses/${course.id}?tab=students`,
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: 'Tambah Siswa',
      icon: <UserPlus className="h-4 w-4" />
    }
  ], [course.id, course.judul])

  useBreadcrumbPage('Tambah Siswa', breadcrumbItems)

  const handleToggleClass = (kelas: string) => {
    setSelectedClasses((prev) =>
      prev.includes(kelas)
        ? prev.filter((k) => k !== kelas)
        : [...prev, kelas]
    )
  }

  const handleSelectAll = () => {
    const availableClasses = classData.filter((c) => c.available > 0).map((c) => c.kelas)
    if (selectedClasses.length === availableClasses.length) {
      setSelectedClasses([])
    } else {
      setSelectedClasses(availableClasses)
    }
  }

  const totalSelected = classData
    .filter((c) => selectedClasses.includes(c.kelas))
    .reduce((sum, c) => sum + c.available, 0)

  const getSelectedStudentIds = () => {
    return classData
      .filter((c) => selectedClasses.includes(c.kelas))
      .flatMap((c) => c.studentIds)
  }

  const handleSubmit = async () => {
    const studentIds = getSelectedStudentIds()
    if (studentIds.length === 0) {
      showError("Error", "Pilih minimal satu kelas yang memiliki siswa tersedia")
      return
    }

    setIsSubmitting(true)

    await execute(
      async () => {
        const response = await fetch(`/api/courses/${course.id}/enrollments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds }),
        })

        if (!response.ok) {
          throw new Error("Failed to enroll students")
        }
      },
      {
        loadingMessage: "Menambahkan siswa...",
        successTitle: "Berhasil!",
        successDescription: `${studentIds.length} siswa dari ${selectedClasses.length} kelas berhasil ditambahkan`,
        errorTitle: "Gagal",
        onSuccess: () => {
          setTimeout(() => {
            router.push(`/courses/${course.id}?tab=students`)
            router.refresh()
          }, 1500)
        },
      }
    )
    setIsSubmitting(false)
  }

  const availableClasses = classData.filter((c) => c.available > 0)

  return (
    <div className="w-full">
      <AlertComponent />
      <ActionFeedback />

      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Tambah Siswa per Kelas</h1>
          <p className="text-sm text-muted-foreground mt-1 sm:text-base">
            {course.judul}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pilih Kelas</CardTitle>
              <CardDescription>
                Centang kelas untuk mendaftarkan seluruh siswa di kelas tersebut
              </CardDescription>
            </div>
            {totalSelected > 0 && (
              <Badge variant="secondary" className="text-sm">
                {totalSelected} siswa dari {selectedClasses.length} kelas
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableClasses.length > 0 && (
            <div className="flex items-center space-x-2 border-b pb-3">
              <Checkbox
                id="select-all-classes"
                checked={
                  selectedClasses.length === availableClasses.length &&
                  availableClasses.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all-classes"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Pilih Semua Kelas ({availableClasses.length})
              </label>
            </div>
          )}

          <ScrollArea className="h-[400px] pr-4">
            {classData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Tidak ada kelas yang tersedia
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {classData.map((cls) => {
                  const isDisabled = cls.available === 0
                  const isChecked = selectedClasses.includes(cls.kelas)

                  return (
                    <div
                      key={cls.kelas}
                      className={`flex items-center space-x-4 rounded-lg border p-4 transition-colors ${
                        isDisabled
                          ? "opacity-50 bg-muted/30"
                          : isChecked
                          ? "bg-primary/5 border-primary/30"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <Checkbox
                        id={`class-${cls.kelas}`}
                        checked={isChecked}
                        onCheckedChange={() => handleToggleClass(cls.kelas)}
                        disabled={isDisabled}
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <label
                        htmlFor={`class-${cls.kelas}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{cls.kelas}</p>
                            <p className="text-xs text-muted-foreground">
                              {cls.total} siswa total
                              {cls.enrolled > 0 && (
                                <span> • {cls.enrolled} sudah terdaftar</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {cls.enrolled === cls.total ? (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                Semua Terdaftar
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                {cls.available} tersedia
                              </Badge>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href={`/courses/${course.id}?tab=students`}>
              <Button variant="outline" disabled={isSubmitting}>
                Batal
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={selectedClasses.length === 0 || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menambahkan...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Tambahkan {totalSelected > 0 ? `${totalSelected} Siswa` : ""}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
