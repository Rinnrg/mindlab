"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"

type Kelas = { id: string; nama: string }

type TipeAsesmen = "KUIS" | "TUGAS"

async function fileToDataUrl(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const base64 = btoa(binary)
  return `data:${file.type || "application/octet-stream"};base64,${base64}`
}

export default function AddAsesmenPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const courseId = params.id

  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()

  const [nama, setNama] = React.useState("")
  const [deskripsi, setDeskripsi] = React.useState("")
  const [tipe, setTipe] = React.useState<TipeAsesmen>("KUIS")

  const [antiCurang, setAntiCurang] = React.useState(false)
  const [acakSoal, setAcakSoal] = React.useState(false)
  const [acakJawaban, setAcakJawaban] = React.useState(false)

  const [durasi, setDurasi] = React.useState<string>("")
  const [tglMulai, setTglMulai] = React.useState<string>("")
  const [tglSelesai, setTglSelesai] = React.useState<string>("")

  const [tipePengerjaan, setTipePengerjaan] = React.useState<"INDIVIDU" | "KELOMPOK">("INDIVIDU")
  const [file, setFile] = React.useState<File | null>(null)

  const [kelasList, setKelasList] = React.useState<Kelas[]>([])
  const [selectedKelas, setSelectedKelas] = React.useState<string[]>([])
  const [loadingKelas, setLoadingKelas] = React.useState(true)
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

    if (!nama.trim()) {
      showError("Error", "Nama asesmen wajib diisi")
      return
    }

    setIsSubmitting(true)

    await execute(
      async () => {
        let fileData: string | null = null
        let fileName: string | null = null
        let fileType: string | null = null
        let fileSize: number | null = null

        if (tipe === "TUGAS" && file) {
          fileData = await fileToDataUrl(file)
          fileName = file.name
          fileType = file.type
          fileSize = file.size
        }

        const payload: any = {
          nama: nama.trim(),
          deskripsi: deskripsi.trim() || null,
          kelasTarget: selectedKelas,
          tipe,
          durasi: durasi ? Number(durasi) : null,
          tgl_mulai: tglMulai || null,
          tgl_selesai: tglSelesai || null,
          courseId,
          antiCurang,
          acakSoal,
          acakJawaban,
        }

        if (tipe === "TUGAS") {
          payload.tipePengerjaan = tipePengerjaan
          payload.lampiran = fileName
          payload.fileData = fileData
          payload.fileName = fileName
          payload.fileType = fileType
          payload.fileSize = fileSize
        }

        const res = await fetch("/api/asesmen", {
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
          throw new Error(json?.error || text || "Gagal membuat asesmen")
        }

        return json
      },
      {
        loadingMessage: "Menyimpan asesmen...",
        successTitle: "Berhasil!",
        successDescription: "Asesmen berhasil dibuat.",
        errorTitle: "Gagal",
        onSuccess: (data: any) => {
          const newId = data?.asesmen?.id || data?.id
          router.push(newId ? `/courses/${courseId}/${newId}` : `/courses/${courseId}?tab=assessments`)
        },
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
          <h1 className="text-2xl font-bold">Buat Asesmen</h1>
          <p className="text-sm text-muted-foreground">Tambahkan asesmen untuk kursus ini.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/courses/${courseId}?tab=assessments`}>Kembali</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Asesmen</CardTitle>
          <CardDescription>Kuis atau tugas. Target kelas dan lampiran (opsional).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama</Label>
              <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Kuis 1" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea id="deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={4} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={tipe} onValueChange={(v) => setTipe(v as TipeAsesmen)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KUIS">Kuis</SelectItem>
                    <SelectItem value="TUGAS">Tugas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="durasi">Durasi (menit, opsional)</Label>
                <Input id="durasi" type="number" min={0} value={durasi} onChange={(e) => setDurasi(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tglMulai">Tanggal Mulai (opsional)</Label>
                <Input id="tglMulai" type="datetime-local" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tglSelesai">Tanggal Selesai (opsional)</Label>
                <Input id="tglSelesai" type="datetime-local" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer">
                <Checkbox checked={antiCurang} onCheckedChange={(v) => setAntiCurang(Boolean(v))} />
                <span className="text-sm">Anti Curang</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer">
                <Checkbox checked={acakSoal} onCheckedChange={(v) => setAcakSoal(Boolean(v))} />
                <span className="text-sm">Acak Soal</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer">
                <Checkbox checked={acakJawaban} onCheckedChange={(v) => setAcakJawaban(Boolean(v))} />
                <span className="text-sm">Acak Jawaban</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label>Target Kelas (opsional)</Label>
              <p className="text-xs text-muted-foreground">Jika tidak dipilih, asesmen berlaku untuk semua siswa.</p>

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

            {tipe === "TUGAS" && (
              <>
                <div className="space-y-2">
                  <Label>Tipe Pengerjaan</Label>
                  <Select value={tipePengerjaan} onValueChange={(v) => setTipePengerjaan(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe pengerjaan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDU">Individu</SelectItem>
                      <SelectItem value="KELOMPOK">Kelompok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Lampiran (opsional)</Label>
                  <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  {file && <p className="text-xs text-muted-foreground">Dipilih: {file.name}</p>}
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Asesmen"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
