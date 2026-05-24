import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const materi = await prisma.materi.findUnique({
      where: { id },
      include: {
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
    })

    if (!materi) {
      return NextResponse.json(
        { error: 'Materi tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ materi })
  } catch (error) {
    console.error('Error fetching materi:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data materi' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { judul, deskripsi, lampiran, fileData, fileName, fileType, fileSize } = body

    console.log('Updating materi:', id, 'with data:', body)

    // Process file if provided
    let finalLampiran = lampiran
    if (fileData) {
      const { uploadToSupabase } = await import('@/lib/supabase')
      try {
        finalLampiran = await uploadToSupabase(fileData, fileName || 'lampiran', fileType || '')
      } catch (uploadError: any) {
        console.error('Supabase upload failed:', uploadError)
        return NextResponse.json(
          { error: 'Gagal mengupload file ke Supabase Storage: ' + (uploadError.message || String(uploadError)) },
          { status: 500 }
        )
      }
    }

    const materi = await prisma.materi.update({
      where: { id },
      data: {
        ...(judul && { judul }),
        ...(deskripsi !== undefined && { deskripsi }),
        ...(finalLampiran !== undefined && { lampiran: finalLampiran }),
        fileData: fileData ? null : undefined,
        ...(fileName !== undefined && { fileName }),
        ...(fileType !== undefined && { fileType }),
        ...(fileSize !== undefined && { fileSize }),
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

    console.log('Materi updated successfully:', materi)
    return NextResponse.json({ materi })
  } catch (error: any) {
    console.error('Error updating materi:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate materi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.materi.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Materi berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting materi:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus materi' },
      { status: 500 }
    )
  }
}
