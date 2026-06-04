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
import { PreviousGroupsSelector } from '@/components/previous-groups-selector'

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

  const [lastLoadError, setLastLoadError] = React.useState<string | null>(null)

  const [newGroupName, setNewGroupName] = React.useState("")
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null)
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<Set<string>>(new Set())
  const [groupNameEdit, setGroupNameEdit] = React.useState<string>("")
  const [selectedKetuaId, setSelectedKetuaId] = React.useState<string | null>(null)

  const selectedGroup = React.useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  )

  React.useEffect(() => {
    if (selectedGroup) {
      setGroupNameEdit(selectedGroup.nama || "")
      setSelectedKetuaId(selectedGroup.ketuaId || null)
    } else {
      setGroupNameEdit("")
      setSelectedKetuaId(null)
    }
  }, [selectedGroup])

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
  setLastLoadError(null)

      const [gRes, sRes] = await Promise.all([
        fetch(`/api/asesmen/${asesmenId}/kelompok`),
        courseId ? fetch(`/api/courses/${courseId}/students`) : Promise.resolve(null),
      ])

      if (!gRes.ok) {
  const err = await gRes.json().catch(() => null)
  const msg = err?.error || "Gagal mengambil data kelompok"
  const details = err?.details ? `\n${String(err.details)}` : ''
  throw new Error(String(msg) + details)
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
  setLastLoadError(e?.message || "Gagal memuat manajemen kelompok")
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

  const saveGroupChanges = async () => {
    if (!selectedGroupId) return
    setSaving(true)
    try {
      const body: any = {}
      if (typeof groupNameEdit === 'string') body.nama = groupNameEdit
      if (selectedKetuaId !== undefined) body.ketuaId = selectedKetuaId

      const res = await fetch(`/api/asesmen/${asesmenId}/kelompok/${selectedGroupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Gagal menyimpan perubahan kelompok')

      await showSuccess('Berhasil', 'Perubahan kelompok disimpan')
      await fetchAll()
    } catch (e: any) {
      showError('Error', e?.message || 'Gagal menyimpan perubahan kelompok')
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

      {lastLoadError ? (
        <Card className="p-4 border border-destructive/30 bg-destructive/5">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-destructive">Gagal mengambil kelompok</div>
            <div className="text-xs text-muted-foreground whitespace-pre-wrap">{lastLoadError}</div>
            <div className="pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => void fetchAll()}>
                Muat Ulang
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {!courseId ? (
        <div className="text-sm text-muted-foreground">Pilih course terlebih dulu untuk memuat daftar siswa.</div>
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

          {/* Previous groups importer - allows teacher to reuse groups from previous pengumpulan */}
          {courseId && (
            <div className="p-3 rounded border my-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Gunakan kelompok dari pengumpulan sebelumnya</div>
                <Button size="sm" variant="outline" onClick={() => window.open(`/api/pengumpulan?proyekId=${courseId}`, '_blank')}>Buka API</Button>
              </div>
              <PreviousGroupsSelector courseId={courseId} students={students} onApplyGroup={async (g: any) => {
                // Create new group then add anggota
                try {
                  setSaving(true)
                  const nama = g.nama || `Kelompok Impor`
                  const res = await fetch(`/api/asesmen/${asesmenId}/kelompok`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nama }),
                  })
                  const created = await res.json().catch(() => null)
                  if (!res.ok) throw new Error(created?.error || 'Gagal membuat kelompok')
                  const newId = created?.id || created?.kelompok?.id || created?.result?.id
                  const memberIds: string[] = g.anggotaIds || (Array.isArray(g.anggota) ? g.anggota.map((a: any) => a.siswaId).filter(Boolean) : [])
                  if (newId && memberIds.length > 0) {
                    const r2 = await fetch(`/api/asesmen/${asesmenId}/kelompok/${newId}/anggota`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ anggotaIds: memberIds }),
                    })
                    const added = await r2.json().catch(() => null)
                    if (!r2.ok) throw new Error(added?.error || 'Gagal menambahkan anggota ke kelompok')
                  }
                  await showSuccess('Berhasil', 'Kelompok berhasil diimpor')
                  await fetchAll()
                } catch (e: any) {
                  showError('Error', e?.message || 'Gagal mengimpor kelompok')
                } finally {
                  setSaving(false)
                }
              }} />
            </div>
          )}

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
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
                  <div className="text-center">
                    <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">Nama Kelompok</p>
                  </div>
                  <Input
                    value={groupNameEdit}
                    onChange={(e) => setGroupNameEdit(e.target.value)}
                    placeholder="Contoh: Kelompok 1"
                    className="rounded-xl border-primary/20 bg-background/60 h-11 font-bold text-center"
                    disabled={saving}
                    aria-label="Nama kelompok"
                  />
                  <p className="text-[10px] text-primary/70 text-center">
                    Nama ini akan dipakai saat pengumpulan.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-bold text-primary">Ketua (Pilih satu)</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
                    {(selectedGroup.anggotaIds || []).map((sid) => {
                      const student = students.find((s) => s.id === sid)
                      if (!student) return null
                      const isSelected = selectedKetuaId === student.id
                      return (
                        <button
                          key={`ketua-${student.id}`}
                          type="button"
                          onClick={() => setSelectedKetuaId(student.id)}
                          disabled={saving}
                          className={`flex items-center gap-3 p-2 rounded-xl border transition-all text-left ${isSelected ? 'border-primary bg-primary/20 shadow-sm' : 'border-border/30 hover:border-primary/50'}`}
                        >
                          <div className="h-8 w-8 rounded-full bg-muted/10 flex items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={student.foto || ''} alt={student.nama || ''} className="h-8 w-8 object-cover" />
                          </div>
                          <p className="text-xs font-bold truncate flex-1">{student.nama}</p>
                          {isSelected && <span className="text-primary text-sm">★</span>}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Ketua wajib dipilih untuk pengumpulan kelompok.</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">Anggota ({selectedGroup.anggotaIds.length})</Label>
                  <div className="space-y-3">
                    {selectedGroup.anggotaIds.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Belum ada anggota.</p>
                    ) : (
                      (selectedGroup.anggotaIds as string[]).map((aId) => {
                        const a = students.find((x) => x.id === aId)
                        return (
                          <div key={aId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-background/50 transition-colors">
                            <div className="h-9 w-9 rounded-full overflow-hidden border border-primary/20">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={a?.foto || ''} alt={a?.nama || ''} className="h-9 w-9 object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{a?.nama || aId}</p>
                              <p className="text-[10px] text-muted-foreground">Siswa Enrollment</p>
                            </div>
                            <div className="ml-auto">
                              <Button type="button" variant="ghost" size="sm" onClick={() => void removeMember(selectedGroup.id, aId)} disabled={saving} title="Hapus anggota">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button type="button" onClick={() => void saveGroupChanges()} disabled={saving || !groupNameEdit.trim()}>
                    Simpan Perubahan
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setSelectedGroupId(null); setSelectedMemberIds(new Set()) }}>
                    Tutup
                  </Button>
                </div>
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
