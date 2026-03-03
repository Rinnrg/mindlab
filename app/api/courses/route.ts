import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guruId = searchParams.get('guruId')
    const siswaId = searchParams.get('siswaId')

    let courses

    if (guruId) {
      // Get courses by teacher - optimized with select
      courses = await prisma.course.findMany({
        where: { guruId },
        select: {
          id: true,
          judul: true,
          deskripsi: true,
          gambar: true,
          kategori: true,
          guruId: true,
          guru: {
            select: {
              id: true,
              nama: true,
              email: true,
              foto: true,
            },
          },
          _count: {
            select: {
              materi: true,
              asesmen: true,
              enrollments: true,
            },
          },
        },
        orderBy: {
          judul: 'asc',
        },
      })
    } else if (siswaId) {
      // Get enrolled courses by student - optimized with select
      const enrollments = await prisma.enrollment.findMany({
        where: { siswaId },
        select: {
          progress: true,
          enrolledAt: true,
          course: {
            select: {
              id: true,
              judul: true,
              deskripsi: true,
              gambar: true,
              kategori: true,
              guruId: true,
              guru: {
                select: {
                  id: true,
                  nama: true,
                  email: true,
                  foto: true,
                },
              },
              _count: {
                select: {
                  materi: true,
                  asesmen: true,
                  enrollments: true,
                },
              },
            },
          },
        },
        orderBy: {
          enrolledAt: 'desc',
        },
      })
      
      courses = enrollments.map(e => ({
        ...e.course,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
      }))
    } else {
      // Get all courses - optimized with select
      courses = await prisma.course.findMany({
        select: {
          id: true,
          judul: true,
          deskripsi: true,
          gambar: true,
          kategori: true,
          guruId: true,
          guru: {
            select: {
              id: true,
              nama: true,
              email: true,
              foto: true,
            },
          },
          _count: {
            select: {
              materi: true,
              asesmen: true,
              enrollments: true,
            },
          },
        },
        orderBy: {
          judul: 'asc',
        },
      })
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data courses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { judul, deskripsi, gambar, kategori, guruId } = body

    if (!judul || !kategori || !guruId) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    const course = await prisma.course.create({
      data: {
        judul,
        deskripsi,
        gambar: gambar || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
        kategori,
        guruId,
      },
      include: {
        guru: {
          select: {
            id: true,
            nama: true,
            email: true,
            foto: true,
          },
        },
      },
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { error: 'Gagal membuat course' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('id')

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Delete the course (cascade will handle related records)
    await prisma.course.delete({
      where: { id: courseId },
    })

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus course' },
      { status: 500 }
    )
  }
}
