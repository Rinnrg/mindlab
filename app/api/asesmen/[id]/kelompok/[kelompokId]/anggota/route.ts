import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
	try {
		const { id: asesmenId, kelompokId } = await params
		const body = await req.json().catch(() => ({}))
		const anggotaIds: string[] = Array.isArray(body?.anggotaIds)
			? body.anggotaIds.map((x: any) => String(x)).filter(Boolean)
			: []

		if (anggotaIds.length === 0) {
			return NextResponse.json({ error: 'anggotaIds wajib diisi' }, { status: 400 })
		}

		const kelompok = await prisma.kelompok.findFirst({
			where: { id: kelompokId, asesmenId },
			select: { id: true, anggotaIds: true },
		})

		if (!kelompok) {
			return NextResponse.json({ error: 'Kelompok tidak ditemukan' }, { status: 404 })
		}

		const next = Array.from(new Set([...(kelompok.anggotaIds || []), ...anggotaIds]))

		const updated = await prisma.kelompok.update({
			where: { id: kelompokId },
			data: { anggotaIds: next },
		})

		return NextResponse.json({ kelompok: updated })
	} catch (e: any) {
		return NextResponse.json(
			{ error: 'Gagal menambah anggota', details: e?.message },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; kelompokId: string }> }
) {
	try {
		const { id: asesmenId, kelompokId } = await params
		const body = await req.json().catch(() => ({}))
		const anggotaId = String(body?.anggotaId || '').trim()
		if (!anggotaId) {
			return NextResponse.json({ error: 'anggotaId wajib diisi' }, { status: 400 })
		}

		const kelompok = await prisma.kelompok.findFirst({
			where: { id: kelompokId, asesmenId },
			select: { id: true, anggotaIds: true },
		})

		if (!kelompok) {
			return NextResponse.json({ error: 'Kelompok tidak ditemukan' }, { status: 404 })
		}

		const next = (kelompok.anggotaIds || []).filter((id) => id !== anggotaId)

		const updated = await prisma.kelompok.update({
			where: { id: kelompokId },
			data: { anggotaIds: next },
		})

		return NextResponse.json({ kelompok: updated })
	} catch (e: any) {
		return NextResponse.json(
			{ error: 'Gagal menghapus anggota', details: e?.message },
			{ status: 500 }
		)
	}
}
