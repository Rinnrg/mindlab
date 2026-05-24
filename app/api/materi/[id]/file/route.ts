import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log('Fetching file for materi:', id)

    const materi = await prisma.materi.findUnique({
      where: { id },
      select: {
        fileData: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        lampiran: true,
      },
    })

    if (materi && materi.lampiran && materi.lampiran.startsWith('http')) {
      console.log('Redirecting to public URL for materi:', materi.lampiran)
      return NextResponse.redirect(materi.lampiran)
    }

    let fileData = materi?.fileData
    let fileName = materi?.fileName
    let fileType = materi?.fileType
    let fileSize = materi?.fileSize

    if (!materi || !materi.fileData) {
      console.log('Materi file not found, checking if ID matches a PBL project:', id)
      const pbl = await prisma.pBL.findUnique({
        where: { id },
        select: {
          fileData: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          lampiran: true,
        }
      })

      if (pbl && pbl.lampiran && pbl.lampiran.startsWith('http')) {
        console.log('Redirecting to fallback PBL public URL:', pbl.lampiran)
        return NextResponse.redirect(pbl.lampiran)
      }

      if (pbl && pbl.fileData) {
        fileData = pbl.fileData
        fileName = pbl.fileName
        fileType = pbl.fileType
        fileSize = pbl.fileSize
      } else {
        console.log('File not found in both Materi and PBL for ID:', id)
        return NextResponse.json(
          { error: 'File tidak ditemukan' },
          { status: 404 }
        )
      }
    }

    console.log('Serving file:', {
      fileName: fileName,
      fileType: fileType,
      fileSize: fileSize,
      dataLength: fileData.length
    })

    // Return file with proper headers
    return new NextResponse(Buffer.from(fileData), {
      headers: {
        'Content-Type': fileType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${fileName || 'file'}"`,
        'Content-Length': String(fileSize || fileData.length),
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
