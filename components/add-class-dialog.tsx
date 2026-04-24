"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"

interface AddClassDialogProps {
  onClassAdded?: (newClass: string) => void
}

export function AddClassDialog({ onClassAdded }: AddClassDialogProps) {
  const [open, setOpen] = useState(false)
  const [className, setClassName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { error: showError } = useAdaptiveAlert()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!className.trim()) {
      showError("Error", "Nama kelas harus diisi")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate adding class - in real app, you might call an API
      // For now, we'll just call the callback with the new class
      console.log("[DEBUG] AddClassDialog submitting class:", className);
      if (onClassAdded) {
        onClassAdded(className.trim())
      }
      setClassName("")
      setOpen(false)
    } catch (error) {
      showError("Error", "Gagal menambahkan kelas")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setClassName("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2" type="button">
          <Plus className="h-4 w-4 mr-1" />
          Tambah Kelas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah Kelas Baru</DialogTitle>
            <DialogDescription>
              Masukkan nama kelas baru yang akan ditambahkan ke daftar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="className">Nama Kelas</Label>
              <Input
                id="className"
                placeholder="Contoh: 10 IPA 1, XII RPL 2"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menambahkan..." : "Tambah Kelas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
