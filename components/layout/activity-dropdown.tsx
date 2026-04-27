"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bell, Award, Upload, BookOpen, Clock, Loader2, Check, CheckCheck, FileText, FolderKanban, UserPlus, BookMarked } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { id as localeId, enUS } from "date-fns/locale"

interface Activity {
  id: string
  action: string
  item: string
  course?: string
  time: string
  type: string
  score?: number
  detail?: string
  group?: string
  progress?: number
}

export function ActivityDropdown() {
  const { user } = useAuth()
  const { t, locale } = useAutoTranslate()
  const dateLocale = locale === 'id' ? localeId : enUS
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [readActivities, setReadActivities] = useState<Set<string>>(new Set())

  // Load read activities from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`read-activities-${user.id}`)
      if (stored) {
        try {
          setReadActivities(new Set(JSON.parse(stored)))
        } catch {
          setReadActivities(new Set())
        }
      }
    }
  }, [user])

  // Save read activities to localStorage
  const saveReadActivities = useCallback((readSet: Set<string>) => {
    if (user) {
      localStorage.setItem(`read-activities-${user.id}`, JSON.stringify(Array.from(readSet)))
      setReadActivities(readSet)
    }
  }, [user])

  const fetchActivities = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/activity?userId=${user.id}&role=${user.role}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }, [user])

  // Fetch activities on mount and periodically
  useEffect(() => {
    if (!user) return

    const doFetch = async () => {
      setLoading(true)
      await fetchActivities()
      setLoading(false)
    }
    doFetch()

    // Fetch every 2 minutes
    const interval = setInterval(fetchActivities, 120000)
    return () => clearInterval(interval)
  }, [user, fetchActivities])

  // Refresh when dropdown opens
  useEffect(() => {
    if (open) {
      fetchActivities()
    }
  }, [open, fetchActivities])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Award className="h-4 w-4" />
      case 'grade':
        return <Award className="h-4 w-4" />
      case 'assignment':
      case 'submission':
        return <Upload className="h-4 w-4" />
      case 'enrollment':
        return <BookOpen className="h-4 w-4" />
      case 'course':
        return <BookOpen className="h-4 w-4" />
      case 'materi':
        return <BookMarked className="h-4 w-4" />
      case 'assessment':
        return <FileText className="h-4 w-4" />
      case 'project':
        return <FolderKanban className="h-4 w-4" />
      case 'user':
        return <UserPlus className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'quiz':
      case 'grade':
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case 'assignment':
      case 'submission':
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case 'enrollment':
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      case 'course':
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
      case 'materi':
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      case 'assessment':
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
      case 'project':
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      case 'user':
        return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getActivityLabel = (action: string) => {
    switch (action) {
      case 'completed':
        return t('Menyelesaikan')
      case 'submitted':
        return t('Mengumpulkan')
      case 'graded':
        return t('Dinilai')
      case 'enrolled':
        return t('Bergabung ke')
      case 'created':
        return t('Membuat')
      case 'new_materi':
        return t('Materi baru:')
      case 'student_enrolled':
        return t('Siswa bergabung:')
      case 'user_created':
        return t('Pengguna baru:')
      case 'course_created':
        return t('Kursus baru:')
      case 'assessment_created':
        return t('Asesmen baru:')
      case 'materi_created':
        return t('Materi baru:')
      default:
        return action
    }
  }

  // Use stable ID from API
  const getActivityId = (activity: Activity) => {
    return activity.id || `${activity.type}-${activity.item}-${activity.time}`
  }

  // Mark single activity as read
  const markAsRead = (activityId: string) => {
    const newReadSet = new Set(readActivities)
    newReadSet.add(activityId)
    saveReadActivities(newReadSet)
  }

  // Mark all activities as read
  const markAllAsRead = () => {
    const newReadSet = new Set(readActivities)
    activities.forEach((activity) => {
      newReadSet.add(getActivityId(activity))
    })
    saveReadActivities(newReadSet)
  }

  const unreadCount = activities.filter((activity) =>
    !readActivities.has(getActivityId(activity))
  ).length

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary transition-colors duration-150 group"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-150 group-hover:scale-110" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 sm:right-1 sm:top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white animate-in zoom-in-50">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[calc(100vw-1rem)] sm:w-96 max-w-[400px] p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 pb-2">
          <h3 className="font-semibold text-sm sm:text-base">{t("Aktivitas Terbaru")}</h3>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">
                {unreadCount} {t("baru")}
              </Badge>
            )}
            {activities.length > 0 && unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 sm:h-7 text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-1.5 sm:px-2"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  markAllAsRead()
                }}
              >
                <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">{t("Tandai Semua")}</span>
                <span className="xs:hidden">✓</span>
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="my-0" />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length > 0 ? (
          <ScrollArea className="h-[min(400px,60vh)]">
            <div className="p-1.5 sm:p-2">
              {activities.map((activity) => {
                const activityId = getActivityId(activity)
                const isRead = readActivities.has(activityId)

                return (
                  <div
                    key={activityId}
                    className={`mb-1.5 sm:mb-2 rounded-lg border p-2.5 sm:p-3 transition-all ${isRead
                      ? 'border-border/50 bg-muted/30 hover:bg-muted/50'
                      : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                      }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className={`rounded-full p-1.5 sm:p-2 shrink-0 ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                          <p className={`text-xs sm:text-sm leading-tight ${isRead ? 'font-normal' : 'font-medium'}`}>
                            {getActivityLabel(activity.action)}{' '}
                            <span className="font-medium">{activity.item}</span>
                          </p>
                          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                            {activity.score !== undefined && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0">
                                {activity.score}
                              </Badge>
                            )}
                            {!isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 sm:h-6 sm:w-6"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  markAsRead(activityId)
                                }}
                                title={t("Tandai telah dibaca")}
                              >
                                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {activity.course && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {activity.course}
                          </p>
                        )}
                        {activity.detail && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {activity.detail}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {formatDistanceToNow(new Date(activity.time), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{t("Belum ada aktivitas")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Aktivitas Anda akan muncul di sini")}
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
