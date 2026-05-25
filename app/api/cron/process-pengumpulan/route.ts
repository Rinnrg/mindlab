import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Cron endpoint: finalize scheduled submissions.
 *
 * Contract:
 * - Finds PengumpulanProyek with status=PENDING and tgl_unggah <= now.
 * - Marks them as SUBMITTED (or SELESAI if SUBMITTED enum doesn't exist).
 *
 * Security:
 * - Requires header: x-cron-secret: process.env.CRON_SECRET
 */

function isAuthorizedCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const token = request.headers.get('x-cron-secret')
  return token === secret
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCron(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // NOTE:
    // StatusPengumpulan enum currently: PENDING | DINILAI | REVISI | VALIDATED
    // We use VALIDATED as the "finalized/arrived" state for scheduled submissions.
    const res = await prisma.pengumpulanProyek.updateMany({
      where: {
        status: 'PENDING',
        tgl_unggah: { lte: now },
      },
      data: {
        status: 'VALIDATED',
      },
    })

    return NextResponse.json(
      {
        ok: true,
        now: now.toISOString(),
  updated: res.count,
  statusSetTo: 'VALIDATED',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('cron/process-pengumpulan error:', error)
    return NextResponse.json(
      { error: 'Cron gagal diproses', details: (error as any)?.message },
      { status: 500 }
    )
  }
}
