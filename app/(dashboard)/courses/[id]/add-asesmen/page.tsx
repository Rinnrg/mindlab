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
  Type,
  Wand2,
  Crown,
  Users,
  User as UserIcon,
  X,
  Loader2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"

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

type SubmissionComponentType = "UPLOAD_FILE" | "COMPILER" | "TEXT"

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

  const [selectedKetuaByGroup, setSelectedKetuaByGroup] = React.useState<Record<number, string>>({})

  const autoGenerateGroups = React.useCallback(() => {
    if (enrolledStudents.length === 0) return

    const students = [...enrolledStudents]
    // Shuffle students randomly
    for (let i = students.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [students[i], students[j]] = [students[j], students[i]]
    }

    const nextMembers: Record<number, string[]> = {}
    const baseSize = Math.floor(students.length / groupCount)
    const remainder = students.length % groupCount

    let studentIndex = 0
    for (let i = 1; i <= groupCount; i++) {
      // Distribution: add 1 from remainder to each group until remainder is exhausted
      // This is slightly better than putting all remainder in the last group,
      // but the user specifically mentioned putting remainder in the last group.
      // Let's stick to the user's specific request: "masukkan ke kelompok 4 jadi 5"
      const currentSize = i === groupCount ? baseSize + remainder : baseSize
      const members = students.slice(studentIndex, studentIndex + currentSize).map(s => s.id)
      nextMembers[i] = members
      studentIndex += currentSize
    }

    setSelectedGroupMembersByGroup(nextMembers)
    // Clear ketua selection on auto-generate
    setSelectedKetuaByGroup({})
  }, [enrolledStudents, groupCount])

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
        
        // Clear ketua selection if they were the ketua of this group
        if (selectedKetuaByGroup[groupNo] === studentId) {
          setSelectedKetuaByGroup(pk => {
            const nk = { ...pk }
            delete nk[groupNo]
            return nk
          })
        }
        
        return next
      }

      // Remove student from any other group first (one student only in one group)
      for (const [k, v] of Object.entries(next)) {
        const gn = Number(k)
        if (v?.includes(studentId)) {
          next[gn] = (v || []).filter((id) => id !== studentId)
          // Also clear as ketua of that other group
          if (selectedKetuaByGroup[gn] === studentId) {
            setSelectedKetuaByGroup(pk => {
              const nk = { ...pk }
              delete nk[gn]
              return nk
            })
          }
        }
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
              ketuaByGroup: selectedKetuaByGroup,
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
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", "TEXT")}
                    onClick={() => addSubmissionComponent("TEXT")}
                    className="w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition bg-background/30 hover:bg-background/50 border-border/30"
                  >
                    <Type className="h-4 w-4" />
                    Input Teks
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
                  if (raw !== "UPLOAD_FILE" && raw !== "COMPILER" && raw !== "TEXT") return
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

                      {submissionComponents.includes("TEXT") && (
                        <div className="rounded-xl border p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-medium">
                              <Type className="h-4 w-4" /> Input Teks
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSubmissionComponents((prev) => prev.filter((c) => c !== "TEXT"))
                              }
                            >
                              Hapus
                            </Button>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Siswa akan melihat area teks (textarea) untuk jawaban tertulis.
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
                  <CardDescription>Pengaturan tanggal, kelas target, dan opsi lainnya.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {tipe === "KUIS" && (
                    <div className="space-y-2">
                      <Label htmlFor="durasi">Durasi (menit, opsional)</Label>
                      <Input id="durasi" type="number" min={0} value={durasi} onChange={(e) => setDurasi(e.target.value)} />
                    </div>
                  )}

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
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none rounded-[32px] bg-background/80 backdrop-blur-xl shadow-2xl">
            <DialogHeader className="p-6 pb-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">Atur Kelompok</DialogTitle>
                  <DialogDescription className="text-sm">
                    Kelola pembagian siswa dan tentukan pemimpin tim dengan mudah.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6 gap-6">
              {/* Modern Toolbar */}
              <div className="flex flex-wrap items-center gap-4 p-4 rounded-[24px] bg-muted/20 border border-border/40 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="groupCount" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Jumlah Kelompok</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="groupCount"
                        type="number"
                        min={1}
                        max={enrolledStudents.length || 1}
                        value={groupCount}
                        onChange={(e) => setGroupCount(Math.max(1, Number(e.target.value) || 1))}
                        className="w-20 h-11 rounded-xl border-border/50 bg-background/50 focus:ring-primary/20 text-center font-bold text-lg"
                      />
                      <Button 
                        type="button" 
                        variant="default"
                        onClick={autoGenerateGroups}
                        disabled={loadingStudents || enrolledStudents.length === 0}
                        className="h-11 px-6 rounded-xl gap-2 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <Wand2 className="h-4 w-4" />
                        Generate Otomatis
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Separator orientation="vertical" className="h-10 hidden sm:block opacity-50" />
                
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs text-primary/80 font-medium leading-tight">
                      Sistem akan membagi <span className="font-bold">{enrolledStudents.length} siswa</span> ke dalam <span className="font-bold">{groupCount} kelompok</span>. Sisa siswa otomatis masuk ke kelompok terakhir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
                {/* Left: Enhanced Student List */}
                <div className="flex flex-col gap-4 overflow-hidden bg-muted/10 rounded-[28px] border border-border/40 p-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Daftar Siswa</h3>
                    <Badge variant="outline" className="bg-background/50 border-border/50 text-[10px] font-bold rounded-full px-2 py-0.5">
                      {enrolledStudents.length} Total
                    </Badge>
                  </div>
                  
                  <div className="flex-1 overflow-auto pr-1 custom-scrollbar space-y-2">
                    {loadingStudents ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-3 opacity-20" />
                        <p className="text-xs font-medium">Memuat data...</p>
                      </div>
                    ) : enrolledStudents.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground italic text-xs">
                        Belum ada siswa.
                      </div>
                    ) : (
                      enrolledStudents.map((s) => {
                        const currentGroup = memberGroupIndex.get(s.id) || 0
                        const isKetua = selectedKetuaByGroup[currentGroup] === s.id
                        
                        return (
                          <div 
                            key={s.id} 
                            className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${
                              currentGroup > 0 
                                ? 'bg-background border-primary/20 shadow-sm' 
                                : 'bg-background/40 border-border/40 hover:border-border/80'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-transparent group-hover:ring-primary/10 transition-all">
                                <AvatarImage src={s.foto || ""} />
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                  {s.nama?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {isKetua && (
                                <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-yellow-500 shadow-sm border border-background">
                                  <Crown className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate leading-tight">{s.nama}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                            </div>

                            <Select
                              value={String(currentGroup)}
                              onValueChange={(v) => {
                                const g = Number(v)
                                if (g === 0) {
                                  setSelectedGroupMembersByGroup((prev) => {
                                    const next = { ...prev }
                                    Object.keys(next).forEach(key => {
                                      next[Number(key)] = next[Number(key)].filter(id => id !== s.id)
                                    })
                                    return next
                                  })
                                  setSelectedKetuaByGroup(prev => {
                                    const next = { ...prev }
                                    Object.keys(next).forEach(key => {
                                      if (next[Number(key)] === s.id) delete next[Number(key)]
                                    })
                                    return next
                                  })
                                } else {
                                  toggleStudentInGroup(g, s.id)
                                }
                              }}
                            >
                              <SelectTrigger className={`w-[70px] h-9 rounded-xl text-[10px] font-bold border-none transition-all ${
                                currentGroup > 0 
                                  ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                  : 'bg-muted hover:bg-muted/80'
                              }`}>
                                <SelectValue placeholder="-" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-border/40 backdrop-blur-lg">
                                <SelectItem value="0" className="text-xs">Unassigned</SelectItem>
                                {Array.from({ length: groupCount }).map((_, idx) => (
                                  <SelectItem key={idx} value={String(idx + 1)} className="text-xs font-medium">
                                    G {idx + 1}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Right: Visual Groups Grid */}
                <div className="flex flex-col gap-4 overflow-hidden">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Visualisasi Kelompok</h3>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-muted-foreground">Live Preview</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4">
                      {Array.from({ length: groupCount }).map((_, idx) => {
                        const groupNo = idx + 1
                        const members = selectedGroupMembersByGroup[groupNo] || []
                        const ketuaId = selectedKetuaByGroup[groupNo]
                        
                        return (
                          <div 
                            key={idx} 
                            className="group flex flex-col bg-background/60 border border-border/40 hover:border-primary/30 rounded-[28px] overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-primary/5"
                          >
                            <div className="p-4 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent border-b border-border/30">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                  {groupNo}
                                </div>
                                <span className="font-black text-sm tracking-tight italic">KELOMPOK {groupNo}</span>
                              </div>
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold rounded-lg h-6">
                                {members.length} SISWA
                              </Badge>
                            </div>
                            
                            <div className="p-5 space-y-5">
                              {/* Ketua Section */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1 px-1">
                                  <Crown className="h-3.5 w-3.5 text-yellow-500" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ketua Tim</span>
                                </div>
                                <Select
                                  value={ketuaId || ""}
                                  onValueChange={(v) => setSelectedKetuaByGroup(prev => ({ ...prev, [groupNo]: v }))}
                                  disabled={members.length === 0}
                                >
                                  <SelectTrigger className="h-11 rounded-2xl border-border/40 bg-background/50 hover:bg-background transition-colors text-xs font-semibold">
                                    <SelectValue placeholder="Pilih pemimpin tim..." />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-border/40 backdrop-blur-lg">
                                    {members.map(id => {
                                      const s = enrolledStudents.find(st => st.id === id)
                                      return (
                                        <SelectItem key={id} value={id} className="text-xs font-medium">
                                          {s?.nama || "Unknown"}
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Members Section */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                  <UserIcon className="h-3.5 w-3.5 text-primary/60" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Anggota Tim</span>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-2 min-h-[60px]">
                                  {members.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-border/30 rounded-2xl bg-muted/5 opacity-50">
                                      <p className="text-[10px] font-medium text-muted-foreground italic">Seret atau pilih siswa untuk grup ini</p>
                                    </div>
                                  ) : (
                                    members.map(id => {
                                      const s = enrolledStudents.find(st => st.id === id)
                                      const isSelfKetua = ketuaId === id
                                      return (
                                        <div 
                                          key={id} 
                                          className={`flex items-center justify-between gap-3 p-2.5 rounded-[18px] border transition-all duration-300 hover:scale-[1.02] ${
                                            isSelfKetua 
                                              ? 'bg-yellow-50/50 border-yellow-200/50 shadow-sm shadow-yellow-500/5' 
                                              : 'bg-muted/20 border-border/30'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <Avatar className="h-7 w-7 border-2 border-background shadow-sm">
                                              <AvatarImage src={s?.foto || ""} />
                                              <AvatarFallback className="text-[9px] font-bold">
                                                {s?.nama?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                              <span className={`text-[11px] font-bold truncate leading-none ${isSelfKetua ? 'text-yellow-700' : ''}`}>
                                                {s?.nama}
                                              </span>
                                              {isSelfKetua && <span className="text-[8px] font-black uppercase tracking-tighter text-yellow-600/80">Leader</span>}
                                            </div>
                                          </div>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setSelectedGroupMembersByGroup(prev => ({
                                                ...prev,
                                                [groupNo]: prev[groupNo].filter(mid => mid !== id)
                                              }))
                                              if (selectedKetuaByGroup[groupNo] === id) {
                                                setSelectedKetuaByGroup(prev => {
                                                  const next = { ...prev }
                                                  delete next[groupNo]
                                                  return next
                                                })
                                              }
                                            }}
                                            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      )
                                    })
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 border-t border-border/40 bg-muted/10 backdrop-blur-md">
              <div className="w-full flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Pastikan semua siswa telah terbagi ke dalam kelompok.
                </p>
                <Button 
                  type="button" 
                  variant="default" 
                  onClick={() => setKelompokDialogOpen(false)} 
                  className="rounded-2xl px-10 h-12 font-black tracking-wide shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95"
                >
                  SIMPAN PENGATURAN
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="min-w-[200px]" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Asesmen"}
          </Button>
        </div>
      </form>
    </div>
  )
}
