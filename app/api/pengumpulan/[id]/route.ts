import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single pengumpulan by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id || id === "undefined" || id === "null") {
    return NextResponse.json(
      { error: "ID pengumpulan tidak valid" },
      { status: 400 }
    )
  }

  try {
    // First, try to interpret `id` as PengumpulanProyek.id
    let pengumpulan = await prisma.pengumpulanProyek.findUnique({
      where: { id },
      include: {
        siswa: {
          select: {
            id: true,
            nama: true,
            email: true,
            foto: true,
          },
        },
        asesmen: {
          select: {
            id: true,
            nama: true,
            tipe: true,
            tipePengerjaan: true,
          },
        },
      },
    })

    // Compatibility fallback:
    // if the frontend accidentally passes an Asesmen ID in the URL (during routing refactors),
    // resolve the most recent pengumpulan for that asesmen.
    if (!pengumpulan) {
      pengumpulan = await prisma.pengumpulanProyek.findFirst({
        where: { asesmenId: id },
        orderBy: { tgl_unggah: "desc" },
        include: {
          siswa: {
            select: {
              id: true,
              nama: true,
              email: true,
              foto: true,
            },
          },
          asesmen: {
            select: {
              id: true,
              nama: true,
              tipe: true,
              tipePengerjaan: true,
            },
          },
        },
      })
    }

    if (!pengumpulan) {
      return NextResponse.json(
        { error: 'Pengumpulan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ pengumpulan })
  } catch (error) {
    console.error('Error fetching pengumpulan:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data pengumpulan' },
      { status: 500 }
    )
  }
}

// UPDATE pengumpulan (nilai, catatan, feedback, status/validation)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id || id === "undefined" || id === "null") {
    return NextResponse.json(
      { error: "ID pengumpulan tidak valid" },
      { status: 400 }
    )
  }

  try {
  // Removed redundant extraction of id
    const body = await request.json()
    const { nilai, catatan, feedback, status, validatedBy, skorK1, skorK2, skorK3, skorK4 } = body

    // Validate
    if (nilai !== undefined && (nilai < 0 || nilai > 100)) {
      return NextResponse.json(
        { error: 'Nilai harus antara 0-100' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (nilai !== undefined) updateData.nilai = parseFloat(nilai)
    if (skorK1 !== undefined) updateData.skorK1 = parseFloat(skorK1)
    if (skorK2 !== undefined) updateData.skorK2 = parseFloat(skorK2)
    if (skorK3 !== undefined) updateData.skorK3 = parseFloat(skorK3)
    if (skorK4 !== undefined) updateData.skorK4 = parseFloat(skorK4)
    if (catatan !== undefined) updateData.catatan = catatan
    if (feedback !== undefined) updateData.feedback = feedback
    if (status !== undefined) {
      updateData.status = status
      if (status === 'VALIDATED') {
        updateData.validatedAt = new Date()
        if (validatedBy) updateData.validatedBy = validatedBy
      }
    }

    const pengumpulan = await prisma.pengumpulanProyek.update({
      where: { id },
      data: updateData,
      include: {
        siswa: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        asesmen: {
          select: {
            id: true,
            nama: true,
            tipe: true,
            tipePengerjaan: true,
            course: {
              select: { id: true, judul: true },
            },
          },
        },
      },
    })

    // If asesmen exists, also create/update Nilai record
    if (pengumpulan.asesmenId && pengumpulan.siswaId && nilai !== undefined) {
      await prisma.nilai.upsert({
        where: {
          siswaId_asesmenId: {
            siswaId: pengumpulan.siswaId,
            asesmenId: pengumpulan.asesmenId,
          },
        },
        create: {
          skor: parseFloat(nilai),
          siswaId: pengumpulan.siswaId,
          asesmenId: pengumpulan.asesmenId,
        },
        update: {
          skor: parseFloat(nilai),
        },
      })
    }

    // Auto-create ProfileShowcase when validated
    if (status === 'VALIDATED' && pengumpulan.siswaId && pengumpulan.asesmen) {
      const courseName = pengumpulan.asesmen.course?.judul || ''
      const asesmenNama = pengumpulan.asesmen.nama || ''
      const judul = `${asesmenNama}${courseName ? ` - ${courseName}` : ''}`

      await prisma.profileShowcase.upsert({
        where: { pengumpulanProyekId: id },
        create: {
          judul,
          deskripsi: `Tugas "${asesmenNama}" berhasil divalidasi${courseName ? ` pada kelas ${courseName}` : ''}`,
          nilai: parseFloat(nilai) || pengumpulan.nilai || 0,
          siswaId: pengumpulan.siswaId,
          pengumpulanProyekId: id,
          isPublic: true,
          tanggalDinilai: new Date(),
        },
        update: {
          judul,
          nilai: parseFloat(nilai) || pengumpulan.nilai || 0,
          tanggalDinilai: new Date(),
        },
      })
    }

    // Remove ProfileShowcase if status changed away from VALIDATED
    if (status && status !== 'VALIDATED') {
      try {
        await prisma.profileShowcase.delete({
          where: { pengumpulanProyekId: id },
        })
      } catch {
        // No showcase record to delete — that's fine
      }
    }

    return NextResponse.json({ pengumpulan })
  } catch (error) {
    console.error('Error updating pengumpulan:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate pengumpulan' },
      { status: 500 }
    )
  }
}

// DELETE pengumpulan (allow resubmission)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id || id === "undefined" || id === "null") {
    return NextResponse.json(
      { error: "ID pengumpulan tidak valid" },
      { status: 400 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'userId dan userRole diperlukan' },
        { status: 400 }
      )
    }
    if (userRole !== 'GURU' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
    }

    const pengumpulan = await prisma.pengumpulanProyek.findUnique({
      where: { id },
      select: {
        id: true,
        asesmenId: true,
        asesmen: { select: { id: true, guruId: true } },
      },
    })

    if (!pengumpulan) {
      return NextResponse.json({ error: 'Pengumpulan tidak ditemukan' }, { status: 404 })
    }

    if (userRole === 'GURU' && pengumpulan.asesmen?.guruId && pengumpulan.asesmen.guruId !== userId) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
    }

    await prisma.pengumpulanProyek.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pengumpulan:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus pengumpulan' },
      { status: 500 }
    )
  }
}

