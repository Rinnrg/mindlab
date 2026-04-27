import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single asesmen by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')
    const includeStats = searchParams.get('includeStats') === 'true'
    
    console.log(`=== GET /api/asesmen/${id} - userId: ${userId}, userRole: ${userRole}`)
    
    // First, fetch basic asesmen info to check permissions
    const asesmenBasic = await prisma.asesmen.findUnique({
      where: { id },
      select: {
        id: true,
        courseId: true,
        guruId: true,
      }
    })
    
    if (!asesmenBasic) {
      console.log('Asesmen not found')
      return NextResponse.json(
        { error: 'Asesmen tidak ditemukan' },
        { status: 404 }
      )
    }
    
    // Check if student is enrolled in the course
    if (userRole === 'SISWA' && userId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          siswaId: userId,
          courseId: asesmenBasic.courseId,
        }
      })
      
      if (!enrollment) {
        console.log(`Student ${userId} not enrolled in course ${asesmenBasic.courseId}`)
        return NextResponse.json(
          { error: 'Anda tidak terdaftar di course ini' },
          { status: 403 }
        )
      }
      
      console.log(`✓ Student ${userId} is enrolled in course ${asesmenBasic.courseId}`)
    }
    
    // Optimized query - only fetch what's needed
    const includeOptions: any = {
      guru: {
        select: {
          id: true,
          nama: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          judul: true,
          kategori: true,
        },
      },
    }

    // For students, only include their own submissions and scores
    if (userRole === 'SISWA' && userId) {
      includeOptions.nilai = {
        where: {
          siswaId: userId,
        },
        select: {
          id: true,
          skor: true,
          tanggal: true,
          siswaId: true,
        },
        take: 1,
      }
      includeOptions.pengumpulanProyek = {
        where: {
          siswaId: userId,
        },
        select: {
          id: true,
          fileUrl: true,
          tgl_unggah: true,
          siswaId: true,
          nilai: true,
          namaKelompok: true,
          ketua: true,
          anggota: true,
          catatan: true,
        },
        take: 1,
      }
      // For KUIS, if not yet submitted, include questions (but not correct answers)
      includeOptions.soal = {
        select: {
          id: true,
          pertanyaan: true,
          gambar: true,
          bobot: true,
          tipeJawaban: true,
          opsi: {
            select: {
              id: true,
              teks: true,
              // Don't include isBenar for students
            }
          }
        }
      }
    } else {
      // For teachers/admins - include full data
      includeOptions.soal = {
        include: {
          opsi: true,
        },
      }
      includeOptions.nilai = {
        include: {
          siswa: {
            select: {
              id: true,
              nama: true,
              email: true,
            }
          }
        }
      }
      includeOptions.pengumpulanProyek = {
        include: {
          siswa: {
            select: {
              id: true,
              nama: true,
              email: true,
            }
          }
        }
      }
      includeOptions._count = {
        select: {
          soal: true,
          nilai: true,
          pengumpulanProyek: true,
        },
      }
    }

    const asesmen = await prisma.asesmen.findUnique({
      where: { id },
      include: includeOptions,
    } as any)

    if (!asesmen) {
      console.log('Asesmen not found after query')
      return NextResponse.json(
        { error: 'Asesmen tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log(`✓ Successfully fetched asesmen: ${asesmen.nama}`)
    console.log(`  - Type: ${asesmen.tipe}`)
    // Avoid accessing optional (conditionally included) relations in a way that
    // breaks strict TS when includeOptions changes.
    const asesmenAny = asesmen as any
    console.log(`  - Course: ${asesmenAny.course?.judul}`)
    if (userRole === 'SISWA') {
      console.log(`  - Student nilai: ${asesmenAny.nilai?.length || 0}`)
      console.log(`  - Student submissions: ${asesmenAny.pengumpulanProyek?.length || 0}`)
      console.log(`  - Soal count: ${asesmenAny.soal?.length || asesmenAny._count?.soal || 0}`)
    }

    // Add cache headers for better performance
    return NextResponse.json({ asesmen }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
      },
    })
  } catch (error: any) {
    console.error('=== Error fetching asesmen:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    return NextResponse.json(
      { error: 'Gagal mengambil data asesmen' },
      { status: 500 }
    )
  }
}

