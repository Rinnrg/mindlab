import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: asesmenId } = await params

    // Fetch original asesmen with all soal and opsi
    const originalAsesmen = await prisma.asesmen.findUnique({
      where: { id: asesmenId },
      include: {
        soal: {
          include: {
            opsi: true
          }
        }
      }
    })

    if (!originalAsesmen) {
      return NextResponse.json(
        { error: 'Asesmen tidak ditemukan' },
        { status: 404 }
      )
    }

    // Create copy with new name
    const copyNumber = await prisma.asesmen.count({
      where: {
        nama: {
          startsWith: originalAsesmen.nama
        },
        courseId: originalAsesmen.courseId
      }
    })

    const newNama = `${originalAsesmen.nama} (Salinan ${copyNumber > 0 ? copyNumber : 1})`

    // Create new asesmen with copied data
    const newAsesmen = await prisma.asesmen.create({
      data: {
        nama: newNama,
        deskripsi: originalAsesmen.deskripsi,
        kelasTarget: originalAsesmen.kelasTarget,
        tipe: originalAsesmen.tipe,
        tipePengerjaan: originalAsesmen.tipePengerjaan,
        jml_soal: originalAsesmen.jml_soal,
        durasi: originalAsesmen.durasi,
        tgl_mulai: originalAsesmen.tgl_mulai,
        tgl_selesai: originalAsesmen.tgl_selesai,
        lampiran: originalAsesmen.lampiran,
        antiCurang: originalAsesmen.antiCurang,
        acakSoal: originalAsesmen.acakSoal,
        acakJawaban: originalAsesmen.acakJawaban,
        fileData: originalAsesmen.fileData,
        fileName: originalAsesmen.fileName,
        fileType: originalAsesmen.fileType,
        fileSize: originalAsesmen.fileSize,
        guruId: originalAsesmen.guruId,
        courseId: originalAsesmen.courseId,
        soal: {
          create: originalAsesmen.soal.map(soal => ({
            pertanyaan: soal.pertanyaan,
            gambar: soal.gambar,
            bobot: soal.bobot,
            tipeJawaban: soal.tipeJawaban,
            opsi: {
              create: soal.opsi.map(opsi => ({
                teks: opsi.teks,
                isBenar: opsi.isBenar
              }))
            }
          }))
        }
      },
      include: {
        soal: {
          include: {
            opsi: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Asesmen berhasil disalin',
      nama: newNama,
      asesmen: newAsesmen
    }, { status: 201 })

  } catch (error) {
    console.error('Error copying asesmen:', error)
    return NextResponse.json(
      { error: 'Gagal menyalin asesmen' },
      { status: 500 }
    )
  }
}
