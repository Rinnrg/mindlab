'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ScheduledSubmitDialog({
  open,
  onOpenChange,
  deadline,
  initialDate,
  onConfirm,
  title = 'Pengumpulan terjadwal',
  description = 'Pilih tanggal & waktu. Sistem akan menahan pengumpulan (pending) sampai waktunya tiba.',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  deadline?: Date | null
  initialDate?: string
  onConfirm: (scheduledAtISO: string) => void
  title?: string
  description?: string
}) {
  const [scheduledLocal, setScheduledLocal] = useState(initialDate || '')

  useEffect(() => {
    if (!open) return
    setScheduledLocal(initialDate || '')
  }, [initialDate, open])

  const deadlineText = useMemo(() => {
    if (!deadline) return null
    try {
      return deadline.toLocaleString('id-ID')
    } catch {
      return String(deadline)
    }
  }, [deadline])

  const validate = () => {
    if (!scheduledLocal) return 'Silakan pilih tanggal dan waktu.'
    const selected = new Date(scheduledLocal)
    if (isNaN(selected.getTime())) return 'Tanggal/waktu tidak valid.'
    const now = new Date()
    // Allow past dates only if they are within the same calendar month and year as now.
    if (selected.getFullYear() !== now.getFullYear() || selected.getMonth() !== now.getMonth()) {
      return 'Waktu terjadwal harus berada di bulan yang sama dengan sekarang.'
    }
    if (deadline && selected > deadline) return 'Waktu terjadwal tidak boleh melewati deadline.'
    return null
  }

  const error = open ? validate() : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            {deadlineText ? (
              <span className="block mt-2 text-xs text-muted-foreground">Maksimal: {deadlineText}</span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="scheduledAt">Tanggal & waktu</Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            value={scheduledLocal}
            onChange={(e) => setScheduledLocal(e.target.value)}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            disabled={!!error}
            onClick={() => {
              const iso = new Date(scheduledLocal).toISOString()
              onConfirm(iso)
            }}
          >
            Jadwalkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
