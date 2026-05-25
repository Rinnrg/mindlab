import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single proyek by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // NOTE: beberapa schema memakai relasi `pengajar` (bukan `guru`).
    // Kita coba query dengan `pengajar` dulu, lalu fallback ke `guru` supaya API tetap jalan
    // meski schema berbeda antar environment.
    let proyek: any = null
    try {
      proyek = await prisma.pBL.findUnique({
        where: { id },
        include: {
          pengajar: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
          kelompok: {
            include: {
              anggota: {
                include: {
                  siswa: {
                    select: {
                      id: true,
                      nama: true,
                      kelas: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  anggota: true,
                },
              },
            },
          },
          _count: {
            select: {
              kelompok: true,
            },
          },
        },
      })
    } catch (e) {
      // fallback schema lama
      proyek = await prisma.pBL.findUnique({
        where: { id },
        include: {
          guru: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
          kelompok: {
            include: {
              anggota: {
                include: {
                  siswa: {
                    select: {
                      id: true,
                      nama: true,
                      kelas: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  anggota: true,
                },
              },
            },
          },
          _count: {
            select: {
              kelompok: true,
            },
          },
        },
      })
    }

    if (!proyek) {
      return NextResponse.json(
        { error: 'PBL tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      proyek 
    })
  } catch (error) {
    console.error('Error fetching proyek:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data proyek' },
      { status: 500 }
    )
  }
}

// UPDATE proyek
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { judul, deskripsi, tgl_mulai, tgl_selesai, lampiran, sintaks, fileData, fileName, fileType, fileSize, sintak, isMaterialOnly } = body

    // Check if project exists
    const existingProyek = await prisma.pBL.findUnique({
      where: { id },
    })

    if (!existingProyek) {
      return NextResponse.json(
        { error: "PBL tidak ditemukan" },
        { status: 404 }
      )
    }

    if (isMaterialOnly) {
      // Process file if provided
      let finalLampiran = lampiran || null
      if (fileData) {
        const { uploadToSupabase } = await import('@/lib/supabase')
        try {
          finalLampiran = await uploadToSupabase(fileData, fileName || 'lampiran', fileType || '')
        } catch (uploadError: any) {
          console.error('Supabase upload failed:', uploadError)
          return NextResponse.json(
            { error: 'Gagal mengupload file ke Supabase Storage: ' + (uploadError.message || String(uploadError)) },
            { status: 500 }
          )
        }
      }

      const proyek = await prisma.pBL.update({
        where: { id },
        data: {
          lampiran: finalLampiran,
          fileData: null,
          fileName: fileName || null,
          fileType: fileType || null,
          fileSize: fileSize || null,
          materiSintak: sintak || null,
        },
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

      return NextResponse.json({ pbl: proyek })
    }

    // Validation for standard update  
    if (!judul || !deskripsi || !tgl_mulai || !tgl_selesai) {
      return NextResponse.json(
        { error: "Semua field wajib harus diisi" },
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

    // Process file if provided for standard update
    let fileUpdate: any = {}
    if (fileData !== undefined) {
      if (fileData) {
        const { uploadToSupabase } = await import('@/lib/supabase')
        try {
          const publicUrl = await uploadToSupabase(fileData, fileName || 'lampiran', fileType || '')
          fileUpdate = {
            fileData: null,
            fileName: fileName || null,
            fileType: fileType || null,
            fileSize: fileSize || null,
            lampiran: publicUrl,
          }
        } catch (uploadError: any) {
          console.error('Supabase upload failed:', uploadError)
          return NextResponse.json(
            { error: 'Gagal mengupload file ke Supabase Storage: ' + (uploadError.message || String(uploadError)) },
            { status: 500 }
          )
        }
      } else {
        fileUpdate = {
          fileData: null,
          fileName: null,
          fileType: null,
          fileSize: null,
          lampiran: null,
        }
      }
    } else if (lampiran !== undefined) {
      fileUpdate = {
        lampiran: lampiran || null,
      }
    }

    const proyek = await prisma.pBL.update({
      where: { id },
      data: {
        judul,
        deskripsi,
        tgl_mulai: new Date(tgl_mulai),
        tgl_selesai: new Date(tgl_selesai),
        sintaks,
        ...fileUpdate,
      },
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

    // Sync corresponding Course record if it exists
    try {
      await prisma.course.update({
        where: { id },
        data: {
          judul,
          deskripsi: deskripsi || null,
        }
      })
    } catch (syncError) {
      console.warn("Course sync update skipped (course might not exist):", syncError)
    }

    return NextResponse.json({ pbl: proyek })
  } catch (error) {
    console.error('Error updating proyek:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate PBL' },
      { status: 500 }
    )
  }
}

// DELETE proyek
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.pBL.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'PBL berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting proyek:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus PBL' },
      { status: 500 }
    )
  }
}
