import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : {},
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        foto: true,
        kelas: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, nama, password, role, foto, kelas } = body

    if (!email || !nama || !role) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah digunakan' },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        nama,
        password: password || 'password123',
        role,
        foto: foto || null,
        kelas: kelas || null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        foto: true,
        kelas: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Gagal membuat user' },
      { status: 500 }
    )
  }
}
