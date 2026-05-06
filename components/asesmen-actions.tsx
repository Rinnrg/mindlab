"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"

interface AsesmenActionsProps {
  asesmenId: string
  asesmenNama: string
  userRole: string
  courseId: string
}

export function AsesmenActions({ asesmenId, asesmenNama, userRole, courseId }: AsesmenActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  // Only show actions for GURU and ADMIN
  if (userRole !== 'GURU' && userRole !== 'ADMIN') {
    return null
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/asesmen/${asesmenId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus asesmen')
      }

      toast({
        title: "Berhasil",
        description: "Asesmen berhasil dihapus",
      })

      setShowDeleteDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting asesmen:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus asesmen",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    router.push(`/courses/${courseId}/${asesmenId}/edit`)
  }

  const handleCopy = async () => {
    setIsCopying(true)
    try {
      const response = await fetch(`/api/asesmen/${asesmenId}/copy`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyalin asesmen')
      }

      toast({
        title: "Berhasil",
        description: `Asesmen "${asesmenNama}" berhasil disalin dengan nama "${data.nama}"`,
      })

      router.refresh()
    } catch (error) {
      console.error('Error copying asesmen:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyalin asesmen",
        variant: "destructive",
      })
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={handleEdit}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleCopy}
          disabled={isCopying}
        >
          <Copy className="h-4 w-4" />
          {isCopying ? "Menyalin..." : "Salin"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
          Hapus
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus asesmen <strong>{asesmenNama}</strong>. Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait termasuk soal dan nilai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
