"use client"

import { useState, useRef } from "react"
import { useUsers } from "@/hooks/use-api"
import type { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { UserTableSkeleton } from "@/components/ui/loading-skeletons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Plus,
  Upload,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  GraduationCap,
  UserCog,
  UserPlus,
  FileSpreadsheet,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id as idLocale, enUS } from "date-fns/locale"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { AnimateIn } from "@/components/ui/animate-in"
import { cn } from "@/lib/utils"
import { useAsyncAction } from "@/hooks/use-async-action"

export default function UsersPage() {
  const { t, locale: currentLocale, setLocale } = useAutoTranslate()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [importRole, setImportRole] = useState<"SISWA" | "GURU">("SISWA")
  const [importStep, setImportStep] = useState<"choose" | "uploading" | "success" | "error" | "download-template">("choose")
  const [importResult, setImportResult] = useState<{ message: string; success: number; failed: number; errors: string[]; importedUsers: { nama: string; email: string; username: string; role: string; kelas?: string }[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { confirm, error: showError, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  const { users, loading, error, refetch } = useUsers()

  const dateLocale = currentLocale === 'id' ? idLocale : enUS

  const roleConfig: Record<UserRole, { label: string; color: string; icon: typeof Users }> = {
    ADMIN: { label: t("Admin"), color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: UserCog },
    GURU: {
      label: t("Guru"),
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      icon: Users,
    },
    SISWA: {
      label: t("Siswa"),
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      icon: GraduationCap,
    },
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    return matchesSearch && matchesRole
  })

  // Separate users by role
  const adminUsers = filteredUsers.filter(u => u.role === "ADMIN")
  const guruUsers = filteredUsers.filter(u => u.role === "GURU")
  const siswaUsers = filteredUsers.filter(u => u.role === "SISWA")

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === "ADMIN").length,
    guru: users.filter((u) => u.role === "GURU").length,
    siswa: users.filter((u) => u.role === "SISWA").length,
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = await confirm(t("Hapus Pengguna"), {
      description: t("Apakah Anda yakin ingin menghapus pengguna") + ` "${userName}"? ` + t("Tindakan ini tidak dapat dibatalkan."),
      confirmText: t("Hapus"),
      cancelText: t("Batal"),
      type: "warning",
      onConfirm: async () => {
        await execute(
          async () => {
            const response = await fetch(`/api/users/${userId}`, {
              method: 'DELETE',
            })
            const data = await response.json()
            if (!response.ok) {
              throw new Error(data.error || 'Gagal menghapus user')
            }
            await refetch()
            router.refresh()
          },
          {
            loadingMessage: t("Menghapus pengguna..."),
            successTitle: t("Berhasil"),
            successDescription: `"${userName}" ${t("berhasil dihapus")}`,
            errorTitle: t("Gagal"),
            autoCloseMs: 1500,
          }
        )
      },
    })
  }

  const handleDownloadTemplate = (role: string) => {
    window.open(`/api/users/template?role=${role}`, '_blank')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setImportStep("uploading")
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('role', importRole)

      const response = await fetch('/api/users/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setImportResult({
          message: data.error || 'Gagal mengimpor data',
          success: 0,
          failed: 0,
          errors: [data.error],
          importedUsers: [],
        })
        setImportStep("error")
      } else {
        setImportResult(data)
        if (data.success > 0) {
          refetch()
          setImportStep("success")
        } else {
          setImportStep("error")
        }
      }
    } catch (err) {
      setImportResult({
        message: 'Terjadi kesalahan saat mengimpor',
        success: 0,
        failed: 0,
        errors: ['Terjadi kesalahan jaringan'],
        importedUsers: [],
      })
      setImportStep("error")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const openImportDialog = () => {
    setImportStep("choose")
    setImportResult(null)
    setImportRole("SISWA")
    setIsImportDialogOpen(true)
  }

  if (loading) {
    return <UserTableSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <AlertComponent />
      <ActionFeedback />

      <AnimateIn stagger={0}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("Manajemen Pengguna")}</h1>
            <p className="text-sm text-muted-foreground">{t("Kelola data pengguna sistem Projecta")}</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("Tambah")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/users/add">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("Manual")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openImportDialog()}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {t("Import Excel")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Import Excel Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={(open) => { setIsImportDialogOpen(open); if (!open) { setImportStep("choose"); setImportResult(null) } }}>
              <DialogContent className="max-w-[95vw] sm:max-w-md">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  aria-label="Upload Excel file"
                  onChange={handleFileUpload}
                />

                {/* Step: Choose action */}
                {importStep === "choose" && (
                  <>
                    <DialogHeader>
                      <DialogTitle>{t("Import Excel")}</DialogTitle>
                      <DialogDescription>{t("Tambahkan banyak pengguna sekaligus melalui file Excel")}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{t("Sudah Mempunyai Excel")}</p>
                          <p className="text-xs text-muted-foreground font-normal">{t("Upload file Excel yang sudah berisi data pengguna")}</p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                        onClick={() => setImportStep("download-template")}
                      >
                        <FileDown className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{t("Download Template Excel")}</p>
                          <p className="text-xs text-muted-foreground font-normal">{t("Unduh template Excel untuk mengisi data pengguna")}</p>
                        </div>
                      </Button>
                    </div>
                  </>
                )}

                {/* Step: Download Template - pilih role */}
                {importStep === "download-template" && (
                  <>
                    <DialogHeader>
                      <DialogTitle>{t("Download Template Excel")}</DialogTitle>
                      <DialogDescription>{t("Pilih template sesuai role yang ingin diimpor")}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                        onClick={() => handleDownloadTemplate('siswa')}
                      >
                        <GraduationCap className="h-5 w-5 text-green-600" />
                        <div className="text-left">
                          <p className="font-medium">{t("Template Siswa")}</p>
                          <p className="text-xs text-muted-foreground font-normal">{t("Kolom: Nama, Kelas, Jenis Kelamin, Username, Email, Password")}</p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-4 bg-transparent"
                        onClick={() => handleDownloadTemplate('guru')}
                      >
                        <Users className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <p className="font-medium">{t("Template Guru")}</p>
                          <p className="text-xs text-muted-foreground font-normal">{t("Kolom: Nama, Jenis Kelamin, Username, Email, Password")}</p>
                        </div>
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setImportStep("choose")}>
                      {t("Kembali")}
                    </Button>
                  </>
                )}

                {/* Step: Uploading */}
                {importStep === "uploading" && (
                  <>
                    <DialogHeader>
                      <DialogTitle>{t("Mengimpor Data")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                      <p className="text-lg font-medium">{t("Mengimpor data...")}</p>
                      <p className="text-sm text-muted-foreground">{t("Mohon tunggu sebentar")}</p>
                    </div>
                  </>
                )}

                {/* Step: Success */}
                {importStep === "success" && importResult && (
                  <>
                    <DialogHeader>
                      <DialogTitle>{t("Import Berhasil!")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center pt-6 pb-2">
                      <div className="relative mb-4">
                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-in zoom-in-50 duration-300">
                          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {importResult.success} {importRole === "SISWA" ? t("siswa") : t("guru")} {t("berhasil ditambahkan")}
                        {importResult.failed > 0 && `, ${importResult.failed} ${t("gagal")}`}
                      </p>
                    </div>

                    {/* List of imported users */}
                    {importResult.importedUsers.length > 0 && (
                      <div className="rounded-lg border max-h-52 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">{t("Nama")}</TableHead>
                              <TableHead className="text-xs">{t("Username")}</TableHead>
                              {importRole === "SISWA" && <TableHead className="text-xs">{t("Kelas")}</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importResult.importedUsers.map((u, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-sm py-2">{u.nama}</TableCell>
                                <TableCell className="text-sm py-2 text-muted-foreground">{u.username}</TableCell>
                                {importRole === "SISWA" && <TableCell className="text-sm py-2 text-muted-foreground">{u.kelas || "-"}</TableCell>}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Errors if any */}
                    {importResult.errors.length > 0 && (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <p className="text-sm font-medium">{importResult.failed} {t("data gagal diimpor")}</p>
                        </div>
                        <ul className="space-y-1 text-xs text-muted-foreground max-h-24 overflow-y-auto">
                          {importResult.errors.map((err, i) => (
                            <li key={i}>• {err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button className="w-full mt-2" onClick={() => setIsImportDialogOpen(false)}>
                      {t("Selesai")}
                    </Button>
                  </>
                )}

                {/* Step: Error */}
                {importStep === "error" && importResult && (
                  <>
                    <DialogHeader>
                      <DialogTitle>{t("Import Gagal")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center pt-6 pb-2">
                      <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{importResult.message}</p>
                    </div>

                    {importResult.errors.length > 0 && (
                      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3">
                        <ul className="space-y-1 text-xs text-muted-foreground max-h-32 overflow-y-auto">
                          {importResult.errors.map((err, i) => (
                            <li key={i}>• {err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setImportStep("choose")}>
                        {t("Coba Lagi")}
                      </Button>
                      <Button className="flex-1" onClick={() => setIsImportDialogOpen(false)}>
                        {t("Tutup")}
                      </Button>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </AnimateIn>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <AnimateIn stagger={1}>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-6">
              <div className="rounded-lg bg-primary/10 p-2 sm:p-3">
                <Users className="h-4 w-4 text-primary sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-lg font-bold sm:text-2xl">{stats.total}</p>
                <p className="text-[10px] text-muted-foreground sm:text-sm">{t("Total Pengguna")}</p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
        <AnimateIn stagger={2}>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-6">
              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2 sm:p-3">
                <UserCog className="h-4 w-4 text-red-600 dark:text-red-400 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-lg font-bold sm:text-2xl">{stats.admin}</p>
                <p className="text-[10px] text-muted-foreground sm:text-sm">{t("Admin")}</p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
        <AnimateIn stagger={3}>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-6">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-lg font-bold sm:text-2xl">{stats.guru}</p>
                <p className="text-[10px] text-muted-foreground sm:text-sm">{t("Guru")}</p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
        <AnimateIn stagger={4}>
          <Card>
            <CardContent className="flex items-center gap-2 p-3 sm:gap-4 sm:p-6">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2 sm:p-3">
                <GraduationCap className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-lg font-bold sm:text-2xl">{stats.siswa}</p>
                <p className="text-[10px] text-muted-foreground sm:text-sm">{t("Siswa")}</p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
      </div>

      <AnimateIn stagger={5}>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("Cari pengguna...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 sm:h-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="h-9 w-full sm:h-10 sm:w-[150px]">
              <SelectValue placeholder={t("Filter berdasarkan role")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Semua Role")}</SelectItem>
              <SelectItem value="ADMIN">{t("Admin")}</SelectItem>
              <SelectItem value="GURU">{t("Guru")}</SelectItem>
              <SelectItem value="SISWA">{t("Siswa")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AnimateIn>

      <AnimateIn stagger={6}>
        <div className="space-y-6">
          {/* Admin Section */}
          {(filterRole === "all" || filterRole === "ADMIN") && adminUsers.length > 0 && (
            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-red-600 dark:text-red-400" />
                  {t("Admin")} ({adminUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile Card List */}
                <div className="divide-y sm:hidden">
                  {adminUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={user.foto || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {user.nama.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{user.nama}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <Badge variant="secondary" className="mt-1 text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Admin
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/users/edit/${user.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("Edit")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user.id, user.nama)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("Hapus")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-x-auto sm:block sm:p-6 sm:pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">{t("Pengguna")}</TableHead>
                        <TableHead>{t("Username")}</TableHead>
                        <TableHead>{t("Role")}</TableHead>
                        <TableHead className="hidden md:table-cell">{t("Tanggal Bergabung")}</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.foto || "/placeholder.svg"} />
                                <AvatarFallback className="text-sm">
                                  {user.nama.split(" ").map((n: string) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-medium">{user.nama}</p>
                                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.username || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Admin
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">
                            {format(user.createdAt, "MMM d, yyyy", { locale: dateLocale })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/users/edit/${user.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t("Edit")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteUser(user.id, user.nama)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t("Hapus")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guru Section */}
          {(filterRole === "all" || filterRole === "GURU") && guruUsers.length > 0 && (
            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {t("Guru")} ({guruUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile Card List */}
                <div className="divide-y sm:hidden">
                  {guruUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={user.foto || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {user.nama.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{user.nama}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <Badge variant="secondary" className="mt-1 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Guru
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/users/edit/${user.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("Edit")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user.id, user.nama)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("Hapus")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-x-auto sm:block sm:p-6 sm:pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">{t("Pengguna")}</TableHead>
                        <TableHead>{t("Username")}</TableHead>
                        <TableHead>{t("Role")}</TableHead>
                        <TableHead className="hidden md:table-cell">{t("Tanggal Bergabung")}</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guruUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.foto || "/placeholder.svg"} />
                                <AvatarFallback className="text-sm">
                                  {user.nama.split(" ").map((n: string) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-medium">{user.nama}</p>
                                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.username || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Guru
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">
                            {format(user.createdAt, "MMM d, yyyy", { locale: dateLocale })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/users/edit/${user.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t("Edit")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteUser(user.id, user.nama)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t("Hapus")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Siswa Section */}
          {(filterRole === "all" || filterRole === "SISWA") && siswaUsers.length > 0 && (
            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  {t("Siswa")} ({siswaUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile Card List */}
                <div className="divide-y sm:hidden">
                  {siswaUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={user.foto || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {user.nama.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{user.nama}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Siswa
                            </Badge>
                            {user.kelas && (
                              <Badge variant="outline" className="text-[10px]">
                                {user.kelas}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/users/edit/${user.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("Edit")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user.id, user.nama)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("Hapus")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>

                {/* Desktop Table for Siswa with additional columns */}
                <div className="hidden overflow-x-auto sm:block sm:p-6 sm:pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">{t("Pengguna")}</TableHead>
                        <TableHead>{t("Username")}</TableHead>
                        <TableHead>{t("Kelas")}</TableHead>
                        <TableHead>{t("Role")}</TableHead>
                        <TableHead className="hidden md:table-cell">{t("Tanggal Bergabung")}</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {siswaUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.foto || "/placeholder.svg"} />
                                <AvatarFallback className="text-sm">
                                  {user.nama.split(" ").map((n: string) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-medium">{user.nama}</p>
                                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.username || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">{user.kelas || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Siswa
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">
                            {format(user.createdAt, "MMM d, yyyy", { locale: dateLocale })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/users/edit/${user.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t("Edit")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteUser(user.id, user.nama)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t("Hapus")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AnimateIn>
    </div>
  )
}
