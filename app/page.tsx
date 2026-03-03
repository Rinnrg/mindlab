"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, Users, Award, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg">
              <img src="/logo mindlab.svg" alt="Mindlab Logo" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-base font-semibold tracking-tight">Mindlab</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-sm" asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button size="sm" className="text-sm" asChild>
              <Link href="/login">Mulai Gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Platform pembelajaran terpercaya
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Belajar lebih efektif dengan platform yang tepat
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg max-w-xl mx-auto">
            Sistem manajemen pembelajaran yang memudahkan guru mengajar dan siswa belajar dalam satu tempat.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="w-full sm:w-auto gap-2" asChild>
              <Link href="/login">
                Mulai Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent" asChild>
              <Link href="#features">Pelajari Lebih Lanjut</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 sm:px-6 border-y border-border/40 bg-muted/20">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-2xl font-semibold text-foreground sm:text-3xl">500+</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">Siswa Aktif</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-foreground sm:text-3xl">50+</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">Kursus</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-foreground sm:text-3xl">98%</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">Kepuasan</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Fitur Unggulan</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Semua yang Anda butuhkan untuk pengalaman belajar yang lebih baik
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Materi Interaktif",
                desc: "Akses materi pembelajaran kapan saja dan di mana saja",
              },
              {
                icon: Users,
                title: "Kolaborasi",
                desc: "Diskusi dan kerja sama dengan guru dan teman sekelas",
              },
              {
                icon: Award,
                title: "Sertifikat",
                desc: "Dapatkan sertifikat setelah menyelesaikan kursus",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/60 bg-card p-5 transition-colors hover:border-border"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <feature.icon className="h-4 w-4 text-foreground" />
                </div>
                <h3 className="mt-3 text-sm font-medium text-foreground">{feature.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-border/60 bg-muted/30 p-8 text-center sm:p-12">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Siap untuk memulai?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bergabung dengan ribuan siswa dan guru yang telah menggunakan Mindlab
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/login">Daftar Sekarang</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Gratis untuk siswa
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Tanpa kartu kredit
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded">
              <img src="/logo mindlab.svg" alt="Mindlab Logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-sm font-medium">Mindlab</span>
          </div>
          <p className="text-xs text-muted-foreground">2025 Mindlab. Hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}
