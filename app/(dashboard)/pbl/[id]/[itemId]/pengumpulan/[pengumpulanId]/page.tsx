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
          tipePengerjaan: true,
          guru: {
            select: {
              id: true,
              nama: true,
            },
          },
        },
      },
      kelompok: {
        select: {
          id: true,
          nama: true,
          ketuaId: true,
          ketua: {
            select: {
              id: true,
              nama: true,
              email: true,
              foto: true,
            },
          },
          anggotaIds: true,
        },
      },
    },
  })

  if (!pengumpulan) {
    notFound()
  }

  // Hydrate info anggota kelompok dari anggotaIds (schema Kelompok menyimpan anggotaIds saja).
  let kelompokAnggota: Array<{ id: string; nama: string; email: string; foto: string | null }> = []
  if (pengumpulan.kelompok?.anggotaIds?.length) {
    const users = await prisma.user.findMany({
      where: { id: { in: pengumpulan.kelompok.anggotaIds } },
      select: { id: true, nama: true, email: true, foto: true },
    })
    // Preserve order from anggotaIds
    const byId = new Map(users.map((u) => [u.id, u]))
    kelompokAnggota = pengumpulan.kelompok.anggotaIds
      .map((uid) => byId.get(uid))
      .filter(Boolean) as any
  }

  // Convert binary data to boolean/null before passing to Client Component
  // to avoid "Uint8Array objects are not supported" error
  const pengumpulanData = {
    ...pengumpulan,
    hasFileData: !!pengumpulan.fileData,
  fileData: null, // Remove binary data
  // attach hydrated members for client UI
  kelompokAnggota,
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
