import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/asesmen/:id/attempt
// Creates an attempt record (or returns existing active attempt) for a student.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params
    const body = await request.json()
    const { siswaId } = body as { siswaId?: string }

    if (!siswaId) {
      return NextResponse.json({ error: 'siswaId diperlukan' }, { status: 400 })
    }

    const asesmen = await prisma.asesmen.findUnique({
      where: { id: asesmenId },
      select: { id: true, courseId: true, tipe: true },
    })

    if (!asesmen) {
      return NextResponse.json({ error: 'Asesmen tidak ditemukan' }, { status: 404 })
    }
    if (asesmen.tipe !== 'KUIS') {
      return NextResponse.json({ error: 'Asesmen ini bukan kuis' }, { status: 400 })
    }

    // Must be enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: { siswaId, courseId: asesmen.courseId },
      select: { id: true },
    })
    if (!enrollment) {
      return NextResponse.json({ error: 'Anda tidak terdaftar di course ini' }, { status: 403 })
    }

    const attempt = await prisma.kuisAttempt.upsert({
      where: { siswaId_asesmenId_attempt: { siswaId, asesmenId } },
      update: {
        // If already submitted, keep it as-is (retake is done via reset endpoint)
      },
      create: {
        siswaId,
        asesmenId,
      },
    })

    return NextResponse.json({ attempt })
  } catch (error) {
    console.error('Error creating attempt:', error)
    return NextResponse.json({ error: 'Gagal membuat attempt' }, { status: 500 })
  }
}
