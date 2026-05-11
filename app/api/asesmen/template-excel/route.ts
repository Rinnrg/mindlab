import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    // Template data with header and example row
    const templateData = [
      {
        'No': 1,
        'Pertanyaan': 'Contoh: Apa ibu kota Indonesia?',
        'Opsi A': 'Jakarta',
        'Opsi B': 'Bandung',
        'Opsi C': 'Surabaya',
        'Opsi D': 'Medan',
        'Jawaban Benar (A/B/C/D)': 'A',
        'Bobot': 10,
      },
      {
        'No': 2,
        'Pertanyaan': 'Contoh: 5 + 3 = ?',
        'Opsi A': '7',
        'Opsi B': '8',
        'Opsi C': '9',
        'Opsi D': '',
        'Jawaban Benar (A/B/C/D)': 'B',
        'Bobot': 10,
      },
    ]

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateData)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // No
      { wch: 50 }, // Pertanyaan
      { wch: 20 }, // Opsi A
      { wch: 20 }, // Opsi B
      { wch: 20 }, // Opsi C
      { wch: 20 }, // Opsi D
      { wch: 25 }, // Jawaban Benar
      { wch: 8 },  // Bobot
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Soal')

    // Add instructions sheet
    const instructions = [
      { 'Panduan Pengisian Template Soal Kuis': '' },
      { 'Panduan Pengisian Template Soal Kuis': '1. Kolom "Pertanyaan" wajib diisi.' },
      { 'Panduan Pengisian Template Soal Kuis': '2. Kolom "Opsi A" dan "Opsi B" wajib diisi (minimal 2 pilihan).' },
      { 'Panduan Pengisian Template Soal Kuis': '3. Kolom "Opsi C" dan "Opsi D" boleh dikosongkan.' },
      { 'Panduan Pengisian Template Soal Kuis': '4. Kolom "Jawaban Benar" diisi huruf: A, B, C, atau D.' },
      { 'Panduan Pengisian Template Soal Kuis': '5. Kolom "Bobot" diisi angka (default 10 jika dikosongkan).' },
      { 'Panduan Pengisian Template Soal Kuis': '6. Hapus baris contoh sebelum diimport, atau biarkan sistem mengabaikannya.' },
      { 'Panduan Pengisian Template Soal Kuis': '7. Simpan file dalam format .xlsx sebelum diimport.' },
    ]
    const instructionSheet = XLSX.utils.json_to_sheet(instructions)
    instructionSheet['!cols'] = [{ wch: 70 }]
    XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Panduan')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = `Template_Soal_Kuis.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json({ error: 'Gagal membuat template Excel' }, { status: 500 })
  }
}
