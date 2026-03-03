"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ImageIcon, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { AnimateIn } from "@/components/ui/animate-in"
import { useAsyncAction } from "@/hooks/use-async-action"

const categories = ["Programming", "Database", "Design", "Networking", "Security", "DevOps"]

export default function AddCoursePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    setIsSubmitting(true)

    await execute(
      async () => {
        const response = await fetch("/api/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            judul: title,
            deskripsi: description.trim() || null,
            gambar: thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
            kategori: category,
            guruId: user.id,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to create course")
        }
      },
      {
        loadingMessage: "Membuat kursus...",
        successTitle: "Berhasil!",
        successDescription: "Kursus berhasil dibuat",
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
