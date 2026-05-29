import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToSupabase, listSupabaseObjects, deleteSupabaseObject } from '@/lib/supabase'

export const runtime = 'nodejs'

// Admin maintenance endpoint. Protect with header 'x-admin-key' matching env ADMIN_MAINTENANCE_KEY
export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (!process.env.ADMIN_MAINTENANCE_KEY || adminKey !== process.env.ADMIN_MAINTENANCE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const dryRun = url.searchParams.get('dryRun') === '1'
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://noltlnkzgishtptqzpqd.supabase.co'

    // 1) Gather candidate DB fields that contain URLs referencing files
    const pbls = await prisma.pBL.findMany({ select: { id: true, lampiran: true } })
    const materis = await prisma.materi.findMany({ select: { id: true, lampiran: true, courseId: true } })
    const courses = await prisma.course.findMany({ select: { id: true, gambar: true } })
    const pengumpulans = await prisma.pengumpulanProyek.findMany({ select: { id: true, fileUrl: true, fileName: true, asesmenId: true } })

    const allRefs: { table: string; id: string; url?: string | null; extra?: any }[] = []
    pbls.forEach(p => allRefs.push({ table: 'pbl', id: p.id, url: p.lampiran }))
    materis.forEach(m => allRefs.push({ table: 'materi', id: m.id, url: m.lampiran, extra: { courseId: m.courseId } }))
    courses.forEach(c => allRefs.push({ table: 'course', id: c.id, url: c.gambar }))
    pengumpulans.forEach(p => allRefs.push({ table: 'pengumpulan', id: p.id, url: p.fileUrl, extra: { asesmenId: p.asesmenId, fileName: p.fileName } }))

    // Helper: detect if URL is already in bucket
    const isInBucket = (u?: string | null) => {
      if (!u) return false
      return u.includes('/storage/v1/object/public/upload/') || (supabaseUrl && u.includes(supabaseUrl))
    }

    const migrated: any[] = []
    const migrationCandidates: any[] = []
    for (const r of allRefs) {
      if (!r.url) continue
      if (isInBucket(r.url)) continue

      try {
        // Candidate for migration: fetch metadata and list as candidate in dryRun
        const res = await fetch(r.url)
        if (!res.ok) {
          console.warn(`Failed to fetch ${r.url} (status ${res.status})`)
          continue
        }
        const size = Number(res.headers.get('content-length') || 0)
        const contentType = res.headers.get('content-type') || 'application/octet-stream'
        const fname = r.url.split('/').pop() || `${r.id}`

        // Determine a sensible prefix so files are not placed at bucket root
        let prefix = `${r.table}/${r.id}`
        if (r.table === 'materi') {
          // place materi under its course folder
          const courseId = r.extra?.courseId || r.id
          prefix = `course/${courseId}/materi`
        } else if (r.table === 'course') {
          prefix = `course/${r.id}/gambar`
        } else if (r.table === 'pengumpulan') {
          const asesmenId = r.extra?.asesmenId || r.id
          prefix = `course_submissions/${asesmenId}`
        }

        migrationCandidates.push({ id: r.id, table: r.table, old: r.url, fname, size, contentType, prefix })

        if (!dryRun) {
          const buf = Buffer.from(await res.arrayBuffer())
          const publicUrl = await uploadToSupabase(buf, fname, contentType, prefix)

          // Update DB depending on table
          if (r.table === 'pbl') {
            await prisma.pBL.update({ where: { id: r.id }, data: { lampiran: publicUrl } })
          } else if (r.table === 'materi') {
            await prisma.materi.update({ where: { id: r.id }, data: { lampiran: publicUrl } })
          } else if (r.table === 'pengumpulan') {
            await prisma.pengumpulanProyek.update({ where: { id: r.id }, data: { fileUrl: publicUrl } })
          } else if (r.table === 'course') {
            await prisma.course.update({ where: { id: r.id }, data: { gambar: publicUrl } })
          }

          migrated.push({ id: r.id, table: r.table, old: r.url, new: publicUrl })
        }
      } catch (e) {
        console.error('Migration fetch/upload failed for', r.url, e)
      }
    }

    // 2) List all objects in bucket and compare against DB references to find orphans
    const objects = await listSupabaseObjects()
    const objectNames: string[] = Array.isArray(objects) ? objects.map((o: any) => o.name || o.id).filter(Boolean) : []

    // Build a set of all referenced paths (relative to bucket) by parsing DB urls that include /public/upload/<path>
    const referencedPaths = new Set<string>()
    const addFromUrl = (u?: string | null) => {
      if (!u) return
      const marker = '/storage/v1/object/public/upload/'
      const idx = u.indexOf(marker)
      if (idx >= 0) {
        const path = decodeURIComponent(u.slice(idx + marker.length))
        referencedPaths.add(path)
      }
    }

    allRefs.forEach(r => addFromUrl(r.url))
    // Also refresh DB for latest values after migration
    const freshPBL = await prisma.pBL.findMany({ select: { lampiran: true } })
    freshPBL.forEach(p => addFromUrl(p.lampiran))
    const freshMateri = await prisma.materi.findMany({ select: { lampiran: true } })
    freshMateri.forEach(m => addFromUrl(m.lampiran))
    const freshPeng = await prisma.pengumpulanProyek.findMany({ select: { fileUrl: true } })
    freshPeng.forEach(p => addFromUrl(p.fileUrl))

    // Determine orphaned objects
    const orphans = objectNames.filter(n => !referencedPaths.has(n))

    const deleted: string[] = []
    if (!dryRun) {
      for (const o of orphans) {
        try {
          await deleteSupabaseObject(o)
          deleted.push(o)
        } catch (e) {
          console.error('Failed to delete object', o, e)
        }
      }
    }

    return NextResponse.json({ dryRun, migrationCandidates: migrationCandidates.slice(0, 200), migrated, orphans, deleted })
  } catch (e: any) {
    console.error('Migration failed', e)
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
