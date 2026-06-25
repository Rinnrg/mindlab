import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        kelas: true,
        foto: true,
        createdAt: true,
        _count: {
          select: {
            course: true,
            masalahDibuat: true,
            asesmenDibuat: true,
            nilai: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data user' },
      { status: 500 }
    )
  }
}

// UPDATE user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { username, email, nama, password, role, kelas, foto } = body

    // Ambil data user lama untuk cek apakah kelas berubah
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { kelas: true, role: true },
    })

    // Check if email is being changed and already exists
    if (email) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id },
        },
      })

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 400 }
        )
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(nama && { nama }),
        ...(password && { password }),
        ...(role && { role }),
        ...(kelas !== undefined && { kelas }),
        ...(foto !== undefined && { foto }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        kelas: true,
        foto: true,
        createdAt: true,
      },
    })

    // Auto-enroll ke course jika kelas SISWA berubah ke kelas baru
    const newRole = role || existingUser?.role
    const newKelas = kelas !== undefined ? kelas : existingUser?.kelas
    const kelasChanged = kelas !== undefined && kelas !== existingUser?.kelas

    if (newRole === 'SISWA' && newKelas && kelasChanged) {
      // Cari semua course yang sudah punya siswa dari kelas yang sama
      const enrolledCourses = await prisma.enrollment.findMany({
        where: {
          siswa: { kelas: newKelas },
          siswaId: { not: id }, // exclude user ini sendiri
        },
        select: { courseId: true },
        distinct: ['courseId'],
      })

      // Daftarkan user ke semua course tersebut (skip jika sudah terdaftar)
      if (enrolledCourses.length > 0) {
        await Promise.all(
          enrolledCourses.map((e) =>
            prisma.enrollment.upsert({
              where: { courseId_siswaId: { courseId: e.courseId, siswaId: id } },
              update: {},
              create: { courseId: e.courseId, siswaId: id },
            })
          )
        )
      }
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate user' },
      { status: 500 }
    )
  }
}


// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'User berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus user' },
      { status: 500 }
    )
  }
}
