"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Lock, AtSign, Upload, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { AnimateIn } from "@/components/ui/animate-in"
import { useAutoTranslate } from "@/lib/auto-translate-context"

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useAutoTranslate()
  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [nama, setNama] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [kelas, setKelas] = useState("")
  const [foto, setFoto] = useState("")
  const [previewImage, setPreviewImage] = useState("")

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/users/${userId}`)
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch user")
        }
        
        const userData = data.user || data
        setNama(userData.nama || "")
        setEmail(userData.email || "")
        setUsername(userData.username || "")
        setRole(userData.role || "")
        setKelas(userData.kelas || "")
        setFoto(userData.foto || "")
        setPreviewImage(userData.foto || "")
      } catch (err) {
        showError(t("Terjadi kesalahan"), t("Gagal memuat data pengguna"))
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId, t, showError])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    await execute(
      async () => {
        const response = await fetch(`/api/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nama,
            email,
            username,
            ...(password && { password }),
            role,
            ...(role === "SISWA" && kelas && { kelas }),
            foto: previewImage,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update user")
        }
      },
      {
        loadingMessage: t("Menyimpan pengguna..."),
        successTitle: t("Berhasil!"),
        successDescription: t("Data pengguna berhasil diperbarui"),
        errorTitle: t("Gagal"),
        onSuccess: () => {
          setTimeout(() => {
            router.push("/users")
            router.refresh()
          }, 1500)
        },
      }
    )
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("Memuat")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <AlertComponent />
      <ActionFeedback />

      <AnimateIn stagger={1}>
        <Card>
          <CardHeader>
            <CardTitle>{t("Edit Pengguna")}</CardTitle>
            <CardDescription>{t("Perbarui informasi pengguna")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                  <AvatarImage src={previewImage || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">
                    {nama
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <Label htmlFor="photo" className="text-sm font-medium">
                    {t("Foto Profil")}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">{t("Upload foto profil pengguna (maks 2MB)")}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("photo")?.click()}
                      className="bg-transparent"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t("Upload Foto")}
                    </Button>
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                      aria-label="Upload profile photo"
                    />
                  </div>
                </div>
              </div>


              <div className="space-y-2">
                <Label htmlFor="nama">{t("Nama Lengkap")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="nama"
                    placeholder={t("Masukkan nama lengkap")}
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>


              <div className="space-y-2">
                <Label htmlFor="email">{t("Email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("Masukkan email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">{t("Username")}</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder={t("Masukkan username")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("Password Baru")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("Biarkan kosong untuk tetap menggunakan password lama")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("Kosongkan jika tidak ingin mengubah password")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t("Role")}</Label>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Pilih role")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SISWA">{t("Siswa")}</SelectItem>
                    <SelectItem value="GURU">{t("Guru")}</SelectItem>
                    <SelectItem value="ADMIN">{t("Admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === "SISWA" && (
                <div className="space-y-2">
                  <Label htmlFor="kelas">{t("Kelas")}</Label>
                  <Input
                    id="kelas"
                    placeholder={t("Masukkan kelas (contoh: 10 IPA 1)")}
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  {t("Batal")}
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("Memperbarui")}
                    </>
                  ) : (
                    t("Perbarui Pengguna")
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
