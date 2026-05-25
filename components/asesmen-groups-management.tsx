"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { Loader2, Plus, Trash2, Users, UserPlus, X } from "lucide-react"

type Student = {
  id: string
  nama?: string | null
  foto?: string | null
  email?: string | null
  kelas?: string | null
}

type Group = {
  id: string
  nama: string
  ketuaId?: string | null
  anggotaIds: string[]
}

export default function AsesmenGroupsManagement(props: { asesmenId: string; courseId?: string }) {
  const { asesmenId, courseId } = props
  const { error: showError, success: showSuccess, AlertComponent } = useAdaptiveAlert()

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const [groups, setGroups] = React.useState<Group[]>([])
  const [students, setStudents] = React.useState<Student[]>([])

  const [newGroupName, setNewGroupName] = React.useState("")
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null)
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<Set<string>>(new Set())

  const selectedGroup = React.useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  )

  const membersInAnyGroup = React.useMemo(() => {
    const set = new Set<string>()
    for (const g of groups) for (const id of g.anggotaIds || []) set.add(id)
    return set
  }, [groups])

  const availableStudents = React.useMemo(() => {
    // Default: siswa yang belum masuk kelompok manapun
    return students.filter((s) => !membersInAnyGroup.has(s.id))
  }, [students, membersInAnyGroup])

  const fetchAll = React.useCallback(async () => {
    try {
      setLoading(true)

      const [gRes, sRes] = await Promise.all([
        fetch(`/api/asesmen/${asesmenId}/kelompok`),
        courseId ? fetch(`/api/courses/${courseId}/students`) : Promise.resolve(null),
      ])

      if (!gRes.ok) {
        const err = await gRes.json().catch(() => null)
        throw new Error(err?.error || "Gagal mengambil data kelompok")
      }
      const gData = await gRes.json().catch(() => null)
      setGroups((gData?.kelompok || gData?.groups || []) as Group[])

      if (sRes) {
        if (!sRes.ok) {
          const err = await sRes.json().catch(() => null)
          throw new Error(err?.error || "Gagal mengambil data siswa")
        }
        const sData = await sRes.json().catch(() => null)
        setStudents((Array.isArray(sData) ? sData : (sData?.students || [])) as Student[])
      } else {
        setStudents([])
      }
    } catch (e: any) {
      showError("Error", e?.message || "Gagal memuat manajemen kelompok")
    } finally {
      setLoading(false)
    }
  }, [asesmenId, courseId, showError])

  React.useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const createGroup = async () => {
    const nama = newGroupName.trim()
    if (!nama) return

    setSaving(true)
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/kelompok`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Gagal membuat kelompok")

      setNewGroupName("")
      await showSuccess("Berhasil", "Kelompok dibuat")
      await fetchAll()
    } catch (e: any) {
      showError("Error", e?.message || "Gagal membuat kelompok")
    } finally {
      setSaving(false)
    }
  }

  const deleteGroup = async (kelompokId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/kelompok/${kelompokId}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Gagal menghapus kelompok")

      if (selectedGroupId === kelompokId) {
        setSelectedGroupId(null)
        setSelectedMemberIds(new Set())
      }
      await showSuccess("Berhasil", "Kelompok dihapus")
      await fetchAll()
    } catch (e: any) {
      showError("Error", e?.message || "Gagal menghapus kelompok")
    } finally {
      setSaving(false)
    }
  }

  const addMembers = async () => {
    if (!selectedGroupId) return
    const ids = Array.from(selectedMemberIds)
    if (ids.length === 0) return

    setSaving(true)
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/kelompok/${selectedGroupId}/anggota`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anggotaIds: ids }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Gagal menambah anggota")

      setSelectedMemberIds(new Set())
      await showSuccess("Berhasil", "Anggota ditambahkan")
      await fetchAll()
    } catch (e: any) {
      showError("Error", e?.message || "Gagal menambah anggota")
    } finally {
      setSaving(false)
    }
  }

  const removeMember = async (kelompokId: string, anggotaId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/kelompok/${kelompokId}/anggota`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anggotaId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Gagal menghapus anggota")

      await showSuccess("Berhasil", "Anggota dihapus")
      await fetchAll()
    } catch (e: any) {
      showError("Error", e?.message || "Gagal menghapus anggota")
    } finally {
      setSaving(false)
    }
  }

  const setKetua = async (kelompokId: string, ketuaId: string | null) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/asesmen/${asesmenId}/kelompok/${kelompokId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ketuaId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Gagal mengubah ketua")

      await showSuccess("Berhasil", "Ketua kelompok diperbarui")
      await fetchAll()
    } catch (e: any) {
      showError("Error", e?.message || "Gagal mengubah ketua")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AlertComponent />

      {!courseId ? (
        <div className="text-sm text-muted-foreground">
          Pilih course terlebih dulu untuk memuat daftar siswa.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <div className="font-semibold">Daftar Kelompok</div>
          </div>

          <div className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nama kelompok (mis. Kelompok 1)"
              disabled={saving}
            />
            <Button type="button" onClick={() => void createGroup()} disabled={saving || !newGroupName.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            {groups.length === 0 ? (
              <div className="text-sm text-muted-foreground">Belum ada kelompok.</div>
            ) : (
              groups.map((g) => {
                const active = g.id === selectedGroupId
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(g.id)
                      setSelectedMemberIds(new Set())
                    }}
                    className={
                      "w-full text-left rounded-xl border p-3 transition flex items-center justify-between gap-2 " +
                      (active
                        ? "bg-primary/10 border-primary/30"
                        : "bg-background/30 border-border/30 hover:bg-background/50")
                    }
                  >
                    <div>
                      <div className="font-medium text-sm">{g.nama}</div>
                      <div className="text-xs text-muted-foreground">{(g.anggotaIds || []).length} anggota</div>
                    </div>
                    <Badge variant={active ? "default" : "secondary"} className="shrink-0">
                      {(g.anggotaIds || []).length}
                    </Badge>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Detail Kelompok</div>
              <div className="text-xs text-muted-foreground">
                {selectedGroup ? `Kelola anggota untuk ${selectedGroup.nama}` : "Pilih kelompok di kiri"}
              </div>
            </div>

            {selectedGroup ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => void deleteGroup(selectedGroup.id)}
                disabled={saving}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            ) : null}
          </div>

          {selectedGroup ? (
            <>
              <div className="space-y-2">
                <Label>Ketua Kelompok</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={selectedGroup.ketuaId ? "default" : "secondary"}>
                    {selectedGroup.ketuaId
                      ? (students.find((s) => s.id === selectedGroup.ketuaId)?.nama || selectedGroup.ketuaId)
                      : "Belum ditentukan"}
                  </Badge>
                  <div className="text-xs text-muted-foreground">Pilih ketua dari anggota di bawah.</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Anggota ({selectedGroup.anggotaIds.length})</Label>
                {selectedGroup.anggotaIds.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Belum ada anggota.</div>
                ) : (
                  <div className="space-y-2">
                    {selectedGroup.anggotaIds.map((id) => {
                      const s = students.find((x) => x.id === id)
                      const isKetua = selectedGroup.ketuaId === id
                      return (
                        <div key={id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {s?.nama || id}{isKetua ? " (Ketua)" : ""}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {s?.kelas ? `Kelas ${s.kelas}` : ""}{s?.email ? (s?.kelas ? ` • ${s.email}` : s.email) : ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant={isKetua ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => void setKetua(selectedGroup.id, id)}
                              disabled={saving}
                            >
                              Ketua
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => void removeMember(selectedGroup.id, id)}
                              disabled={saving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tambahkan anggota</Label>
                {courseId ? (
                  availableStudents.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Semua siswa sudah masuk kelompok.</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-auto pr-1">
                        {availableStudents.map((s) => {
                          const checked = selectedMemberIds.has(s.id)
                          return (
                            <label
                              key={s.id}
                              className="flex items-center justify-between gap-2 rounded-lg border p-3 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    const next = new Set(selectedMemberIds)
                                    if (Boolean(v)) next.add(s.id)
                                    else next.delete(s.id)
                                    setSelectedMemberIds(next)
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{s.nama || s.id}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {s.kelas ? `Kelas ${s.kelas}` : ""}{s.email ? (s.kelas ? ` • ${s.email}` : s.email) : ""}
                                  </div>
                                </div>
                              </div>
                              {s.kelas ? <Badge variant="secondary">{s.kelas}</Badge> : null}
                            </label>
                          )
                        })}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={() => void addMembers()}
                          disabled={saving || selectedMemberIds.size === 0}
                        >
                          {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="mr-2 h-4 w-4" />
                          )}
                          Tambah ({selectedMemberIds.size})
                        </Button>
                      </div>
                    </>
                  )
                ) : (
                  <div className="text-sm text-muted-foreground">Daftar siswa belum tersedia.</div>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Pilih satu kelompok untuk mulai mengelola anggota.</div>
          )}
        </Card>
      </div>
    </div>
  )
}
