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

    // Validate access:
    // - GURU/ADMIN: allowed (additional ownership checks happen elsewhere)
    // - SISWA: must be enrolled. Forum is allowed even before completion to avoid blocking help/discussion.
    if (userRole === 'SISWA') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { siswaId: userId, courseId: asesmen.courseId },
        select: { id: true },
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Anda tidak terdaftar di course ini', code: 'NOT_ENROLLED' },
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

    // Validate access (same rules as GET)
    if (userRole === 'SISWA') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { siswaId: userId, courseId: asesmen.courseId },
        select: { id: true },
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Anda tidak terdaftar di course ini', code: 'NOT_ENROLLED' },
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

// NOTE: Previously we blocked forum for SISWA until completion.
// That caused 403 during quiz and could crash the client when it didn't handle it.
// If you want to restore that rule, implement it in the UI (disable inputs) rather than hard-blocking GET.

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
