import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
  const { id, kelompokId } = await params

  try {
    const kelompok = await prisma.kelompok.findUnique({
      where: { id: kelompokId },
      select: { id: true, asesmenId: true },
    })

    if (!kelompok || kelompok.asesmenId !== id) {
      return NextResponse.json({ error: "Kelompok tidak ditemukan" }, { status: 404 })
    }

    const asesmen = await prisma.asesmen.findUnique({
      where: { id },
      select: { id: true, courseId: true },
    })

    if (!asesmen) {
      return NextResponse.json({ error: "Asesmen tidak ditemukan" }, { status: 404 })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: asesmen.courseId },
      select: {
        siswa: { select: { id: true, nama: true, email: true, foto: true, kelas: true } },
      },
    })

    const students = enrollments.map((e) => e.siswa)
    return NextResponse.json({ students })
  } catch (e) {
    console.error("GET /api/asesmen/[id]/kelompok/[kelompokId]/anggota error", e)
    return NextResponse.json({ error: "Gagal memuat siswa" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
  const { id, kelompokId } = await params

  try {
    const body = await req.json().catch(() => null)
    const siswaIds: string[] = Array.isArray(body?.siswaIds) ? body.siswaIds : []

    const kelompok = await prisma.kelompok.findUnique({
      where: { id: kelompokId },
      select: { id: true, asesmenId: true },
    })

    if (!kelompok || kelompok.asesmenId !== id) {
      return NextResponse.json({ error: "Kelompok tidak ditemukan" }, { status: 404 })
    }

    // Remove duplicates and empty
    const uniqueIds = Array.from(new Set(siswaIds.filter((x) => typeof x === "string" && x)))

    // Ensure each student appears only once across groups for this asesmen
    if (uniqueIds.length > 0) {
      await prisma.anggotaKelompok.deleteMany({
        where: {
          siswaId: { in: uniqueIds },
          kelompok: { asesmenId: id },
          NOT: { kelompokId },
        },
      })
    }

    // Create members (skip duplicates inside kelompok)
    if (uniqueIds.length > 0) {
      await prisma.anggotaKelompok.createMany({
        data: uniqueIds.map((siswaId) => ({ kelompokId, siswaId })),
        skipDuplicates: true,
      })
    }

    const updated = await prisma.kelompok.findUnique({
      where: { id: kelompokId },
      include: {
        ketua: { select: { id: true, nama: true, email: true, foto: true, kelas: true } },
        anggota: {
          include: { siswa: { select: { id: true, nama: true, email: true, foto: true, kelas: true } } },
        },
        _count: { select: { anggota: true } },
      },
    })

    return NextResponse.json({ kelompok: updated })
  } catch (e) {
    console.error("POST /api/asesmen/[id]/kelompok/[kelompokId]/anggota error", e)
    return NextResponse.json({ error: "Gagal menambah anggota" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
  const { id, kelompokId } = await params

  try {
    const body = await req.json().catch(() => null)
    const siswaId = typeof body?.siswaId === "string" ? body.siswaId : ""
    if (!siswaId) {
      return NextResponse.json({ error: "siswaId wajib" }, { status: 400 })
    }

    const kelompok = await prisma.kelompok.findUnique({
      where: { id: kelompokId },
      select: { id: true, asesmenId: true },
    })

    if (!kelompok || kelompok.asesmenId !== id) {
      return NextResponse.json({ error: "Kelompok tidak ditemukan" }, { status: 404 })
    }

    await prisma.anggotaKelompok.deleteMany({ where: { kelompokId, siswaId } })

    // If ketua removed, unset ketuaId
    await prisma.kelompok.update({
      where: { id: kelompokId },
      data: { ketuaId: null },
    }).catch(() => null)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/asesmen/[id]/kelompok/[kelompokId]/anggota error", e)
    return NextResponse.json({ error: "Gagal menghapus anggota" }, { status: 500 })
  }
}
