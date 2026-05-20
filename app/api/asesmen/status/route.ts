
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/asesmen/status?asesmenId=...&siswaId=...
// Returns submission status for both KUIS and TUGAS.
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const asesmenId = searchParams.get('asesmenId')
		const siswaId = searchParams.get('siswaId')

		if (!asesmenId || !siswaId) {
			return NextResponse.json(
				{ error: 'asesmenId dan siswaId diperlukan' },
				{ status: 400 }
			)
		}

		const asesmen = await prisma.asesmen.findUnique({
			where: { id: asesmenId },
			select: { id: true, tipe: true, tipePengerjaan: true },
		})

		if (!asesmen) {
			return NextResponse.json({ error: 'Asesmen tidak ditemukan' }, { status: 404 })
		}

		if (asesmen.tipe === 'KUIS') {
			const attempt = await prisma.kuisAttempt.findUnique({
				where: { siswaId_asesmenId_attempt: { siswaId, asesmenId } },
				select: { id: true, submittedAt: true, createdAt: true },
			})

			const nilai = await prisma.nilai.findUnique({
				where: { siswaId_asesmenId: { siswaId, asesmenId } },
				select: { id: true, skor: true, tanggal: true },
			})

			return NextResponse.json({
				asesmenId,
				siswaId,
				tipe: 'KUIS' as const,
				hasAttempt: !!attempt,
				attemptId: attempt?.id ?? null,
				submittedAt: attempt?.submittedAt ?? null,
				hasSubmitted: !!attempt?.submittedAt || !!nilai,
				nilaiId: nilai?.id ?? null,
				skor: nilai?.skor ?? null,
				nilaiTanggal: nilai?.tanggal ?? null,
			})
		}

		if (asesmen.tipe === 'TUGAS') {
			// For group tasks, try to resolve the student's kelompok first.
			const kelompokId =
				asesmen.tipePengerjaan === 'KELOMPOK'
					? (
							await prisma.kelompok.findFirst({
								where: {
									asesmenId,
									anggota: {
										some: { siswaId },
									},
								} as any,
								select: { id: true },
							})
						)?.id ?? null
					: null

			const submission = await prisma.pengumpulanProyek.findFirst({
				where: {
					asesmenId,
					...(asesmen.tipePengerjaan === 'KELOMPOK'
						? { kelompokId: kelompokId as string }
						: { siswaId }),
				},
				select: {
					id: true,
					createdAt: true,
					updatedAt: true,
					fileUrl: true,
					fileName: true,
					fileType: true,
					fileSize: true,
					textContent: true,
					sourceCode: true,
				},
			})

			return NextResponse.json({
				asesmenId,
				siswaId,
				tipe: 'TUGAS' as const,
				tipePengerjaan: asesmen.tipePengerjaan,
				kelompokId,
				pengumpulanId: submission?.id ?? null,
				hasSubmitted: !!submission,
				submittedAt: submission?.updatedAt ?? submission?.createdAt ?? null,
				hasFile:
					!!(submission?.fileUrl && submission.fileUrl.trim()) ||
					!!(submission?.fileName && submission.fileName.trim()),
				hasText: !!(submission?.textContent && submission.textContent.trim()),
				hasCode: !!(submission?.sourceCode && submission.sourceCode.trim()),
			})
		}

		return NextResponse.json({ error: 'Tipe asesmen tidak didukung' }, { status: 400 })
	} catch (error) {
		console.error('Error getting asesmen status:', error)
		return NextResponse.json({ error: 'Gagal mengambil status asesmen' }, { status: 500 })
	}
}

