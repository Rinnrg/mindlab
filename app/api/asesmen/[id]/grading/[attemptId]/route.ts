import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  try {
    const { id: asesmenId, attemptId } = await params
    const body = await request.json()
    const { scores } = body // Array of { jawabanId: string, type: 'BENAR' | 'SETENGAH' | 'SALAH' }

    if (!scores || !Array.isArray(scores)) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    // Fetch attempt and its value
    const attempt = await prisma.kuisAttempt.findUnique({
      where: { id: attemptId },
      include: {
        nilai: true,
      }
    })

    if (!attempt || !attempt.nilai[0]) {
      return NextResponse.json({ error: 'Attempt atau Nilai tidak ditemukan' }, { status: 404 })
    }

    const nilaiId = attempt.nilai[0].id

    // Update each answer
    await prisma.$transaction(async (tx) => {
      for (const item of scores) {
        const jawaban = await tx.jawabanSiswa.findUnique({
          where: { id: item.jawabanId },
          include: { soal: true }
        })

        if (!jawaban) continue

        let skorDidapat = 0
        if (item.type === 'BENAR') {
          skorDidapat = jawaban.soal.bobot
        } else if (item.type === 'SETENGAH') {
          skorDidapat = jawaban.soal.bobot / 2
        } else if (item.type === 'SALAH') {
          skorDidapat = 0
        }

        await tx.jawabanSiswa.update({
          where: { id: item.jawabanId },
          data: {
            skorDidapat,
            isBenar: item.type === 'BENAR' ? true : item.type === 'SALAH' ? false : null
          }
        })
      }

      // Recalculate total score for this Nilai using formula: (jumlahBenar / jumlahSoal) * 100
      const allJawaban = await tx.jawabanSiswa.findMany({
        where: { nilaiId },
        include: { soal: true }
      })

      let totalQuestions = 0
      let correctCount = 0

      for (const j of allJawaban) {
        totalQuestions += 1
        if (j.isBenar === true) correctCount += 1
      }

      const finalSkor = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

      await tx.nilai.update({
        where: { id: nilaiId },
        data: { skor: Math.round(finalSkor * 100) / 100 }
      })
    })

    return NextResponse.json({ success: true, message: 'Nilai berhasil diperbarui' })
  } catch (error) {
    console.error('Error grading kuis:', error)
    return NextResponse.json({ error: 'Gagal memperbarui nilai' }, { status: 500 })
  }
}
