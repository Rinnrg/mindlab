import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ 
    id: string
    itemId: string
  }>
}

// Component untuk Materi
async function MateriDetailPage({ courseId, itemId }: { courseId: string, itemId: string }) {
  const { default: MateriDetailClient } = await import('./materi-detail-client')
  
  try {
    const materi = await prisma.materi.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        judul: true,
        deskripsi: true,
        tgl_unggah: true,
        lampiran: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        courseId: true,
        fileData: false,
        course: {
          select: {
            id: true,
            judul: true,
            guru: {
              select: {
                id: true,
                nama: true,
                email: true,
                foto: true,
              },
            },
          },
        },
      },
    })

    if (!materi || materi.courseId !== courseId) {
      notFound()
    }

    // Check if file data exists
    const hasFileData = materi.fileSize != null && materi.fileSize > 0

    // Fetch all materi from the same course for sidebar
    const allMateri = await prisma.materi.findMany({
      where: { courseId },
      orderBy: { tgl_unggah: 'asc' },
      select: {
        id: true,
        judul: true,
        tgl_unggah: true,
      },
    })

    // Create clean objects without circular references
    const cleanMateri = {
      id: materi.id,
      judul: materi.judul,
      deskripsi: materi.deskripsi,
      tgl_unggah: materi.tgl_unggah,
      lampiran: materi.lampiran,
      fileName: materi.fileName,
      fileType: materi.fileType,
      fileSize: materi.fileSize,
      courseId: materi.courseId,
      hasFileData,
      course: {
        id: materi.course.id,
        judul: materi.course.judul,
        guru: {
          id: materi.course.guru.id,
          nama: materi.course.guru.nama,
          email: materi.course.guru.email,
          foto: materi.course.guru.foto,
        },
      },
    }

    const cleanAllMateri = allMateri.map(item => ({
      id: item.id,
      judul: item.judul,
      tgl_unggah: item.tgl_unggah,
    }))

    return (
      <MateriDetailClient 
        materi={cleanMateri}
        allMateri={cleanAllMateri}
        courseId={courseId}
      />
    )
  } catch (error) {
    console.error("Database error in MateriDetailPage:", error)
    notFound()
  }
}

// Component untuk Asesmen  
async function AsesmenDetailPage({ courseId, itemId }: { courseId: string, itemId: string }) {
  const { default: AsesmenDetailClient } = await import('./asesmen-detail-client')
  
  return <AsesmenDetailClient courseId={courseId} asesmenId={itemId} />
}

export const dynamic = 'force-dynamic'

export default async function ItemDetailPage({ params }: PageProps) {
  const { id: courseId, itemId } = await params

  try {
    // Cek apakah itemId adalah materi
    const materi = await prisma.materi.findUnique({
      where: { id: itemId },
      select: { id: true, courseId: true }
    })

    if (materi && materi.courseId === courseId) {
      return <MateriDetailPage courseId={courseId} itemId={itemId} />
    }

    // Cek apakah itemId adalah asesmen
    const asesmen = await prisma.asesmen.findUnique({
      where: { id: itemId },
      select: { id: true, courseId: true }
    })

    if (asesmen && asesmen.courseId === courseId) {
      return <AsesmenDetailPage courseId={courseId} itemId={itemId} />
    }

    // Jika tidak ditemukan keduanya
    notFound()
  } catch (error) {
    console.error("Database error in ItemDetailPage:", error)
    notFound()
  }
}
