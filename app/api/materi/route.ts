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
    const { judul, deskripsi, kelasTarget, lampiran, fileData, fileName, fileType, fileSize, courseId } = body

    if (!judul || !courseId) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Convert base64 file data to Buffer if provided
    let fileBuffer = null
    if (fileData) {
      // Remove data URL prefix if exists (e.g., "data:application/pdf;base64,")
      const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData
      fileBuffer = Buffer.from(base64Data, 'base64')
    }

    const materi = await prisma.materi.create({
      data: {
        judul,
        deskripsi,
        kelasTarget: kelasTarget || [],
        lampiran,
        fileData: fileBuffer,
        fileName,
        fileType,
        fileSize,
        courseId,
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
