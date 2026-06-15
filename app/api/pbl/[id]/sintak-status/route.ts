import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: courseId } = await params
    const { searchParams } = new URL(request.url)
    const siswaId = searchParams.get('siswaId')

    if (!siswaId) {
      return NextResponse.json({ error: 'siswaId diperlukan' }, { status: 400 })
    }

    // Ambil semua asesmen PBL dari course ini
    const assessments = await prisma.asesmen.findMany({
      where: {
        courseId,
        origin: 'PBL',
      },
      select: {
        id: true,
        sintak: true,
        tipe: true,
        tipePengerjaan: true,
      },
    })

    // Cari kelompok milik siswa dalam PBL ini
    // (pblId sama dengan courseId pada sistem ini)
    const userKelompok = await prisma.kelompok.findFirst({
      where: {
        pblId: courseId,
        OR: [
          { ketuaId: siswaId },
          { anggotaIds: { has: siswaId } },
        ],
      },
      select: {
        id: true,
        ketuaId: true,
        anggotaIds: true,
      },
    })

    const SINTAKS = ['1', '2', '3', '4', '5']
    const completedSintaks: string[] = []

    for (const sintak of SINTAKS) {
      const sintakAssessments = assessments.filter(
        (a) => (a.sintak || '1') === sintak
      )

      // Jika tidak ada asesmen di sintak ini → dianggap selesai otomatis
      if (sintakAssessments.length === 0) {
        completedSintaks.push(sintak)
        continue
      }

      let allCompleted = true

      for (const assessment of sintakAssessments) {
        let completed = false
        const isKelompok = assessment.tipePengerjaan === 'KELOMPOK'

        if (assessment.tipe === 'KUIS') {
          if (isKelompok && userKelompok) {
            // KUIS KELOMPOK: cek apakah salah satu anggota sudah submit
            const memberIds = [
              ...(userKelompok.anggotaIds ?? []),
              ...(userKelompok.ketuaId ? [userKelompok.ketuaId] : []),
            ]
            const attempt = await prisma.kuisAttempt.findFirst({
              where: {
                asesmenId: assessment.id,
                siswaId: { in: memberIds },
                submittedAt: { not: null },
              },
            })
            completed = !!attempt
          } else {
            // KUIS INDIVIDU: cek attempt siswa ini
            const attempt = await prisma.kuisAttempt.findFirst({
              where: {
                asesmenId: assessment.id,
                siswaId,
                submittedAt: { not: null },
              },
            })
            completed = !!attempt
          }
        } else {
          // TUGAS
          if (isKelompok && userKelompok) {
            // TUGAS KELOMPOK: cek pengumpulan berdasarkan kelompokId
            const pengumpulan = await prisma.pengumpulanProyek.findFirst({
              where: {
                asesmenId: assessment.id,
                kelompokId: userKelompok.id,
              },
            })
            completed = !!pengumpulan
          } else {
            // TUGAS INDIVIDU: cek pengumpulan berdasarkan siswaId
            const pengumpulan = await prisma.pengumpulanProyek.findFirst({
              where: {
                asesmenId: assessment.id,
                siswaId,
              },
            })
            completed = !!pengumpulan
          }
        }

        if (!completed) {
          allCompleted = false
          break
        }
      }

      if (allCompleted) {
        completedSintaks.push(sintak)
      } else {
        // Hentikan pengecekan sintak berikutnya (berurutan)
        break
      }
    }

    // Sintak yang terbuka = semua yang sudah selesai + sintak berikutnya
    const unlockedSintaks = [...completedSintaks]
    const lastCompletedIdx =
      completedSintaks.length > 0
        ? SINTAKS.indexOf(completedSintaks[completedSintaks.length - 1])
        : -1
    const nextUnlocked = SINTAKS[lastCompletedIdx + 1]
    if (nextUnlocked && !unlockedSintaks.includes(nextUnlocked)) {
      unlockedSintaks.push(nextUnlocked)
    }

    // Sintak 1 selalu terbuka
    if (!unlockedSintaks.includes('1')) {
      unlockedSintaks.unshift('1')
    }

    return NextResponse.json({ completedSintaks, unlockedSintaks })
  } catch (error) {
    console.error('Error fetching sintak status:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil status sintak' },
      { status: 500 }
    )
  }
}
