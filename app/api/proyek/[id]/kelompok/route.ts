import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all groups for a project with their members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const kelompok = await prisma.kelompok.findMany({
      where: { pblId: id },
      include: {
        anggota: {
          include: {
            siswa: {
              select: {
                id: true,
                nama: true,
                email: true,
                foto: true,
                kelas: true,
              }
            }
          }
        },
        _count: {
          select: {
            anggota: true
          }
        }
      },
      orderBy: { nama: 'asc' }
    })

    return NextResponse.json({ kelompok })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data kelompok' },
      { status: 500 }
    )
  }
}

// POST - Create a new group for the project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nama, anggotaIds } = body

    if (!nama) {
      return NextResponse.json(
        { error: 'Nama kelompok harus diisi' },
        { status: 400 }
      )
    }

    // Verify project exists
    const proyek = await prisma.pBL.findUnique({
      where: { id }
    })

    if (!proyek) {
      return NextResponse.json(
        { error: 'Proyek tidak ditemukan' },
        { status: 404 }
      )
    }

    // Create group with transaction
    const kelompok = await prisma.$transaction(async (tx) => {
      // Create the group
      const newKelompok = await tx.kelompok.create({
        data: {
          nama,
          pblId: id,
        }
      })

      // Add members if any
      if (anggotaIds && anggotaIds.length > 0) {
        await tx.anggotaKelompok.createMany({
          data: anggotaIds.map((siswaId: string) => ({
            kelompokId: newKelompok.id,
            siswaId,
          }))
        })
      }

      return newKelompok
    })

    return NextResponse.json({ kelompok })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Gagal membuat kelompok' },
      { status: 500 }
    )
  }
}
