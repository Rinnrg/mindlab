"use client"

import { use, useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useBreadcrumbPage } from "@/hooks/use-breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAdaptiveAlert } from "@/components/ui/adaptive-alert"
import { useAsyncAction } from "@/hooks/use-async-action"
import { 
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  BookOpen,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface PageProps {
  params: Promise<{ 
    id: string
  itemId: string
  }>
}

interface Opsi {
  id: string
  teks: string
  isBenar: boolean
}

interface Soal {
  id: string
  pertanyaan: string
  gambar?: string
  bobot: number
  tipeJawaban: 'PILIHAN_GANDA' | 'ISIAN'
  opsi: Opsi[]
}

interface Jawaban {
  soalId: string
  jawaban: string
}

// Seeded Random Number Generator (Mulberry32)
function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  
  return function() {
    h = Math.imul(h ^ h >>> 16, 0x85ebca6b)
    h = Math.imul(h ^ h >>> 13, 0xc2b2ae35)
    return ((h = h ^ h >>> 16) >>> 0) / 4294967296
  }
}

// Fisher-Yates Shuffle dengan Seeded Random
function shuffleArray<T>(array: T[], seed: string): T[] {
  const arr = [...array] // Clone array
  const rng = seededRandom(seed)
  
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  
  return arr
}


