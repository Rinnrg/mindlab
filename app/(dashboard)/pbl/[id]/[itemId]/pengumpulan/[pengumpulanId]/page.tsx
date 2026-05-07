import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PengumpulanDetailClient from "./pengumpulan-detail-client"

interface PageProps {
  params: Promise<{
    id: string
    itemId: string
    pengumpulanId: string
  }>
}

export default async function PengumpulanDetailPage({ params }: PageProps) {
  const { id: courseId, itemId: asesmenId, pengumpulanId } = await params

  const pengumpulan = await prisma.pengumpulanProyek.findUnique({
    where: { id: pengumpulanId },
    include: {
      siswa: {
        select: {
          id: true,
          nama: true,
          email: true,
          foto: true,
        },
      },
      asesmen: {
        select: {
          id: true,
          nama: true,
          tipe: true,
          sintak: true,
          guru: {
            select: {
              id: true,
              nama: true,
            },
          },
        },
      },
    },
  })

  if (!pengumpulan) {
    notFound()
  }

  // Convert binary data to boolean/null before passing to Client Component
  // to avoid "Uint8Array objects are not supported" error
  const pengumpulanData = {
    ...pengumpulan,
    hasFileData: !!pengumpulan.fileData,
    fileData: null // Remove binary data
  }

  return (
    <div className="container mx-auto py-6 sm:py-10">
      <PengumpulanDetailClient 
        courseId={courseId} 
        asesmenId={asesmenId} 
        pengumpulan={pengumpulanData} 
      />
    </div>
  )
}
