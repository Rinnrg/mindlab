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

    // Normalize anggota to string[] because Prisma schema expects String[]
    const anggotaArr: string[] = Array.isArray(anggota)
      ? anggota.filter((x: unknown) => typeof x === 'string' && x.trim().length > 0)
      : typeof anggota === 'string'
        ? anggota
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : []

    const fileUrlStr = typeof fileUrl === 'string' ? fileUrl.trim() : ''
    const sourceCodeStr = typeof sourceCode === 'string' ? sourceCode : ''
    const outputStr = typeof output === 'string' ? output : ''

    // Hard limits from Prisma schema
    const MAX_FILE_URL = 255
    const MAX_SOURCE = 5000
    const MAX_OUTPUT = 5000

    // Reject data URLs or too-long URLs because DB column is VARCHAR(255)
    if (fileUrlStr) {
      if (fileUrlStr.startsWith('data:')) {
        return NextResponse.json(
          {
            error:
              'File hasil upload saat ini masih berbentuk base64 (data URL) dan terlalu panjang untuk disimpan. Silakan gunakan link (Google Drive/OneDrive) atau upload via endpoint /api/upload yang menghasilkan URL pendek.',
          },
          { status: 400 }
        )
      }
      if (fileUrlStr.length > MAX_FILE_URL) {
        return NextResponse.json(
          { error: `Link file terlalu panjang (maks ${MAX_FILE_URL} karakter). Gunakan link pendek.` },
          { status: 400 }
        )
      }
    }

    if (sourceCodeStr && sourceCodeStr.length > MAX_SOURCE) {
      return NextResponse.json(
        { error: `Kode terlalu panjang (maks ${MAX_SOURCE} karakter).` },
        { status: 400 }
      )
    }
    if (outputStr && outputStr.length > MAX_OUTPUT) {
      return NextResponse.json(
        { error: `Output terlalu panjang (maks ${MAX_OUTPUT} karakter).` },
        { status: 400 }
      )
    }

    // Basic validation: require at least fileUrl OR sourceCode
    const hasFile = fileUrlStr.length > 0
    const hasCode = sourceCodeStr.trim().length > 0
    if (!hasFile && !hasCode) {
      return NextResponse.json(
        { error: 'Silakan upload file atau isi kode terlebih dahulu' },
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
          // only set group metadata when provided
          ...(typeof namaKelompok === 'string' && namaKelompok.trim() ? { namaKelompok } : {}),
          ...(typeof ketua === 'string' && ketua.trim() ? { ketua } : {}),
          ...(anggotaArr.length > 0 ? { anggota: anggotaArr } : {}),
          fileUrl: fileUrlStr || existingSubmission.fileUrl,
          ...(typeof catatan === 'string' ? { catatan } : {}),
          sourceCode: sourceCodeStr || existingSubmission.sourceCode,
          output: outputStr || existingSubmission.output,
          kelompokId: existingSubmission.kelompokId || kelompokId,
          status: 'PENDING', // Reset status when re-submitted
        },
      })
    } else {
      // Create new submission
      pengumpulan = await prisma.pengumpulanProyek.create({
        data: {
          ...(typeof namaKelompok === 'string' && namaKelompok.trim() ? { namaKelompok } : {}),
          ...(typeof ketua === 'string' && ketua.trim() ? { ketua } : {}),
          anggota: anggotaArr,
          ...(fileUrlStr ? { fileUrl: fileUrlStr } : {}),
          ...(typeof catatan === 'string' ? { catatan } : {}),
          ...(sourceCodeStr.trim() ? { sourceCode: sourceCodeStr } : {}),
          ...(outputStr ? { output: outputStr } : {}),
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
      {
        error: 'Gagal mengumpulkan tugas',
        details: (error as any)?.message,
        code: (error as any)?.code,
      },
      { status: 500 }
    )
  }
}
