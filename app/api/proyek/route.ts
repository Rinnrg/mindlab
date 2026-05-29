import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guruId = searchParams.get('guruId')
    const judul = searchParams.get('judul')

    // Auto-migrate database by checking/adding materiSintak column
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE pbl ADD COLUMN IF NOT EXISTS "materiSintak" VARCHAR(50);
      `)
    } catch (sqlError) {
      console.warn('materiSintak auto-migration skipped/failed:', sqlError)
    }

    // If judul is specified, return single proyek
    if (judul) {
      const proyek = await prisma.pBL.findFirst({
        where: { judul },
        include: {
          guru: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
        },
      })
      return NextResponse.json(proyek)
    }

    const proyek = await prisma.pBL.findMany({
      where: guruId ? { guruId } : {},
      include: {
        guru: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        kelompok: true,
        _count: {
          select: {
            kelompok: true,
          },
        },
      },
      orderBy: {
        tgl_mulai: 'desc',
      },
    })

    // Fetch all user details for kelompok anggota
    const allUserIds = Array.from(new Set(proyek.flatMap(p => p.kelompok.flatMap(k => k.anggotaIds))))
    const users = await prisma.user.findMany({
      where: { id: { in: allUserIds } },
      select: {
        id: true,
        nama: true,
        kelas: true,
      }
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    const formattedProyek = proyek.map(p => ({
      ...p,
      kelompok: p.kelompok.map(k => ({
        ...k,
        anggota: k.anggotaIds.map(id => userMap.get(id)).filter(Boolean),
        _count: {
          anggota: k.anggotaIds.length
        }
      }))
    }))

    return NextResponse.json({ pbl: formattedProyek })
  } catch (error) {
    console.error('Error fetching proyek:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data PBL' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { judul, deskripsi, tgl_mulai, tgl_selesai, lampiran, sintaks, guruId, fileData, fileName, fileType, fileSize } = body

    if (!judul || !deskripsi || !tgl_mulai || !tgl_selesai || !guruId) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    if (!sintaks || !Array.isArray(sintaks) || sintaks.length === 0) {
      return NextResponse.json(
        { error: 'Pilih minimal satu tahapan sintaks' },
        { status: 400 }
      )
    }

    // Check if start date is before end date
    if (new Date(tgl_mulai) >= new Date(tgl_selesai)) {
      return NextResponse.json(
        { error: "Tanggal selesai harus lebih besar dari tanggal mulai" },
        { status: 400 }
      )
    }

    // Check if teacher exists
    const guru = await prisma.user.findUnique({
      where: { 
        id: guruId,
        role: "GURU"
      }
    })

    if (!guru) {
      return NextResponse.json(
        { error: "Guru tidak ditemukan" },
        { status: 404 }
      )
    }

    // Extract selectedClasses for enrollment
    const { selectedClasses } = body

  // Process file if provided - will upload after creating the proyek to include proyek id in prefix
  let finalLampiran = lampiran || null

  const proyek = await prisma.$transaction(async (tx) => {
      // Create the project
      const newProyek = await tx.pBL.create({
        data: {
          judul,
          deskripsi,
          tgl_mulai: new Date(tgl_mulai),
          tgl_selesai: new Date(tgl_selesai),
          lampiran: finalLampiran,
          fileData: null,
          fileName: fileName || null,
          fileType: fileType || null,
          fileSize: fileSize || null,
          sintaks,
          guruId,
          materiSintak: "1", // default to Sintak 1
        },
        include: {
          guru: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
          _count: {
            select: {
              kelompok: true,
            },
          },
        },
      })

      // Create the corresponding Course record for UI compatibility
      await tx.course.create({
        data: {
          id: newProyek.id,
          judul,
          deskripsi: deskripsi || null,
          gambar: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
          kategori: 'Programming',
          guruId,
        }
      })

      // If classes are selected, create a default group and enroll all students from those classes
      if (selectedClasses && Array.isArray(selectedClasses) && selectedClasses.length > 0) {
        // Get all students from selected classes
        const students = await tx.user.findMany({
          where: {
            role: 'SISWA',
            kelas: { in: selectedClasses },
          },
          select: { id: true },
        })

        if (students.length > 0) {
          // Create a default group and connect students
          await tx.kelompok.create({
            data: {
              nama: 'Kelompok Utama',
              pblId: newProyek.id,
              anggotaIds: students.map((s) => s.id)
            },
          })
        }
      }

      return newProyek
    })

    // If fileData provided, upload to structured path and update proyek.lampiran
    if (fileData) {
      try {
        const { uploadToSupabase } = await import('@/lib/supabase')
        const prefix = `proyek/${proyek.id}/lampiran`
        const publicUrl = await uploadToSupabase(fileData, fileName || 'lampiran', fileType || '', prefix)
        await prisma.pBL.update({ where: { id: proyek.id }, data: { lampiran: publicUrl } })
        proyek.lampiran = publicUrl
      } catch (uploadError: any) {
        console.error('Supabase upload failed during proyek creation:', uploadError)
        return NextResponse.json(
          { error: 'Gagal mengupload file ke Supabase Storage: ' + (uploadError.message || String(uploadError)) },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ pbl: proyek }, { status: 201 })
  } catch (error) {
    console.error('Error creating proyek:', error)
    const message = error instanceof Error ? error.message : 'Gagal membuat PBL'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
