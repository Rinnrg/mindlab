import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all available classes with student counts, grouped by class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proyekId } = await params

    // Get all unique classes with student counts
    const students = await prisma.user.findMany({
      where: {
        role: 'SISWA',
        kelas: { not: null },
      },
      select: {
        id: true,
        kelas: true,
      },
    })

    // Get already assigned members to this project (all groups)
    const assignedMembers = await prisma.anggotaKelompok.findMany({
      where: {
        kelompok: { pblId: proyekId },
      },
      select: { siswaId: true },
    })
    const assignedIds = new Set(assignedMembers.map((a) => a.siswaId))

    // Group by class
    const classMap: Record<string, { total: number; enrolled: number; available: number }> = {}

    for (const student of students) {
      const kelas = student.kelas!
      if (!classMap[kelas]) {
        classMap[kelas] = { total: 0, enrolled: 0, available: 0 }
      }
      classMap[kelas].total++
      if (assignedIds.has(student.id)) {
        classMap[kelas].enrolled++
      } else {
        classMap[kelas].available++
      }
    }

    const classes = Object.entries(classMap)
      .map(([kelas, counts]) => ({
        kelas,
        ...counts,
      }))
      .sort((a, b) => a.kelas.localeCompare(b.kelas))

    return NextResponse.json({ classes })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data kelas' },
      { status: 500 }
    )
  }
}
