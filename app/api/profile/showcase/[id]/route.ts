import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json({ error: "ID showcase tidak valid" }, { status: 400 })
    }

    const showcase = await prisma.profileShowcase.findUnique({
      where: { id },
      include: {
        siswa: {
          select: {
            id: true,
            nama: true,
            email: true,
            foto: true,
          },
        },
        pengumpulanProyek: {
          select: {
            id: true,
            sourceCode: true,
            output: true,
            fileUrl: true,
            fileData: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            status: true,
            validatedAt: true,
            validatedBy: true,
            namaKelompok: true,
            ketua: true,
            anggota: true,
            tgl_unggah: true,
            feedback: true,
            asesmen: {
              select: {
                id: true,
                nama: true,
                tipe: true,
                tipePengerjaan: true,
                course: {
                  select: {
                    id: true,
                    judul: true,
                    gambar: true,
                  },
                },
                guru: {
                  select: {
                    id: true,
                    nama: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!showcase) {
      return NextResponse.json({ error: "Showcase tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ showcase })
  } catch (error) {
    console.error("Error fetching showcase by id:", error)
    return NextResponse.json({ error: "Gagal mengambil detail showcase" }, { status: 500 })
  }
}
