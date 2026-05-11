"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"

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
  Layout,
  FileUp,
  Code,
  Type,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import * as XLSX from 'xlsx'

async function uploadPublicFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: form,
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error || 'Gagal upload file')
  if (!json?.url) throw new Error('Upload berhasil tapi URL tidak ditemukan')
  return String(json.url)
}

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

function isDataUrl(value?: string) {
  return typeof value === 'string' && value.startsWith('data:')
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
  const searchParams = useSearchParams()
  const courseId = params.id
  const sintak = searchParams.get('sintak')

  const { user } = useAuth()

  const { error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()

  const [nama, setNama] = React.useState("")
  const [deskripsi, setDeskripsi] = React.useState("")
  const [tipe, setTipe] = React.useState<TipeAsesmen>((searchParams.get('type') as TipeAsesmen) || "KUIS")
  const [tipePengerjaan, setTipePengerjaan] = React.useState<"INDIVIDU" | "KELOMPOK">((searchParams.get('mode') as "INDIVIDU" | "KELOMPOK") || "INDIVIDU")

  const [antiCurang, setAntiCurang] = React.useState(false)
  const [acakSoal, setAcakSoal] = React.useState(false)
  const [acakJawaban, setAcakJawaban] = React.useState(false)

  const [durasi, setDurasi] = React.useState<string>("")
  const [tglMulai, setTglMulai] = React.useState<string>("")
  const [tglSelesai, setTglSelesai] = React.useState<string>("")

  const [file, setFile] = React.useState<File | null>(null)

  const [kelasList, setKelasList] = React.useState<Kelas[]>([])
  const [selectedKelas, setSelectedKelas] = React.useState<string[]>([])
  const [loadingKelas, setLoadingKelas] = React.useState(true)

  const [students, setStudents] = React.useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = React.useState(false)
  const [selectedGroupMembers, setSelectedGroupMembers] = React.useState<string[]>([])

  const [submissionComponents, setSubmissionComponents] = React.useState<string[]>(["UPLOAD_FILE"])

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

  const [importExcelLoading, setImportExcelLoading] = React.useState(false)
  const [importExcelResult, setImportExcelResult] = React.useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const importExcelRef = React.useRef<HTMLInputElement>(null)

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

  const moveSoalToIndex = React.useCallback((from: number, to: number) => {
    setSoalList((prev) => {
      if (from === to) return prev
      if (from < 0 || from >= prev.length) return prev
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

  const [activeSoalIndex, setActiveSoalIndex] = React.useState(0)
  const dragFromIndexRef = React.useRef<number | null>(null)

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

  React.useEffect(() => {
    if (tipe === "TUGAS" && tipePengerjaan === "KELOMPOK") {
      setLoadingStudents(true)
      fetch(`/api/courses/${courseId}/students`)
        .then(res => res.json())
        .then(data => {
          setStudents(Array.isArray(data) ? data : [])
        })
        .catch(err => console.error("Error fetching students:", err))
        .finally(() => setLoadingStudents(false))
    }
  }, [tipe, tipePengerjaan, courseId])

  const toggleKelas = (kelasId: string, checked: boolean) => {
    setSelectedKelas((prev) => (checked ? [...prev, kelasId] : prev.filter((id) => id !== kelasId)))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const guruId = user?.id
    if (!guruId) {
      showError("Error", "Akun guru tidak terdeteksi. Silakan login ulang.")
      return
    }

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
          guruId,
          antiCurang,
          acakSoal,
          acakJawaban,
          sintak: sintak || null,
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
          if (tipePengerjaan === "KELOMPOK") {
            payload.selectedGroupMembers = selectedGroupMembers
          }
          payload.lampiran = fileName
          payload.fileData = fileData
          payload.fileName = fileName
          payload.fileType = fileType
          payload.fileSize = fileSize
          payload.submissionComponents = submissionComponents
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
      router.push(newId ? `/pbl/${courseId}/${newId}` : `/pbl/${courseId}?tab=assessments`)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AlertComponent />
      <ActionFeedback />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Buat Asesmen {sintak ? `(Sintak ${sintak})` : ''}</h1>
          <p className="text-sm text-muted-foreground">Tambahkan asesmen untuk PBL ini.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/pbl/${courseId}?tab=assessments`}>Kembali</Link>
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_380px] gap-6 items-start">
          {/* Left: Panel nomor soal (sticky) */}
          <div className="lg:sticky lg:top-20 space-y-4">
            {tipe === "KUIS" && (
              <Card className="ios-glass-card border-border/30 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Panel Soal</CardTitle>
                  <CardDescription>Drag untuk ubah urutan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {soalList.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      draggable
                      onClick={() => {
                        setActiveSoalIndex(i)
                        // scroll ke soal
                        document.getElementById(`soal-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }}
                      onDragStart={() => {
                        dragFromIndexRef.current = i
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const from = dragFromIndexRef.current
                        dragFromIndexRef.current = null
                        if (from === null) return
                        moveSoalToIndex(from, i)
                        setActiveSoalIndex(i)
                        // setelah reorder, scroll ke posisi baru
                        setTimeout(() => {
                          document.getElementById(`soal-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }, 50)
                      }}
                      className={
                        "w-full flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition " +
                        (i === activeSoalIndex
                          ? "bg-primary/10 border-primary/30 text-foreground"
                          : "bg-background/30 hover:bg-background/50 border-border/30 text-muted-foreground")
                      }
                      aria-label={`Soal ${i + 1}`}
                      title="Drag untuk pindah"
                    >
                      <span className="font-medium">Soal {i + 1}</span>
                      <span className="text-xs">↕</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Left: Builder + content utama */}
          <div className="space-y-6">
            {/* Header card ala Google Form (compact) */}
            <Card className="ios-glass-card border-border/30 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Judul</CardTitle>
                <CardDescription>Judul dan deskripsi asesmen.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-3">
                <Input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Judul asesmen (contoh: Kuis 1)"
                  className="text-lg sm:text-xl font-semibold h-11"
                />
                <Textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Deskripsi (opsional)"
                  rows={2}
                  className="min-h-[64px]"
                />
              </CardContent>
            </Card>

            {tipe === "KUIS" && (
              <Card className="ios-glass-card border-border/30 rounded-2xl border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-sm">Import Soal dari Excel</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Download template, isi soal &amp; jawaban, lalu import sekaligus
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = `/api/asesmen/template-excel`
                          a.download = 'Template_Soal_Kuis.xlsx'
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        }}
                      >
                        <FileUp className="mr-2 h-4 w-4 rotate-180" />
                        Download Template
                      </Button>

                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={importExcelLoading}
                        onClick={() => importExcelRef.current?.click()}
                      >
                        {importExcelLoading ? (
                          <Plus className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileUp className="mr-2 h-4 w-4" />
                        )}
                        {importExcelLoading ? 'Mengimport...' : 'Import Excel'}
                      </Button>

                      <input
                        ref={importExcelRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          e.target.value = ''
                          setImportExcelLoading(true)
                          setImportExcelResult(null)

                          try {
                            const reader = new FileReader()
                            reader.onload = (evt) => {
                              try {
                                const data = evt.target?.result
                                if (!data) throw new Error("Gagal membaca file")
                                
                                const wb = XLSX.read(data, { type: 'array' })
                                const wsname = wb.SheetNames[0]
                                const ws = wb.Sheets[wsname]
                                const jsonData = XLSX.utils.sheet_to_json(ws)

                                const newSoal: Soal[] = jsonData.map((row: any) => {
                                  // Normalize keys for this row
                                  const normalized: Record<string, any> = {}
                                  Object.keys(row).forEach(k => {
                                    normalized[k.trim().toLowerCase()] = row[k]
                                  })

                                  const getValue = (...keys: string[]) => {
                                    for (const key of keys) {
                                      if (normalized[key] !== undefined) return normalized[key]
                                    }
                                    // Fallback partial match
                                    const foundKey = Object.keys(normalized).find(k => 
                                      keys.some(searchKey => k.includes(searchKey))
                                    )
                                    return foundKey ? normalized[foundKey] : ''
                                  }

                                  const pertanyaan = getValue('pertanyaan', 'soal')
                                  if (!pertanyaan || String(pertanyaan).toLowerCase().startsWith('contoh:')) return null

                                  const opsiA = getValue('opsi a', 'pilihan a', 'a')
                                  const opsiB = getValue('opsi b', 'pilihan b', 'b')
                                  const opsiC = getValue('opsi c', 'pilihan c', 'c')
                                  const opsiD = getValue('opsi d', 'pilihan d', 'd')
                                  const kunci = String(getValue('jawaban benar', 'kunci', 'jawaban', 'benar') || 'A').toUpperCase()

                                  const opsi: Opsi[] = []
                                  if (opsiA) opsi.push({ teks: String(opsiA), isBenar: kunci.includes('A') })
                                  if (opsiB) opsi.push({ teks: String(opsiB), isBenar: kunci.includes('B') })
                                  if (opsiC) opsi.push({ teks: String(opsiC), isBenar: kunci.includes('C') })
                                  if (opsiD) opsi.push({ teks: String(opsiD), isBenar: kunci.includes('D') })

                                  // Jika tidak ada opsi yang benar, set A sebagai default (minimal data valid)
                                  if (opsi.length > 0 && !opsi.some(o => o.isBenar)) {
                                    opsi[0].isBenar = true
                                  }

                                  return {
                                    pertanyaan: String(pertanyaan),
                                    bobot: 10, // Fixed weight as requested
                                    tipeJawaban: 'PILIHAN_GANDA',
                                    opsi
                                  }
                                }).filter(s => s !== null && s.opsi.length >= 2) as Soal[]

                                if (newSoal.length > 0) {
                                  setSoalList(prev => {
                                    const currentSoal = prev.filter(s => s.pertanyaan.trim() !== "")
                                    return [...currentSoal, ...newSoal]
                                  })
                                  setImportExcelResult({ message: `Berhasil mengimport ${newSoal.length} soal`, type: 'success' })
                                } else {
                                  setImportExcelResult({ message: 'Tidak ada soal valid ditemukan (minimal 2 opsi)', type: 'error' })
                                }
                              } catch (err) {
                                console.error("Excel parse error:", err)
                                setImportExcelResult({ message: 'Gagal memproses file Excel', type: 'error' })
                              } finally {
                                setImportExcelLoading(false)
                              }
                            }
                            reader.readAsArrayBuffer(file)
                          } catch (err) {
                            setImportExcelResult({ message: 'Gagal membaca file', type: 'error' })
                            setImportExcelLoading(false)
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
                {importExcelResult && (
                  <CardContent className="pt-0">
                    <Alert
                      className={
                        importExcelResult.type === 'success'
                          ? 'border-green-500 bg-green-50 dark:bg-green-950'
                          : 'border-red-500 bg-red-50 dark:bg-red-950'
                      }
                    >
                      <AlertDescription className="text-xs">
                        {importExcelResult.message}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Catatan: Tipe asesmen tidak dipilih di UI ini (tiap asesmen sudah punya tipe). */}
            {/* Builder soal ala Google Form */}
            {tipe === "KUIS" && (
              <div className="space-y-4">
                {soalList.map((soal, index) => (
                  <div
                    key={index}
                    id={`soal-${index}`}
                    ref={index === soalList.length - 1 ? lastSoalRef : undefined}
                  >
                    <Card className="ios-glass-card border-border/30 rounded-2xl">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="rounded-lg">Soal {index + 1}</Badge>
                            <Select
                              value={soal.tipeJawaban}
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
                                        ? existing.opsi?.length
                                          ? existing.opsi
                                          : [
                                              { teks: "", isBenar: false },
                                              { teks: "", isBenar: false },
                                              { teks: "", isBenar: false },
                                              { teks: "", isBenar: false },
                                            ]
                                        : [],
                                  }
                                  return next
                                })
                              }
                            >
                              <SelectTrigger className="h-8 w-[170px] rounded-lg">
                                <SelectValue placeholder="Tipe soal" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PILIHAN_GANDA">Pilihan Ganda</SelectItem>
                                <SelectItem value="ISIAN">Essay</SelectItem>
                              </SelectContent>
                            </Select>
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
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            {/* Poin dihitung otomatis */}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Pertanyaan *</Label>
                          <Textarea
                            value={soal.pertanyaan}
                            onChange={(e) =>
                              setSoalList((prev) => {
                                const next = [...prev]
                                next[index] = { ...next[index], pertanyaan: e.target.value }
                                return next
                              })
                            }
                            placeholder="Tulis pertanyaan/soal di sini..."
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Gambar Soal (opsional)</Label>
                          <Input
                            value={soal.gambar || ""}
                            onChange={(e) =>
                              setSoalList((prev) => {
                                const next = [...prev]
                                next[index] = { ...next[index], gambar: e.target.value }
                                return next
                              })
                            }
                            placeholder="Tempel link gambar (https://...)"
                          />

                          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const f = e.target.files?.[0]
                                if (!f) return
                                try {
                                  const url = await uploadPublicFile(f)
                                  setSoalList((prev) => {
                                    const next = [...prev]
                                    next[index] = { ...next[index], gambar: url }
                                    return next
                                  })
                                } catch (err) {
                                  showError('Gagal upload', err instanceof Error ? err.message : 'Gagal upload gambar')
                                } finally {
                                  // allow re-select same file
                                  e.currentTarget.value = ''
                                }
                              }}
                            />

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setSoalList((prev) => {
                                  const next = [...prev]
                                  next[index] = { ...next[index], gambar: '' }
                                  return next
                                })
                              }
                              disabled={!soal.gambar}
                            >
                              Hapus gambar
                            </Button>
                          </div>

                          {!!soal.gambar && isDataUrl(soal.gambar) && (
                            <p className="text-xs text-destructive">
                              Format data URL/base64 tidak didukung untuk gambar soal (terlalu panjang untuk database). Gunakan link gambar.
                            </p>
                          )}
                          {!!soal.gambar && !isDataUrl(soal.gambar) && (
                            <div className="rounded-xl border p-3 bg-background/30">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={soal.gambar}
                                alt={`Gambar soal ${index + 1}`}
                                className="max-h-60 w-auto rounded-lg"
                                onError={(e) => {
                                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Bisa tempel URL atau upload gambar. Gambar akan disimpan sebagai URL (maks 255 karakter).
                          </p>
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

                <div className="flex justify-center py-2">
                  <Button
                    type="button"
                    onClick={addSoal}
                    className="w-fit px-10"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Soal
                  </Button>
                </div>
              </div>
            )}

            {/* Builder Komponen Pengumpulan (Hanya untuk TUGAS) */}
            {tipe === "TUGAS" && (
              <div className="space-y-6">
                <Card className="ios-glass-card border-border/30 rounded-2xl overflow-hidden shadow-xl">
                  <CardHeader className="bg-muted/30 border-b border-border/30 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Layout className="h-5 w-5 text-primary" />
                      Komponen Pengumpulan
                    </CardTitle>
                    <CardDescription>
                      Tentukan apa saja yang harus dikumpulkan oleh siswa.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[400px]">
                      {/* Toolbox */}
                      <div className="p-4 bg-muted/20 border-r border-border/30 space-y-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                          Toolbox
                        </div>
                        <div className="space-y-2">
                          {[
                            { id: "UPLOAD_FILE", label: "Upload File", icon: FileUp, desc: "Siswa mengunggah file atau link" },
                            { id: "COMPILER", label: "Python Compiler", icon: Code, desc: "Editor kode Python langsung" },
                            { id: "TEXT", label: "Input Teks", icon: Type, desc: "Kolom teks untuk jawaban/laporan" },
                          ].map((item) => {
                            const isAdded = submissionComponents.includes(item.id)
                            return (
                              <button
                                key={item.id}
                                type="button"
                                disabled={isAdded}
                                onClick={() => setSubmissionComponents(prev => [...prev, item.id])}
                                className={`w-full text-left p-3 rounded-xl border transition-all group ${
                                  isAdded 
                                    ? "bg-muted/50 border-border/50 opacity-50 cursor-not-allowed" 
                                    : "bg-background border-border/50 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${isAdded ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"}`}>
                                    <item.icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold">{item.label}</p>
                                    <p className="text-[9px] text-muted-foreground line-clamp-1">{item.desc}</p>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                          <p className="text-[10px] leading-relaxed text-primary/80 italic">
                            💡 Klik komponen di toolbox untuk menambahkannya ke canvas pengumpulan.
                          </p>
                        </div>
                      </div>

                      {/* Canvas */}
                      <div className="p-6 bg-background/50 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Canvas Pengumpulan ({submissionComponents.length})
                          </div>
                          {submissionComponents.length === 0 && (
                            <Badge variant="destructive" className="animate-pulse">Kosong</Badge>
                          )}
                        </div>

                        {submissionComponents.length === 0 ? (
                          <div className="h-[300px] border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-muted/5">
                            <div className="p-4 rounded-full bg-muted/50 mb-4">
                              <Plus className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Belum ada komponen</p>
                            <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
                              Pilih komponen dari toolbox di sebelah kiri untuk mulai membangun form pengumpulan.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {submissionComponents.map((compId, idx) => {
                              const config = {
                                UPLOAD_FILE: { label: "Upload File", icon: FileUp, color: "blue" },
                                COMPILER: { label: "Python Compiler", icon: Code, color: "emerald" },
                                TEXT: { label: "Input Teks", icon: Type, color: "purple" },
                              }[compId as "UPLOAD_FILE" | "COMPILER" | "TEXT"] || { label: compId, icon: FileUp, color: "gray" }

                              return (
                                <div 
                                  key={compId}
                                  className="flex items-center gap-4 p-4 bg-background border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-right-4 duration-300"
                                  style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                    {idx + 1}
                                  </div>
                                  <div className={`p-2.5 rounded-xl bg-${config.color}-500/10 text-${config.color}-500`}>
                                    <config.icon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-bold">{config.label}</p>
                                    <p className="text-[10px] text-muted-foreground italic">Komponen ini akan muncul sebagai tab di halaman siswa.</p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSubmissionComponents(prev => prev.filter(id => id !== compId))}
                                    className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all rounded-full"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        
                        {submissionComponents.length > 0 && (
                          <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
                            * Urutan di atas akan menentukan urutan tab pada halaman pengumpulan siswa.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right: Settings sticky */}
          <div className="lg:sticky lg:top-20 space-y-4">
            {showSettings && (
              <Card className="ios-glass-card border-border/30 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Informasi</CardTitle>
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

                      {tipePengerjaan === "KELOMPOK" && (
                        <div className="space-y-3 pt-2">
                          <Label>Pilih Anggota Kelompok</Label>
                          <p className="text-xs text-muted-foreground">Pilih siswa yang akan masuk ke dalam kelompok untuk tugas ini.</p>
                          
                          {loadingStudents ? (
                            <div className="text-sm text-muted-foreground">Memuat daftar siswa...</div>
                          ) : students.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Tidak ada siswa terdaftar di kursus ini.</div>
                          ) : (
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                              {students.map((student) => (
                                <label 
                                  key={student.id} 
                                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                                >
                                  <Checkbox 
                                    checked={selectedGroupMembers.includes(student.id)} 
                                    onCheckedChange={(checked) => {
                                      setSelectedGroupMembers(prev => 
                                        checked 
                                          ? [...prev, student.id] 
                                          : prev.filter(id => id !== student.id)
                                      )
                                    }}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{student.nama}</span>
                                    <span className="text-xs text-muted-foreground">{student.email}</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="min-w-[200px]" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Asesmen"}
          </Button>
        </div>
      </form>
    </div>
  )
}
