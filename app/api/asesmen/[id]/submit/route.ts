import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const contentType = request.headers.get('content-type') || ''
    const isMultipart = contentType.includes('multipart/form-data')

    let namaKelompok: unknown
    let ketua: unknown
    let anggota: unknown
    let fileUrl: unknown
    let catatan: unknown
    let siswaId: unknown
    let sourceCode: unknown
    let output: unknown
    let uploadedFile: File | null = null

    if (isMultipart) {
      const form = await request.formData()
      namaKelompok = form.get('namaKelompok')
      ketua = form.get('ketua')
      anggota = form.get('anggota')
      fileUrl = form.get('fileUrl')
      catatan = form.get('catatan')
      siswaId = form.get('siswaId')
      sourceCode = form.get('sourceCode')
      output = form.get('output')
      const f = form.get('file')
      uploadedFile = f instanceof File ? f : null
    } else {
      const body = await request.json()
      ;({ namaKelompok, ketua, anggota, fileUrl, catatan, siswaId, sourceCode, output } = body || {})
    }

  if (!siswaId || typeof siswaId !== 'string' || !siswaId.trim()) {
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
      ? (anggota as unknown[]).filter((x: unknown) => typeof x === 'string' && x.trim().length > 0) as string[]
      : typeof anggota === 'string'
        ? anggota
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : []

    const fileUrlStr = typeof fileUrl === 'string' ? fileUrl.trim() : ''
    const sourceCodeStr = typeof sourceCode === 'string' ? sourceCode : ''
    const outputStr = typeof output === 'string' ? output : ''

  // If multipart file is provided, we'll store bytes in DB (PengumpulanProyek.fileData)
  const hasUploadedFile = !!uploadedFile && typeof uploadedFile.name === 'string' && uploadedFile.size > 0

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

    // File constraints when uploading
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (hasUploadedFile && uploadedFile!.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 10MB.' },
        { status: 400 }
      )
    }

    // Basic validation: require at least uploaded file OR fileUrl OR sourceCode
    const hasFile = fileUrlStr.length > 0 || hasUploadedFile
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

    // Prepare uploaded file data if any
    let fileDataToSave: Buffer | null = null
    let fileNameToSave: string | null = null
    let fileTypeToSave: string | null = null
    let fileSizeToSave: number | null = null
    if (hasUploadedFile) {
      const arr = await uploadedFile!.arrayBuffer()
      fileDataToSave = Buffer.from(arr)
      fileNameToSave = uploadedFile!.name
      fileTypeToSave = uploadedFile!.type || 'application/octet-stream'
      fileSizeToSave = uploadedFile!.size
    }

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
          fileUrl: fileUrlStr || (hasUploadedFile ? null : existingSubmission.fileUrl),
          ...(hasUploadedFile
            ? {
                fileData: fileDataToSave!,
                fileName: fileNameToSave,
                fileType: fileTypeToSave,
                fileSize: fileSizeToSave,
              }
            : {}),
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
          ...(hasUploadedFile
            ? {
                fileData: fileDataToSave!,
                fileName: fileNameToSave,
                fileType: fileTypeToSave,
                fileSize: fileSizeToSave,
              }
            : {}),
          ...(typeof catatan === 'string' ? { catatan } : {}),
          ...(sourceCodeStr.trim() ? { sourceCode: sourceCodeStr } : {}),
          ...(outputStr ? { output: outputStr } : {}),
          siswaId: siswaId.trim(),
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
