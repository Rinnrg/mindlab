import { NextResponse } from 'next/server'

export async function GET() {
	// TODO: implement a real session lookup.
	return NextResponse.json({ user: null })
}

