import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: asesmenId } = await params

		const kelompok = await prisma.kelompok.findMany({
			where: { asesmenId },
			orderBy: { createdAt: 'asc' },
		})

		return NextResponse.json({ kelompok })
	} catch (e: any) {
		return NextResponse.json(
			{ error: 'Gagal mengambil kelompok', details: e?.message },
			{ status: 500 }
		)
	}
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: asesmenId } = await params
		const body = await req.json().catch(() => ({}))
		const nama = String(body?.nama || '').trim()
		if (!nama) {
			return NextResponse.json({ error: 'Nama kelompok wajib diisi' }, { status: 400 })
		}

		// Ensure asesmen exists
		const asesmen = await prisma.asesmen.findUnique({
			where: { id: asesmenId },
			select: { id: true },
		})
		if (!asesmen) {
			return NextResponse.json({ error: 'Asesmen tidak ditemukan' }, { status: 404 })
		}

		const created = await prisma.kelompok.create({
			data: {
				nama,
				asesmenId,
				anggotaIds: [],
			},
		})

		return NextResponse.json({ kelompok: created })
	} catch (e: any) {
		return NextResponse.json(
			{ error: 'Gagal membuat kelompok', details: e?.message },
			{ status: 500 }
		)
	}
}