// UPDATE asesmen
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    console.log('=== PUT /api/asesmen/[id] - Request body:', JSON.stringify(body, null, 2))
    
    const { 
      nama, 
      deskripsi, 
      tipe,
      tipePengerjaan,
      jml_soal, 
      durasi, 
      tgl_mulai,
      tgl_selesai,
      lampiran,
      courseId,
      antiCurang,
      soal // Array of questions for KUIS
    } = body

    // Validate dates if provided
    let startDate = null
    let endDate = null
    
    if (tgl_mulai) {
      startDate = new Date(tgl_mulai)
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Format tanggal mulai tidak valid' },
          { status: 400 }
        )
      }
    }

    if (tgl_selesai) {
      endDate = new Date(tgl_selesai)
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Format tanggal selesai tidak valid' },
          { status: 400 }
        )
      }
      
      if (startDate && endDate < startDate) {
        return NextResponse.json(
          { error: 'Tanggal selesai harus setelah tanggal mulai' },
          { status: 400 }
        )
      }
    }

    console.log('Updating asesmen...')
    
    // Build update data object
    const updateData: any = {}
    
    if (nama !== undefined) updateData.nama = nama
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi
    if (tipe !== undefined) updateData.tipe = tipe
    if (tipe === 'TUGAS' && tipePengerjaan !== undefined) {
      updateData.tipePengerjaan = tipePengerjaan || 'INDIVIDU'
    } else if (tipe === 'KUIS') {
      updateData.tipePengerjaan = null
    }
    if (tipe === 'KUIS' && soal) {
      updateData.jml_soal = soal.length
    }
    if (durasi !== undefined) {
      updateData.durasi = durasi !== null ? parseInt(String(durasi)) || null : null
    }
    
    // Handle dates - allow null values
    if (tgl_mulai !== undefined) {
      updateData.tgl_mulai = startDate // Can be null or Date
    }
    if (tgl_selesai !== undefined) {
      updateData.tgl_selesai = endDate // Can be null or Date
    }
    
    if (lampiran !== undefined) updateData.lampiran = lampiran
    if (courseId !== undefined) updateData.courseId = courseId
    if (antiCurang !== undefined) updateData.antiCurang = !!antiCurang
    
    console.log('Update data:', JSON.stringify(updateData, null, 2))
    console.log('Date values - tgl_mulai:', updateData.tgl_mulai, 'tgl_selesai:', updateData.tgl_selesai)

    // Update asesmen
    const updatedAsesmen = await prisma.asesmen.update({
      where: { id },
      data: updateData,
    })
    
    console.log(`✓ Asesmen updated with ID: ${updatedAsesmen.id}`)

    // Handle soal for KUIS
    if (tipe === 'KUIS' && soal && Array.isArray(soal)) {
      console.log(`Updating ${soal.length} questions for KUIS...`)
      
      try {
        // Delete existing soal (will cascade delete opsi due to onDelete: Cascade)
        console.log('Deleting existing soal...')
        await prisma.soal.deleteMany({
          where: { asesmenId: id }
        })
        console.log('✓ Existing soal deleted')

        // Create new soal with opsi
        for (let i = 0; i < soal.length; i++) {
          const soalItem = soal[i]
          console.log(`Creating question ${i + 1}/${soal.length}`)
          
          const soalData: any = {
            pertanyaan: soalItem.pertanyaan,
            gambar: soalItem.gambar || null,
            bobot: soalItem.bobot || 10,
            tipeJawaban: soalItem.tipeJawaban || 'PILIHAN_GANDA',
            asesmenId: id,
          }
          
          // Create soal with nested opsi
          if (soalItem.tipeJawaban === 'PILIHAN_GANDA' && soalItem.opsi && soalItem.opsi.length > 0) {
            soalData.opsi = {
              create: soalItem.opsi.map((opsiItem: any) => ({
                teks: opsiItem.teks,
                isBenar: opsiItem.isBenar || false,
              }))
            }
          }
          
          // @ts-ignore - Prisma client type issue
          await prisma.soal.create({
            data: soalData
          })
          
          console.log(`✓ Question ${i + 1} created`)
        }
        
        console.log(`✓ All ${soal.length} questions updated successfully`)
      } catch (soalError: any) {
        console.error('Error updating questions:', soalError)
        // Don't rollback asesmen update, just return error
        return NextResponse.json(
          { 
            error: 'Asesmen diperbarui tetapi gagal memperbarui soal', 
            details: soalError?.message 
          },
          { status: 500 }
        )
      }
    }

    // Fetch updated asesmen with all relations
    const asesmen = await prisma.asesmen.findUnique({
      where: { id },
      include: {
        guru: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            judul: true,
          },
        },
        soal: {
          include: {
            opsi: true,
          },
        },
      },
    })

    console.log('=== PUT /api/asesmen/[id] - Success')
    return NextResponse.json({ asesmen })
  } catch (error: any) {
    console.error('=== PUT /api/asesmen/[id] - Error:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    
    return NextResponse.json(
      { error: 'Gagal mengupdate asesmen', details: error?.message },
      { status: 500 }
    )
  }
}

// DELETE asesmen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params
    
    console.log(`=== DELETE /api/asesmen/${asesmenId}`)
    
    // Delete in correct order to avoid foreign key issues
    // Schema has onDelete: Cascade for most relations, but we do critical ones explicitly
    
    console.log('Step 1: Deleting nilai...')
    await prisma.nilai.deleteMany({
      where: { asesmenId }
    })
    console.log('✓ Nilai deleted')
    
    console.log('Step 2: Deleting pengumpulan proyek...')
    await prisma.pengumpulanProyek.deleteMany({
      where: { asesmenId }
    })
    console.log('✓ Pengumpulan proyek deleted')
    
    console.log('Step 3: Deleting soal (will cascade opsi and jawabanSiswa)...')
    await prisma.soal.deleteMany({
      where: { asesmenId }
    })
    console.log('✓ Soal deleted')
    
    console.log('Step 4: Deleting asesmen...')
    await prisma.asesmen.delete({
      where: { id: asesmenId }
    })
    console.log('✓ Asesmen deleted successfully')

    console.log('=== DELETE /api/asesmen - Success')
    return NextResponse.json({ message: 'Asesmen berhasil dihapus' })
  } catch (error: any) {
    console.error('=== DELETE /api/asesmen - Error:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    
    return NextResponse.json(
      { error: 'Gagal menghapus asesmen', details: error?.message },
      { status: 500 }
    )
  }
}
