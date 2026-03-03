import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single course by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
        materi: true,
        asesmen: true,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data course' },
      { status: 500 }
    )
  }
}

// UPDATE course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { judul, deskripsi, gambar, kategori, guruId } = body

    console.log('Updating course:', id, 'with data:', body)

    // Build update data object
    const updateData: any = {}
    if (judul !== undefined) updateData.judul = judul
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi
    if (gambar !== undefined) updateData.gambar = gambar
    if (kategori !== undefined) updateData.kategori = kategori
    if (guruId !== undefined) updateData.guruId = guruId

    console.log('Update data:', updateData)

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        guru: {
          select: {
            id: true,
            nama: true,
            email: true,
            foto: true,
          },
        },
      },
    })

    console.log('Course updated successfully:', course)

    return NextResponse.json({ course }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating course:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate course' },
      { status: 500 }
    )
  }
}

// PATCH - Partial update course (untuk update guru, dll)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { judul, gambar, kategori, guruId } = body

    // Build update data object
    const updateData: any = {}
    if (judul !== undefined) updateData.judul = judul
    if (gambar !== undefined) updateData.gambar = gambar
    if (kategori !== undefined) updateData.kategori = kategori
    if (guruId !== undefined) updateData.guruId = guruId

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        guru: {
          select: {
            id: true,
            nama: true,
            email: true,
            foto: true,
          },
        },
      },
    })

    return NextResponse.json({ course }, { status: 200 })
  } catch (error: any) {
    console.error('Error patching course:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate course' },
      { status: 500 }
    )
  }
}

// DELETE course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.course.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Course berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus course' },
      { status: 500 }
    )
  }
}
