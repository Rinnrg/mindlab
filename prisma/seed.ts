/*
  Safe Prisma seed.

  - No destructive operations.
  - Skips automatically on Supabase/production-like databases.

  This project previously referenced prisma/seed.ts but the file didn't exist,
  causing `prisma migrate dev` to fail after applying migrations.
*/

import { prisma } from "@/lib/prisma"

function isRemoteDatabase(url: string | undefined) {
  if (!url) return false
  const u = url.toLowerCase()
  return u.includes("supabase.com") || u.includes("pooler.supabase") || u.includes("neon.tech")
}

async function main() {
  const url = process.env.DATABASE_URL

  if (process.env.NODE_ENV === "production" || isRemoteDatabase(url)) {
    console.log("Prisma seed: skipped (production/remote database detected)")
    return
  }

  // No-op seed by default.
  // If later you need local demo data, add *idempotent* upserts here.
  await prisma.$connect()
  console.log("Prisma seed: no-op (local)")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    try {
      await prisma.$disconnect()
    } catch {
      // ignore
    }
  })