export default function KuisPage({ params }: PageProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const resolvedParams = use(params)
  const { id: courseId, itemId: asesmenId } = resolvedParams
  const { confirm, error: showError, warning: showWarning, AlertComponent } = useAdaptiveAlert()
  const { execute, ActionFeedback } = useAsyncAction()
  
  const [asesmen, setAsesmen] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentSoalIndex, setCurrentSoalIndex] = useState(0)
  const [jawaban, setJawaban] = useState<Jawaban[]>([])
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [durasiMenit, setDurasiMenit] = useState<number | null>(null)
  const [timeExpired, setTimeExpired] = useState(false)
  const [shuffledSoal, setShuffledSoal] = useState<Soal[]>([])
  
  // Ragu-ragu state
  const [raguRagu, setRaguRagu] = useState<Set<string>>(new Set())
  
  // Anti-cheat state
  const [antiCurang, setAntiCurang] = useState(false)
  const [leaveCount, setLeaveCount] = useState(0)
  const leaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [leaveCountdown, setLeaveCountdown] = useState<number | null>(null)
  const isSubmittingRef = useRef(false)
  
  // Check if already submitted
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Set custom breadcrumb
  const breadcrumbItems = useMemo(() => [
    {
      label: 'Kursus',
      href: '/courses',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: 'Loading...', // Will be replaced by smart-breadcrumb
      href: `/courses/${courseId}?tab=assessments`,
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      label: asesmen?.judul || 'Loading...', 
      href: `/courses/${courseId}/${asesmenId}`,
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: 'Kuis',
      icon: <HelpCircle className="h-4 w-4" />
    }
  ], [courseId, asesmenId, asesmen?.judul])

  useBreadcrumbPage('Kuis', breadcrumbItems)

  // Fungsi untuk mengacak array menggunakan Fisher-Yates shuffle
  const shuffleArray = <T,>(array: T[], seed: string): T[] => {
    const arr = [...array]
    // Generate seeded random number based on user ID + asesmen ID
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i)
      hash = hash & hash
    }
    
    // Seeded random function
    const random = () => {
      hash = (hash * 9301 + 49297) % 233280
      return hash / 233280
    }
    
    // Fisher-Yates shuffle with seeded random
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  useEffect(() => {
    if (authLoading) return

    if (!asesmenId) {
      router.push(`/courses/${courseId}`)
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'SISWA') {
      router.push(`/courses/${courseId}/${asesmenId}`)
      return
    }

    // Fetch asesmen data
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/asesmen/${asesmenId}?userId=${user.id}&userRole=${user.role}`)
        if (response.ok) {
          const data = await response.json()
          const asesmenData = data.asesmen
          
          // Check if asesmen has started
          if (asesmenData.tgl_mulai && new Date(asesmenData.tgl_mulai) > new Date()) {
            showError("Belum Dimulai", "Kuis ini belum bisa dimulai")
            router.push(`/courses/${courseId}/${asesmenId}`)
            return
          }
          
          // Check if deadline has passed
          if (asesmenData.tgl_selesai && new Date(asesmenData.tgl_selesai) < new Date()) {
            showError("Sudah Ditutup", "Kuis ini sudah ditutup")
            router.push(`/courses/${courseId}/${asesmenId}`)
            return
          }
          
          setAsesmen(asesmenData)
          setAntiCurang(!!asesmenData.antiCurang)
          
          // Check if already submitted
          if (asesmenData.nilai && asesmenData.nilai.length > 0) {
            setHasSubmitted(true)
          }
          
          // Process soal - apply shuffling if enabled
          let processedSoal = asesmenData.soal || []
          
          // Acak soal jika diaktifkan
          if (asesmenData.acakSoal && user?.id) {
            const seed = `${user.id}-${asesmenId}-soal`
            processedSoal = shuffleArray(processedSoal, seed)
          }
          
          // Acak jawaban jika diaktifkan
          if (asesmenData.acakJawaban && user?.id) {
            processedSoal = processedSoal.map((soal: Soal) => {
              if (soal.tipeJawaban === 'PILIHAN_GANDA' && soal.opsi && soal.opsi.length > 0) {
                const seed = `${user.id}-${asesmenId}-opsi-${soal.id}`
                return {
                  ...soal,
                  opsi: shuffleArray(soal.opsi, seed)
                }
              }
              return soal
            })
          }
          
          setShuffledSoal(processedSoal)
          
          // Initialize jawaban array
          if (processedSoal.length > 0) {
            setJawaban(processedSoal.map((s: Soal) => ({
              soalId: s.id,
              jawaban: ''
            })))
          }
          
          // Start timer if durasi is set
          if (asesmenData.durasi && asesmenData.durasi > 0) {
            const durasiSeconds = Number(asesmenData.durasi) * 60
            setDurasiMenit(Number(asesmenData.durasi))

            // Cek apakah sudah ada start time di sessionStorage (untuk handle refresh)
            const storageKey = `kuis_start_${asesmenId}`
            const savedStartTime = sessionStorage.getItem(storageKey)
            
            let start: Date
            if (savedStartTime) {
              start = new Date(savedStartTime)
            } else {
              start = new Date()
              sessionStorage.setItem(storageKey, start.toISOString())
            }
            setStartTime(start)

            // Hitung sisa waktu berdasarkan selisih waktu sekarang dan start time
            const elapsedSeconds = Math.floor((Date.now() - start.getTime()) / 1000)
            const remaining = durasiSeconds - elapsedSeconds

            if (remaining <= 0) {
              // Waktu sudah habis
              setTimeLeft(0)
              setTimeExpired(true)
            } else {
              setTimeLeft(remaining)
            }
          }
          
          // Restore leave count from sessionStorage
          const savedLeaveCount = sessionStorage.getItem(`kuis_leave_${asesmenId}`)
          if (savedLeaveCount) {
            setLeaveCount(parseInt(savedLeaveCount))
          }
        } else {
          router.push(`/courses/${courseId}`)
        }
      } catch (error) {
        console.error('Error fetching asesmen:', error)
        router.push(`/courses/${courseId}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, authLoading, router, asesmenId, courseId])

  // Timer countdown - menggunakan interval yang stabil tanpa dependency pada timeLeft
  useEffect(() => {
    if (startTime === null || durasiMenit === null || durasiMenit <= 0 || hasSubmitted) return

    const durasiSeconds = durasiMenit * 60

    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000)
      const remaining = durasiSeconds - elapsedSeconds

      if (remaining <= 0) {
        setTimeLeft(0)
        setTimeExpired(true)
        clearInterval(timer)
      } else {
        setTimeLeft(remaining)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime, durasiMenit, hasSubmitted])

  // Auto-submit saat waktu habis
  useEffect(() => {
    if (timeExpired && !hasSubmitted && !isSubmittingRef.current) {
      handleSubmit(true)
    }
  }, [timeExpired, hasSubmitted])

  // Anti-cheat: detect tab switch / visibility change / window blur
  useEffect(() => {
    if (!antiCurang || hasSubmitted || loading) return

    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittingRef.current) {
        triggerLeaveWarning()
      } else if (!document.hidden) {
        handleWindowReturn()
      }
    }

    const handleBlur = () => {
      if (!isSubmittingRef.current && !hasSubmitted) {
        triggerLeaveWarning()
      }
    }

    const handleFocus = () => {
      handleWindowReturn()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      if (leaveTimerRef.current) {
        clearInterval(leaveTimerRef.current)
      }
    }
  }, [antiCurang, hasSubmitted, loading])

  const triggerLeaveWarning = useCallback(() => {
    if (isSubmittingRef.current || hasSubmitted) return
    
    setLeaveCount(prev => {
      const newCount = prev + 1
      sessionStorage.setItem(`kuis_leave_${asesmenId}`, String(newCount))
      
      // Auto-submit jika pelanggaran lebih dari 10
      if (newCount > 10) {
        setTimeout(() => {
          if (!isSubmittingRef.current && !hasSubmitted) {
            showError(
              "Pelanggaran Berlebihan!",
              `Anda telah meninggalkan jendela kuis sebanyak ${newCount} kali. Kuis akan dikumpulkan secara otomatis karena melanggar aturan anti-curang.`
            )
            setTimeout(() => {
              setTimeExpired(true)
            }, 3000) // Berikan waktu 3 detik untuk membaca pesan
          }
        }, 100)
        return newCount
      }
      
      return newCount
    })

    // Start 30 second countdown for auto-submit (hanya jika belum lebih dari 10 pelanggaran)
    setLeaveCount(currentCount => {
      if (currentCount <= 10) {
        let countdown = 30 // 30 seconds for anti-cheat
        setLeaveCountdown(countdown)

        if (leaveTimerRef.current) {
          clearInterval(leaveTimerRef.current)
        }

        leaveTimerRef.current = setInterval(() => {
          countdown--
          setLeaveCountdown(countdown)
          if (countdown <= 0) {
            if (leaveTimerRef.current) clearInterval(leaveTimerRef.current)
            // Auto-submit karena siswa tidak kembali dalam 30 detik
            if (!isSubmittingRef.current) {
              setTimeExpired(true)
            }
          }
        }, 1000)
      }
      return currentCount
    })
  }, [asesmenId, hasSubmitted, showError])

  const handleWindowReturn = useCallback(() => {
    // Clear the 5-minute leave timer
    if (leaveTimerRef.current) {
      clearInterval(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
    setLeaveCountdown(null)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleJawabanChange = (soalId: string, value: string) => {
    setJawaban(prev => prev.map(j => 
      j.soalId === soalId ? { ...j, jawaban: value } : j
    ))
  }

  const toggleRaguRagu = (soalId: string) => {
    setRaguRagu(prev => {
      const newSet = new Set(prev)
      if (newSet.has(soalId)) {
        newSet.delete(soalId)
      } else {
        newSet.add(soalId)
      }
      return newSet
    })
  }

  const handleNext = () => {
    if (shuffledSoal.length > 0 && currentSoalIndex < shuffledSoal.length - 1) {
      setCurrentSoalIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSoalIndex > 0) {
      setCurrentSoalIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async (autoSubmit = false) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    // Clear leave timer if active
    if (leaveTimerRef.current) {
      clearInterval(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
    setLeaveCountdown(null)

    const doSubmit = async () => {
      try {
        const payload = {
          siswaId: user?.id,
          jawaban: jawaban,
          waktuMulai: startTime,
          waktuSelesai: new Date(),
        }
        
        const response = await fetch(`/api/asesmen/${asesmenId}/submit-kuis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        
        const responseData = await response.json()
        
        if (!response.ok) {
          throw new Error(responseData.error || "Gagal mengumpulkan kuis")
        }
        
        return responseData
      } catch (error) {
        console.error('Error submitting:', error)
        throw error
      }
    }

    if (autoSubmit) {
      try {
        await doSubmit()
        sessionStorage.removeItem(`kuis_start_${asesmenId}`)
        sessionStorage.removeItem(`kuis_leave_${asesmenId}`)
        setHasSubmitted(true)
        await execute(
          async () => {},
          {
            loadingMessage: "Mengumpulkan kuis...",
            successTitle: "Berhasil!",
            successDescription: "Waktu habis! Kuis telah dikumpulkan secara otomatis.",
            autoCloseMs: 2000,
            onSuccess: () => {
              setTimeout(() => {
                router.push(`/courses/${courseId}/${itemId}`)
              }, 2000)
            },
          }
        )
      } catch {
        isSubmittingRef.current = false
      }
      return
    }

    const confirmed = await confirm(
      "Kumpulkan Kuis?",
      {
        description: "Apakah Anda yakin ingin mengumpulkan kuis ini? Jawaban tidak dapat diubah setelah dikumpulkan.",
        confirmText: "Kumpulkan",
        cancelText: "Batal",
        type: "warning",
      }
    )
    
    if (confirmed) {
      await execute(
        async () => {
          await doSubmit()
        },
        {
          loadingMessage: "Mengumpulkan kuis...",
          successTitle: "Berhasil!",
          successDescription: "Kuis berhasil dikumpulkan",
          errorTitle: "Gagal",
          autoCloseMs: 2000,
          onSuccess: () => {
            sessionStorage.removeItem(`kuis_start_${asesmenId}`)
            sessionStorage.removeItem(`kuis_leave_${asesmenId}`)
            setHasSubmitted(true)
            setTimeout(() => {
              router.push(`/courses/${courseId}/${itemId}`)
            }, 2000)
          },
        }
      )
    } else {
      isSubmittingRef.current = false
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!asesmen || shuffledSoal.length === 0) {
    return (
      <div className="w-full py-6 sm:py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Kuis tidak ditemukan atau belum memiliki soal.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (hasSubmitted) {
    return (
      <div className="w-full py-6 sm:py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle>Kuis Sudah Dikumpulkan</CardTitle>
            </div>
            <CardDescription>
              Anda sudah mengumpulkan kuis ini. Lihat nilai Anda di halaman detail asesmen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const currentSoal = shuffledSoal[currentSoalIndex]
  const currentJawaban = jawaban.find(j => j.soalId === currentSoal.id)
  const answeredCount = jawaban.filter(j => j.jawaban !== '').length
  const progress = (answeredCount / shuffledSoal.length) * 100
  const isCurrentRagu = raguRagu.has(currentSoal.id)

  return (
    <div className="w-full py-6 sm:py-8 space-y-6">
      <AlertComponent />
      <ActionFeedback />
      
      {/* Anti-cheat leave countdown overlay */}
      {antiCurang && leaveCountdown !== null && leaveCount <= 10 && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-6 w-6" />
                <CardTitle className="text-red-600">⚠️ Anda Meninggalkan Kuis!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Anda terdeteksi meninggalkan jendela kuis. Kuis akan otomatis dikumpulkan jika Anda tidak kembali dalam waktu:
              </p>
              <div className="text-center">
                <span className="text-4xl font-mono font-bold text-red-600">
                  {formatTime(leaveCountdown)}
                </span>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  Pelanggaran ke-{leaveCount}
                </p>
                <p className={`text-xs font-medium ${
                  leaveCount >= 8 ? 'text-red-600' : 
                  leaveCount >= 5 ? 'text-orange-600' : 
                  'text-yellow-600'
                }`}>
                  {leaveCount >= 8 ? '🚨 Bahaya: Mendekati batas maksimal!' : 
                   leaveCount >= 5 ? '⚠️ Peringatan: Batas pelanggaran tinggi!' :
                   leaveCount >= 3 ? '⚡ Hati-hati dengan pelanggaran!' :
                   '📢 Mohon tetap di halaman kuis'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Maksimal 10 pelanggaran
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold sm:text-2xl">{asesmen.nama}</h1>
          {antiCurang && (
            <div className="flex items-center gap-1.5">
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="mr-1 h-3 w-3" />
                Anti-Curang Aktif
              </Badge>
              {leaveCount > 0 && (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                  Pelanggaran: {leaveCount}x
                </Badge>
              )}
            </div>
          )}
        </div>
        {timeLeft !== null && (
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${timeLeft < 60 ? 'text-red-600' : 'text-muted-foreground'}`} />
            <span className={`text-lg font-mono ${timeLeft < 60 ? 'text-red-600 font-bold' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progres: {answeredCount} / {asesmen.soal.length} soal</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question Card - iOS Glass */}
      <Card className="ios-glass-card border-border/30 rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-lg">Soal {currentSoalIndex + 1} / {asesmen.soal.length}</Badge>
              <Badge variant="outline" className="rounded-lg">{currentSoal.bobot} poin</Badge>
              <Badge variant={currentSoal.tipeJawaban === 'PILIHAN_GANDA' ? 'default' : 'secondary'} className="rounded-lg">
                {currentSoal.tipeJawaban === 'PILIHAN_GANDA' ? 'Pilihan Ganda' : 'Isian'}
              </Badge>
              {isCurrentRagu && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400">
                  <HelpCircle className="mr-1 h-3 w-3" />
                  Ragu-ragu
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="mt-4">{currentSoal.pertanyaan}</CardTitle>
          {currentSoal.gambar && (
            <div className="mt-3">
              <img
                src={currentSoal.gambar}
                alt="Gambar soal"
                className="max-h-64 rounded-lg border object-contain"
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {currentSoal.tipeJawaban === 'PILIHAN_GANDA' ? (
            <RadioGroup
              value={currentJawaban?.jawaban || ''}
              onValueChange={(value) => handleJawabanChange(currentSoal.id, value)}
            >
              {currentSoal.opsi.map((opsi: Opsi) => (
                <div key={opsi.id} className="flex items-center space-x-2 border border-border/30 rounded-xl p-3 hover:bg-accent/50 cursor-pointer transition-colors">
                  <RadioGroupItem value={opsi.id} id={opsi.id} />
                  <Label htmlFor={opsi.id} className="flex-1 cursor-pointer">
                    {opsi.teks}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="jawaban-isian">Jawaban Anda</Label>
              <Textarea
                id="jawaban-isian"
                value={currentJawaban?.jawaban || ''}
                onChange={(e) => handleJawabanChange(currentSoal.id, e.target.value)}
                placeholder="Tulis jawaban Anda di sini..."
                rows={6}
              />
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Soal isian akan dinilai secara manual oleh guru.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Ragu-ragu button + Navigation Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            {/* Tombol Ragu-ragu */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant={isCurrentRagu ? "default" : "outline"}
                size="sm"
                onClick={() => toggleRaguRagu(currentSoal.id)}
                className={isCurrentRagu 
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500" 
                  : "border-yellow-400 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                }
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                {isCurrentRagu ? "Hapus Tanda Ragu" : "Tandai Ragu-ragu"}
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentSoalIndex === 0}
            >
              Sebelumnya
            </Button>
            
            {currentSoalIndex === shuffledSoal.length - 1 ? (
              <Button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengumpulkan...
                  </>
                ) : (
                  'Kumpulkan Kuis'
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Selanjutnya
              </Button>
            )}
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Navigator - iOS Glass */}
      <Card className="ios-glass-card border-border/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm">Navigasi Soal</CardTitle>
          <CardDescription className="text-xs">
            <span className="inline-flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm inline-block bg-green-500" /> Sudah dijawab
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm inline-block bg-yellow-400" /> Ragu-ragu
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm border border-border inline-block" /> Belum dijawab
              </span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {shuffledSoal.map((soal: Soal, index: number) => {
              const isAnswered = jawaban.find(j => j.soalId === soal.id)?.jawaban !== ''
              const isCurrent = index === currentSoalIndex
              const isRagu = raguRagu.has(soal.id)
              
              let btnClass = "h-10 w-full font-medium transition-all "
              if (isCurrent) {
                btnClass += "ring-2 ring-primary ring-offset-2 "
              }
              
              return (
                <Button
                  key={soal.id}
                  variant={(!isAnswered && !isRagu) ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setCurrentSoalIndex(index)}
                  className={btnClass}
                  style={
                    isRagu 
                      ? { backgroundColor: 'rgb(250, 204, 21)', borderColor: 'rgb(250, 204, 21)', color: 'white' }
                      : isAnswered 
                        ? { backgroundColor: 'rgb(34, 197, 94)', borderColor: 'rgb(34, 197, 94)', color: 'white' }
                        : undefined
                  }
                >
                  {index + 1}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
