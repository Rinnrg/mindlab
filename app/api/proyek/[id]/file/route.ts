import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const proyek = await prisma.pBL.findUnique({
      where: { id },
      select: {
        fileData: true,
        fileName: true,
        fileType: true,
        fileSize: true,
      },
    }) as any

    if (!proyek || !proyek.fileData) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 404 }
      )
    }

    // Return file with proper headers
    return new NextResponse(Buffer.from(proyek.fileData), {
      headers: {
        'Content-Type': proyek.fileType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${proyek.fileName || 'file'}"`,
        'Content-Length': String(proyek.fileSize || proyek.fileData.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil file' },
      { status: 500 }
    )
  }
}
