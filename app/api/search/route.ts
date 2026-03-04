import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 30

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    // If no query, return recent/popular items as suggestions
    if (!query) {
      const [recentCourses, recentMateri, recentAsesmen, recentSchedules] = await Promise.all([
        prisma.course.findMany({
          select: {
            id: true,
            judul: true,
            kategori: true,
            gambar: true,
          },
          take: 5,
          orderBy: { id: 'desc' },
        }),
        prisma.materi.findMany({
          select: {
            id: true,
            judul: true,
            deskripsi: true,
            tgl_unggah: true,
            courseId: true,
            course: {
              select: {
                id: true,
                judul: true,
                kategori: true,
              },
            },
          },
          take: 5,
          orderBy: { tgl_unggah: 'desc' },
        }),
        prisma.asesmen.findMany({
          select: {
            id: true,
            nama: true,
            deskripsi: true,
            tipe: true,
            tgl_selesai: true,
            courseId: true,
            course: {
              select: {
                id: true,
                judul: true,
              },
            },
            _count: {
              select: {
                soal: true,
              },
            },
          },
          take: 5,
          orderBy: { id: 'desc' },
        }),
        prisma.proyek.findMany({
          select: {
            id: true,
            judul: true,
            deskripsi: true,
            tgl_mulai: true,
            tgl_selesai: true,
            guru: {
              select: {
                nama: true,
              },
            },
          },
          take: 5,
          orderBy: { tgl_mulai: 'desc' },
        }),
      ])

      return NextResponse.json({
        results: {
          courses: recentCourses,
          materi: recentMateri,
          asesmen: recentAsesmen,
          schedules: recentSchedules,
        },
        isRecent: true,
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
      })
    }

    const searchLower = query.toLowerCase()

    // Search in parallel for better performance
    const [courses, materi, asesmen, schedules, users] = await Promise.all([
      // Search Courses
      prisma.course.findMany({
        where: {
          OR: [
            { judul: { contains: searchLower, mode: 'insensitive' } },
            { kategori: { contains: searchLower, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          judul: true,
          kategori: true,
          gambar: true,
        },
        take: 10,
      }),

      // Search Materi
      prisma.materi.findMany({
        where: {
          OR: [
            { judul: { contains: searchLower, mode: 'insensitive' } },
            { deskripsi: { contains: searchLower, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          judul: true,
          deskripsi: true,
          tgl_unggah: true,
          courseId: true,
          course: {
            select: {
              id: true,
              judul: true,
              kategori: true,
            },
          },
        },
        take: 10,
        orderBy: {
          tgl_unggah: 'desc',
        },
      }),

      // Search Asesmen - include courseId
      prisma.asesmen.findMany({
        where: {
          OR: [
            { nama: { contains: searchLower, mode: 'insensitive' } },
            { deskripsi: { contains: searchLower, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          nama: true,
          deskripsi: true,
          tipe: true,
          tgl_selesai: true,
          courseId: true,
          course: {
            select: {
              id: true,
              judul: true,
            },
          },
          _count: {
            select: {
              soal: true,
            },
          },
        },
        take: 10,
        orderBy: { id: 'desc' },
      }),

      // Search Jadwal/Schedule (Proyek)
      prisma.proyek.findMany({
        where: {
          OR: [
            { judul: { contains: searchLower, mode: 'insensitive' } },
            { deskripsi: { contains: searchLower, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          judul: true,
          deskripsi: true,
          tgl_mulai: true,
          tgl_selesai: true,
          guru: {
            select: {
              nama: true,
            },
          },
        },
        take: 10,
      }),

      // Search Users
      prisma.user.findMany({
        where: {
          OR: [
            { nama: { contains: searchLower, mode: 'insensitive' } },
            { email: { contains: searchLower, mode: 'insensitive' } },
            { username: { contains: searchLower, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          nama: true,
          email: true,
          role: true,
          foto: true,
        },
        take: 10,
      }),
    ])

    return NextResponse.json({
      results: {
        courses,
        materi,
        asesmen,
        schedules,
        users,
      },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Gagal melakukan pencarian' },
      { status: 500 }
    )
  }
}
