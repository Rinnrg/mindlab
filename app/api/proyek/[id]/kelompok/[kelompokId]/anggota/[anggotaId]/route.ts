import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Remove a member from a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kelompokId: string; anggotaId: string }> }
) {
  try {
    const { id: proyekId, kelompokId, anggotaId } = await params

    // Verify the member belongs to this group and project
    const kelompok = await prisma.kelompok.findFirst({
      where: {
        id: kelompokId,
        pblId: proyekId,
        anggotaIds: { has: anggotaId }
      },
    })

    if (!kelompok) {
      return NextResponse.json(
        { error: 'Anggota tidak ditemukan' },
        { status: 404 }
      )
    }

    const updatedIds = kelompok.anggotaIds.filter(id => id !== anggotaId)

    await prisma.kelompok.update({
      where: { id: kelompokId },
      data: {
        anggotaIds: updatedIds
      }
    })

    return NextResponse.json({ message: 'Anggota berhasil dihapus dari kelompok' })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus anggota' },
      { status: 500 }
    )
  }
}
