import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This route relies on request.url (query params) and user-specific DB reads.
// Force it to be treated as dynamic to avoid build-time static rendering attempts.
export const dynamic = 'force-dynamic'

export const revalidate = 180

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId dan role diperlukan' },
        { status: 400 }
      )
    }

    const today = new Date()
    const scheduleEvents: any[] = []

    if (role === 'SISWA') {
      // Optimized: Execute all queries in parallel using Promise.all
      const [enrollments, anggotaKelompok] = await Promise.all([
        prisma.enrollment.findMany({
          where: { siswaId: userId },
          select: { courseId: true }
        }),
        prisma.anggotaKelompok.findMany({
          where: { siswaId: userId },
          select: {
            id: true,
            siswaId: true,
            kelompokId: true,
            kelompok: {
              select: {
                nama: true,
                pbl: {
                  select: {
                    id: true,
                    judul: true,
                    deskripsi: true,
                    tgl_mulai: true,
                    tgl_selesai: true,
                  }
                }
              }
            }
          }
        })
      ])

      const courseIds = enrollments.map(e => e.courseId)

      // Get upcoming assessments from enrolled courses
      const asesmen = await prisma.asesmen.findMany({
        where: {
          courseId: { in: courseIds }
        },
        select: {
          id: true,
          nama: true,
          deskripsi: true,
          tipe: true,
          jml_soal: true,
          durasi: true,
          tgl_mulai: true,
          tgl_selesai: true,
          courseId: true,
          course: {
            select: {
              judul: true
            }
          }
        }
      })

      // Add assessments to schedule
      asesmen.forEach(a => {
        // Use actual deadline if available, otherwise skip
        if (a.tgl_selesai) {
          scheduleEvents.push({
            id: `asesmen-${a.id}`,
            title: a.nama,
            type: 'assessment',
            date: a.tgl_selesai.toISOString(),
            description: a.deskripsi || (a.tipe === 'KUIS' ? `${a.jml_soal || 0} soal, ${a.durasi || 0} menit` : 'Tugas'),
            course: a.course.judul,
            courseId: a.courseId,
            status: a.tgl_selesai < today ? 'overdue' : (a.tgl_mulai && a.tgl_mulai <= today ? 'ongoing' : 'upcoming')
          })
        }
      })

      // Add projects to schedule
      anggotaKelompok.forEach(ak => {
        if (ak.kelompok.pbl.tgl_selesai >= today) {
          scheduleEvents.push({
            id: `proyek-${ak.kelompok.pbl.id}`,
            title: ak.kelompok.pbl.judul,
            type: 'project',
            date: ak.kelompok.pbl.tgl_selesai.toISOString(),
            description: ak.kelompok.pbl.deskripsi,
            group: ak.kelompok.nama,
            status: ak.kelompok.pbl.tgl_mulai <= today ? 'ongoing' : 'upcoming'
          })
        }
      })
    } else if (role === 'GURU') {
      // Optimized: Execute both queries in parallel using Promise.all
      const [asesmen, proyeks] = await Promise.all([
        prisma.asesmen.findMany({
          where: { guruId: userId },
          select: {
            id: true,
            nama: true,
            deskripsi: true,
            tipe: true,
            jml_soal: true,
            durasi: true,
            tgl_mulai: true,
            tgl_selesai: true,
            courseId: true,
            course: {
              select: {
                judul: true
              }
            }
          }
        }),
        prisma.pBL.findMany({
          where: { guruId: userId },
          select: {
            id: true,
            judul: true,
            deskripsi: true,
            tgl_mulai: true,
            tgl_selesai: true,
          }
        })
      ])

      // Add assessments to schedule
      asesmen.forEach(a => {
        // Use actual deadline if available, otherwise skip
        if (a.tgl_selesai) {
          scheduleEvents.push({
            id: `asesmen-${a.id}`,
            title: a.nama,
            type: 'assessment',
            date: a.tgl_selesai.toISOString(),
            description: a.deskripsi || (a.tipe === 'KUIS' ? `${a.jml_soal || 0} soal, ${a.durasi || 0} menit` : 'Tugas'),
            course: a.course.judul,
            courseId: a.courseId,
            status: a.tgl_selesai < today ? 'overdue' : (a.tgl_mulai && a.tgl_mulai <= today ? 'ongoing' : 'upcoming')
          })
        }
      })

      // Add projects to schedule
      proyeks.forEach(p => {
        if (p.tgl_selesai >= today) {
          scheduleEvents.push({
            id: `proyek-${p.id}`,
            title: p.judul,
            type: 'project',
            date: p.tgl_selesai.toISOString(),
            description: p.deskripsi,
            status: p.tgl_mulai <= today ? 'ongoing' : 'upcoming'
          })
        }
      })
    }

    // Sort by date
    scheduleEvents.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const response = NextResponse.json({ schedule: scheduleEvents })
    response.headers.set('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=600')
    return response
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil jadwal' },
      { status: 500 }
    )
  }
}
