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
        kelompok: true,
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

    // Fetch all user details for kelompok anggota
    const allUserIds = Array.from(new Set(proyek.flatMap(p => p.kelompok.flatMap(k => k.anggotaIds))))
    const users = await prisma.user.findMany({
      where: { id: { in: allUserIds } },
      select: {
        id: true,
        nama: true,
        kelas: true,
      }
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    const formattedProyek = proyek.map(p => ({
      ...p,
      kelompok: p.kelompok.map(k => ({
        ...k,
        anggota: k.anggotaIds.map(id => userMap.get(id)).filter(Boolean),
        _count: {
          anggota: k.anggotaIds.length
        }
      }))
    }))

    return NextResponse.json({ pbl: formattedProyek })
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
          // Create a default group and connect students
          await tx.kelompok.create({
            data: {
              nama: 'Kelompok Utama',
              pblId: newProyek.id,
              anggotaIds: students.map((s) => s.id)
            },
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
