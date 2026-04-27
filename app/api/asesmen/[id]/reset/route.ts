import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/asesmen/:id/reset
// Teacher/admin resets a student's quiz attempt so they can retake.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params
    const body = await request.json()
    const { siswaId, userId, userRole } = body as {
      siswaId?: string
      userId?: string
      userRole?: string
    }

    if (!siswaId || !userId || !userRole) {
      return NextResponse.json(
        { error: 'siswaId, userId, dan userRole diperlukan' },
        { status: 400 }
      )
    }
    if (userRole !== 'GURU' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
    }

    const asesmen = await prisma.asesmen.findUnique({
      where: { id: asesmenId },
      select: { id: true, courseId: true, guruId: true, tipe: true },
    })
    if (!asesmen) {
      return NextResponse.json({ error: 'Asesmen tidak ditemukan' }, { status: 404 })
    }
    if (asesmen.tipe !== 'KUIS') {
      return NextResponse.json({ error: 'Asesmen ini bukan kuis' }, { status: 400 })
    }
    if (userRole === 'GURU' && asesmen.guruId !== userId) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
    }

    // Ensure student enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: { siswaId, courseId: asesmen.courseId },
      select: { id: true },
    })
    if (!enrollment) {
      return NextResponse.json({ error: 'Siswa tidak terdaftar di course ini' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
  const prevAttempt = await tx.kuisAttempt.findUnique({
        where: { siswaId_asesmenId_attempt: { siswaId, asesmenId } },
        select: { id: true, attemptNo: true },
      })

      // Remove nilai (cascades JawabanSiswa via nilaiId relation)
      await tx.nilai.deleteMany({ where: { siswaId, asesmenId } })

      // Also delete any remaining answers that might not have nilaiId
      await tx.jawabanSiswa.deleteMany({
        where: {
          siswaId,
          soal: { asesmenId },
        },
      })

      // Reset attempt record by deleting & recreating to bump attemptNo
      if (prevAttempt) {
        await tx.kuisAttempt.delete({ where: { id: prevAttempt.id } })
      }

  const newAttempt = await tx.kuisAttempt.create({
        data: {
          siswaId,
          asesmenId,
          attemptNo: (prevAttempt?.attemptNo ?? 0) + 1,
          resetAt: new Date(),
          startedAt: new Date(),
          submittedAt: null,
        },
      })

      return { newAttempt }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error resetting quiz:', error)
    return NextResponse.json({ error: 'Gagal reset kuis' }, { status: 500 })
  }
}
