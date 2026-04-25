"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Lock, AtSign, Loader2, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { AnimateIn } from "@/components/ui/animate-in"
import { useAsyncAction } from "@/hooks/use-async-action"
import { AddClassDialog } from "@/components/add-class-dialog"

export default function AddUserPage() {
  const router = useRouter()
  const { error: showError, success: showSuccess, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const [nama, setNama] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [kelas, setKelas] = useState("")
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch available classes when role is SISWA
  useEffect(() => {
    if (role === "SISWA") {
      fetchAvailableClasses()
    } else {
      // Reset kelas when role is not SISWA
      setKelas("")
    }
  }, [role])

  const fetchAvailableClasses = async () => {
    setLoadingClasses(true)
    try {
      const response = await fetch("/api/kelas")
      if (!response.ok) throw new Error("Gagal mengambil data kelas")
      const data = await response.json()
      setAvailableClasses(data.classes || [])
    } catch (error) {
      console.error("Error fetching classes:", error)
      setAvailableClasses([])
    } finally {
      setLoadingClasses(false)
    }
  }

  const handleClassAdded = (newClass: string) => {
    setAvailableClasses(prev => {
      // Pastikan kelas bersifat unik/tidak duplikat (case-insensitive checks opsional jika mau, di sini exact match)
      if (prev.includes(newClass)) return prev;
      return [...prev, newClass].sort();
    })
    setKelas(newClass)
    
    // Tampilkan notifikasi berhasil menambah kelas
    showSuccess("Berhasil", `Kelas ${newClass} berhasil ditambahkan`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nama.trim()) {
      showError("Error", "Full name is required")
      return
    }

    if (!email.trim()) {
      showError("Error", "Email is required")
      return
    }

    if (!role) {
      showError("Error", "Please select a role")
      return
    }

    if (role === "SISWA" && !kelas.trim()) {
      showError("Error", "Kelas is required for students")
      return
    }

    setIsSubmitting(true)

    // Jika kelas diketik manual dan belum ada di list availableClasses, tambahkan secara atomik ke local state
    const kelasFix = kelas.trim()
    if (role === "SISWA" && kelasFix && !availableClasses.includes(kelasFix)) {
      handleClassAdded(kelasFix)
    }

    await execute(
      async () => {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nama,
            email,
            username: username || email.split('@')[0],
            password: password || "password123",
            role,
            ...(role === "SISWA" && kelasFix && { kelas: kelasFix }),
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to create user")
        }
      },
      {
        loadingMessage: "Membuat pengguna...",
        successTitle: "Berhasil!",
        successDescription: "Pengguna berhasil dibuat",
        errorTitle: "Gagal",
        onSuccess: () => {
          setTimeout(() => {
            router.push("/users")
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
            <CardTitle>Add New User</CardTitle>
            <CardDescription>Create a new user account for Mindlab platform</CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Field - di paling atas */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SISWA">Siswa (Student)</SelectItem>
                  <SelectItem value="GURU">Guru (Teacher)</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="nama"
                  placeholder="Enter full name"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Conditional fields based on role */}
            {role === "SISWA" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="kelas">Kelas</Label>
                </div>
                {loadingClasses ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading classes...</span>
                  </div>
                ) : (
                  <div className="space-y-2 border rounded-md p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                       <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pilih Kelas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select value={kelas} onValueChange={setKelas}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Pilih kelas yang sudah ada" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClasses.map((className) => (
                            <SelectItem key={className} value={className}>
                              <div className="flex items-center">
                                <GraduationCap className="h-4 w-4 mr-2" />
                                {className}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <AddClassDialog onClassAdded={handleClassAdded} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {role === "GURU" && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Guru Account</h4>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Akun guru akan memiliki akses untuk mengelola course, materi, dan asesmen.
                </p>
              </div>
            )}

            {role === "ADMIN" && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 text-red-600 mr-2" />
                  <h4 className="font-medium text-red-900 dark:text-red-100">Administrator Account</h4>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Akun admin memiliki akses penuh untuk mengelola semua aspek platform.
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:flex-1 bg-transparent" 
                onClick={(e) => { e.preventDefault(); router.back(); }}
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
                  "Create User"
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
