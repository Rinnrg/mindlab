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
      }
      
      includeOptions.pengumpulanProyek = {
        where: {
          siswaId: userId,
        },
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
      
      // For KUIS, if taking the quiz, we need the questions (without correct answers)
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
              // isBenar is excluded for security
            }
          }
        }
      }

      includeOptions._count = {
        select: {
          soal: true,
        },
      }

      // NOTE: Halaman submit kelompok butuh data kelompok untuk menentukan userGroup.
      // Untuk menghindari payload besar, kita kirim minimal fields + anggotaIds.
      includeOptions.kelompok = {
        select: {
          id: true,
          nama: true,
          asesmenId: true,
          ketuaId: true,
          anggotaIds: true,
        },
      }
    } else {
      // For teachers/admins - include full data based on params
      // Always include soal and opsi for teachers to see the quiz content
      includeOptions.soal = {
        include: {
          opsi: true,
        },
      }
      
      // Only include heavy stats/roster if explicitly requested
      if (includeStats) {
        includeOptions.nilai = {
          include: {
            siswa: {
              select: {
                id: true,
                nama: true,
                email: true,
                foto: true,
                kelas: true,
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
        
        includeOptions.kelompok = true
      } else {
        // Fast path: just counts
        includeOptions._count = {
          select: {
            soal: true,
            nilai: true,
            pengumpulanProyek: true,
          },
        }

        // IMPORTANT: halaman guru (edit/detail) sering butuh data kelompok,
        // tapi sebelumnya kelompok hanya ikut kalau includeStats=true.
        // Ini bikin kelompok terlihat "kosong" setelah create.
        includeOptions.kelompok = {
          select: {
            id: true,
            nama: true,
            asesmenId: true,
            ketuaId: true,
            anggotaIds: true,
          },
        }
      }
    }

    const asesmen = await prisma.asesmen.findUnique({
      where: { id },
      include: includeOptions,
    })

    if (!asesmen) {
      console.log('Asesmen not found after query')
      return NextResponse.json(
        { error: 'Asesmen tidak ditemukan' },
        { status: 404 }
      )
    }

    // Populate kelompok.anggota using manual load from array column.
    // IMPORTANT: UI submit lama mengharapkan shape: anggota: Array<{ siswaId: string, siswa?: { nama, foto } }>
    // (bukan hanya Array<User>), supaya kompatibel dengan kode existing.
    if (asesmen.kelompok && asesmen.kelompok.length > 0) {
      const allUserIds = Array.from(new Set(asesmen.kelompok.flatMap((k: any) => k.anggotaIds || [])))
      const users = await prisma.user.findMany({
        where: { id: { in: allUserIds } },
        select: {
          id: true,
          nama: true,
          foto: true,
        },
      })
      const userMap = new Map(users.map((u) => [u.id, u]))

      const formattedKelompok = asesmen.kelompok.map((k: any) => ({
        ...k,
        anggota: (k.anggotaIds || []).map((uid: string) => ({
          siswaId: uid,
          siswa: userMap.get(uid) || null,
        })),
      }))

      ;(asesmen as any).kelompok = formattedKelompok
    }

    console.log(`✓ Successfully fetched asesmen: ${asesmen.nama}`)
    console.log(`  - Type: ${asesmen.tipe}`)
    
    // Safety check for large responses
    const responseData = { 
      asesmen,
      _debug: {
        timestamp: new Date().toISOString(),
        v: "1.1.0-optimized"
      }
    }
    
    // Add cache headers for better performance
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
      },
    })
  } catch (error: any) {
    console.error('=== Error fetching asesmen:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    
    // Return more helpful error details to help debugging
    return NextResponse.json(
      { 
        error: 'Gagal mengambil data asesmen',
        details: error?.message,
        type: error?.name
      },
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
    
    console.log('=== PUT /api/asesmen/[id] - Request body received')
    
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
      submissionComponents,
      soal, // Array of questions for KUIS
      kelasTarget
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

    console.log('Updating asesmen metadata...')
    
    // Build update data object
    const updateData: any = {}
    
    if (nama !== undefined) updateData.nama = nama
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi
    if (tipe !== undefined) updateData.tipe = tipe
    if (kelasTarget !== undefined) updateData.kelasTarget = kelasTarget
    
    if (tipe === 'TUGAS' && tipePengerjaan !== undefined) {
      updateData.tipePengerjaan = tipePengerjaan || 'INDIVIDU'
      if (submissionComponents && Array.isArray(submissionComponents)) {
        const allowed = new Set(['UPLOAD_FILE', 'COMPILER', 'TEXT'])
        const invalid = submissionComponents.find((c: any) => !allowed.has(String(c)))
        if (invalid) {
          return NextResponse.json(
            { error: `Komponen pengumpulan tidak valid: ${String(invalid)}` },
            { status: 400 }
          )
        }
        updateData.submissionComponents = submissionComponents
      }
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
    if (tgl_mulai !== undefined) updateData.tgl_mulai = startDate
    if (tgl_selesai !== undefined) updateData.tgl_selesai = endDate
    
    if (lampiran !== undefined) updateData.lampiran = lampiran
    if (courseId !== undefined) updateData.courseId = courseId
    if (antiCurang !== undefined) updateData.antiCurang = !!antiCurang
    
    // Execute update in a transaction if soal are provided
    let updatedAsesmen;
    
    if (tipe === 'KUIS' && soal && Array.isArray(soal)) {
      console.log(`Performing atomic update for ${soal.length} questions...`)
      
      // Use transaction to ensure either everything or nothing is updated
      updatedAsesmen = await prisma.$transaction(async (tx) => {
        // 1. Update basic asesmen info
        const result = await tx.asesmen.update({
          where: { id },
          data: updateData,
        })
        
        // 2. Delete existing soal
        await tx.soal.deleteMany({
          where: { asesmenId: id }
        })
        
        // 3. Create new soal with nested opsi
        // We use create inside the transaction loop for now as Prisma doesn't support nested createMany easily
        // but it's now wrapped in a transaction which is much safer.
        for (const soalItem of soal) {
          const soalData: any = {
            pertanyaan: soalItem.pertanyaan,
            gambar: soalItem.gambar || null,
            bobot: soalItem.bobot || 10,
            tipeJawaban: soalItem.tipeJawaban || 'PILIHAN_GANDA',
            asesmenId: id,
          }
          
          if (soalItem.opsi && Array.isArray(soalItem.opsi) && soalItem.opsi.length > 0) {
            soalData.opsi = {
              create: soalItem.opsi.map((opsiItem: any) => ({
                teks: opsiItem.teks,
                isBenar: opsiItem.isBenar || false,
              }))
            }
          }
          
          await tx.soal.create({
            data: soalData
          })
        }
        
        return result
      })
      
      console.log(`✓ Atomic update complete for asesmen ID: ${id}`)
    } else {
      // Simple update for TUGAS or when no soal provided
      updatedAsesmen = await prisma.asesmen.update({
        where: { id },
        data: updateData,
      })
      console.log(`✓ Asesmen metadata updated for ID: ${id}`)
    }

    // Fetch final state with relations for response
    const asesmen = await prisma.asesmen.findUnique({
      where: { id },
      include: {
        guru: {
          select: { id: true, nama: true, email: true },
        },
        course: {
          select: { id: true, judul: true },
        },
        soal: {
          include: { opsi: true },
        },
      },
    })

    console.log('=== PUT /api/asesmen/[id] - Success')
    return NextResponse.json({ asesmen })
  } catch (error: any) {
    console.error('=== PUT /api/asesmen/[id] - Error:', error)
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
