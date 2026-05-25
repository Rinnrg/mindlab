import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
	try {
		const { id: asesmenId, kelompokId } = await params

		const kelompok = await prisma.kelompok.findFirst({
			where: { id: kelompokId, asesmenId },
			select: { id: true },
		})

		if (!kelompok) {
			return NextResponse.json({ error: 'Kelompok tidak ditemukan' }, { status: 404 })
		}

		await prisma.kelompok.delete({ where: { id: kelompokId } })
		return NextResponse.json({ message: 'Kelompok dihapus' })
	} catch (e: any) {
		return NextResponse.json(
			{ error: 'Gagal menghapus kelompok', details: e?.message },
			{ status: 500 }
		)
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
	try {
		const { id: asesmenId, kelompokId } = await params
		const body = await req.json().catch(() => ({}))
		const ketuaIdRaw = body?.ketuaId
		const ketuaId = ketuaIdRaw === null || ketuaIdRaw === undefined ? null : String(ketuaIdRaw).trim()

		const kelompok = await prisma.kelompok.findFirst({
			where: { id: kelompokId, asesmenId },
			select: { id: true, anggotaIds: true },
		})

		if (!kelompok) {
			return NextResponse.json({ error: 'Kelompok tidak ditemukan' }, { status: 404 })
		}

		if (ketuaId && !(kelompok.anggotaIds || []).includes(ketuaId)) {
			return NextResponse.json(
				{ error: 'Ketua harus merupakan anggota kelompok' },
				{ status: 400 }
			)
		}

		const updated = await prisma.kelompok.update({
			where: { id: kelompokId },
			data: { ketuaId },
		})

		return NextResponse.json({ kelompok: updated })
	} catch (e: any) {
		return NextResponse.json(
			{ error: 'Gagal mengubah ketua kelompok', details: e?.message },
			{ status: 500 }
		)
	}
}
