import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all unique classes from students
export async function GET(request: NextRequest) {
  try {
    // Get all unique classes from students with detailed info
    const studentsWithKelas = await prisma.user.findMany({
      where: {
        role: 'SISWA',
        kelas: { not: null }
      },
      select: {
        kelas: true
      },
      distinct: ['kelas']
    })

    // Create kelas objects with id and name
    const kelas = studentsWithKelas
      .map(student => ({
        id: student.kelas!,
        nama: student.kelas!,
        // You can add guru info here if you have a relation
        // For now, we'll just use the kelas name
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama))

    return NextResponse.json({ kelas })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data kelas' },
      { status: 500 }
    )
  }
}
