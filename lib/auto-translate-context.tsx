"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

type Locale = 'id' | 'en'

interface AutoTranslateContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (text: string) => string
}

const AutoTranslateContext = createContext<AutoTranslateContextType | undefined>(undefined)

const translationDict: Record<string, { id: string; en: string }> = {
  // Common
  'Beranda': { id: 'Beranda', en: 'Dashboard' },
  'Kursus': { id: 'Kursus', en: 'Courses' },
  'Jadwal': { id: 'Jadwal', en: 'Schedule' },
  'Profil': { id: 'Profil', en: 'Profile' },
  'Keluar': { id: 'Keluar', en: 'Logout' },
  'Simpan': { id: 'Simpan', en: 'Save' },
  'Batal': { id: 'Batal', en: 'Cancel' },
  'Hapus': { id: 'Hapus', en: 'Delete' },
  'Edit': { id: 'Edit', en: 'Edit' },
  'Cari': { id: 'Cari', en: 'Search' },
  'Lihat': { id: 'Lihat', en: 'View' },
  'Tambah': { id: 'Tambah', en: 'Add' },
  'Kembali': { id: 'Kembali', en: 'Back' },
  'Selanjutnya': { id: 'Selanjutnya', en: 'Next' },
  'Sebelumnya': { id: 'Sebelumnya', en: 'Previous' },

  // Dashboard
  'Selamat Datang': { id: 'Selamat Datang', en: 'Welcome' },
  'Statistik': { id: 'Statistik', en: 'Statistics' },
  'Total Siswa': { id: 'Total Siswa', en: 'Total Students' },
  'Tugas Aktif': { id: 'Tugas Aktif', en: 'Active Assignments' },
  'Rata-rata Nilai': { id: 'Rata-rata Nilai', en: 'Average Grade' },
  'Aktivitas Terbaru': { id: 'Aktivitas Terbaru', en: 'Recent Activity' },
  'Tandai Semua': { id: 'Tandai Semua', en: 'Mark All' },
  'Belum ada aktivitas': { id: 'Belum ada aktivitas', en: 'No activity yet' },

  // PBL
  'PBL': { id: 'PBL', en: 'PBL' },
  'PBL Saya': { id: 'PBL Saya', en: 'My PBL' },
  'Cari PBL...': { id: 'Cari PBL...', en: 'Search PBL...' },
  'Belum ada PBL': { id: 'Belum ada PBL', en: 'No PBL yet' },
  'Tambah PBL': { id: 'Tambah PBL', en: 'Add PBL' },
  'Edit PBL': { id: 'Edit PBL', en: 'Edit PBL' },
  'Detail PBL': { id: 'Detail PBL', en: 'PBL Details' },
  'Buat PBL Baru': { id: 'Buat PBL Baru', en: 'Create New PBL' },
  'Kembali ke PBL': { id: 'Kembali ke PBL', en: 'Back to PBL' },
  'Sintaks': { id: 'Sintaks', en: 'Syntax' },
  'Belum ada PBL yang dibuat': { id: 'Belum ada PBL yang dibuat', en: 'No PBL created yet' },

  // Courses
  'Daftar Kursus': { id: 'Daftar Kursus', en: 'Course List' },
  'Tambah Kursus': { id: 'Tambah Kursus', en: 'Add Course' },
  'Detail Kursus': { id: 'Detail Kursus', en: 'Course Details' },
  'Kembali ke Kursus': { id: 'Kembali ke Kursus', en: 'Back to Courses' },

  // Auth
  'Masuk': { id: 'Masuk', en: 'Login' },
  'Masuk ke akun Anda': { id: 'Masuk ke akun Anda', en: 'Log in to your account' },
  'Lupa kata sandi?': { id: 'Lupa kata sandi?', en: 'Forgot password?' },
  'Belum punya akun?': { id: 'Belum punya akun?', en: 'Don\'t have an account?' },
  'Daftar': { id: 'Daftar', en: 'Register' },
}

export function AutoTranslateProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('id')

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved && (saved === 'id' || saved === 'en')) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }, [])

  const t = useCallback((text: string) => {
    if (locale === 'id') return text
    const translation = translationDict[text]
    return translation ? translation.en : text
  }, [locale])

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
  }), [locale, setLocale, t])

  return (
    <AutoTranslateContext.Provider value={value}>
      {children}
    </AutoTranslateContext.Provider>
  )
}

export function useAutoTranslate() {
  const context = useContext(AutoTranslateContext)
  if (context === undefined) {
    throw new Error('useAutoTranslate must be used within an AutoTranslateProvider')
  }
  return context
}
