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
    let cleanMateri
    let cleanAllMateri = []

    if (itemId === courseId) {
      const pbl = await prisma.pBL.findUnique({
        where: { id: itemId },
        include: {
          guru: {
            select: {
              id: true,
              nama: true,
              email: true,
              foto: true,
            }
          }
        }
      })

      if (!pbl || !pbl.fileName) {
        notFound()
      }

      const hasFileData = pbl.fileSize != null && pbl.fileSize > 0

      cleanMateri = {
        id: pbl.id,
        judul: pbl.fileName || "Materi PBL / Jobsheet",
        deskripsi: pbl.deskripsi,
        tgl_unggah: pbl.tgl_mulai,
        lampiran: pbl.lampiran,
        fileName: pbl.fileName,
        fileType: pbl.fileType,
        fileSize: pbl.fileSize,
        courseId: pbl.id,
        sintak: pbl.materiSintak || "1",
        hasFileData,
        course: {
          id: pbl.id,
          judul: pbl.judul,
          guru: {
            id: pbl.guru.id,
            nama: pbl.guru.nama,
            email: pbl.guru.email,
            foto: pbl.guru.foto,
          },
        },
      }

      cleanAllMateri = [{
        id: pbl.id,
        judul: pbl.fileName || "Materi PBL / Jobsheet",
        tgl_unggah: pbl.tgl_mulai,
        sintak: pbl.materiSintak || "1",
      }]
    } else {
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
          sintak: true,
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

      // Fetch all materi from the same course and same sintak for sidebar
      const allMateri = await prisma.materi.findMany({
        where: { 
          courseId,
          sintak: materi.sintak 
        },
        orderBy: { tgl_unggah: 'asc' },
        select: {
          id: true,
          judul: true,
          tgl_unggah: true,
          sintak: true,
        },
      })

      cleanMateri = {
        id: materi.id,
        judul: materi.judul,
        deskripsi: materi.deskripsi,
        tgl_unggah: materi.tgl_unggah,
        lampiran: materi.lampiran,
        fileName: materi.fileName,
        fileType: materi.fileType,
        fileSize: materi.fileSize,
        courseId: materi.courseId,
        sintak: materi.sintak,
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

      cleanAllMateri = allMateri.map(item => ({
        id: item.id,
        judul: item.judul,
        tgl_unggah: item.tgl_unggah,
        sintak: item.sintak,
      }))
    }

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
    // Jika itemId === courseId, ini adalah virtual materi PBL
    if (itemId === courseId) {
      return <MateriDetailPage courseId={courseId} itemId={itemId} />
    }

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
