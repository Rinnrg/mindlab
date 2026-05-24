import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
  const { id, kelompokId } = await params

  try {
    const body = await req.json().catch(() => null)
    const nama = typeof body?.nama === "string" ? body.nama.trim() : undefined
    const ketuaId = typeof body?.ketuaId === "string" ? body.ketuaId : undefined

    const updated = await prisma.kelompok.update({
      where: { id: kelompokId },
      data: {
        ...(nama !== undefined ? { nama } : {}),
        ...(ketuaId !== undefined ? { ketuaId } : {}),
      },
      include: {
        ketua: { select: { id: true, nama: true, email: true, foto: true, kelas: true } },
        anggota: {
          include: { siswa: { select: { id: true, nama: true, email: true, foto: true, kelas: true } } },
        },
        _count: { select: { anggota: true } },
      },
    })

    if (updated.asesmenId !== id) {
      return NextResponse.json({ error: "Kelompok tidak cocok dengan asesmen" }, { status: 400 })
    }

    return NextResponse.json({ kelompok: updated })
  } catch (e) {
    console.error("PATCH /api/asesmen/[id]/kelompok/[kelompokId] error", e)
    return NextResponse.json({ error: "Gagal mengubah kelompok" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
  const { id, kelompokId } = await params

  try {
    const existing = await prisma.kelompok.findUnique({ where: { id: kelompokId } })
    if (!existing || existing.asesmenId !== id) {
      return NextResponse.json({ error: "Kelompok tidak ditemukan" }, { status: 404 })
    }

    await prisma.kelompok.delete({ where: { id: kelompokId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/asesmen/[id]/kelompok/[kelompokId] error", e)
    return NextResponse.json({ error: "Gagal menghapus kelompok" }, { status: 500 })
  }
}
