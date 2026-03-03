import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params

    // Get assessment details with scores (both quiz and assignment)
    const asesmen = await prisma.asesmen.findUnique({
      where: { 
        id: asesmenId
      },
      include: {
        course: {
          select: {
            judul: true,
          },
        },
        // Include nilai for KUIS
        nilai: {
          include: {
            siswa: {
              select: {
                nama: true,
                kelas: true,
                email: true,
              },
            },
          },
          orderBy: [
            { siswa: { kelas: 'asc' } },
            { siswa: { nama: 'asc' } }
          ],
        },
        // Include pengumpulanProyek for TUGAS
        pengumpulanProyek: {
          include: {
            siswa: true,
          },
          orderBy: [
            { tgl_unggah: 'asc' }
          ],
        },
      },
    })

    if (!asesmen) {
      return NextResponse.json(
        { error: 'Asesmen tidak ditemukan' },
        { status: 404 }
      )
    }

    let excelData: any[] = []
    let sheetName = ''
    let filename = ''

    if (asesmen.tipe === 'KUIS') {
      // Prepare data for KUIS
      excelData = asesmen.nilai.map((nilai, index) => ({
        'No': index + 1,
        'Nama Siswa': nilai.siswa.nama,
        'Kelas': nilai.siswa.kelas || '-',
        'Email': nilai.siswa.email,
        'Nilai': nilai.skor,
        'Tanggal Pengerjaan': new Date(nilai.tanggal).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }))
      sheetName = 'Nilai Kuis'
      filename = `Nilai_Kuis_${asesmen.nama.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    } else if (asesmen.tipe === 'TUGAS') {
      // Prepare data for TUGAS
      if (asesmen.tipePengerjaan === 'KELOMPOK') {
        excelData = asesmen.pengumpulanProyek.map((pengumpulan, index) => ({
          'No': index + 1,
          'Nama Kelompok': pengumpulan.namaKelompok || '-',
          'Ketua': pengumpulan.ketua || '-',
          'Anggota': pengumpulan.anggota || '-',
          'Tanggal Upload': new Date(pengumpulan.tgl_unggah).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          'Nilai': pengumpulan.nilai || 'Belum dinilai',
          'Catatan': pengumpulan.catatan || '-'
        }))
      } else {
        excelData = asesmen.pengumpulanProyek.map((pengumpulan, index) => ({
          'No': index + 1,
          'Nama Siswa': pengumpulan.siswa?.nama || '-',
          'Kelas': pengumpulan.siswa?.kelas || '-',
          'Email': pengumpulan.siswa?.email || '-',
          'Tanggal Upload': new Date(pengumpulan.tgl_unggah).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          'Nilai': pengumpulan.nilai || 'Belum dinilai',
          'Catatan': pengumpulan.catatan || '-'
        }))
      }
      sheetName = `Rekap Tugas ${asesmen.tipePengerjaan}`
      filename = `Rekap_Tugas_${asesmen.nama.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    }

    if (excelData.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data untuk diekspor' },
        { status: 400 }
      )
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths based on type
    let columnWidths: any[]
    if (asesmen.tipe === 'KUIS') {
      columnWidths = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama Siswa
        { wch: 15 }, // Kelas
        { wch: 30 }, // Email
        { wch: 10 }, // Nilai
        { wch: 20 }, // Tanggal Pengerjaan
      ]
    } else if (asesmen.tipePengerjaan === 'KELOMPOK') {
      columnWidths = [
        { wch: 5 },  // No
        { wch: 20 }, // Nama Kelompok
        { wch: 20 }, // Ketua
        { wch: 30 }, // Anggota
        { wch: 20 }, // Tanggal Upload
        { wch: 15 }, // Nilai
        { wch: 30 }, // Catatan
      ]
    } else {
      columnWidths = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama Siswa
        { wch: 15 }, // Kelas
        { wch: 30 }, // Email
        { wch: 20 }, // Tanggal Upload
        { wch: 15 }, // Nilai
        { wch: 30 }, // Catatan
      ]
    }
    worksheet['!cols'] = columnWidths

    // Add header styling
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:F1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) continue
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E0E0E0' } },
        alignment: { horizontal: 'center' }
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    })

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })

  } catch (error) {
    console.error('Error exporting Excel:', error)
    return NextResponse.json(
      { error: 'Gagal mengekspor data ke Excel' },
      { status: 500 }
    )
  }
}
