import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, kelasId } = body

    console.log('POST /api/enrollments - Request body:', { courseId, kelasId })

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    if (!kelasId) {
      return NextResponse.json(
        { error: 'Kelas name is required' },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, judul: true }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get all students in the kelas (using kelas name as string)
    const studentsInKelas = await prisma.user.findMany({
      where: { 
        kelas: kelasId, // kelasId is actually the kelas name string
        role: 'SISWA'
      },
      select: { id: true, nama: true, kelas: true }
    })

    if (studentsInKelas.length === 0) {
      return NextResponse.json(
        { error: `No students found in kelas ${kelasId}` },
        { status: 404 }
      )
    }

    console.log(`Found ${studentsInKelas.length} students in kelas ${kelasId}`)

    // Create enrollment records for all students in the kelas
    const enrollmentData = studentsInKelas.map(student => ({
      courseId,
      siswaId: student.id,
      progress: 0,
    }))

    // Use createMany with skipDuplicates to handle existing enrollments
    const result = await prisma.enrollment.createMany({
      data: enrollmentData,
      skipDuplicates: true
    })

    console.log(`Created ${result.count} new enrollments for course ${courseId}`)

    return NextResponse.json({
      message: `Successfully enrolled ${result.count} students from kelas ${kelasId}`,
      enrolledCount: result.count,
      totalStudentsInKelas: studentsInKelas.length,
      skippedCount: studentsInKelas.length - result.count
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating enrollments:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create enrollments',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    let enrollments

    if (courseId) {
      // Get enrollments for specific course
      enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        include: {
          siswa: {
            select: {
              id: true,
              nama: true,
              email: true,
              kelas: true,
              foto: true
            }
          },
          course: {
            select: {
              id: true,
              judul: true,
              kategori: true
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        }
      })
    } else {
      // Get all enrollments
      enrollments = await prisma.enrollment.findMany({
        include: {
          siswa: {
            select: {
              id: true,
              nama: true,
              email: true,
              kelas: true,
              foto: true
            }
          },
          course: {
            select: {
              id: true,
              judul: true,
              kategori: true
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        }
      })
    }

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}
