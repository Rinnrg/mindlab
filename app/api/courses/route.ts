import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 300 // 5 minutes

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

    const response = NextResponse.json({ courses })
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return response
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

    console.log('POST /api/courses - Request body:', { judul, deskripsi, gambar, kategori, guruId })

    if (!judul || !kategori || !guruId) {
      console.log('POST /api/courses - Missing required fields:', { judul: !!judul, kategori: !!kategori, guruId: !!guruId })
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Validate that the guru exists
    const guru = await prisma.user.findUnique({
      where: { id: guruId },
      select: { id: true, role: true }
    })

    if (!guru) {
      console.log('POST /api/courses - Guru not found:', guruId)
      return NextResponse.json(
        { error: 'Guru tidak ditemukan' },
        { status: 404 }
      )
    }

    if (guru.role !== 'GURU' && guru.role !== 'ADMIN') {
      console.log('POST /api/courses - Invalid role for course creation:', guru.role)
      return NextResponse.json(
        { error: 'Hanya guru atau admin yang dapat membuat course' },
        { status: 403 }
      )
    }

    console.log('POST /api/courses - Creating course with data:', {
      judul,
      deskripsi: deskripsi || null,
      gambar: gambar || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
      kategori,
      guruId
    })

    const course = await prisma.course.create({
      data: {
        judul,
        deskripsi: deskripsi || null,
        gambar: gambar || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
        kategori,
        guruId,
      },
    })

    console.log('POST /api/courses - Course created successfully:', course.id)
    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid guru ID or database constraint error' },
          { status: 400 }
        )
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Course with this title already exists' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Gagal membuat course', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
