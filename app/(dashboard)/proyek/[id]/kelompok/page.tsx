import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProjectGroupsManagement from "@/components/project-groups-management"

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectGroupsPage({ params }: PageProps) {
  const { id: proyekId } = await params
  
  const proyek = await prisma.pBL.findUnique({
    where: { id: proyekId },
    select: { 
      id: true, 
      judul: true,
      deskripsi: true,
      tgl_mulai: true,
      tgl_selesai: true,
      guru: {
        select: {
          id: true,
          nama: true
        }
      }
    }
  })
  
  if (!proyek) notFound()
  
  return (
    <ProjectGroupsManagement 
      proyekId={proyek.id} 
      proyekTitle={proyek.judul} 
    />
  )
}
