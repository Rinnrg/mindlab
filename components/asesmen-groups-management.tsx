"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Trash2, Users, UserPlus, Crown } from "lucide-react"

type Student = {
  id: string
  nama: string
  email?: string
  foto?: string | null
  kelas?: string | null
}

type Kelompok = {
  id: string
  nama: string
  ketua?: Student | null
  ketuaId?: string | null
  anggota: { id: string; siswa: Student }[]
  _count?: { anggota: number }
}

export default function AsesmenGroupsManagement({
  asesmenId,
  title,
}: {
  asesmenId: string
  title?: string
}) {
  const { success, error: showError, confirm, AlertComponent } = useAdaptiveAlert()

  const [kelompok, setKelompok] = useState<Kelompok[]>([])
  const [loading, setLoading] = useState(true)

  const [creating, setCreating] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")

  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false)
  const [activeKelompokId, setActiveKelompokId] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [savingMembers, setSavingMembers] = useState(false)

  const activeKelompok = useMemo(
    () => kelompok.find((k) => k.id === activeKelompokId) || null,
    [kelompok, activeKelompokId]
  )

  const loadKelompok = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/asesmen/${asesmenId}/kelompok`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Gagal memuat kelompok")
      setKelompok(Array.isArray(data.kelompok) ? data.kelompok : [])
    } catch (e) {
      console.error(e)
      showError("Gagal", e instanceof Error ? e.message : "Gagal memuat kelompok")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKelompok()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asesmenId])

  const handleCreate = async () => {
    const nama = newGroupName.trim()
    if (!nama) {
      showError("Error", "Nama kelompok wajib diisi")
      return
    }
    try {
      setCreating(true)
      const res = await fetch(`/api/asesmen/${asesmenId}/kelompok`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Gagal membuat kelompok")
      await success("Berhasil", "Kelompok dibuat")
      setNewGroupName("")
      loadKelompok()
    } catch (e) {
      showError("Gagal", e instanceof Error ? e.message : "Gagal membuat kelompok")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKelompok = async (k: Kelompok) => {
    await confirm("Hapus Kelompok", {
      description: `Hapus kelompok "${k.nama}"? Anggota di dalamnya akan ikut terhapus.`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "warning",
      onConfirm: async () => {
        const res = await fetch(`/api/asesmen/${asesmenId}/kelompok/${k.id}`, { method: "DELETE" })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          showError("Gagal", data?.error || "Gagal menghapus")
          return
        }
        await success("Berhasil", "Kelompok dihapus")
        loadKelompok()
      },
    })
  }

  const openMemberDialog = async (kelompokId: string) => {
    setActiveKelompokId(kelompokId)
    setIsMemberDialogOpen(true)
    setLoadingStudents(true)

    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/kelompok/${kelompokId}/anggota`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Gagal memuat siswa")
      const list = Array.isArray(data.students) ? data.students : []
      setStudents(list)

      const current = kelompok.find((k) => k.id === kelompokId)
      const selected = current?.anggota?.map((a) => a.siswa.id) || []
      setSelectedIds(selected)
    } catch (e) {
      showError("Gagal", e instanceof Error ? e.message : "Gagal memuat siswa")
    } finally {
      setLoadingStudents(false)
    }
  }

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const saveMembers = async () => {
    if (!activeKelompok) return
    try {
      setSavingMembers(true)
      const res = await fetch(`/api/asesmen/${asesmenId}/kelompok/${activeKelompok.id}/anggota`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siswaIds: selectedIds }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Gagal menyimpan anggota")
      await success("Berhasil", "Anggota tersimpan")
      setIsMemberDialogOpen(false)
      setActiveKelompokId("")
      loadKelompok()
    } catch (e) {
      showError("Gagal", e instanceof Error ? e.message : "Gagal menyimpan anggota")
    } finally {
      setSavingMembers(false)
    }
  }

  const setKetua = async (kelompokId: string, ketuaId: string | null) => {
    const res = await fetch(`/api/asesmen/${asesmenId}/kelompok/${kelompokId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ketuaId }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      showError("Gagal", data?.error || "Gagal set ketua")
      return
    }
    loadKelompok()
  }

  return (
    <div className="space-y-4">
      <AlertComponent />

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            {title ? `Kelompok: ${title}` : "Kelompok"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nama kelompok baru"
            />
            <Button type="button" onClick={handleCreate} disabled={creating} className="sm:w-[180px]">
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Buat Kelompok
            </Button>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Memuat kelompok...</div>
          ) : kelompok.length === 0 ? (
            <div className="text-sm text-muted-foreground">Belum ada kelompok.</div>
          ) : (
            <div className="space-y-2">
              {kelompok.map((k, idx) => (
                <div key={k.id} className="rounded-2xl border border-border/50 bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">Kelompok {idx + 1}</Badge>
                        <div className="font-semibold truncate">{k.nama}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {k._count?.anggota ?? k.anggota?.length ?? 0} anggota
                      </div>

                      {k.ketua && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-medium">Ketua:</span>
                          <span className="truncate">{k.ketua.nama}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openMemberDialog(k.id)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Anggota
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteKelompok(k)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {Array.isArray(k.anggota) && k.anggota.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {k.anggota.map((a) => (
                        <Badge key={a.id} variant="outline" className="max-w-full truncate">
                          {a.siswa.nama}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {Array.isArray(k.anggota) && k.anggota.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Set Ketua</div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={k.ketuaId ? "outline" : "default"}
                          onClick={() => setKetua(k.id, null)}
                        >
                          Tanpa Ketua
                        </Button>
                        {k.anggota.map((a) => (
                          <Button
                            key={a.id}
                            type="button"
                            size="sm"
                            variant={k.ketuaId === a.siswa.id ? "default" : "outline"}
                            onClick={() => setKetua(k.id, a.siswa.id)}
                          >
                            {a.siswa.nama}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Atur Anggota Kelompok</DialogTitle>
            <DialogDescription>
              Centang siswa untuk menambah/menghapus dari kelompok. Satu siswa hanya boleh ada di satu kelompok.
            </DialogDescription>
          </DialogHeader>

          {loadingStudents ? (
            <div className="py-8 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memuat siswa...
            </div>
          ) : (
            <ScrollArea className="h-[420px] pr-3">
              <div className="space-y-2">
                {students.map((s) => {
                  const checked = selectedIds.includes(s.id)
                  const alreadyInOtherGroup = kelompok.some(
                    (k) => k.id !== activeKelompokId && k.anggota?.some((a) => a.siswa.id === s.id)
                  )

                  return (
                    <label
                      key={s.id}
                      className={
                        "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition bg-background/30 " +
                        (alreadyInOtherGroup ? "opacity-50 cursor-not-allowed" : "hover:bg-background/50")
                      }
                    >
                      <Checkbox
                        checked={checked}
                        disabled={alreadyInOtherGroup}
                        onCheckedChange={() => {
                          if (alreadyInOtherGroup) return
                          toggleStudent(s.id)
                        }}
                      />
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={s.foto || undefined} />
                        <AvatarFallback>{(s.nama || "S").slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{s.nama}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {s.email || ""}{s.kelas ? ` • ${s.kelas}` : ""}
                        </div>
                      </div>
                      {alreadyInOtherGroup && <Badge variant="secondary">Sudah di kelompok lain</Badge>}
                    </label>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
              Batal
            </Button>
            <Button type="button" onClick={saveMembers} disabled={savingMembers}>
              {savingMembers ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
