import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/asesmen/status?courseId=...&siswaId=...
 * Returns per-asesmen status for a student within a course.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const siswaId = searchParams.get("siswaId")

    if (!courseId || !siswaId) {
      return NextResponse.json(
        { error: "courseId dan siswaId wajib diisi" },
        { status: 400 }
      )
    }

    // Ensure student is enrolled in this course.
    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId, siswaId },
      select: { id: true },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "Tidak memiliki akses ke course ini" },
        { status: 403 }
      )
    }

    const asesmenList = await prisma.asesmen.findMany({
      where: { courseId },
      select: { id: true, tipe: true },
    })

    const asesmenIds = asesmenList.map((a) => a.id)

    if (asesmenIds.length === 0) {
      return NextResponse.json({ statusByAsesmenId: {} })
    }

    const [pengumpulan, nilai] = await Promise.all([
      prisma.pengumpulanProyek.findMany({
        where: {
          asesmenId: { in: asesmenIds },
          siswaId,
        },
        select: { asesmenId: true },
      }),
      prisma.nilai.findMany({
        where: {
          asesmenId: { in: asesmenIds },
          siswaId,
        },
        select: { asesmenId: true },
      }),
    ])

    const submittedSet = new Set(pengumpulan.map((p) => p.asesmenId))
    const completedQuizSet = new Set(nilai.map((n) => n.asesmenId))

    const statusByAsesmenId: Record<
      string,
      { submitted: boolean; completedQuiz: boolean }
    > = {}

    for (const a of asesmenList) {
      statusByAsesmenId[a.id] = {
        submitted: submittedSet.has(a.id),
        completedQuiz: completedQuizSet.has(a.id),
      }
    }

    return NextResponse.json({ statusByAsesmenId })
  } catch (error) {
    console.error("Error fetching asesmen status:", error)
    return NextResponse.json(
      { error: "Gagal mengambil status asesmen" },
      { status: 500 }
    )
  }
}
