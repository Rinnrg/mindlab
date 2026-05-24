import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get available students for adding to the group, with class filtering
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, kelompokId: string }> }
) {
  try {
    const { id: proyekId, kelompokId } = await params
    const { searchParams } = new URL(request.url)
    const kelasFilter = searchParams.get('kelas')

    // Get all students with their class information
    const whereCondition: any = { role: "SISWA" }
    if (kelasFilter && kelasFilter !== 'all') {
      whereCondition.kelas = kelasFilter
    }

    const allStudents = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        nama: true,
        email: true,
        foto: true,
        kelas: true,
      },
      orderBy: { nama: 'asc' }
    })

    // Get already assigned members to this project (all groups)
    const groups = await prisma.kelompok.findMany({
      where: { pblId: proyekId },
      select: {
        anggotaIds: true
      }
    })

    const assignedIds = groups.flatMap(g => g.anggotaIds)

    // Filter out already assigned students
    const availableStudents = allStudents.filter(student => 
      !assignedIds.includes(student.id)
    )

    // Get unique classes for filtering
    const uniqueClasses = [...new Set(allStudents.map(s => s.kelas).filter(Boolean))].sort()

    return NextResponse.json({ 
      students: availableStudents,
      uniqueClasses 
    })
  } catch (error) {
    console.error('Error fetching available students:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data siswa' },
      { status: 500 }
    )
  }
}

// POST - Add members to the group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, kelompokId: string }> }
) {
  try {
    const { kelompokId } = await params
    const body = await request.json()
    const { studentIds } = body

    if (!studentIds || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Pilih minimal satu siswa' },
        { status: 400 }
      )
    }

    // Verify group exists
    const kelompok = await prisma.kelompok.findUnique({
      where: { id: kelompokId }
    })

    if (!kelompok) {
      return NextResponse.json(
        { error: 'Kelompok tidak ditemukan' },
        { status: 404 }
      )
    }

    // Add members
    const currentGroup = await prisma.kelompok.findUnique({
      where: { id: kelompokId },
      select: { anggotaIds: true }
    })
    const currentIds = currentGroup?.anggotaIds || []
    const updatedIds = Array.from(new Set([...currentIds, ...studentIds]))

    await prisma.kelompok.update({
      where: { id: kelompokId },
      data: {
        anggotaIds: updatedIds
      }
    })

    return NextResponse.json({ 
      message: `Berhasil menambahkan ${studentIds.length} anggota ke kelompok` 
    })
  } catch (error) {
    console.error('Error adding group members:', error)
    return NextResponse.json(
      { error: 'Gagal menambahkan anggota kelompok' },
      { status: 500 }
    )
  }
}
