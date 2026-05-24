import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const kelompok = await prisma.kelompok.findMany({
      where: { asesmenId: id },
  orderBy: { nama: "asc" },
      include: {
        ketua: {
          select: { id: true, nama: true, email: true, foto: true, kelas: true },
        },
        anggota: {
          include: {
            siswa: {
              select: { id: true, nama: true, email: true, foto: true, kelas: true },
            },
          },
        },
        _count: { select: { anggota: true } },
      },
    })

    return NextResponse.json({ kelompok })
  } catch (e) {
    console.error("GET /api/asesmen/[id]/kelompok error", e)
    return NextResponse.json({ error: "Gagal memuat kelompok" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await req.json().catch(() => null)
    const nama = typeof body?.nama === "string" ? body.nama.trim() : ""
    const ketuaId = typeof body?.ketuaId === "string" ? body.ketuaId : null

    if (!nama) {
      return NextResponse.json({ error: "Nama kelompok wajib diisi" }, { status: 400 })
    }

    const created = await prisma.kelompok.create({
      data: {
        nama,
        asesmenId: id,
        ...(ketuaId ? { ketuaId } : {}),
      },
      include: {
        ketua: {
          select: { id: true, nama: true, email: true, foto: true, kelas: true },
        },
        anggota: {
          include: {
            siswa: {
              select: { id: true, nama: true, email: true, foto: true, kelas: true },
            },
          },
        },
        _count: { select: { anggota: true } },
      },
    })

    return NextResponse.json({ kelompok: created })
  } catch (e) {
    console.error("POST /api/asesmen/[id]/kelompok error", e)
    return NextResponse.json({ error: "Gagal membuat kelompok" }, { status: 500 })
  }
}
