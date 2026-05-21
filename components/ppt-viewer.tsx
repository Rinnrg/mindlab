"use client"

import { useMemo } from "react"
import { FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface PptViewerProps {
  /** Publicly accessible URL to PPT/PPTX file */
  src: string
  className?: string
  title?: string
}

function isProbablyPublicUrl(url: string) {
  // Office viewer needs to download the file. Relative URLs are OK in same-origin,
  // but file must be reachable without auth headers.
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost")
    return Boolean(u.protocol === "http:" || u.protocol === "https:")
  } catch {
    return false
  }
}

export function PptViewer({ src, className, title }: PptViewerProps) {
  const viewerUrl = useMemo(() => {
    // Microsoft Office Online viewer
    // https://learn.microsoft.com/en-us/office/dev/add-ins/develop/requirements-for-using-office-online
    const encoded = encodeURIComponent(src)
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`
  }, [src])

  const canEmbed = isProbablyPublicUrl(src)

  if (!canEmbed) {
    return (
      <div className={className}>
        <div className="rounded-xl border bg-background p-6">
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4" /> Preview PPT belum tersedia
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Viewer PPT butuh URL publik (bisa diakses tanpa login). Silakan gunakan link publik (Google Drive direct download / OneDrive / S3 / Supabase Storage)
            atau download file.
          </p>
          <div className="mt-4">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={src} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Buka file
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="rounded-xl border bg-background overflow-hidden">
        <iframe
          src={viewerUrl}
          title={title || "PPT Viewer"}
          className="w-full h-[520px] sm:h-[650px] lg:h-[780px] border-0"
          allowFullScreen
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Tips: jika viewer blank, pastikan link file PPT/PPTX bersifat public dan tidak butuh login.
      </p>
    </div>
  )
}
