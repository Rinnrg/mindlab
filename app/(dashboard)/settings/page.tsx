"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigationMode } from "@/lib/navigation-mode-context"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { useAuth } from "@/lib/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Layout, Palette, Bell, Shield, Globe, Monitor, Moon, Sun,
  Menu, Navigation, Lock, Eye, EyeOff, Check, LogOut,
  Smartphone, Languages, Volume2, VolumeX,
} from "lucide-react"

export default function SettingsPage() {
  const { navigationMode, toggleNavigationMode, mobileNavigationMode, setMobileNavigationMode } = useNavigationMode()
  const { t, locale, setLocale } = useAutoTranslate()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const isMobile = useIsMobile()
  
  // Track mount state and actual mobile detection
  const [isMobileResolved, setIsMobileResolved] = React.useState(false)
  
  React.useEffect(() => {
    // Wait a tick so useIsMobile has resolved
    const timer = setTimeout(() => {
      setIsMobileResolved(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])
  
  // Only show after mobile detection is resolved
  const showDesktopNav = isMobileResolved && !isMobile
  const showMobileNav = isMobileResolved && isMobile

  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [pushNotif, setPushNotif] = useState(true)
  const [emailNotif, setEmailNotif] = useState(false)
  const [soundNotif, setSoundNotif] = useState(true)
  const [animationEnabled, setAnimationEnabled] = useState(true)

  useEffect(() => {
    const s1 = localStorage.getItem("settings-animations")
    if (s1 !== null) setAnimationEnabled(s1 === "true")
    const s2 = localStorage.getItem("settings-push-notif")
    if (s2 !== null) setPushNotif(s2 === "true")
    const s3 = localStorage.getItem("settings-email-notif")
    if (s3 !== null) setEmailNotif(s3 === "true")
    const s4 = localStorage.getItem("settings-sound-notif")
    if (s4 !== null) setSoundNotif(s4 === "true")
  }, [])

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword || !oldPassword || !newPassword) return
    setPasswordSaved(true)
    setTimeout(() => {
      setPasswordSaved(false)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }, 2000)
  }

  const saveSetting = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val)
    localStorage.setItem(key, String(val))
  }

  const themeOptions = [
    { value: "light", icon: Sun, label: t("Terang") },
    { value: "dark", icon: Moon, label: t("Gelap") },
    { value: "system", icon: Monitor, label: t("Sistem") },
  ]

  return (
    <div className="w-full space-y-5 sm:space-y-6 px-4 sm:px-6 pt-4 sm:pt-6">
      <Tabs defaultValue="navigation" className="space-y-6">
        <TabsList className="ios-tab-list">
          <TabsTrigger value="general" className="ios-tab-trigger">
            <Palette className="ios-tab-icon" />
            <span className="ios-tab-text">{t("Umum")}</span>
          </TabsTrigger>
          <TabsTrigger value="navigation" className="ios-tab-trigger">
            <Navigation className="ios-tab-icon" />
            <span className="ios-tab-text">{t("Navigasi")}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="ios-tab-trigger">
            <Bell className="ios-tab-icon" />
            <span className="ios-tab-text">{t("Notifikasi")}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="ios-tab-trigger">
            <Shield className="ios-tab-icon" />
            <span className="ios-tab-text">{t("Keamanan")}</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══ General Tab ═══ */}
        <TabsContent value="general" className="space-y-6">
          {/* Theme Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t("Tema")}</CardTitle>
              </div>
              <CardDescription>{t("Pilih tema tampilan aplikasi")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      theme === value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/25 hover:bg-muted/50"
                    }`}
                  >
                    {theme === value && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <Icon className={`h-6 w-6 ${theme === value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${theme === value ? "text-primary" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Language Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t("Bahasa")}</CardTitle>
              </div>
              <CardDescription>{t("Pilih bahasa tampilan aplikasi")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(["id", "en"] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => setLocale(val)}
                    className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                      locale === val
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/25 hover:bg-muted/50"
                    }`}
                  >
                    {locale === val && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="text-2xl">{val === "id" ? "🇮🇩" : "🇺🇸"}</span>
                    <span className={`text-sm font-medium ${locale === val ? "text-primary" : "text-muted-foreground"}`}>
                      {val === "id" ? "Bahasa Indonesia" : "English"}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Animations Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t("Animasi")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">{t("Transisi Halus")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("Aktifkan animasi transisi antar halaman")}
                  </p>
                </div>
                <Switch
                  checked={animationEnabled}
                  onCheckedChange={(v) => saveSetting("settings-animations", v, setAnimationEnabled)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Navigation Tab ═══ */}
        <TabsContent value="navigation" className="space-y-6">
          {/* Desktop Navigation Mode - hanya tampil di desktop */}
          {showDesktopNav && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{t("Mode Navigasi Desktop")}</CardTitle>
                </div>
                <CardDescription>
                  {t("Pilih gaya navigasi untuk tampilan desktop")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Sidebar Option */}
                  <button
                    onClick={() => {
                      if (navigationMode === "dock") toggleNavigationMode()
                    }}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
                      navigationMode === "sidebar"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/25 hover:bg-muted/50"
                    }`}
                  >
                    {navigationMode === "sidebar" && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="w-full flex gap-1 h-16">
                      <div className="w-8 bg-muted rounded-md flex flex-col items-center gap-0.5 p-1">
                        <div className="w-4 h-4 bg-primary/20 rounded" />
                        <div className="w-4 h-3 bg-muted-foreground/10 rounded" />
                        <div className="w-4 h-3 bg-muted-foreground/10 rounded" />
                      </div>
                      <div className="flex-1 bg-muted/50 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Menu className="h-4 w-4" />
                      <span
                        className={`text-sm font-medium ${
                          navigationMode === "sidebar" ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {t("Sidebar")}
                      </span>
                    </div>
                  </button>

                  {/* Dock Option */}
                  <button
                    onClick={() => {
                      if (navigationMode === "sidebar") toggleNavigationMode()
                    }}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
                      navigationMode === "dock"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/25 hover:bg-muted/50"
                    }`}
                  >
                    {navigationMode === "dock" && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="w-full h-16 bg-muted/50 rounded-md relative">
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 bg-muted rounded-lg px-2 py-1">
                        <div className="w-3 h-3 bg-primary/30 rounded" />
                        <div className="w-3 h-3 bg-muted-foreground/10 rounded" />
                        <div className="w-3 h-3 bg-muted-foreground/10 rounded" />
                        <div className="w-3 h-3 bg-muted-foreground/10 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4" />
                      <span
                        className={`text-sm font-medium ${
                          navigationMode === "dock" ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {t("Dock")}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 text-sm text-muted-foreground">
                  <p>
                    {navigationMode === "dock"
                      ? t("Dock akan muncul di bagian bawah layar dengan efek magnifikasi seperti macOS")
                      : t("Sidebar akan tampil di sisi kiri layar dengan menu navigasi lengkap")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile Navigation Mode - hanya tampil di mobile */}
          {showMobileNav && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{t("Mode Navigasi Mobile")}</CardTitle>
                </div>
                <CardDescription>
                  {t("Pilih antara Hamburger atau Dynamic Bar")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Hamburger Option */}
                  <button
                    onClick={() => {
                      setMobileNavigationMode("sidebar")
                    }}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
                      mobileNavigationMode === "sidebar"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/25 hover:bg-muted/50"
                    }`}
                  >
                    {mobileNavigationMode === "sidebar" && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="w-full h-16 bg-muted/50 rounded-md relative flex items-center justify-center">
                      <Menu className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Menu className="h-4 w-4" />
                      <span
                        className={`text-sm font-medium ${
                          mobileNavigationMode === "sidebar" ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {t("Hamburger")}
                      </span>
                    </div>
                  </button>

                  {/* Dynamic Bar Option */}
                  <button
                    onClick={() => {
                      setMobileNavigationMode("bottom-nav")
                    }}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
                      mobileNavigationMode === "bottom-nav"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/25 hover:bg-muted/50"
                    }`}
                  >
                    {mobileNavigationMode === "bottom-nav" && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="w-full h-16 bg-muted/50 rounded-md relative">
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-muted rounded-lg px-3 py-1.5">
                        <div className="w-4 h-4 bg-primary/30 rounded" />
                        <div className="w-4 h-4 bg-muted-foreground/20 rounded" />
                        <div className="w-4 h-4 bg-muted-foreground/20 rounded" />
                        <div className="w-4 h-4 bg-muted-foreground/20 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span
                        className={`text-sm font-medium ${
                          mobileNavigationMode === "bottom-nav" ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {t("Dynamic Bar")}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-muted/40 text-sm text-muted-foreground">
                  <div className="flex flex-col gap-2">
                    <div className="font-medium">Mode saat ini: {mobileNavigationMode === "sidebar" ? "Hamburger" : "Dynamic Bar"}</div>
                    <div>
                      {mobileNavigationMode === "sidebar"
                        ? t("🍔 Hamburger: Topbar dengan tombol ☰ untuk buka sidebar drawer")
                        : t("📱 Dynamic Bar: Topbar tanpa hamburger + navigation bar di bawah layar")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>        {/* ═══ Notifications Tab ═══ */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t("Preferensi Notifikasi")}</CardTitle>
              </div>
              <CardDescription>{t("Kelola bagaimana Anda menerima notifikasi")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                    <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-base">{t("Notifikasi Push")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Terima notifikasi untuk pembaruan penting")}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={pushNotif}
                  onCheckedChange={(v) => saveSetting("settings-push-notif", v, setPushNotif)}
                />
              </div>
              <Separator />

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                    <Languages className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-base">{t("Email Notifikasi")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Terima ringkasan aktivitas melalui email")}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={emailNotif}
                  onCheckedChange={(v) => saveSetting("settings-email-notif", v, setEmailNotif)}
                />
              </div>
              <Separator />

              {/* Sound Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950">
                    {soundNotif ? (
                      <Volume2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-base">{t("Suara Notifikasi")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Putar suara saat menerima notifikasi")}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={soundNotif}
                  onCheckedChange={(v) => saveSetting("settings-sound-notif", v, setSoundNotif)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Security Tab ═══ */}
        <TabsContent value="security" className="space-y-6">
          {/* Password Change Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t("Ubah Password")}</CardTitle>
              </div>
              <CardDescription>{t("Perbarui password akun Anda secara berkala")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("Password Lama")}</Label>
                <div className="relative">
                  <Input
                    type={showOldPass ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("Password Baru")}</Label>
                <div className="relative">
                  <Input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("Konfirmasi Password Baru")}</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive">{t("Password tidak cocok")}</p>
                )}
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={!oldPassword || !newPassword || newPassword !== confirmPassword || passwordSaved}
                className="w-full"
              >
                {passwordSaved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t("Password Berhasil Diubah")}
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    {t("Ubah Password")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t("Informasi Akun")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">{t("Nama")}</p>
                  <p className="font-medium">{user?.nama || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">{t("Email")}</p>
                  <p className="font-medium">{user?.email || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">{t("Role")}</p>
                  <p className="font-medium capitalize">{user?.role?.toLowerCase() || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">{t("ID")}</p>
                  <p className="font-medium text-xs font-mono truncate">{user?.id || "-"}</p>
                </div>
              </div>
              <Separator />
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  if (confirm(t("Apakah Anda yakin ingin keluar?"))) {
                    logout()
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("Keluar")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
