"use client"

import { useParams, useSearchParams } from "next/navigation"
import { AddAsesmenDialog } from "../add-asesmen-dialog"
import { AddMateriDialog } from "../add-materi-dialog"

export default function NewItemPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const courseId = params.id as string
  const type = searchParams.get('type') || 'materi'

  if (type === 'asesmen') {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <AddAsesmenDialog courseId={courseId} />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <AddMateriDialog courseId={courseId} />
    </div>
  )
}
