import { NextResponse } from 'next/server'

export async function POST() {
	// TODO: implement logout (clear cookie/session) as needed.
	return NextResponse.json({ ok: true })
}

