"use client"

// Canonical URL shape: /courses/[courseId]/[asesmenId]/[pengumpulanId]
export const dynamic = "force-dynamic"

// Re-export the same page implementation from the legacy route file.
// NOTE: We keep this indirection minimal; the legacy route no longer redirects.
export { default } from "../pengumpulan/[pengumpulanId]/page"
