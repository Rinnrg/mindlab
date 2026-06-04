import * as React from "react"
import { Button } from "@/components/ui/button"

export function PreviousGroupsSelector({ courseId, students, onApplyGroup }: { courseId: string; students: any[]; onApplyGroup: (g: any) => void }) {
  const [previousByAsesmen, setPreviousByAsesmen] = React.useState<Record<string, any>>({})
  const [selectedAsesmenChecks, setSelectedAsesmenChecks] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (!courseId) return
    let cancelled = false
    const fetchPrevious = async () => {
      try {
        const res = await fetch(`/api/pengumpulan?proyekId=${courseId}`)
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (cancelled) return
        const items = data?.pengumpulan || []
        const map: Record<string, any> = {}
        for (const p of items) {
          const a = p.asesmen || { id: p.asesmenId, nama: p.asesmenNama }
          const aid = a?.id || String(p.asesmenId || 'unknown')
          if (!map[aid]) map[aid] = { asesmenId: aid, nama: a?.nama || `Asesmen ${aid}`, groups: new Map() }
          const key = p.kelompokId || (`name:${p.namaKelompok || ''}`)
          if (!map[aid].groups.has(key)) {
            map[aid].groups.set(key, {
              key,
              kelompokId: p.kelompokId || null,
              namaKelompok: p.namaKelompok || null,
              ketua: p.ketua || null,
              anggota: p.anggota || null,
              submittedBy: p.siswaId || null,
              raw: p,
            })
          }
        }
        const final: Record<string, any> = {}
        for (const k of Object.keys(map)) {
          final[k] = { asesmenId: map[k].asesmenId, nama: map[k].nama, groups: Array.from(map[k].groups.values()) }
        }
        setPreviousByAsesmen(final)
      } catch (err) {
        // ignore
      }
    }
    void fetchPrevious()
    return () => { cancelled = true }
  }, [courseId])

  return (
    <div className="space-y-3">
      {Object.keys(previousByAsesmen).length === 0 ? (
        <div className="text-sm text-muted-foreground">Belum ada pengumpulan sebelumnya atau data belum dimuat.</div>
      ) : (
        <div className="space-y-2">
          {Object.values(previousByAsesmen).map((pa: any) => (
            <div key={pa.asesmenId} className="p-2 border rounded">
              <div className="flex items-center gap-2">
                <input
                  id={`prev-${pa.asesmenId}`}
                  type="checkbox"
                  checked={!!selectedAsesmenChecks[pa.asesmenId]}
                  onChange={(e) => setSelectedAsesmenChecks((s) => ({ ...s, [pa.asesmenId]: e.target.checked }))}
                />
                <label htmlFor={`prev-${pa.asesmenId}`} className="font-medium">{pa.nama}</label>
              </div>
              {selectedAsesmenChecks[pa.asesmenId] && (
                <div className="mt-2 space-y-2">
                  {pa.groups.map((g: any) => (
                    <div key={g.key} className="flex items-center justify-between">
                      <div className="text-sm">{g.namaKelompok || `Kelompok oleh ${g.submittedBy}`}</div>
                      <Button size="sm" onClick={() => {
                        const groupObj: any = {
                          nama: g.namaKelompok || g.kelompokId || 'Kelompok',
                          anggota: Array.isArray(g.anggota) ? g.anggota : undefined,
                          anggotaIds: Array.isArray(g.anggota) ? g.anggota.map((a: any) => a.siswaId).filter(Boolean) : undefined,
                          ketuaId: undefined,
                        }
                        if (g.ketua) {
                          const ket = students.find((s: any) => s.nama === g.ketua || s.id === g.ketua)
                          if (ket) groupObj.ketuaId = ket.id
                        }
                        onApplyGroup(groupObj)
                      }}>Gunakan</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
