import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { AutoTranslateProvider } from "@/lib/auto-translate-context"
import { NavigationModeProvider } from "@/lib/navigation-mode-context"
import { BreadcrumbProvider } from "@/hooks/use-breadcrumb"
import { PageTransitionProvider } from "@/lib/page-transition-context"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Projecta",
  description: "Platform pembelajaran modern berbasis project-based learning untuk pendidikan yang lebih bermakna",
  openGraph: {
    title: "Projecta",
    description: "Platform pembelajaran modern berbasis project-based learning untuk pendidikan yang lebih bermakna",
    siteName: "Projecta",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <NavigationModeProvider>
            <AutoTranslateProvider>
              <AuthProvider>
                <BreadcrumbProvider>
                  <PageTransitionProvider>
                    {children}
                  </PageTransitionProvider>
                </BreadcrumbProvider>
              </AuthProvider>
            </AutoTranslateProvider>
          </NavigationModeProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
