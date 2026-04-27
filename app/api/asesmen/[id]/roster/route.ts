import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type StatusKuis = 'BELUM' | 'SEDANG' | 'SELESAI'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'userId dan userRole diperlukan' }, { status: 400 })
    }
    if (userRole !== 'GURU' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
    }

    const asesmen = await prisma.asesmen.findUnique({
      where: { id: asesmenId },
      select: {
        id: true,
        tipe: true,
        courseId: true,
        guruId: true,
      },
    })
    if (!asesmen) {
      return NextResponse.json({ error: 'Asesmen tidak ditemukan' }, { status: 404 })
    }
    if (asesmen.tipe !== 'KUIS') {
      return NextResponse.json({ error: 'Roster hanya untuk kuis' }, { status: 400 })
    }
    if (userRole === 'GURU' && asesmen.guruId !== userId) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: asesmen.courseId },
      include: {
        siswa: {
          select: {
            id: true,
            nama: true,
            email: true,
            kelas: true,
          },
        },
      },
      orderBy: [{ siswa: { kelas: 'asc' } }, { siswa: { nama: 'asc' } }],
    })

    const siswaIds = enrollments.map((e) => e.siswaId)

    const attempts = await prisma.kuisAttempt.findMany({
      where: { asesmenId, siswaId: { in: siswaIds } },
      select: {
        siswaId: true,
        attemptNo: true,
        startedAt: true,
        submittedAt: true,
      },
    })

    const nilai = await prisma.nilai.findMany({
      where: { asesmenId, siswaId: { in: siswaIds } },
      select: { siswaId: true, id: true },
    })

    const attemptBySiswa = new Map(attempts.map((a) => [a.siswaId, a]))
    const nilaiSet = new Set(nilai.map((n) => n.siswaId))

    const items = enrollments.map((e) => {
      const a = attemptBySiswa.get(e.siswaId)
      let status: StatusKuis = 'BELUM'
      if (nilaiSet.has(e.siswaId) || a?.submittedAt) status = 'SELESAI'
      else if (a) status = 'SEDANG'

      return {
        siswa: e.siswa,
        status,
        attemptNo: a?.attemptNo ?? null,
        startedAt: a?.startedAt ?? null,
        submittedAt: a?.submittedAt ?? null,
      }
    })

    // Group by kelas
    const grouped: Record<string, typeof items> = {}
    for (const it of items) {
      const k = it.siswa.kelas?.trim() || 'Tanpa Kelas'
      if (!grouped[k]) grouped[k] = []
      grouped[k].push(it)
    }

    return NextResponse.json({ grouped })
  } catch (error) {
    console.error('Error roster:', error)
    return NextResponse.json({ error: 'Gagal mengambil roster' }, { status: 500 })
  }
}
