import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guruId = searchParams.get('guruId')
    const judul = searchParams.get('judul')

    // If judul is specified, return single proyek
    if (judul) {
      const proyek = await prisma.pBL.findFirst({
        where: { judul },
        include: {
          guru: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
        },
      })
      return NextResponse.json(proyek)
    }

    const proyek = await prisma.pBL.findMany({
      where: guruId ? { guruId } : {},
      include: {
        guru: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        kelompok: {
          include: {
            anggota: {
              include: {
                siswa: {
                  select: {
                    id: true,
                    nama: true,
                    kelas: true,
                  },
                },
              },
            },
            _count: {
              select: {
                anggota: true,
              },
            },
          },
        },
        _count: {
          select: {
            kelompok: true,
          },
        },
      },
      orderBy: {
        tgl_mulai: 'desc',
      },
    })

    return NextResponse.json({ pbl: proyek })
  } catch (error) {
    console.error('Error fetching proyek:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data PBL' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { judul, deskripsi, tgl_mulai, tgl_selesai, lampiran, sintaks, guruId } = body

    if (!judul || !deskripsi || !tgl_mulai || !tgl_selesai || !guruId) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    if (!sintaks || !Array.isArray(sintaks) || sintaks.length === 0) {
      return NextResponse.json(
        { error: 'Pilih minimal satu tahapan sintaks' },
        { status: 400 }
      )
    }

    // Check if start date is before end date
    if (new Date(tgl_mulai) >= new Date(tgl_selesai)) {
      return NextResponse.json(
        { error: "Tanggal selesai harus lebih besar dari tanggal mulai" },
        { status: 400 }
      )
    }

    // Check if teacher exists
    const guru = await prisma.user.findUnique({
      where: { 
        id: guruId,
        role: "GURU"
      }
    })

    if (!guru) {
      return NextResponse.json(
        { error: "Guru tidak ditemukan" },
        { status: 404 }
      )
    }

    // Extract selectedClasses for enrollment
    const { selectedClasses } = body

    const proyek = await prisma.$transaction(async (tx) => {
      // Create the project
      const newProyek = await tx.pBL.create({
        data: {
          judul,
          deskripsi,
          tgl_mulai: new Date(tgl_mulai),
          tgl_selesai: new Date(tgl_selesai),
          lampiran: lampiran || null,
          sintaks,
          guruId,
        },
        include: {
          guru: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
          _count: {
            select: {
              kelompok: true,
            },
          },
        },
      })

      // If classes are selected, create a default group and enroll all students from those classes
      if (selectedClasses && Array.isArray(selectedClasses) && selectedClasses.length > 0) {
        // Get all students from selected classes
        const students = await tx.user.findMany({
          where: {
            role: 'SISWA',
            kelas: { in: selectedClasses },
          },
          select: { id: true },
        })

        if (students.length > 0) {
          // Create a default group
          const kelompok = await tx.kelompok.create({
            data: {
              nama: 'Kelompok Utama',
              pblId: newProyek.id,
            },
          })

          // Add all students as members
          await tx.anggotaKelompok.createMany({
            data: students.map((s) => ({
              kelompokId: kelompok.id,
              siswaId: s.id,
            })),
          })
        }
      }

      return newProyek
    })

    return NextResponse.json({ pbl: proyek }, { status: 201 })
  } catch (error) {
    console.error('Error creating proyek:', error)
    const message = error instanceof Error ? error.message : 'Gagal membuat PBL'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
