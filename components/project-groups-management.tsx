"use client"

import { useState, useEffect, useRef } from "react"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  UserPlus, GraduationCap, Users, Plus,
  FileSpreadsheet, Upload, FileDown, Loader2, CheckCircle2,
  XCircle, Trash2, AlertTriangle
} from "lucide-react"

interface Student {
  id: string
  nama: string
  email: string
  foto: string | null
  kelas: string | null
}

interface Kelompok {
  id: string
  nama: string
  anggota: Student[]
  _count: {
    anggota: number
  }
}

interface ClassInfo {
  kelas: string
  total: number
  enrolled: number
  available: number
}

interface ImportResult {
  message: string
  success: number
  failed: number
  errors: string[]
  addedStudents: { nama: string; email: string; kelas: string }[]
  byClass: Record<string, number>
}

interface ProjectGroupsManagementProps {
  proyekId: string
  proyekTitle?: string
}

export default function ProjectGroupsManagement({
  proyekId,
  proyekTitle,
}: ProjectGroupsManagementProps) {
  const { success, error: showError, confirm, AlertComponent } = useAdaptiveAlert()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Groups management state
  const [kelompok, setKelompok] = useState<Kelompok[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  // Class enrollment state
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [enrollingClass, setEnrollingClass] = useState<string | null>(null)

  // Add member dialog state (class-based)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [selectedKelompokId, setSelectedKelompokId] = useState<string>("")
  const [addMemberClassData, setAddMemberClassData] = useState<(ClassInfo & { studentIds: string[] })[]>([])
  const [loadingAddMemberClasses, setLoadingAddMemberClasses] = useState(false)
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Enroll by class dialog state
  const [isEnrollClassDialogOpen, setIsEnrollClassDialogOpen] = useState(false)
  const [enrollKelompokId, setEnrollKelompokId] = useState<string>("")

  // Import Excel dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importKelompokId, setImportKelompokId] = useState<string>("")
  const [importStep, setImportStep] = useState<"choose" | "uploading" | "success" | "error">("choose")
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // New group state
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [creatingGroup, setCreatingGroup] = useState(false)

  // Delete member state
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)

  // Load groups
  const loadGroups = async () => {
    try {
      setLoadingGroups(true)
      const response = await fetch(`/api/proyek/${proyekId}/kelompok`)
      const data = await response.json()

      if (response.ok) {
        setKelompok(data.kelompok || [])
      } else {
        showError("Gagal", data.error || "Gagal memuat data kelompok")
      }
    } catch (error) {
      console.error("Error loading groups:", error)
      showError("Error", "Terjadi kesalahan saat memuat data")
    } finally {
      setLoadingGroups(false)
    }
  }

  // Load available classes for enrollment
  const loadClasses = async () => {
    try {
      setLoadingClasses(true)
      const response = await fetch(`/api/proyek/${proyekId}/classes`)
      const data = await response.json()

      if (response.ok) {
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error("Error loading classes:", error)
    } finally {
      setLoadingClasses(false)
    }
  }

  // Load available students grouped by class for adding to group
  const loadAddMemberClassData = async (kelompokId: string) => {
    try {
      setLoadingAddMemberClasses(true)
      const response = await fetch(`/api/proyek/${proyekId}/kelompok/${kelompokId}/anggota`)
      const data = await response.json()

      if (response.ok) {
        const students: Student[] = data.students || []
        // Group by class
        const classMap: Record<string, { total: number; studentIds: string[] }> = {}
        for (const s of students) {
          const kelas = s.kelas || "Tanpa Kelas"
          if (!classMap[kelas]) classMap[kelas] = { total: 0, studentIds: [] }
          classMap[kelas].total++
          classMap[kelas].studentIds.push(s.id)
        }
        const result = Object.entries(classMap)
          .map(([kelas, info]) => ({
            kelas,
            total: info.total,
            enrolled: 0,
            available: info.total,
            studentIds: info.studentIds,
          }))
          .sort((a, b) => a.kelas.localeCompare(b.kelas))
        setAddMemberClassData(result)
      } else {
        showError("Gagal", data.error || "Gagal memuat data siswa")
      }
    } catch (error) {
      console.error("Error loading class data:", error)
      showError("Error", "Terjadi kesalahan saat memuat data siswa")
    } finally {
      setLoadingAddMemberClasses(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [proyekId])

  useEffect(() => {
    if (selectedKelompokId && isAddMemberDialogOpen) {
      loadAddMemberClassData(selectedKelompokId)
    }
  }, [selectedKelompokId, isAddMemberDialogOpen])

  useEffect(() => {
    if (isEnrollClassDialogOpen) {
      loadClasses()
    }
  }, [isEnrollClassDialogOpen])

  const handleOpenAddMemberDialog = (kelompokId: string) => {
    setSelectedKelompokId(kelompokId)
    setSelectedClassNames([])
    setIsAddMemberDialogOpen(true)
  }

  const handleOpenEnrollClassDialog = (kelompokId: string) => {
    setEnrollKelompokId(kelompokId)
    setIsEnrollClassDialogOpen(true)
  }

  const handleOpenImportDialog = (kelompokId: string) => {
    setImportKelompokId(kelompokId)
    setImportStep("choose")
    setImportResult(null)
    setIsImportDialogOpen(true)
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      showError("Error", "Nama kelompok harus diisi")
      return
    }

    try {
      setCreatingGroup(true)
      const response = await fetch(`/api/proyek/${proyekId}/kelompok`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: newGroupName.trim() }),
      })

      if (response.ok) {
        await success("Berhasil", "Kelompok berhasil dibuat")
        setNewGroupName("")
        setIsCreateGroupDialogOpen(false)
        loadGroups()
      } else {
        const data = await response.json()
        showError("Gagal", data.error || "Gagal membuat kelompok")
      }
    } catch (error) {
      console.error("Error creating group:", error)
      showError("Error", "Terjadi kesalahan saat membuat kelompok")
    } finally {
      setCreatingGroup(false)
    }
  }

  const handleDeleteGroup = async (kelompokId: string, nama: string) => {
    await confirm("Hapus Kelompok", {
      description: `Apakah Anda yakin ingin menghapus kelompok "${nama}"? Semua anggota akan dihapus dari kelompok ini.`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "warning",
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/proyek/${proyekId}/kelompok/${kelompokId}`, {
            method: "DELETE",
          })

          if (response.ok) {
            await success("Berhasil", "Kelompok berhasil dihapus")
            loadGroups()
          } else {
            const data = await response.json()
            showError("Gagal", data.error || "Gagal menghapus kelompok")
          }
        } catch (error) {
          console.error("Error deleting group:", error)
          showError("Error", "Terjadi kesalahan saat menghapus kelompok")
        }
      },
    })
  }

  const handleDeleteMember = async (kelompokId: string, anggotaId: string, nama: string) => {
    await confirm("Hapus Anggota", {
      description: `Hapus "${nama}" dari kelompok ini?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "warning",
      onConfirm: async () => {
        try {
          setDeletingMemberId(anggotaId)
          const response = await fetch(`/api/proyek/${proyekId}/kelompok/${kelompokId}/anggota/${anggotaId}`, {
            method: "DELETE",
          })

          if (response.ok) {
            await success("Berhasil", `${nama} berhasil dihapus dari kelompok`)
            loadGroups()
          } else {
            const data = await response.json()
            showError("Gagal", data.error || "Gagal menghapus anggota")
          }
        } catch (error) {
          console.error("Error deleting member:", error)
          showError("Error", "Terjadi kesalahan")
        } finally {
          setDeletingMemberId(null)
        }
      },
    })
  }

  const handleAddMembers = async () => {
    if (selectedClassNames.length === 0) {
      showError("Error", "Pilih minimal satu kelas")
      return
    }

    // Collect all student IDs from selected classes
    const studentIds = addMemberClassData
      .filter((cls) => selectedClassNames.includes(cls.kelas))
      .flatMap((cls) => cls.studentIds)

    if (studentIds.length === 0) {
      showError("Error", "Tidak ada siswa tersedia di kelas yang dipilih")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/proyek/${proyekId}/kelompok/${selectedKelompokId}/anggota`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds }),
      })

      if (response.ok) {
        await success("Berhasil", `${studentIds.length} siswa dari ${selectedClassNames.length} kelas berhasil ditambahkan`)
        setIsAddMemberDialogOpen(false)
        loadGroups()
      } else {
        const data = await response.json()
        showError("Gagal", data.error || "Gagal menambahkan anggota")
      }
    } catch (error) {
      console.error("Error adding members:", error)
      showError("Error", "Terjadi kesalahan saat menambahkan anggota")
    } finally {
      setSubmitting(false)
    }
  }

  // Enroll entire class
  const handleEnrollClass = async (kelas: string) => {
    try {
      setEnrollingClass(kelas)
      const response = await fetch(`/api/proyek/${proyekId}/kelompok/${enrollKelompokId}/anggota/enroll-class`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelas }),
      })

      const data = await response.json()

      if (response.ok) {
        await success("Berhasil", data.message)
        setIsEnrollClassDialogOpen(false)
        loadGroups()
      } else {
        showError("Gagal", data.error || "Gagal menambahkan kelas")
      }
    } catch (error) {
      console.error("Error enrolling class:", error)
      showError("Error", "Terjadi kesalahan")
    } finally {
      setEnrollingClass(null)
    }
  }

  // Excel import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportStep("uploading")
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(
        `/api/proyek/${proyekId}/kelompok/${importKelompokId}/anggota/import`,
        {
          method: "POST",
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setImportResult({
          message: data.error || "Gagal mengimpor data",
          success: 0,
          failed: 0,
          errors: [data.error],
          addedStudents: [],
          byClass: {},
        })
        setImportStep("error")
      } else {
        setImportResult(data)
        if (data.success > 0) {
          loadGroups()
          setImportStep("success")
        } else {
          setImportStep("error")
        }
      }
    } catch (err) {
      setImportResult({
        message: "Terjadi kesalahan saat mengimpor",
        success: 0,
        failed: 0,
        errors: ["Terjadi kesalahan jaringan"],
        addedStudents: [],
        byClass: {},
      })
      setImportStep("error")
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDownloadTemplate = () => {
    window.open(
      `/api/proyek/${proyekId}/kelompok/${importKelompokId}/anggota/template`,
      "_blank"
    )
  }

  // Toggle class selection
  const handleToggleClass = (kelas: string) => {
    setSelectedClassNames((prev) =>
      prev.includes(kelas)
        ? prev.filter((k) => k !== kelas)
        : [...prev, kelas]
    )
  }

  const handleSelectAllClasses = () => {
    const availableClasses = addMemberClassData.filter((cls) => cls.available > 0)
    if (selectedClassNames.length === availableClasses.length) {
      setSelectedClassNames([])
    } else {
      setSelectedClassNames(availableClasses.map((cls) => cls.kelas))
    }
  }

  const totalSelectedStudents = addMemberClassData
    .filter((cls) => selectedClassNames.includes(cls.kelas))
    .reduce((sum, cls) => sum + cls.available, 0)

  // Group members by class for display
  const getMembersByClass = (group: Kelompok) => {
    const classMap: Record<string, typeof group.anggota> = {}
    for (const member of group.anggota) {
      const kelas = member.kelas || "Tanpa Kelas"
      if (!classMap[kelas]) classMap[kelas] = []
      classMap[kelas].push(member)
    }
    return Object.entries(classMap).sort(([a], [b]) => a.localeCompare(b))
  }

  return (
    <div className="space-y-6">
      <AlertComponent />

      {/* Hidden file input for Excel import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        aria-label="Upload Excel file"
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Kelola Kelompok</h2>
          {proyekTitle && (
            <p className="text-sm text-muted-foreground mt-1">{proyekTitle}</p>
          )}
        </div>

        <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Buat Kelompok
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Kelompok Baru</DialogTitle>
              <DialogDescription>
                Masukkan nama kelompok untuk proyek ini
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nama kelompok..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateGroupDialogOpen(false)}
                  disabled={creatingGroup}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  disabled={creatingGroup || !newGroupName.trim()}
                >
                  {creatingGroup ? "Membuat..." : "Buat Kelompok"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingGroups ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-2/3 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-100 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : kelompok.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Belum ada kelompok dibuat</p>
              <p className="text-sm text-muted-foreground/70">
                Klik &quot;Buat Kelompok&quot; untuk memulai
              </p>
            </CardContent>
          </Card>
        ) : (
          kelompok.map((group) => {
            const membersByClass = getMembersByClass(group)

            return (
              <Card key={group.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{group.nama}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {group._count.anggota} anggota
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteGroup(group.id, group.nama)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Members grouped by class */}
                  {group.anggota.length > 0 ? (
                    <div className="space-y-3">
                      {membersByClass.map(([kelas, members]) => (
                        <div key={kelas}>
                          <div className="flex items-center gap-2 mb-2">
                            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {kelas}
                            </span>
                            <Badge variant="outline" className="text-xs h-5">
                              {members.length}
                            </Badge>
                          </div>
                          <div className="space-y-1.5 ml-5">
                            {members.map((member) => (
                              <div key={member.id} className="flex items-center gap-2 group">
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={member.foto || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {member.nama.split(" ").map((n) => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-sm font-medium truncate flex-1">
                                  {member.nama}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                  disabled={deletingMemberId === member.id}
                                  onClick={() =>
                                    handleDeleteMember(group.id, member.id, member.nama)
                                  }
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada anggota</p>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleOpenEnrollClassDialog(group.id)}
                    >
                      <GraduationCap className="h-4 w-4" />
                      Tambah per Kelas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleOpenImportDialog(group.id)}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Import Excel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 text-muted-foreground"
                      onClick={() => handleOpenAddMemberDialog(group.id)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Tambah Siswa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* =========================================== */}
      {/* Enroll by Class Dialog */}
      {/* =========================================== */}
      <Dialog open={isEnrollClassDialogOpen} onOpenChange={setIsEnrollClassDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Tambah Siswa per Kelas</DialogTitle>
            <DialogDescription>
              Pilih kelas untuk menambahkan semua siswa sekaligus ke kelompok
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {loadingClasses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Tidak ada kelas yang tersedia
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {classes.map((cls) => (
                  <div
                    key={cls.kelas}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{cls.kelas}</p>
                        <p className="text-xs text-muted-foreground">
                          {cls.total} siswa total • {cls.available} tersedia • {cls.enrolled} sudah terdaftar
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleEnrollClass(cls.kelas)}
                      disabled={cls.available === 0 || enrollingClass !== null}
                      className="gap-1"
                    >
                      {enrollingClass === cls.kelas ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {cls.available === 0 ? "Sudah Semua" : `Tambah ${cls.available}`}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEnrollClassDialogOpen(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================== */}
      {/* Import Excel Dialog */}
      {/* =========================================== */}
      <Dialog
        open={isImportDialogOpen}
        onOpenChange={(open) => {
          setIsImportDialogOpen(open)
          if (!open) {
            setImportStep("choose")
            setImportResult(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          {/* Step: Choose action */}
          {importStep === "choose" && (
            <>
              <DialogHeader>
                <DialogTitle>Import Excel</DialogTitle>
                <DialogDescription>
                  Tambahkan anggota kelompok melalui file Excel
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Upload File Excel</p>
                    <p className="text-xs text-muted-foreground font-normal">
                      Upload file Excel yang berisi data siswa (Nama, Email, Kelas)
                    </p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                  onClick={handleDownloadTemplate}
                >
                  <FileDown className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Download Template</p>
                    <p className="text-xs text-muted-foreground font-normal">
                      Unduh template Excel untuk mengisi data anggota
                    </p>
                  </div>
                </Button>
              </div>
            </>
          )}

          {/* Step: Uploading */}
          {importStep === "uploading" && (
            <>
              <DialogHeader>
                <DialogTitle>Mengimpor Data</DialogTitle>
                <DialogDescription>Mohon tunggu sebentar</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Mengimpor data...</p>
                <p className="text-sm text-muted-foreground">
                  Mencocokkan siswa dan menambahkan ke kelompok
                </p>
              </div>
            </>
          )}

          {/* Step: Success */}
          {importStep === "success" && importResult && (
            <>
              <DialogHeader>
                <DialogTitle>Import Berhasil!</DialogTitle>
                <DialogDescription>Data siswa berhasil diimpor</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center pt-4 pb-2">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {importResult.success} siswa berhasil ditambahkan
                  {importResult.failed > 0 && `, ${importResult.failed} gagal`}
                </p>
              </div>

              {/* Show added students grouped by class */}
              {Object.keys(importResult.byClass).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Berdasarkan Kelas:</p>
                  {Object.entries(importResult.byClass).map(([kelas, count]) => (
                    <div key={kelas} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>{kelas}</span>
                      </div>
                      <Badge variant="secondary">{count} siswa</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Added students table */}
              {importResult.addedStudents.length > 0 && (
                <ScrollArea className="max-h-40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Nama</TableHead>
                        <TableHead className="text-xs">Kelas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.addedStudents.map((s, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm py-2">{s.nama}</TableCell>
                          <TableCell className="text-sm py-2 text-muted-foreground">
                            {s.kelas}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}

              {/* Show errors if any */}
              {importResult.errors.length > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <p className="text-sm font-medium">{importResult.failed} data gagal diimpor</p>
                  </div>
                  <ScrollArea className="max-h-24">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        • {err}
                      </p>
                    ))}
                  </ScrollArea>
                </div>
              )}

              <Button className="w-full" onClick={() => setIsImportDialogOpen(false)}>
                Selesai
              </Button>
            </>
          )}

          {/* Step: Error */}
          {importStep === "error" && importResult && (
            <>
              <DialogHeader>
                <DialogTitle>Import Gagal</DialogTitle>
                <DialogDescription>Terjadi kesalahan saat mengimpor data</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center pt-4 pb-2">
                <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{importResult.message}</p>
              </div>

              {importResult.errors.length > 0 && (
                <ScrollArea className="max-h-32">
                  <div className="space-y-1">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        • {err}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setImportStep("choose")}
                >
                  Coba Lagi
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  Tutup
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================== */}
      {/* Add Member Dialog (Class-based) */}
      {/* =========================================== */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Tambah Anggota Kelompok</DialogTitle>
            <DialogDescription>
              Pilih kelas untuk menambahkan semua siswa ke kelompok
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-hidden">
            {loadingAddMemberClasses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : addMemberClassData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Tidak ada siswa tersedia untuk ditambahkan
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Semua siswa sudah terdaftar di proyek ini
                </p>
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="flex items-center space-x-2 border-b pb-3">
                  <Checkbox
                    id="select-all-classes"
                    checked={
                      selectedClassNames.length > 0 &&
                      selectedClassNames.length === addMemberClassData.filter((c) => c.available > 0).length
                    }
                    onCheckedChange={handleSelectAllClasses}
                  />
                  <label
                    htmlFor="select-all-classes"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Pilih Semua Kelas
                  </label>
                  {selectedClassNames.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedClassNames.length} kelas • {totalSelectedStudents} siswa
                    </Badge>
                  )}
                </div>

                {/* Class List */}
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-2">
                    {addMemberClassData.map((cls) => (
                      <div
                        key={cls.kelas}
                        className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          id={`class-add-${cls.kelas}`}
                          checked={selectedClassNames.includes(cls.kelas)}
                          onCheckedChange={() => handleToggleClass(cls.kelas)}
                          disabled={cls.available === 0}
                        />
                        <label
                          htmlFor={`class-add-${cls.kelas}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{cls.kelas}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {cls.available} siswa
                            </Badge>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsAddMemberDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={selectedClassNames.length === 0 || submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menambahkan...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Tambah {totalSelectedStudents > 0 ? `(${totalSelectedStudents} siswa)` : ""}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
