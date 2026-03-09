"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ImageIcon, Loader2, Users, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { AnimateIn } from "@/components/ui/animate-in"
import { useAsyncAction } from "@/hooks/use-async-action"
import { Checkbox } from "@/components/ui/checkbox"

const categories = ["Programming", "Database", "Design", "Networking", "Security", "DevOps"]

interface Guru {
  id: string
  nama: string
  email: string
}

interface Kelas {
  id: string
  nama: string
  guru?: {
    nama: string
  }
}

export default function AddCoursePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [selectedGuruId, setSelectedGuruId] = useState("")
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([])
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gurus, setGurus] = useState<Guru[]>([])
  const [kelas, setKelas] = useState<Kelas[]>([])
  const [loadingGurus, setLoadingGurus] = useState(true)
  const [loadingKelas, setLoadingKelas] = useState(true)

  // Fetch daftar guru
  useEffect(() => {
    const fetchGurus = async () => {
      try {
        const response = await fetch('/api/users?role=GURU')
        const data = await response.json()
        if (response.ok) {
          setGurus(data.users)
          // Auto-select current user if they are a guru
          if (user?.role === 'GURU') {
            setSelectedGuruId(user.id)
          }
        }
      } catch (error) {
        console.error('Error fetching gurus:', error)
      } finally {
        setLoadingGurus(false)
      }
    }

    fetchGurus()
  }, [user])

  // Fetch daftar kelas
  useEffect(() => {
    const fetchKelas = async () => {
      try {
        const response = await fetch('/api/kelas')
        const data = await response.json()
        if (response.ok) {
          setKelas(data.kelas || [])
        }
      } catch (error) {
        console.error('Error fetching kelas:', error)
      } finally {
        setLoadingKelas(false)
      }
    }

    fetchKelas()
  }, [])

  const handleKelasToggle = (kelasId: string, checked: boolean) => {
    if (checked) {
      setSelectedKelasIds(prev => [...prev, kelasId])
    } else {
      setSelectedKelasIds(prev => prev.filter(id => id !== kelasId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      showError("Error", "You must be logged in to create a course")
      return
    }

    // Validasi form
    if (!title.trim()) {
      showError("Error", "Course title is required")
      return
    }

    if (!category) {
      showError("Error", "Please select a category")
      return
    }

    if (!selectedGuruId) {
      showError("Error", "Please select a guru pengampu")
      return
    }

    setIsSubmitting(true)

    await execute(
      async () => {
        // 1. Create course
        const courseResponse = await fetch("/api/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            judul: title,
            deskripsi: description.trim() || null,
            gambar: thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
            kategori: category,
            guruId: selectedGuruId,
          }),
        })

        const courseData = await courseResponse.json()

        if (!courseResponse.ok) {
          throw new Error(courseData.error || "Failed to create course")
        }

        // 2. Create enrollments for selected kelas
        if (selectedKelasIds.length > 0) {
          const enrollmentPromises = selectedKelasIds.map(async (kelasId) => {
            const enrollmentResponse = await fetch("/api/enrollments", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                courseId: courseData.course.id,
                kelasId: kelasId,
              }),
            })

            if (!enrollmentResponse.ok) {
              const errorData = await enrollmentResponse.json()
              console.error(`Failed to enroll kelas ${kelasId}:`, errorData)
              // Don't throw here, continue with other enrollments
            }
          })

          await Promise.all(enrollmentPromises)
        }

        return courseData
      },
      {
        loadingMessage: "Membuat kursus dan enrollment...",
        successTitle: "Berhasil!",
        successDescription: `Kursus berhasil dibuat${selectedKelasIds.length > 0 ? ` dan dienroll ke ${selectedKelasIds.length} kelas` : ''}`,
        errorTitle: "Gagal",
        onSuccess: () => {
          setTimeout(() => {
            router.push("/courses")
            router.refresh()
          }, 1500)
        },
      }
    )

    setIsSubmitting(false)
  }

  return (
    <div className="w-full space-y-6">
      <AlertComponent />
      <ActionFeedback />
      
      <AnimateIn stagger={1}>
        <Card>
          <CardHeader>
            <CardTitle>Create New Course</CardTitle>
            <CardDescription>Fill in the details below to create a new course for your students</CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label>Course Thumbnail</Label>
              {thumbnail ? (
                <div className="relative aspect-video overflow-hidden rounded-lg border">
                  <img
                    src={thumbnail || "/placeholder.svg"}
                    alt="Course thumbnail"
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
                  htmlFor="thumbnail-upload"
                  className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50"
                >
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Click to upload thumbnail</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  <input
                    id="thumbnail-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert("File size must be less than 5MB")
                          return
                        }
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setThumbnail(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Web Development"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what students will learn in this course..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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

            {/* Guru Pengampu */}
            <div className="space-y-2">
              <Label htmlFor="guru">Guru Pengampu</Label>
              {loadingGurus ? (
                <div className="flex items-center space-x-2 rounded-lg border p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading guru...</span>
                </div>
              ) : (
                <Select value={selectedGuruId} onValueChange={setSelectedGuruId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih guru pengampu" />
                  </SelectTrigger>
                  <SelectContent>
                    {gurus.map((guru) => (
                      <SelectItem key={guru.id} value={guru.id}>
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>{guru.nama}</span>
                          <span className="text-xs text-muted-foreground">({guru.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Enrollment Kelas */}
            <div className="space-y-2">
              <Label>Enrollment Kelas (Opsional)</Label>
              <p className="text-xs text-muted-foreground">
                Pilih kelas yang akan dienroll otomatis ke course ini
              </p>
              {loadingKelas ? (
                <div className="flex items-center space-x-2 rounded-lg border p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading kelas...</span>
                </div>
              ) : (
                <div className="space-y-2 rounded-lg border p-4">
                  {kelas.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-center">
                      <div>
                        <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Tidak ada kelas tersedia</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {kelas.map((kelasItem) => (
                        <div key={kelasItem.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`kelas-${kelasItem.id}`}
                            checked={selectedKelasIds.includes(kelasItem.id)}
                            onCheckedChange={(checked) => handleKelasToggle(kelasItem.id, checked as boolean)}
                          />
                          <label
                            htmlFor={`kelas-${kelasItem.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>{kelasItem.nama}</span>
                              {kelasItem.guru && (
                                <span className="text-xs text-muted-foreground">
                                  ({kelasItem.guru.nama})
                                </span>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {selectedKelasIds.length > 0 && (
                <p className="text-xs text-green-600">
                  {selectedKelasIds.length} kelas dipilih untuk enrollment otomatis
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:flex-1 bg-transparent" 
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </AnimateIn>
    </div>
  )
}
