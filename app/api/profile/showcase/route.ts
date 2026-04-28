import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Get profile showcase entries for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siswaId = searchParams.get("siswaId")
  const onlyPublic = searchParams.get("public")

    if (!siswaId) {
      return NextResponse.json(
        { error: "siswaId is required" },
        { status: 400 }
      )
    }

    const showcases = await prisma.profileShowcase.findMany({
      where: {
        siswaId,
        ...(onlyPublic === "true" ? { isPublic: true } : {}),
      },
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
      orderBy: {
        tanggalDinilai: "desc",
      },
    })

    // Normalize a few fields so the UI can rely on them.
    const normalized = showcases.map((s) => {
      const p = s.pengumpulanProyek
      const courseTitle = p?.asesmen?.course?.judul
      const asesmenTitle = p?.asesmen?.nama
      const fallbackTitle = [asesmenTitle, courseTitle].filter(Boolean).join(" - ")
      return {
        ...s,
        judul: s.judul || fallbackTitle || "Showcase",
        deskripsi: s.deskripsi ?? p?.feedback ?? null,
      }
    })

    return NextResponse.json({ showcases: normalized })
  } catch (error) {
    console.error("Error fetching showcases:", error)
    return NextResponse.json(
      { error: "Failed to fetch showcases" },
      { status: 500 }
    )
  }
}
