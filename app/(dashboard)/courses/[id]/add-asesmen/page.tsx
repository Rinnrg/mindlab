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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Plus,
  Trash2,
  Check,
  Copy,
  ArrowUp,
  ArrowDown,
  Upload,
  Code as CodeIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

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

type SubmissionComponentType = "UPLOAD_FILE" | "COMPILER"

type EnrolledStudent = {
  id: string
  nama: string
  foto?: string | null
  email?: string | null
}

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
  const typeParam = searchParams.get('type')
  const modeParam = searchParams.get('mode')

  const { user } = useAuth()

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

  // TUGAS builder state (drag-drop toolbox)
  const [submissionComponents, setSubmissionComponents] = React.useState<SubmissionComponentType[]>(["UPLOAD_FILE"])
  const [isCanvasDragOver, setIsCanvasDragOver] = React.useState(false)

  // Kelompok configuration (for tipePengerjaan=KELOMPOK) - create groups per asesmen
  const [kelompokDialogOpen, setKelompokDialogOpen] = React.useState(false)
  const [groupCount, setGroupCount] = React.useState<number>(1)
  const [selectedGroupMembersByGroup, setSelectedGroupMembersByGroup] = React.useState<Record<number, string[]>>({})

  const [enrolledStudents, setEnrolledStudents] = React.useState<EnrolledStudent[]>([])
  const [loadingStudents, setLoadingStudents] = React.useState(false)

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

  // Sync initial intent from query params (from dropdown in course/project detail)
  React.useEffect(() => {
    const nextType = (typeParam || '').toUpperCase()
    if (nextType === 'TUGAS' || nextType === 'KUIS') {
      setTipe(nextType as TipeAsesmen)
    }

    const nextMode = (modeParam || '').toUpperCase()
    if (nextMode === 'INDIVIDU' || nextMode === 'KELOMPOK') {
      setTipePengerjaan(nextMode as any)
      // If mode is specified, assume it's a TUGAS builder
      setTipe('TUGAS')
    }
  }, [typeParam, modeParam])

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
    if (!kelompokDialogOpen) return
    if (tipe !== "TUGAS" || tipePengerjaan !== "KELOMPOK") return

    let cancelled = false
    setLoadingStudents(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}/students`)
        if (!res.ok) return
        const data = await res.json()

        // The API sometimes returns array directly; keep it flexible.
        const list = Array.isArray(data) ? data : data?.students || data?.data || []
        if (!cancelled) setEnrolledStudents(list)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingStudents(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [kelompokDialogOpen, tipe, tipePengerjaan, courseId])

  const memberGroupIndex = React.useMemo(() => {
    const index = new Map<string, number>()
    for (const [groupNoRaw, members] of Object.entries(selectedGroupMembersByGroup)) {
      const groupNo = Number(groupNoRaw)
      for (const m of members || []) index.set(m, groupNo)
    }
    return index
  }, [selectedGroupMembersByGroup])

  const toggleStudentInGroup = (groupNo: number, studentId: string) => {
    setSelectedGroupMembersByGroup((prev) => {
      const current = new Set(prev[groupNo] || [])
      const next: Record<number, string[]> = { ...prev }

      if (current.has(studentId)) {
        current.delete(studentId)
        next[groupNo] = Array.from(current)
        return next
      }

      // Remove student from any other group first (one student only in one group)
      for (const [k, v] of Object.entries(next)) {
        const g = Number(k)
        next[g] = (v || []).filter((id) => id !== studentId)
      }

      current.add(studentId)
      next[groupNo] = Array.from(current)
      return next
    })
  }

  const addSubmissionComponent = React.useCallback((c: SubmissionComponentType) => {
    setSubmissionComponents((prev) => (prev.includes(c) ? prev : [...prev, c]))
  }, [])

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
          payload.submissionComponents = submissionComponents
          if (tipePengerjaan === "KELOMPOK") {
            payload.groups = {
              groupCount,
              membersByGroup: selectedGroupMembersByGroup,
            }
          }
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
          <h1 className="text-2xl font-bold">Buat Asesmen {sintak ? `(Sintak ${sintak})` : ''}</h1>
          <p className="text-sm text-muted-foreground">Tambahkan asesmen untuk kursus ini.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/courses/${courseId}?tab=assessments`}>Kembali</Link>
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_380px] gap-6 items-start">
          {/* Left: Panel (KUIS: nomor soal) | (TUGAS: toolbox) */}
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

            {tipe === "TUGAS" && (
              <Card className="ios-glass-card border-border/30 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Komponen Pengumpulan</CardTitle>
                  <CardDescription>Drag ke canvas untuk menambahkan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", "UPLOAD_FILE")}
                    onClick={() => addSubmissionComponent("UPLOAD_FILE")}
                    className="w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition bg-background/30 hover:bg-background/50 border-border/30"
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", "COMPILER")}
                    onClick={() => addSubmissionComponent("COMPILER")}
                    className="w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition bg-background/30 hover:bg-background/50 border-border/30"
                  >
                    <CodeIcon className="h-4 w-4" />
                    Compiler
                  </button>

                  <Separator className="my-2" />
                  <div className="text-xs text-muted-foreground">
                    Aktif di canvas: {submissionComponents.length ? submissionComponents.join(", ") : "(kosong)"}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center: Builder + content utama */}
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

            {tipe === "TUGAS" && (
              <Card
                className={
                  "ios-glass-card border-border/30 rounded-2xl transition " +
                  (isCanvasDragOver ? "ring-2 ring-primary/30" : "")
                }
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsCanvasDragOver(true)
                }}
                onDragLeave={() => setIsCanvasDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsCanvasDragOver(false)
                  const raw = e.dataTransfer.getData("text/plain") as SubmissionComponentType
                  if (!raw) return
                  if (raw !== "UPLOAD_FILE" && raw !== "COMPILER") return
                  setSubmissionComponents((prev) => (prev.includes(raw) ? prev : [...prev, raw]))
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Konten Pengumpulan</CardTitle>
                  <CardDescription>Drop komponen dari panel kiri ke area ini.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submissionComponents.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Canvas kosong. Drag "Upload File" atau "Compiler" dari panel kiri.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissionComponents.includes("UPLOAD_FILE") && (
                        <div className="rounded-xl border p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-medium">
                              <Upload className="h-4 w-4" /> Upload File
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSubmissionComponents((prev) => prev.filter((c) => c !== "UPLOAD_FILE"))
                              }
                            >
                              Hapus
                            </Button>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Siswa akan melihat field upload saat melakukan pengumpulan.
                          </p>
                        </div>
                      )}

                      {submissionComponents.includes("COMPILER") && (
                        <div className="rounded-xl border p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-medium">
                              <CodeIcon className="h-4 w-4" /> Compiler
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSubmissionComponents((prev) => prev.filter((c) => c !== "COMPILER"))
                              }
                            >
                              Hapus
                            </Button>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Siswa akan melihat editor kode dan hasil output (jika dijalankan).
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
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

                  {(tipe === "KUIS" || (tipe === "TUGAS" && tipePengerjaan === "INDIVIDU")) && (
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
                  )}

                  {tipe === "TUGAS" && (
                    <>
                      {tipePengerjaan === "KELOMPOK" && (
                        <div className="space-y-2">
                          <Label>Kelompok</Label>
                          <Button type="button" variant="outline" onClick={() => setKelompokDialogOpen(true)}>
                            Atur Kelompok
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Pengumpulan cukup 1 perwakilan per kelompok.
                          </p>
                        </div>
                      )}

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

        <Dialog open={kelompokDialogOpen} onOpenChange={setKelompokDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Atur Kelompok</DialogTitle>
              <DialogDescription>
                Pilih anggota untuk tiap kelompok. Satu siswa hanya boleh ada di satu kelompok.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="groupCount">Jumlah Kelompok</Label>
                <Input
                  id="groupCount"
                  type="number"
                  min={1}
                  value={groupCount}
                  onChange={(e) => setGroupCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-28"
                />
              </div>

              <div className="rounded-xl border p-3 space-y-3">
                <p className="text-sm font-medium">Daftar Siswa</p>
                {loadingStudents ? (
                  <div className="text-sm text-muted-foreground">Memuat daftar siswa...</div>
                ) : enrolledStudents.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Tidak ada siswa terdaftar di course ini, atau endpoint students belum mengembalikan data.
                  </div>
                ) : (
                  <div className="max-h-[280px] overflow-auto rounded-lg border border-border/30">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background/80 backdrop-blur border-b">
                        <tr>
                          <th className="text-left font-medium p-2">Siswa</th>
                          <th className="text-left font-medium p-2 w-[120px]">Kelompok</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrolledStudents.map((s) => {
                          const currentGroup = memberGroupIndex.get(s.id) || 0
                          return (
                            <tr key={s.id} className="border-b last:border-b-0">
                              <td className="p-2">
                                <div className="font-medium">{s.nama}</div>
                                {s.email ? <div className="text-xs text-muted-foreground">{s.email}</div> : null}
                              </td>
                              <td className="p-2">
                                <Select
                                  value={currentGroup ? String(currentGroup) : "0"}
                                  onValueChange={(v) => {
                                    const g = Number(v)
                                    if (!g) {
                                      // remove from all groups
                                      setSelectedGroupMembersByGroup((prev) => {
                                        const next: Record<number, string[]> = { ...prev }
                                        for (const [k, members] of Object.entries(next)) {
                                          const gn = Number(k)
                                          next[gn] = (members || []).filter((id) => id !== s.id)
                                        }
                                        return next
                                      })
                                      return
                                    }
                                    toggleStudentInGroup(g, s.id)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="-" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">-</SelectItem>
                                    {Array.from({ length: groupCount }).map((_, idx) => (
                                      <SelectItem key={idx} value={String(idx + 1)}>
                                        {`Kelompok ${idx + 1}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: groupCount }).map((_, idx) => (
                  <div key={idx} className="rounded-xl border p-3">
                    <div className="font-medium">Kelompok {idx + 1}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Anggota dipilih: {(selectedGroupMembersByGroup[idx + 1] || []).length}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setKelompokDialogOpen(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Asesmen"}
        </Button>
      </form>
    </div>
  )
}
