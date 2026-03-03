import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST create reply to a discussion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; forumId: string }> }
) {
  try {
    const { id: asesmenId, forumId } = await params
    const body = await request.json()
    const { userId, userRole, pesan } = body

    if (!userId || !userRole || !pesan?.trim()) {
      return NextResponse.json(
        { error: 'userId, userRole, dan pesan diperlukan' },
        { status: 400 }
      )
    }

    // Check if forum discussion exists and belongs to the asesmen
    const forumDiskusi = await prisma.forumDiskusi.findFirst({
      where: { id: forumId, asesmenId },
      include: {
        asesmen: {
          select: { courseId: true, tipe: true }
        }
      }
    })

    if (!forumDiskusi) {
      return NextResponse.json(
        { error: 'Diskusi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Validate access for students
    if (userRole === 'SISWA') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { siswaId: userId, courseId: forumDiskusi.asesmen.courseId }
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Anda tidak terdaftar di course ini' },
          { status: 403 }
        )
      }

      // Check if student completed the asesmen
      const hasCompleted = await checkStudentCompleted(userId, asesmenId, forumDiskusi.asesmen.tipe)
      if (!hasCompleted) {
        return NextResponse.json(
          { error: 'Anda harus menyelesaikan asesmen terlebih dahulu' },
          { status: 403 }
        )
      }
    }

    const reply = await prisma.balasanForum.create({
      data: {
        pesan: pesan.trim(),
        userId,
        forumDiskusiId: forumId,
      },
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
    })

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Gagal membuat balasan' },
      { status: 500 }
    )
  }
}

// DELETE a reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; forumId: string }> }
) {
  try {
    const { forumId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')
    const replyId = searchParams.get('replyId')

    if (!userId || !userRole || !replyId) {
      return NextResponse.json(
        { error: 'userId, userRole, dan replyId diperlukan' },
        { status: 400 }
      )
    }

    // Verify reply belongs to user (or user is GURU/ADMIN)
    const reply = await prisma.balasanForum.findUnique({
      where: { id: replyId }
    })

    if (!reply) {
      return NextResponse.json(
        { error: 'Balasan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (reply.userId !== userId && userRole === 'SISWA') {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk menghapus balasan ini' },
        { status: 403 }
      )
    }

    await prisma.balasanForum.delete({
      where: { id: replyId }
    })

    return NextResponse.json({ message: 'Balasan berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting reply:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus balasan' },
      { status: 500 }
    )
  }
}

// Helper
async function checkStudentCompleted(userId: string, asesmenId: string, tipe: string): Promise<boolean> {
  if (tipe === 'KUIS') {
    const nilai = await prisma.nilai.findFirst({
      where: { siswaId: userId, asesmenId }
    })
    return !!nilai
  } else {
    const pengumpulan = await prisma.pengumpulanProyek.findFirst({
      where: { siswaId: userId, asesmenId }
    })
    return !!pengumpulan
  }
}
