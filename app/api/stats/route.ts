import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Revalidate stats every 60 seconds
export const revalidate = 60

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    let stats: any = {}

    if (role === 'SISWA' && userId) {
      // Stats untuk siswa — optimized: use count + aggregate only
      const [enrollmentCount, nilaiCount, proyekCount, avgNilai] = await Promise.all([
        prisma.enrollment.count({
          where: { siswaId: userId },
        }),
        // Total asesmen yang sudah dikerjakan
        prisma.nilai.count({
          where: { siswaId: userId },
        }),
        // Total proyek yang diikuti
        prisma.anggotaKelompok.count({
          where: { siswaId: userId },
        }),
        // Rata-rata nilai
        prisma.nilai.aggregate({
          where: { siswaId: userId },
          _avg: { skor: true },
        }),
      ])

      stats = {
        coursesCount: enrollmentCount,
        asesmenCount: nilaiCount,
        proyekCount,
        avgNilai: avgNilai._avg.skor || 0,
      }
    } else if (role === 'GURU' && userId) {
      // Stats untuk guru
      const [coursesCount, asesmenCount, proyekCount, studentsCount] = await Promise.all([
        prisma.course.count({
          where: { guruId: userId },
        }),
        prisma.asesmen.count({
          where: { guruId: userId },
        }),
        prisma.proyek.count({
          where: { guruId: userId },
        }),
        // Total siswa yang mengambil course guru ini
        prisma.nilai.findMany({
          where: {
            asesmen: {
              guruId: userId
            }
          },
          select: { siswaId: true },
          distinct: ['siswaId']
        })
      ])

      stats = {
        coursesCount,
        asesmenCount,
        proyekCount,
        studentsCount: studentsCount.length,
      }
    } else if (role === 'ADMIN') {
      // Stats untuk admin
      const [usersCount, coursesCount, asesmenCount, proyekCount] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.asesmen.count(),
        prisma.proyek.count(),
      ])

      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: true,
      })

      stats = {
        usersCount,
        coursesCount,
        asesmenCount,
        proyekCount,
        usersByRole: usersByRole.reduce((acc, curr) => {
          acc[curr.role] = curr._count
          return acc
        }, {} as Record<string, number>),
      }
    }

    const response = NextResponse.json({ stats })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil statistik' },
      { status: 500 }
    )
  }
}
