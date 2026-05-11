import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import KuisGradingClient from "@/components/kuis-grading-client"

interface PageProps {
  params: Promise<{
    id: string
    itemId: string
    attemptId: string
  }>
}

export default async function KuisGradingPage({ params }: PageProps) {
  const { id: courseId, itemId: asesmenId, attemptId } = await params

  const attempt = await prisma.kuisAttempt.findUnique({
    where: { id: attemptId },
    include: {
      siswa: {
        select: {
          id: true,
          nama: true,
          email: true,
          foto: true,
        },
      },
      asesmen: {
        include: {
          soal: {
            include: {
              opsi: true
            }
          }
        }
      },
      nilai: {
        include: {
          jawabanSiswa: {
            include: {
              soal: {
                include: {
                  opsi: true
                }
              }
            }
          }
        }
      }
    },
  })

  if (!attempt || !attempt.nilai[0]) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6 sm:py-10">
      <KuisGradingClient 
        courseId={courseId} 
        asesmenId={asesmenId} 
        attempt={attempt} 
        moduleType="pbl"
      />
    </div>
  )
}
