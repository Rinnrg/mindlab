import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Enroll all students from a specific class to a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
  try {
    const { id: proyekId, kelompokId } = await params
    const body = await request.json()
    const { kelas } = body

    if (!kelas) {
      return NextResponse.json(
        { error: 'Kelas harus dipilih' },
        { status: 400 }
      )
    }

    // Verify group exists and belongs to project
    const kelompok = await prisma.kelompok.findFirst({
      where: { id: kelompokId, pblId: proyekId },
    })

    if (!kelompok) {
      return NextResponse.json(
        { error: 'Kelompok tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get all students in the specified class
    const studentsInClass = await prisma.user.findMany({
      where: {
        role: 'SISWA',
        kelas: kelas,
      },
      select: { id: true, nama: true, email: true, kelas: true },
    })

    if (studentsInClass.length === 0) {
      return NextResponse.json(
        { error: `Tidak ada siswa ditemukan di kelas "${kelas}"` },
        { status: 404 }
      )
    }

    // Get already assigned members to this project (all groups)
    const assignedMembers = await prisma.anggotaKelompok.findMany({
      where: {
        kelompok: { pblId: proyekId },
      },
      select: { siswaId: true },
    })
    const assignedIds = new Set(assignedMembers.map((a) => a.siswaId))

    // Filter out already assigned students
    const newStudents = studentsInClass.filter((s) => !assignedIds.has(s.id))

    if (newStudents.length === 0) {
      return NextResponse.json(
        { error: `Semua siswa kelas "${kelas}" sudah terdaftar di proyek ini` },
        { status: 400 }
      )
    }

    // Add all new students to the group
    await prisma.anggotaKelompok.createMany({
      data: newStudents.map((student) => ({
        kelompokId,
        siswaId: student.id,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      message: `${newStudents.length} siswa kelas "${kelas}" berhasil ditambahkan`,
      added: newStudents.length,
      skipped: studentsInClass.length - newStudents.length,
      students: newStudents.map((s) => ({
        nama: s.nama,
        email: s.email,
        kelas: s.kelas,
      })),
    })
  } catch (error) {
    console.error('Error enrolling class:', error)
    return NextResponse.json(
      { error: 'Gagal menambahkan kelas' },
      { status: 500 }
    )
  }
}
