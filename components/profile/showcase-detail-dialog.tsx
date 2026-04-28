"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Code, 
  User, 
  Calendar, 
  Trophy, 
  Star, 
  ExternalLink,
  Download,
  Eye,
  ArrowRight
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"

interface ShowcaseDetailDialogProps {
  showcase: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShowcaseDetailDialog({ showcase, open, onOpenChange }: ShowcaseDetailDialogProps) {
  const [activeView, setActiveView] = React.useState<"pdf" | "code">("pdf")

  if (!showcase) return null

  const p = showcase.pengumpulanProyek
  const a = p?.asesmen
  const dateLocale = idLocale
  const hasCompiler = Boolean(p?.sourceCode)
  const hasOutput = Boolean(p?.output)
  const isKelompok = Boolean(p?.kelompok || p?.namaKelompok)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 ios-glass-card border-border/30 rounded-3xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <Badge className="mb-2 bg-yellow-400/10 text-yellow-600 hover:bg-yellow-400/20 border-yellow-400/20">
                <Trophy className="mr-1 h-3 w-3" /> Showcase Achievement
              </Badge>
              <DialogTitle className="text-2xl font-bold">{showcase.judul}</DialogTitle>
              <DialogDescription className="text-base line-clamp-2">
                {showcase.deskripsi}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 rounded-2xl bg-primary/10 px-4 py-2 text-2xl font-bold text-primary">
                <Star className="h-5 w-5 fill-primary" />
                {showcase.nilai}
              </div>
              <p className="text-xs text-muted-foreground">
                Divalidasi pada {format(new Date(showcase.tanggalDinilai), "d MMMM yyyy", { locale: dateLocale })}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
          {/* Main Info Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-2xl ios-glass-inset space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tugas / Proyek</p>
              <p className="font-medium">{a?.nama || "Tugas"}</p>
            </div>
            <div className="p-4 rounded-2xl ios-glass-inset space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guru Pengampu</p>
              <p className="font-medium">{a?.guru?.nama || "-"}</p>
            </div>
            <div className="p-4 rounded-2xl ios-glass-inset space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal Pengumpulan</p>
              <p className="font-medium">
                {p?.tgl_unggah ? format(new Date(p.tgl_unggah), "d MMMM yyyy", { locale: dateLocale }) : "-"}
              </p>
            </div>
            {isKelompok && (
              <div className="p-4 rounded-2xl ios-glass-inset space-y-1 sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelompok</p>
                <p className="font-medium">{p?.kelompok?.nama || p?.namaKelompok || "-"}</p>
                {Array.isArray(p?.anggota) && p.anggota.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Anggota: {p.anggota.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-border/50" />

          {/* Result Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Hasil Pengerjaan
              </h3>
              <div className="flex bg-muted p-1 rounded-xl">
                {p?.fileUrl && (
                  <Button 
                    variant={activeView === "pdf" ? "default" : "ghost"} 
                    size="sm" 
                    onClick={() => setActiveView("pdf")}
                    className="rounded-lg h-8"
                  >
                    PDF Viewer
                  </Button>
                )}
                {p?.sourceCode && (
                  <Button 
                    variant={activeView === "code" ? "default" : "ghost"} 
                    size="sm" 
                    onClick={() => setActiveView("code")}
                    className="rounded-lg h-8"
                  >
                    Result Code
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/30 overflow-hidden bg-muted/30">
              {activeView === "pdf" && p?.fileUrl && (
                <div className="aspect-[4/5] w-full">
                  <iframe 
                    src={`${p.fileUrl}#toolbar=0`}
                    className="w-full h-full border-0"
                    title="Result PDF"
                  />
                </div>
              )}
              {activeView === "code" && p?.sourceCode && (
                <div className="p-6 bg-black/5 dark:bg-white/5">
                  <pre className="p-4 rounded-xl bg-background border border-border/50 overflow-x-auto text-sm font-mono leading-relaxed max-h-[400px]">
                    <code>{p.sourceCode}</code>
                  </pre>

                  {hasOutput && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Output</p>
                      <pre className="p-4 rounded-xl bg-background border border-border/50 overflow-x-auto text-sm font-mono leading-relaxed max-h-[240px] whitespace-pre-wrap">
                        <code>{p.output}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
              {!p?.fileUrl && !p?.sourceCode && (
                <div className="p-12 text-center text-muted-foreground">
                  Tidak ada konten hasil pengerjaan untuk ditampilkan.
                </div>
              )}
            </div>
          </div>

          {/* Feedback Section */}
          {p?.feedback && (
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-primary">
                <Star className="h-5 w-5" />
                Feedback dari Guru
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap italic text-muted-foreground">
                "{p.feedback}"
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border/30 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">{showcase.siswa.nama}</p>
              <p className="text-xs text-muted-foreground">{showcase.siswa.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {p?.fileUrl && (
              <Button variant="outline" size="sm" asChild className="rounded-xl">
                <a href={p.fileUrl} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
            <Button size="sm" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
