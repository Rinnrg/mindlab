"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useParams, useSearchParams } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"

type Kelas = { id: string; nama: string }

async function fileToDataUrl(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const base64 = btoa(binary)
  return `data:${file.type || "application/octet-stream"};base64,${base64}`
}

export default function AddMateriPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const courseId = params.id
  const sintak = searchParams.get('sintak')

  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()

  const [judul, setJudul] = React.useState("")
  const [deskripsi, setDeskripsi] = React.useState("")
  const [kelasList, setKelasList] = React.useState<Kelas[]>([])
  const [selectedKelas, setSelectedKelas] = React.useState<string[]>([])
  const [loadingKelas, setLoadingKelas] = React.useState(true)

  const [file, setFile] = React.useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/kelas")
        const data = await res.json()
        if (!cancelled && res.ok) setKelasList(data.kelas || [])
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingKelas(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const toggleKelas = (kelasId: string, checked: boolean) => {
    setSelectedKelas((prev) => (checked ? [...prev, kelasId] : prev.filter((id) => id !== kelasId)))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!judul.trim()) {
      showError("Error", "Judul materi wajib diisi")
      return
    }

    setIsSubmitting(true)

    await execute(
      async () => {
        let fileData: string | undefined
        let fileName: string | undefined
        let fileType: string | undefined
        let fileSize: number | undefined

        if (file) {
          fileData = await fileToDataUrl(file)
          fileName = file.name
          fileType = file.type
          fileSize = file.size
        }

        const payload = {
          judul: judul.trim(),
          deskripsi: deskripsi.trim() || null,
          kelasTarget: selectedKelas,
          courseId,
          lampiran: fileName || null,
          fileData: fileData || null,
          fileName: fileName || null,
          fileType: fileType || null,
          fileSize: fileSize || null,
          sintak: sintak || null,
        }

        const res = await fetch("/api/materi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const text = await res.text()
        let json: any = null
        try {
          json = text ? JSON.parse(text) : null
        } catch {
          json = null
        }

        if (!res.ok) {
          throw new Error(json?.error || text || "Gagal membuat materi")
        }

        return json
      },
      {
        loadingMessage: "Menyimpan materi...",
        successTitle: "Berhasil!",
        successDescription: "Materi berhasil ditambahkan.",
        errorTitle: "Gagal",
        onSuccess: () => router.push(`/projects/${courseId}`),
      }
    )

    setIsSubmitting(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AlertComponent />
      <ActionFeedback />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tambah Materi Baru {sintak ? `(Sintak ${sintak})` : ''}</h1>
          <p className="text-sm text-muted-foreground">Tambahkan materi untuk PBL ini.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/projects/${courseId}`}>Kembali</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Materi</CardTitle>
          <CardDescription>Isi judul, deskripsi, target kelas, dan lampiran (opsional).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="judul">Judul</Label>
              <Input id="judul" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Pengenalan SQL" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Ringkasan materi..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Target Kelas (opsional)</Label>
              <p className="text-xs text-muted-foreground">Jika tidak dipilih, materi bisa dianggap untuk semua kelas.</p>

              {loadingKelas ? (
                <div className="text-sm text-muted-foreground">Loading kelas...</div>
              ) : kelasList.length === 0 ? (
                <div className="text-sm text-muted-foreground">Belum ada data kelas.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {kelasList.map((k) => {
                    const checked = selectedKelas.includes(k.id)
                    return (
                      <label key={k.id} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={(v) => toggleKelas(k.id, Boolean(v))} />
                        <span className="text-sm">{k.nama}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Lampiran (opsional)</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept="*/*"
              />
              {file && <p className="text-xs text-muted-foreground">Dipilih: {file.name}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Materi"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
