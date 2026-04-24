import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ 
    id: string
  }>
}

export default async function AddMateriPage({ params }: PageProps) {
  const { id: courseId } = await params

  // Redirect to course page for now since we'll implement add materi dialog
  // This is a temporary solution
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Tambah Materi Baru</h1>
      <p>Halaman untuk menambah materi masih dalam pengembangan.</p>
      <a href={`/courses/${courseId}`} className="text-blue-600 hover:underline">
        Kembali ke halaman kursus
      </a>
    </div>
  )
}
