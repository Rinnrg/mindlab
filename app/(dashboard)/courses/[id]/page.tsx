import { notFound } from "next/navigation"
import CourseDetailClient from "./course-detail-client"
import { prisma } from "@/lib/prisma"
import type { Course, Asesmen } from "@/lib/types"

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params

  // Fetch course from database
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      guru: {
        select: {
          id: true,
          nama: true,
          email: true,
          foto: true,
        },
      },
      materi: {
        orderBy: {
          tgl_unggah: 'desc',
        },
      },
      asesmen: {
        include: {
          guru: {
            select: {
              id: true,
              nama: true,
            },
          },
        },
        orderBy: {
          nama: 'asc',
        },
      },
    },
  })

  // If course not found, show 404
  if (!course) {
    notFound()
  }

  // Transform data to match client component expectations
  const transformedCourse: Course = {
    id: course.id,
    judul: course.judul,
    deskripsi: course.deskripsi || undefined,
    gambar: course.gambar,
    kategori: course.kategori,
    guruId: course.guru?.id || '',
    guru: course.guru ? {
      id: course.guru.id,
      nama: course.guru.nama,
      email: course.guru.email,
      role: 'GURU' as const,
      foto: course.guru.foto || undefined,
      createdAt: new Date(),
    } : undefined,
    materi: course.materi.map((m) => ({
      id: m.id,
      judul: m.judul,
      deskripsi: m.deskripsi || undefined,
      kelasTarget: m.kelasTarget,
      tgl_unggah: m.tgl_unggah,
      lampiran: m.lampiran || undefined,
      courseId: course.id,
    })),
    asesmen: course.asesmen.map((a) => ({
      id: a.id,
      nama: a.nama,
      deskripsi: a.deskripsi || undefined,
      kelasTarget: a.kelasTarget,
      tipe: a.tipe,
      tipePengerjaan: a.tipePengerjaan,
      jml_soal: a.jml_soal,
      durasi: a.durasi,
      tgl_mulai: a.tgl_mulai,
      tgl_selesai: a.tgl_selesai,
      lampiran: a.lampiran,
      guruId: a.guruId,
      courseId: course.id,
    })),
  }

  // Transform assessments
  const assessments: Asesmen[] = course.asesmen.map((a) => ({
    id: a.id,
    nama: a.nama,
    deskripsi: a.deskripsi || undefined,
    tipe: a.tipe,
    tipePengerjaan: a.tipePengerjaan,
    jml_soal: a.jml_soal,
    durasi: a.durasi,
    tgl_mulai: a.tgl_mulai,
    tgl_selesai: a.tgl_selesai,
    lampiran: a.lampiran,
    guruId: a.guruId,
    courseId: course.id,
  }))

  return <CourseDetailClient course={transformedCourse} assessments={assessments} />
}
