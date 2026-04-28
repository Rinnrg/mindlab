import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
  const { namaKelompok, ketua, anggota, fileUrl, catatan, siswaId, sourceCode, output } = body

    if (!siswaId) {
      return NextResponse.json(
        { error: 'Siswa ID diperlukan' },
        { status: 400 }
      )
    }

    // Check if asesmen exists
    const asesmen = await prisma.asesmen.findUnique({
      where: { id },
    })

    if (!asesmen) {
      return NextResponse.json(
        { error: 'Asesmen tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if it's a TUGAS
    if (asesmen.tipe !== 'TUGAS') {
      return NextResponse.json(
        { error: 'Hanya tugas yang bisa dikumpulkan' },
        { status: 400 }
      )
    }

    // Check deadline
    if (asesmen.tgl_selesai && new Date(asesmen.tgl_selesai) < new Date()) {
      return NextResponse.json(
        { error: 'Deadline pengumpulan sudah lewat' },
        { status: 400 }
      )
    }

    // If kelompok task, find the kelompok that contains this siswa for this asesmen.
    let kelompokId: string | null = null
    if (asesmen.tipePengerjaan === 'KELOMPOK') {
      const kelompok = await prisma.kelompok.findFirst({
        where: {
          asesmenId: id,
          anggota: {
            some: { siswaId },
          },
        } as any,
        select: { id: true },
      })
      kelompokId = kelompok?.id || null
      if (!kelompokId) {
        return NextResponse.json(
          { error: 'Anda belum masuk kelompok untuk tugas ini. Hubungi guru untuk mengatur kelompok.' },
          { status: 400 }
        )
      }
    }

    // Check if already submitted
    const existingSubmission = await prisma.pengumpulanProyek.findFirst({
      where: {
        asesmenId: id,
        ...(asesmen.tipePengerjaan === 'KELOMPOK'
          ? { kelompokId: kelompokId as string }
          : { siswaId }),
      },
      include: {
        siswa: { select: { id: true, nama: true } },
      },
    })

    let pengumpulan

    if (existingSubmission) {
      // For kelompok: only allow the same submitter to edit/update
      if (asesmen.tipePengerjaan === 'KELOMPOK' && existingSubmission.siswaId !== siswaId) {
        return NextResponse.json(
          { error: `Tugas kelompok sudah dikumpulkan oleh ${existingSubmission.siswa?.nama || 'anggota lain'}` },
          { status: 409 }
        )
      }

      // Update existing submission
      pengumpulan = await prisma.pengumpulanProyek.update({
        where: { id: existingSubmission.id },
        data: {
          namaKelompok,
          ketua,
          anggota,
          fileUrl: fileUrl || existingSubmission.fileUrl,
          catatan,
          sourceCode: sourceCode || existingSubmission.sourceCode,
          output: output || existingSubmission.output,
          kelompokId: existingSubmission.kelompokId || kelompokId,
          status: 'PENDING', // Reset status when re-submitted
        },
      })
    } else {
      // Create new submission
      pengumpulan = await prisma.pengumpulanProyek.create({
        data: {
          namaKelompok,
          ketua,
          anggota,
          fileUrl,
          catatan,
          sourceCode,
          output,
          siswaId,
          asesmenId: id,
          kelompokId,
          status: 'PENDING',
        },
      })
    }

    return NextResponse.json({ pengumpulan }, { status: 200 })
  } catch (error) {
    console.error('Error submitting task:', error)
    return NextResponse.json(
      { error: 'Gagal mengumpulkan tugas' },
      { status: 500 }
    )
  }
}
