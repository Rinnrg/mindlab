import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params
    const body = await request.json()
    
    const { siswaId, jawaban, waktuMulai, waktuSelesai, scheduledAt } = body

    if (!siswaId || !jawaban || !Array.isArray(jawaban)) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Check if asesmen exists and is KUIS
    const asesmen = await prisma.asesmen.findUnique({
      where: { id: asesmenId },
      include: {
        soal: {
          include: {
            opsi: true
          }
        }
      }
    })

    if (!asesmen) {
      return NextResponse.json(
        { error: 'Asesmen tidak ditemukan' },
        { status: 404 }
      )
    }

    if (asesmen.tipe !== 'KUIS') {
      return NextResponse.json(
        { error: 'Asesmen ini bukan kuis' },
        { status: 400 }
      )
    }

    // Check if already submitted
    const existingNilai = await prisma.nilai.findUnique({
      where: {
        siswaId_asesmenId: {
          siswaId,
          asesmenId,
        },
      },
      select: { id: true },
    })

    if (existingNilai) {
      return NextResponse.json(
        { error: 'Anda sudah mengumpulkan kuis ini' },
        { status: 400 }
      )
    }

    // Ensure attempt exists (created when quiz starts)
  const attempt = await prisma.kuisAttempt.upsert({
      where: { siswaId_asesmenId_attempt: { siswaId, asesmenId } },
      update: {},
      create: { siswaId, asesmenId },
      select: { id: true },
    })

    // Calculate score and save answers using formula: (jumlahBenar / jumlahSoal) * 100
    let totalQuestions = 0
    let correctCount = 0

    const result = await prisma.$transaction(async (tx) => {
      // Create nilai record first
      const nilaiRecord = await tx.nilai.create({
        data: {
          siswaId,
          asesmenId,
          skor: 0, // Will update later
          tanggal: scheduledAt ? new Date(scheduledAt) : new Date(),
          attemptId: attempt.id,
        }
      })

      // Process each answer
      for (const jawabanItem of jawaban) {
        const soal = asesmen.soal.find(s => s.id === jawabanItem.soalId)
        if (!soal) continue
        // Count questions and correct answers (only fully correct answers count)
        totalQuestions += 1

        let isBenar: boolean | null = null
        let skorDidapat: number | null = null

        if (soal.tipeJawaban === 'PILIHAN_GANDA') {
          const selectedOpsi = soal.opsi.find(o => o.id === jawabanItem.jawaban)
          if (selectedOpsi) {
            isBenar = selectedOpsi.isBenar
            if (isBenar) {
              correctCount += 1
              skorDidapat = 1 // normalized per-question correctness
            } else {
              skorDidapat = 0
            }
          } else {
            skorDidapat = 0
          }
        } else if (soal.tipeJawaban === 'ISIAN') {
          // Essay / isian - mark as pending (null) and will be graded by teacher
          isBenar = null
          skorDidapat = null
        }

        // Save answer (skorDidapat uses normalized per-question scale)
        await tx.jawabanSiswa.create({
          data: {
            siswaId,
            soalId: soal.id,
            jawaban: jawabanItem.jawaban,
            isBenar,
            skorDidapat: skorDidapat,
            nilaiId: nilaiRecord.id,
          }
        })
      }

      // Calculate final score (0-100) using count of correct answers over total questions
      const finalSkor = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

      // Round to nearest integer (0-100) and update nilai record
      const roundedSkor = Math.round(finalSkor)

      await tx.nilai.update({
        where: { id: nilaiRecord.id },
        data: { skor: roundedSkor }
      })

      // Mark attempt submitted
      await tx.kuisAttempt.update({
        where: { id: attempt.id },
        data: { submittedAt: scheduledAt ? new Date(scheduledAt) : new Date() },
      })

      return {
        nilaiId: nilaiRecord.id,
        skor: roundedSkor,
        correctCount,
        totalQuestions,
      }
    })

    return NextResponse.json({ 
      success: true,
      result,
      message: 'Kuis berhasil dikumpulkan'
    }, { status: 201 })

  } catch (error) {
    console.error('Error submitting kuis:', error)
    return NextResponse.json(
      { error: 'Gagal mengumpulkan kuis' },
      { status: 500 }
    )
  }
}
