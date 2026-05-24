import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log('Fetching file for asesmen:', id)

    const asesmen = await prisma.asesmen.findUnique({
      where: { id },
      select: {
        fileData: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        lampiran: true,
      },
    }) as any

    if (asesmen && asesmen.lampiran && asesmen.lampiran.startsWith('http')) {
      console.log('Redirecting to public URL for asesmen:', asesmen.lampiran)
      return NextResponse.redirect(asesmen.lampiran)
    }

    if (!asesmen || !asesmen.fileData) {
      console.log('File not found or no fileData for asesmen:', id)
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log('Serving file:', {
      fileName: asesmen.fileName,
      fileType: asesmen.fileType,
      fileSize: asesmen.fileSize,
      dataLength: asesmen.fileData.length
    })

    // Return file with proper headers
    return new NextResponse(Buffer.from(asesmen.fileData), {
      headers: {
        'Content-Type': asesmen.fileType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${asesmen.fileName || 'file'}"`,
        'Content-Length': String(asesmen.fileSize || asesmen.fileData.length),
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
