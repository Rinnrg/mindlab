import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET forum discussions for an asesmen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'userId dan userRole diperlukan' },
        { status: 400 }
      )
    }

    // Check if asesmen exists
    const asesmen = await prisma.asesmen.findUnique({
      where: { id: asesmenId },
      select: { id: true, courseId: true, guruId: true, tipe: true }
    })

    if (!asesmen) {
      return NextResponse.json(
        { error: 'Asesmen tidak ditemukan' },
        { status: 404 }
      )
    }

    // Validate access - guru always has access, siswa must have completed
    if (userRole === 'SISWA') {
      // Check enrollment
      const enrollment = await prisma.enrollment.findFirst({
        where: { siswaId: userId, courseId: asesmen.courseId }
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Anda tidak terdaftar di course ini' },
          { status: 403 }
        )
      }

      // Check if student has completed the asesmen
      const hasCompleted = await checkStudentCompleted(userId, asesmenId, asesmen.tipe)
      if (!hasCompleted) {
        return NextResponse.json(
          { error: 'Anda harus menyelesaikan asesmen terlebih dahulu' },
          { status: 403 }
        )
      }
    }

    // Fetch discussions with replies
    const discussions = await prisma.forumDiskusi.findMany({
      where: { asesmenId },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            foto: true,
            role: true,
          }
        },
        balasan: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                foto: true,
                role: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { balasan: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ discussions })
  } catch (error) {
    console.error('Error fetching forum:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data forum' },
      { status: 500 }
    )
  }
}

// POST create new discussion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params
    const body = await request.json()
    const { userId, userRole, pesan } = body

    if (!userId || !userRole || !pesan?.trim()) {
      return NextResponse.json(
        { error: 'userId, userRole, dan pesan diperlukan' },
        { status: 400 }
      )
    }

    // Check if asesmen exists
    const asesmen = await prisma.asesmen.findUnique({
      where: { id: asesmenId },
      select: { id: true, courseId: true, guruId: true, tipe: true }
    })

    if (!asesmen) {
      return NextResponse.json(
        { error: 'Asesmen tidak ditemukan' },
        { status: 404 }
      )
    }

    // Validate access
    if (userRole === 'SISWA') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { siswaId: userId, courseId: asesmen.courseId }
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Anda tidak terdaftar di course ini' },
          { status: 403 }
        )
      }

      const hasCompleted = await checkStudentCompleted(userId, asesmenId, asesmen.tipe)
      if (!hasCompleted) {
        return NextResponse.json(
          { error: 'Anda harus menyelesaikan asesmen terlebih dahulu' },
          { status: 403 }
        )
      }
    }

    const discussion = await prisma.forumDiskusi.create({
      data: {
        pesan: pesan.trim(),
        userId,
        asesmenId,
      },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            foto: true,
            role: true,
          }
        },
        balasan: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                foto: true,
                role: true,
              }
            }
          }
        },
        _count: {
          select: { balasan: true }
        }
      }
    })

    return NextResponse.json({ discussion }, { status: 201 })
  } catch (error) {
    console.error('Error creating discussion:', error)
    return NextResponse.json(
      { error: 'Gagal membuat diskusi' },
      { status: 500 }
    )
  }
}

// Helper function to check if student has completed the asesmen
async function checkStudentCompleted(userId: string, asesmenId: string, tipe: string): Promise<boolean> {
  if (tipe === 'KUIS') {
    // Check if student has nilai (score) for this quiz
    const nilai = await prisma.nilai.findFirst({
      where: { siswaId: userId, asesmenId }
    })
    return !!nilai
  } else {
    // TUGAS - Check if student has submitted
    const pengumpulan = await prisma.pengumpulanProyek.findFirst({
      where: { siswaId: userId, asesmenId }
    })
    return !!pengumpulan
  }
}

// DELETE a discussion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')
    const discussionId = searchParams.get('discussionId')

    if (!userId || !userRole || !discussionId) {
      return NextResponse.json(
        { error: 'userId, userRole, dan discussionId diperlukan' },
        { status: 400 }
      )
    }

    // Verify discussion exists
    const discussion = await prisma.forumDiskusi.findFirst({
      where: { id: discussionId, asesmenId }
    })

    if (!discussion) {
      return NextResponse.json(
        { error: 'Diskusi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Only owner or guru/admin can delete
    if (discussion.userId !== userId && userRole === 'SISWA') {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk menghapus diskusi ini' },
        { status: 403 }
      )
    }

    await prisma.forumDiskusi.delete({
      where: { id: discussionId }
    })

    return NextResponse.json({ message: 'Diskusi berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting discussion:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus diskusi' },
      { status: 500 }
    )
  }
}
