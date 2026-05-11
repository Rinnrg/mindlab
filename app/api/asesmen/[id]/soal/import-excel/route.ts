import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params

    // Verify asesmen exists and is KUIS
    const asesmen = await prisma.asesmen.findUnique({
      where: { id: asesmenId },
      select: { id: true, tipe: true },
    })

    if (!asesmen) {
      return NextResponse.json({ error: 'Asesmen tidak ditemukan' }, { status: 404 })
    }

    if (asesmen.tipe !== 'KUIS') {
      return NextResponse.json({ error: 'Bukan asesmen kuis' }, { status: 400 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File Excel tidak ditemukan' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan file .xlsx atau .xls' },
        { status: 400 }
      )
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'File Excel kosong atau tidak memiliki data' }, { status: 400 })
    }

    // Normalize header keys (handle case differences & trim spaces)
    const normalizeKey = (key: string) => key.trim().toLowerCase()

    const errors: string[] = []
    const soalToCreate: {
      pertanyaan: string
      bobot: number
      opsi: { teks: string; isBenar: boolean }[]
    }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Excel row number (1=header, so data starts at 2)

      // Normalize keys
      const normalized: Record<string, string> = {}
      for (const key of Object.keys(row)) {
        normalized[normalizeKey(key)] = String(row[key] ?? '').trim()
      }

      // Helper to find value by possible key names
      const getValue = (...keys: string[]) => {
        for (const k of keys) {
          if (normalized[k] !== undefined && normalized[k] !== '') return normalized[k]
        }
        // Fallback partial match
        const foundKey = Object.keys(normalized).find(nk => 
          keys.some(searchKey => nk.includes(searchKey))
        )
        return foundKey ? normalized[foundKey] : ''
      }

      const pertanyaan = getValue('pertanyaan')
      const opsiA = getValue('opsi a', 'a', 'pilihan a')
      const opsiB = getValue('opsi b', 'b', 'pilihan b')
      const opsiC = getValue('opsi c', 'c', 'pilihan c')
      const opsiD = getValue('opsi d', 'd', 'pilihan d')
      const jawabanBenar = getValue(
        'jawaban benar (a/b/c/d)',
        'jawaban benar',
        'jawaban',
        'kunci jawaban',
        'kunci'
      ).toUpperCase()
      const bobot = 10 // Fixed weight for all questions as requested

      // Skip empty rows
      if (!pertanyaan && !opsiA && !opsiB) continue

      // Skip example rows from template
      if (pertanyaan.toLowerCase().startsWith('contoh:')) continue

      // Validate
      if (!pertanyaan) {
        errors.push(`Baris ${rowNum}: Kolom "Pertanyaan" wajib diisi`)
        continue
      }

      if (!opsiA || !opsiB) {
        errors.push(`Baris ${rowNum}: Minimal harus ada Opsi A dan Opsi B`)
        continue
      }

      if (!['A', 'B', 'C', 'D'].includes(jawabanBenar)) {
        errors.push(`Baris ${rowNum}: "Jawaban Benar" harus berisi A, B, C, atau D (saat ini: "${jawabanBenar || 'kosong'}")`)
        continue
      }

      // Validation for weight removed as it is now fixed at 10

      // Build opsi array (only include non-empty options)
      const opsiMap: Record<string, string> = {
        A: opsiA,
        B: opsiB,
        C: opsiC,
        D: opsiD,
      }

      // Validate jawaban benar corresponds to a non-empty option
      if (!opsiMap[jawabanBenar]) {
        errors.push(`Baris ${rowNum}: Jawaban benar "${jawabanBenar}" tapi opsi tersebut kosong`)
        continue
      }

      const opsi = Object.entries(opsiMap)
        .filter(([, teks]) => teks !== '')
        .map(([key, teks]) => ({
          teks,
          isBenar: key === jawabanBenar,
        }))

      soalToCreate.push({ pertanyaan, bobot, opsi })
    }

    // If there are critical errors and no valid soal, return errors
    if (soalToCreate.length === 0) {
      return NextResponse.json(
        {
          error: 'Tidak ada soal valid yang bisa diimport',
          details: errors,
        },
        { status: 400 }
      )
    }

    // Batch create soal
    const created = await prisma.$transaction(
      soalToCreate.map((s) =>
        prisma.soal.create({
          data: {
            pertanyaan: s.pertanyaan,
            bobot: s.bobot,
            asesmenId,
            opsi: {
              create: s.opsi,
            },
          },
        })
      )
    )

    return NextResponse.json(
      {
        message: `Berhasil mengimport ${created.length} soal`,
        imported: created.length,
        skipped: rows.length - soalToCreate.length,
        warnings: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error importing Excel:', error)
    return NextResponse.json({ error: 'Gagal mengimport file Excel' }, { status: 500 })
  }
}
