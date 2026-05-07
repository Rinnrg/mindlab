import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params
    const body = await request.json()
  const { pertanyaan, bobot, opsi, gambar } = body

    if (!pertanyaan || !bobot || !opsi || !Array.isArray(opsi)) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Image URL validation (Prisma Soal.gambar is now @db.Text)
    if (typeof gambar === 'string' && gambar.trim()) {
      const g = gambar.trim()
      if (g.startsWith('data:')) {
        return NextResponse.json(
          { error: 'Format base64/data URL tidak didukung. Gunakan upload agar menjadi URL.' },
          { status: 400 }
        )
      }
    }

    // Check if there's exactly one correct answer for multiple choice
    if (body.tipeJawaban !== 'ISIAN') {
      if (!opsi || !Array.isArray(opsi) || opsi.length < 2) {
        return NextResponse.json(
          { error: 'Minimal 2 pilihan jawaban untuk pilihan ganda' },
          { status: 400 }
        )
      }
      const correctAnswers = opsi.filter((o: any) => o.isBenar)
      if (correctAnswers.length !== 1) {
        return NextResponse.json(
          { error: 'Harus ada tepat 1 jawaban benar untuk pilihan ganda' },
          { status: 400 }
        )
      }
    }

    // Check if asesmen exists and is a quiz
    const asesmen = await prisma.asesmen.findUnique({
      where: { id: asesmenId },
    })

    if (!asesmen) {
      return NextResponse.json(
        { error: 'Asesmen tidak ditemukan' },
        { status: 404 }
      )
    }

    if (asesmen.tipe !== 'KUIS') {
      return NextResponse.json(
        { error: 'Bukan asesmen kuis' },
        { status: 400 }
      )
    }

    // Create soal with opsi
    const soal = await prisma.soal.create({
      data: {
        pertanyaan,
        gambar: typeof gambar === 'string' && gambar.trim() ? gambar.trim() : null,
        bobot: parseInt(bobot),
        tipeJawaban: body.tipeJawaban || 'PILIHAN_GANDA',
        asesmenId,
        opsi: (opsi && Array.isArray(opsi) && opsi.length > 0) ? {
          create: opsi.map((o: any) => ({
            teks: o.teks,
            isBenar: o.isBenar || false,
          })),
        } : undefined,
      },
      include: {
        opsi: true,
      },
    })

    return NextResponse.json({ soal }, { status: 201 })
  } catch (error) {
    console.error('Error creating soal:', error)
    return NextResponse.json(
      { error: 'Gagal membuat soal' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params

    const soal = await prisma.soal.findMany({
      where: { asesmenId },
      include: {
        opsi: true,
      },
      orderBy: {
        id: 'asc',
      },
    })

    return NextResponse.json({ soal })
  } catch (error) {
    console.error('Error fetching soal:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data soal' },
      { status: 500 }
    )
  }
}
