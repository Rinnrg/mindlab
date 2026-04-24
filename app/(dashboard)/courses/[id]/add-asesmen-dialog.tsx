"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface AddAsesmenDialogProps {
  courseId: string
}

export function AddAsesmenDialog({ courseId }: AddAsesmenDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
    tipe_asesmen: "KUIS",
    deadline: undefined as Date | undefined,
    max_score: 100
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/asesmen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          courseId,
        }),
      })

      if (response.ok) {
        router.push(`/courses/${courseId}`)
        router.refresh()
      } else {
        console.error("Failed to create asesmen")
      }
    } catch (error) {
      console.error("Error creating asesmen:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Buat Asesmen Baru</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Asesmen Baru</CardTitle>
          <CardDescription>
            Isi informasi asesmen yang akan dibuat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Asesmen</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                placeholder="Masukkan nama asesmen"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                value={formData.deskripsi}
                onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                placeholder="Masukkan deskripsi asesmen"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipe">Tipe Asesmen</Label>
              <Select
                value={formData.tipe_asesmen}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipe_asesmen: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe asesmen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KUIS">Kuis</SelectItem>
                  <SelectItem value="TUGAS">Tugas</SelectItem>
                  <SelectItem value="UJIAN">Ujian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? (
                      format(formData.deadline, "PPP", { locale: id })
                    ) : (
                      <span>Pilih tanggal deadline</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_score">Skor Maksimal</Label>
              <Input
                id="max_score"
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData(prev => ({ ...prev, max_score: parseInt(e.target.value) }))}
                placeholder="100"
                min="1"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Membuat..." : "Buat Asesmen"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
