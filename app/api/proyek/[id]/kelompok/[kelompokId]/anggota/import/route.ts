import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// POST - Import students from Excel and add to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
  try {
    const { id: proyekId, kelompokId } = await params

    // Verify group exists and belongs to this project
    const kelompok = await prisma.kelompok.findFirst({
      where: { id: kelompokId, pblId: proyekId },
    })

    if (!kelompok) {
      return NextResponse.json(
        { error: 'Kelompok tidak ditemukan' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    // Read the Excel file
    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buffer, { type: 'buffer' })

    const wsName = wb.SheetNames[0]
    const ws = wb.Sheets[wsName]

    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' })

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: 'File tidak berisi data' },
        { status: 400 }
      )
    }

    // Get already assigned members to this project (all groups)
    const assignedMembers = await prisma.anggotaKelompok.findMany({
      where: {
        kelompok: { pblId: proyekId },
      },
      select: { siswaId: true },
    })
    const assignedIds = new Set(assignedMembers.map((a) => a.siswaId))

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      addedStudents: [] as { nama: string; email: string; kelas: string }[],
      byClass: {} as Record<string, number>,
    }

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i]
      const rowNum = i + 2

      // Map columns
      const nama = (row['Nama'] || row['nama'] || '').toString().trim()
      const email = (row['Email'] || row['email'] || '').toString().trim()
      const kelas = (row['Kelas'] || row['kelas'] || '').toString().trim()

      if (!nama && !email) {
        results.failed++
        results.errors.push(`Baris ${rowNum}: Nama dan Email kosong, baris dilewati`)
        continue
      }

      try {
        // Find student by email or name+class
        let student = null

        if (email) {
          student = await prisma.user.findFirst({
            where: { email, role: 'SISWA' },
            select: { id: true, nama: true, email: true, kelas: true },
          })
        }

        if (!student && nama) {
          const whereCondition: any = { nama: { contains: nama, mode: 'insensitive' }, role: 'SISWA' }
          if (kelas) {
            whereCondition.kelas = kelas
          }
          student = await prisma.user.findFirst({
            where: whereCondition,
            select: { id: true, nama: true, email: true, kelas: true },
          })
        }

        if (!student) {
          results.failed++
          results.errors.push(`Baris ${rowNum}: Siswa "${nama || email}" tidak ditemukan di database`)
          continue
        }

        // Check if already assigned
        if (assignedIds.has(student.id)) {
          results.failed++
          results.errors.push(`Baris ${rowNum}: "${student.nama}" sudah terdaftar di proyek ini`)
          continue
        }

        // Add to group
        await prisma.anggotaKelompok.create({
          data: {
            kelompokId,
            siswaId: student.id,
          },
        })

        assignedIds.add(student.id)
        results.success++
        const studentKelas = student.kelas || 'Tanpa Kelas'
        results.addedStudents.push({
          nama: student.nama,
          email: student.email,
          kelas: studentKelas,
        })
        results.byClass[studentKelas] = (results.byClass[studentKelas] || 0) + 1
      } catch (err) {
        results.failed++
        results.errors.push(`Baris ${rowNum}: Gagal menambahkan - ${(err as Error).message}`)
      }
    }

    return NextResponse.json({
      message: `Import selesai: ${results.success} berhasil, ${results.failed} gagal`,
      ...results,
    })
  } catch (error) {
    console.error('Error importing students to group:', error)
    return NextResponse.json(
      { error: 'Gagal mengimpor data siswa' },
      { status: 500 }
    )
  }
}
