"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Upload, FileText, AlertCircle, Plus, Pencil } from "lucide-react"
import Link from "next/link"

export default function Sintaks3Page() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [proyek, setProyek] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    async function fetchProyek() {
      try {
        const response = await fetch("/api/proyek?judul=Membimbing Penyelidikan")
        if (response.ok) {
          const data = await response.json()
          setProyek(data)
        }
      } catch (error) {
        console.error("Error fetching proyek:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProyek()
  }, [isAuthenticated, router])

  if (!isAuthenticated || isLoading) {
    return <div>Loading...</div>
  }

  const isGuruOrAdmin = user?.role === "GURU" || user?.role === "ADMIN"

  if (!proyek) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">PBL - Project Based Learning</h1>
          </div>
          {isGuruOrAdmin && (
            <Link href="/projects/add/sintaks_3">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Tahapan PBL
              </Button>
            </Link>
          )}
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tahapan PBL Ini Belum Ditambahkan</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Tahapan PBL ini belum tersedia. Silakan hubungi guru atau tunggu hingga tahapan PBL ditambahkan.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const today = new Date()
  const deadline = new Date(proyek.tgl_selesai)
  const totalDays = Math.ceil((deadline.getTime() - new Date(proyek.tgl_mulai).getTime()) / (1000 * 60 * 60 * 24))
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const progressPercentage = Math.max(0, Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">PBL - Project Based Learning</h1>
          <p className="text-muted-foreground">Membimbing Penyelidikan</p>
        </div>
        {isGuruOrAdmin && proyek && (
          <Link href="/projects/edit/sintaks_3">
            <Button variant="outline">
              <Pencil className="w-4 h-4 mr-2" />
              Edit Tahapan PBL
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{proyek.judul}</CardTitle>
            <CardDescription>
              Guru : {proyek.guru?.nama || "Tidak tersedia"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Deskripsi Proyek</h3>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {proyek.deskripsi}
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <h3 className="font-semibold text-lg">Tujuan Pembelajaran</h3>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>Memahami konsep masalah dalam pemrograman berorientasi objek</li>
                <li>Mengidentifikasi komponen-komponen utama masalah</li>
                <li>Menganalisis kebutuhan sistem</li>
                <li>Merumuskan solusi berbasis objek</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aksi Proyek</CardTitle>
              <CardDescription>Akses sumber daya dan kumpulkan tugas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {proyek.lampiran && (
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" asChild>
                  <Link href={proyek.lampiran} target="_blank">
                    <Download className="h-4 w-4" />
                    Download Jobsheet/Modul
                  </Link>
                </Button>
              )}

              <Button className="w-full justify-start gap-2" asChild>
                <Link href={`/logbook/add`}>
                  <FileText className="h-4 w-4" />
                  Isi Logbook
                </Link>
              </Button>

              <Button variant="secondary" className="w-full justify-start gap-2" asChild>
                <Link href={`/projects/sintaks_3/submit?proyekId=${proyek.id}`}>
                  <Upload className="h-4 w-4" />
                  Kumpulkan Proyek
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kelengkapan</span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div 
                    className="h-2 rounded-full bg-primary transition-all" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Deadline: {deadline.toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
