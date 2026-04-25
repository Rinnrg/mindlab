import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Disable caching for dynamic content
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guruId = searchParams.get('guruId')
    const siswaId = searchParams.get('siswaId')
    
    console.log('GET /api/courses - Parameters:', { guruId, siswaId, url: request.url })

    let courses = []

    if (guruId) {
      // Fetch courses for a specific teacher
      console.log('Fetching courses for guruId:', guruId)
      courses = await prisma.course.findMany({
        where: { guruId },
        include: {
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
          materi: {
            take: 5,
            select: {
              id: true,
              judul: true,
              deskripsi: true,
              tgl_unggah: true,
              kelasTarget: true,
            }
          }
        },
        orderBy: {
          judul: 'asc',
        },
      })
    } else if (siswaId) {
      // Fetch courses for a specific student (enrolled courses)
      console.log('Fetching courses for siswaId:', siswaId)
      const enrollments = await prisma.enrollment.findMany({
        where: { siswaId },
        include: {
          course: {
            include: {
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
              materi: {
                take: 5,
                select: {
                  id: true,
                  judul: true,
                  deskripsi: true,
                  tgl_unggah: true,
                  kelasTarget: true,
                }
              }
            },
          },
        },
      })
      courses = enrollments.map(e => e.course)
    } else {
      // Fetch all courses
      console.log('Fetching all courses')
      courses = await prisma.course.findMany({
        include: {
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
          materi: {
            take: 5,
            select: {
              id: true,
              judul: true,
              deskripsi: true,
              tgl_unggah: true,
              kelasTarget: true,
            }
          }
        },
        orderBy: {
          judul: 'asc',
        },
      })
    }

    console.log('Returning courses response with', courses.length, 'courses')
    const response = NextResponse.json({ courses })
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    return response

  } catch (error) {
    console.error('Error in GET /api/courses:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data courses', details: String(error) },
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
        deskripsi: deskripsi || null,
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
        _count: {
          select: {
            materi: true,
            asesmen: true,
            enrollments: true,
          },
        },
      },
    })
    
    return NextResponse.json({ course })

  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { error: 'Gagal membuat course', details: String(error) },
      { status: 500 }
    )
  }
}
