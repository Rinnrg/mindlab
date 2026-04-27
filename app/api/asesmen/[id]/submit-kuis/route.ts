import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params
    const body = await request.json()
    
    const { siswaId, jawaban, waktuMulai, waktuSelesai } = body

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

    // Calculate score and save answers
    let totalSkor = 0
    let totalBobot = 0

    const result = await prisma.$transaction(async (tx) => {
      // Create nilai record first
      const nilaiRecord = await tx.nilai.create({
        data: {
          siswaId,
          asesmenId,
          skor: 0, // Will update later
          tanggal: new Date(),
          attemptId: attempt.id,
        }
      })

      // Process each answer
      for (const jawabanItem of jawaban) {
        const soal = asesmen.soal.find(s => s.id === jawabanItem.soalId)
        if (!soal) continue

        totalBobot += soal.bobot

        let isBenar: boolean | null = null
        let skorDidapat = 0

        // Auto-grade for multiple choice
        if (soal.tipeJawaban === 'PILIHAN_GANDA') {
          const selectedOpsi = soal.opsi.find(o => o.id === jawabanItem.jawaban)
          if (selectedOpsi) {
            isBenar = selectedOpsi.isBenar
            if (isBenar) {
              skorDidapat = soal.bobot
              totalSkor += skorDidapat
            }
          }
        }
        // For essay questions, mark as null (to be graded manually)
        else if (soal.tipeJawaban === 'ISIAN') {
          isBenar = null // Will be graded manually by teacher
          skorDidapat = 0 // Will be updated by teacher
        }

        // Save answer
        await tx.jawabanSiswa.create({
          data: {
            siswaId,
            soalId: soal.id,
            jawaban: jawabanItem.jawaban,
            isBenar,
            skorDidapat: skorDidapat > 0 ? skorDidapat : null,
            nilaiId: nilaiRecord.id,
          }
        })
      }

      // Calculate final score (0-100)
      const finalSkor = totalBobot > 0 ? (totalSkor / totalBobot) * 100 : 0

      // Update nilai record
      await tx.nilai.update({
        where: { id: nilaiRecord.id },
        data: { skor: finalSkor }
      })

      // Mark attempt submitted
      await tx.kuisAttempt.update({
        where: { id: attempt.id },
        data: { submittedAt: new Date() },
      })

      return {
        nilaiId: nilaiRecord.id,
        skor: finalSkor,
        totalSkor,
        totalBobot,
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
