import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Delete a group and all its members
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
  try {
    const { id: proyekId, kelompokId } = await params

    // Verify group exists and belongs to project
    const kelompok = await prisma.kelompok.findFirst({
      where: { id: kelompokId, pblId: proyekId },
    })

    if (!kelompok) {
      return NextResponse.json(
        { error: 'Kelompok tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete all members first, then the group
    await prisma.$transaction(async (tx) => {
      await tx.anggotaKelompok.deleteMany({
        where: { kelompokId },
      })
      await tx.kelompok.delete({
        where: { id: kelompokId },
      })
    })

    return NextResponse.json({ message: 'Kelompok berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus kelompok' },
      { status: 500 }
    )
  }
}
