import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    // Optimized: Use select to exclude heavy fileData field
    const materi = await prisma.materi.findMany({
      where: courseId ? { courseId } : {},
      select: {
        id: true,
        judul: true,
        deskripsi: true,
        kelasTarget: true,
        tgl_unggah: true,
        lampiran: true,
        // Exclude fileData to reduce payload size
        fileName: true,
        fileType: true,
        fileSize: true,
        courseId: true,
        sintak: true,
  origin: true,
        course: {
          select: {
            id: true,
            judul: true,
            guru: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        },
      },
      orderBy: {
        tgl_unggah: 'desc',
      },
    })

    return NextResponse.json({ materi })
  } catch (error) {
    console.error('Error fetching materi:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data materi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
  const { judul, deskripsi, kelasTarget, lampiran, fileData, fileName, fileType, fileSize, courseId, sintak, origin } = body

    if (!judul || !courseId) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Ensure the Course exists (untuk kasus PBL, Course dibuat otomatis dengan ID yang sama dengan PBL).
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Kursus/PBL tidak ditemukan (courseId tidak valid)' },
        { status: 404 }
      )
    }

    // Process file if provided
    let finalLampiran = lampiran || null
    if (fileData) {
      const { uploadToSupabase } = await import('@/lib/supabase')
      try {
        const prefix = `course/${courseId}/materi`
        finalLampiran = await uploadToSupabase(fileData, fileName || 'lampiran', fileType || '', prefix)
      } catch (uploadError: any) {
        console.error('Supabase upload failed:', uploadError)
        return NextResponse.json(
          { error: 'Gagal mengupload file ke Supabase Storage: ' + (uploadError.message || String(uploadError)) },
          { status: 500 }
        )
      }
    }

    const materi = await prisma.materi.create({
      data: {
        judul,
        deskripsi,
        kelasTarget: kelasTarget || [],
        lampiran: finalLampiran,
        fileData: null,
        fileName,
        fileType,
        fileSize,
        courseId,
        sintak,
  origin: origin || 'COURSE',
      },
      include: {
        course: {
          select: {
            id: true,
            judul: true,
          },
        },
      },
    })

    return NextResponse.json({ materi }, { status: 201 })
  } catch (error) {
    console.error('Error creating materi:', error)
    return NextResponse.json(
      { error: 'Gagal membuat materi' },
      { status: 500 }
    )
  }
}
