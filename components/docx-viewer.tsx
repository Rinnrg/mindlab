"use client"

import { useEffect, useRef, useState } from "react"
import { renderAsync } from "docx-preview"
import { Loader2, FileText } from "lucide-react"

interface DocxViewerProps {
  /** Direct URL to a .docx file endpoint (should return application/vnd.openxmlformats-officedocument.wordprocessingml.document) */
  src: string
  className?: string
}

export function DocxViewer({ src, className }: DocxViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!containerRef.current) return
      setError(null)
      setLoading(true)

      try {
        // Reset old render
        containerRef.current.innerHTML = ""

        const res = await fetch(src)
        if (!res.ok) throw new Error("Gagal memuat file DOCX")

        const buffer = await res.arrayBuffer()
        if (cancelled) return

        await renderAsync(buffer, containerRef.current, undefined, {
          className: "docx",
          inWrapper: false,
          ignoreFonts: false,
          ignoreWidth: false,
          ignoreHeight: false,
          experimental: false,
          breakPages: true,
        })
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Gagal merender DOCX")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [src])

  if (error) {
    return (
      <div className={className}>
        <div className="rounded-xl border bg-background p-6">
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4" /> Preview DOCX gagal
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Tips: unduh file untuk membukanya di Microsoft Word / Google Docs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[240px] rounded-xl border bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border bg-background p-4 overflow-auto">
          <div ref={containerRef} />
        </div>
      )}
    </div>
  )
}
