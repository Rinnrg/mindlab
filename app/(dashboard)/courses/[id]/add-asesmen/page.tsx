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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Trash2,
  Check,
  Copy,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

type TipeSoal = "PILIHAN_GANDA" | "ISIAN"

type Opsi = {
  teks: string
  isBenar: boolean
}

type Soal = {
  pertanyaan: string
  gambar?: string
  bobot: number
  tipeJawaban: TipeSoal
  opsi: Opsi[]
}

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

  // Google-Form-like builder state (hanya untuk KUIS)
  const [soalList, setSoalList] = React.useState<Soal[]>([
    {
      pertanyaan: "",
      gambar: "",
      bobot: 10,
      tipeJawaban: "PILIHAN_GANDA",
      opsi: [
        { teks: "", isBenar: false },
        { teks: "", isBenar: false },
        { teks: "", isBenar: false },
        { teks: "", isBenar: false },
      ],
    },
  ])
  // Settings sekarang selalu tampil di kanan (sticky)
  const [showSettings] = React.useState(true)

  const lastSoalRef = React.useRef<HTMLDivElement | null>(null)

  const scrollToLastSoal = React.useCallback(() => {
    // Delay to wait for DOM render
    setTimeout(() => {
      lastSoalRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 60)
  }, [])

  const addSoal = React.useCallback(() => {
    setSoalList((prev) => [
      ...prev,
      {
        pertanyaan: "",
        gambar: "",
        bobot: 10,
        tipeJawaban: "PILIHAN_GANDA",
        opsi: [
          { teks: "", isBenar: false },
          { teks: "", isBenar: false },
          { teks: "", isBenar: false },
          { teks: "", isBenar: false },
        ],
      },
    ])
    scrollToLastSoal()
  }, [scrollToLastSoal])

  const duplicateSoal = React.useCallback((index: number) => {
    setSoalList((prev) => {
      const source = prev[index]
      if (!source) return prev
      const clone: Soal = {
        ...source,
        opsi: (source.opsi || []).map((o) => ({ ...o })),
      }
      const next = [...prev]
      next.splice(index + 1, 0, clone)
      return next
    })
    scrollToLastSoal()
  }, [scrollToLastSoal])

  const moveSoal = React.useCallback((from: number, direction: -1 | 1) => {
    setSoalList((prev) => {
      const to = from + direction
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

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

    if (tipe === "KUIS") {
      if (soalList.length === 0) {
        showError("Error", "Minimal harus ada 1 soal untuk kuis")
        return
      }

      for (let i = 0; i < soalList.length; i++) {
        const s = soalList[i]
        if (!s.pertanyaan?.trim()) {
          showError("Error", `Soal ${i + 1}: Pertanyaan wajib diisi`)
          return
        }

        if (s.tipeJawaban === "PILIHAN_GANDA") {
          const filledOpsi = (s.opsi || []).filter((o) => o.teks.trim() !== "")
          if (filledOpsi.length < 2) {
            showError("Error", `Soal ${i + 1}: Minimal 2 pilihan jawaban harus diisi`)
            return
          }
          const hasCorrect = (s.opsi || []).some((o) => o.isBenar)
          if (!hasCorrect) {
            showError("Error", `Soal ${i + 1}: Harus ada minimal 1 jawaban yang benar`)
            return
          }
        }
      }
    }

    setIsSubmitting(true)

  const result = await execute(
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

        if (tipe === "KUIS") {
          payload.soal = soalList.map((s) => ({
            pertanyaan: s.pertanyaan,
            gambar: s.gambar || null,
            bobot: s.bobot || 10,
            tipeJawaban: s.tipeJawaban || "PILIHAN_GANDA",
            opsi:
              s.tipeJawaban === "PILIHAN_GANDA"
                ? (s.opsi || [])
                    .filter((o) => o.teks.trim() !== "")
                    .map((o) => ({ teks: o.teks, isBenar: o.isBenar }))
                : [],
          }))
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
      }
    )

    // Redirect setelah sukses
    if (result) {
      const newId = (result as any)?.asesmen?.id || (result as any)?.id
      router.push(newId ? `/courses/${courseId}/${newId}` : `/courses/${courseId}?tab=assessments`)
    }

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

  <form onSubmit={onSubmit} className="space-y-6">
        {/* Header card ala Google Form */}
        <Card className="ios-glass-card border-border/30 rounded-2xl">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Judul asesmen (contoh: Kuis 1)"
                  className="text-xl font-semibold h-12"
                />
                <Textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Deskripsi (opsional)"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SettingsIcon className="h-4 w-4" />
                Pengaturan ada di panel kanan
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
          {/* Left: Builder + content utama */}
          <div className="space-y-6">
            {/* Catatan: Tipe asesmen tidak dipilih di UI ini (tiap asesmen sudah punya tipe). */}
            {/* Builder soal ala Google Form */}
            {tipe === "KUIS" && (
              <div className="space-y-4">
                {soalList.map((soal, index) => (
                  <div key={index} ref={index === soalList.length - 1 ? lastSoalRef : undefined}>
                    <Card className="ios-glass-card border-border/30 rounded-2xl">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="rounded-lg">Soal {index + 1}</Badge>
                            <Badge variant="outline" className="rounded-lg">
                              {soal.tipeJawaban === "PILIHAN_GANDA" ? "Pilihan Ganda" : "Essay"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSoal(index, -1)}
                              disabled={index === 0}
                              aria-label="Pindah ke atas"
                            >
                              <div className="min-h-screen">
                                <div className="mx-auto w-full max-w-7xl px-4 py-8">
                                  <div className="mb-6 flex items-start justify-between gap-4">
                                    <div>
                                      <h1 className="text-2xl font-semibold">Buat Asesmen</h1>
                                      <p className="text-sm text-muted-foreground">Tambahkan asesmen untuk kursus ini.</p>
                                    </div>

                                    <Button asChild variant="outline" className="rounded-xl">
                                      <Link href={`/courses/${courseId}/asesmen`}>Kembali</Link>
                                    </Button>
                                  </div>

                                  <form onSubmit={onSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
                                      {/* Left: Builder + content utama */}
                                      <div className="space-y-6">
                                        {/* Header card ala Google Form */}
                                        <Card className="ios-glass-card border-border/30 rounded-2xl">
                                          <CardContent className="pt-6 space-y-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="judul">Judul *</Label>
                                              <Input
                                                id="judul"
                                                value={nama}
                                                onChange={(e) => setNama(e.target.value)}
                                                placeholder="Judul asesmen (contoh: Kuis 1)"
                                              />
                                            </div>

                                            <div className="space-y-2">
                                              <Label htmlFor="deskripsi">Deskripsi (opsional)</Label>
                                              <Textarea
                                                id="deskripsi"
                                                value={deskripsi}
                                                onChange={(e) => setDeskripsi(e.target.value)}
                                                placeholder="Deskripsi (opsional)"
                                                rows={4}
                                              />
                                            </div>
                                          </CardContent>
                                        </Card>
                              onValueChange={(v) =>
                                setSoalList((prev) => {
                                  const next = [...prev]
                                  const tipeJawaban = v as TipeSoal
                                  const existing = next[index]
                                  next[index] = {
                                    ...existing,
                                    tipeJawaban,
                                    opsi:
                                      tipeJawaban === "PILIHAN_GANDA"
                                        ? (existing.opsi?.length ? existing.opsi : [
                                            { teks: "", isBenar: false },
                                            { teks: "", isBenar: false },
                                            { teks: "", isBenar: false },
                                            { teks: "", isBenar: false },
                                          ])
                                        : [],
                                  }
                                  return next
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe soal" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PILIHAN_GANDA">Pilihan Ganda</SelectItem>
                                <SelectItem value="ISIAN">Essay</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-4">
                          <div className="space-y-2">
                            <Label>Poin *</Label>
                            <Input
                              type="number"
                              value={soal.bobot}
                              onChange={(e) =>
                                setSoalList((prev) => {
                                  const next = [...prev]
                                  next[index] = { ...next[index], bobot: parseInt(e.target.value) || 10 }
                                  return next
                                })
                              }
                              min={1}
                              className="max-w-[140px]"
                            />
                          </div>
                        </div>

                        {soal.tipeJawaban === "PILIHAN_GANDA" ? (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <Label>Pilihan Jawaban *</Label>
                              <p className="text-xs text-muted-foreground">
                                Klik tombol centang untuk menandai jawaban yang benar.
                              </p>
                              {(soal.opsi || []).map((opsi, opsiIndex) => (
                                <div key={opsiIndex} className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant={opsi.isBenar ? "default" : "outline"}
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() =>
                                      setSoalList((prev) => {
                                        const next = [...prev]
                                        const s = next[index]
                                        const opsiNext = (s.opsi || []).map((o, i) => ({
                                          ...o,
                                          isBenar: i === opsiIndex,
                                        }))
                                        next[index] = { ...s, opsi: opsiNext }
                                        return next
                                      })
                                    }
                                    aria-label={`Tandai jawaban benar opsi ${opsiIndex + 1}`}
                                  >
                                    {opsi.isBenar ? <Check className="h-4 w-4" /> : <span className="h-4 w-4" />}
                                  </Button>
                                  <Input
                                    value={opsi.teks}
                                    onChange={(e) =>
                                      setSoalList((prev) => {
                                        const next = [...prev]
                                        const s = next[index]
                                        const opsiNext = [...(s.opsi || [])]
                                        opsiNext[opsiIndex] = { ...opsiNext[opsiIndex], teks: e.target.value }
                                        next[index] = { ...s, opsi: opsiNext }
                                        return next
                                      })
                                    }
                                    placeholder={`Pilihan ${opsiIndex + 1}`}
                                    className={opsi.isBenar ? "border-green-500" : ""}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground"
                                    onClick={() =>
                                      setSoalList((prev) => {
                                        const next = [...prev]
                                        const s = next[index]
                                        const opsiNext = (s.opsi || []).filter((_, i) => i !== opsiIndex)
                                        next[index] = { ...s, opsi: opsiNext }
                                        return next
                                      })
                                    }
                                    aria-label="Hapus opsi"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}

                              <div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setSoalList((prev) => {
                                      const next = [...prev]
                                      const s = next[index]
                                      next[index] = {
                                        ...s,
                                        opsi: [...(s.opsi || []), { teks: "", isBenar: false }],
                                      }
                                      return next
                                    })
                                  }
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Tambah Opsi
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                            Soal essay akan dinilai manual oleh guru. (Tidak perlu pilihan jawaban)
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={addSoal}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Soal
                </Button>
              </div>
            )}
          </div>

          {/* Right: Settings sticky */}
          <div className="lg:sticky lg:top-6 space-y-4">
            {showSettings && (
              <Card className="ios-glass-card border-border/30 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Settings</CardTitle>
                  <CardDescription>Pengaturan tanggal, durasi, kelas target, dan opsi lainnya.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="durasi">Durasi (menit, opsional)</Label>
                    <Input id="durasi" type="number" min={0} value={durasi} onChange={(e) => setDurasi(e.target.value)} />
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tglMulai">Tanggal Mulai (opsional)</Label>
                      <Input id="tglMulai" type="datetime-local" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tglSelesai">Tanggal Selesai (opsional)</Label>
                      <Input id="tglSelesai" type="datetime-local" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)} />
                    </div>
                  </div>

                  {tipe === "KUIS" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-2 rounded-lg border p-3">
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <Checkbox checked={antiCurang} onCheckedChange={(v) => setAntiCurang(Boolean(v))} />
                            <span className="text-sm">Anti Curang</span>
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                                aria-label="Info Anti Curang"
                              >
                                Info
                              </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-80">
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Anti Curang</div>
                                <p className="text-xs text-muted-foreground">
                                  Jika diaktifkan, siswa akan mendapat peringatan saat meninggalkan tab/jendela kuis.
                                  Kuis bisa otomatis dikumpulkan jika siswa tidak kembali dalam waktu tertentu atau jika pelanggaran berulang.
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="flex items-center gap-2 rounded-lg border p-3">
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <Checkbox checked={acakSoal} onCheckedChange={(v) => setAcakSoal(Boolean(v))} />
                            <span className="text-sm">Acak Soal</span>
                          </label>
                        </div>

                        <div className="flex items-center gap-2 rounded-lg border p-3">
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <Checkbox checked={acakJawaban} onCheckedChange={(v) => setAcakJawaban(Boolean(v))} />
                            <span className="text-sm">Acak Jawaban</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Target Kelas (opsional)</Label>
                    <p className="text-xs text-muted-foreground">Jika tidak dipilih, asesmen berlaku untuk semua siswa.</p>

                    {loadingKelas ? (
                      <div className="text-sm text-muted-foreground">Loading kelas...</div>
                    ) : kelasList.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Belum ada data kelas.</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Asesmen"}
        </Button>
      </form>
    </div>
  )
}
