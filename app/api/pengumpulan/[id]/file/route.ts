import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const pengumpulan = await prisma.pengumpulanProyek.findUnique({
    where: { id },
  })

  const data = pengumpulan as any

  if (!data || !data.fileData) {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
  }

  const fileName = data.fileName || `pengumpulan-${id}`
  const contentType = data.fileType || 'application/octet-stream'

  return new NextResponse(data.fileData, {
    headers: {
      'Content-Type': contentType,
      // inline for preview when possible (pdf/images); browser will download if it can't show
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  })
}
