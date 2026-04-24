"use client"

import { useState, useMemo, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  FileText,
  FolderKanban,
  GraduationCap,
  BookOpen,
  AlertCircle,
  Loader2,
} from "lucide-react"
import {
  format,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfMonth,
  endOfMonth,
  isAfter,
  addDays,
} from "date-fns"
import { id as localeId, enUS } from "date-fns/locale"
import type { DayButtonProps } from "react-day-picker"
import { AnimateIn } from "@/components/ui/animate-in"

type EventType = "assessment" | "project" | "lesson"

interface ScheduleEvent {
  id: string
  title: string
  date: Date
  type: EventType
  courseId?: string
  description?: string
  course?: string
  group?: string
  status?: string
}

export default function SchedulePage() {
  const { user } = useAuth()
  const { t, locale } = useAutoTranslate()
  const dateLocale = locale === 'id' ? localeId : enUS

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [filterType, setFilterType] = useState<"all" | EventType>("all")
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [allEvents, setAllEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch schedule events from API
  useEffect(() => {
    if (!user) return

    const fetchSchedule = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/schedule?userId=${user.id}&role=${user.role}`)
        const data = await response.json()

        if (response.ok) {
          // Convert date strings to Date objects
          const events: ScheduleEvent[] = data.schedule.map((event: any) => ({
            ...event,
            date: new Date(event.date),
            // Map API types to our event types
            type: event.type === 'assessment' ? 'assessment' : 
                  event.type === 'project' ? 'project' : 
                  'lesson' as EventType
          }))
          setAllEvents(events)
        }
      } catch (error) {
        console.error('Error fetching schedule:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [user])

  const eventTypeConfig = useMemo(
    () => ({
      assessment: {
        color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        dotColor: "bg-blue-500",
        icon: GraduationCap,
        label: t("assessment"),
      },
      project: {
        color:
          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
        dotColor: "bg-emerald-500",
        icon: FolderKanban,
        label: t("project"),
      },
      lesson: {
        color:
          "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
        dotColor: "bg-purple-500",
        icon: BookOpen,
        label: t("lesson"),
      },
    }),
    [t],
  )

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => filterType === "all" || event.type === filterType)
  }, [allEvents, filterType])

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter((event) => isSameDay(event.date, date))
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const upcomingEvents = useMemo(() => {
    const today = new Date()
    const nextWeek = addDays(today, 7)
    return filteredEvents
      .filter((event) => !isBefore(event.date, today) && isBefore(event.date, nextWeek))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [filteredEvents])

  const overdueEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return allEvents
      .filter((event) => isBefore(event.date, today) && (event.type === "assessment" || event.type === "project"))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 3)
  }, [allEvents])

  // Helper function to get event link
  const getEventLink = (event: ScheduleEvent) => {
    if (event.type === 'assessment' && event.courseId) {
      // Extract asesmenId from event.id (format: "asesmen-{id}")
      const asesmenId = event.id.replace('asesmen-', '')
      return `/courses/${event.courseId}/${asesmenId}`
    }
    if (event.type === 'project') {
      // Extract proyekId from event.id (format: "proyek-{id}")
      const proyekId = event.id.replace('proyek-', '')
      return `/projects/${proyekId}`
    }
    return null
  }

  const monthEvents = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return filteredEvents
      .filter((event) => !isBefore(event.date, start) && !isAfter(event.date, end))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [filteredEvents, currentMonth])

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) {
      return t("today")
    }
    return format(date, "EEEE, d MMMM", { locale: dateLocale })
  }

  const CustomDayButton = ({ day, modifiers, ...props }: DayButtonProps) => {
    const date = day.date
    const events = getEventsForDate(date)
    const isSelected = modifiers.selected
    const isOutside = modifiers.outside
    const isTodayDate = modifiers.today

    return (
      <button
        {...props}
        onClick={() => setSelectedDate(date)}
        className={`relative flex w-full flex-col items-center justify-center rounded-lg transition-colors aspect-square ${
          isSelected ? "bg-primary text-primary-foreground" : isTodayDate ? "bg-accent font-semibold" : "hover:bg-muted"
        } ${isOutside ? "opacity-40" : ""}`}
      >
        <span className="text-[11px] sm:text-sm leading-none">{format(date, "d")}</span>
        {events.length > 0 && (
          <div className="mt-0.5 flex gap-0.5">
            {events.slice(0, 3).map((event, i) => (
              <div
                key={i}
                className={`h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5 ${
                  isSelected ? "bg-primary-foreground" : eventTypeConfig[event.type].dotColor
                }`}
              />
            ))}
            {events.length > 3 && (
              <span
                className={`text-[8px] sm:text-[10px] ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}
              >
                +{events.length - 3}
              </span>
            )}
          </div>
        )}
      </button>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="ios-schedule-container">
      {/* iOS-style Header with Glass Morphism */}
      <AnimateIn stagger={0}>
        <div className="ios-schedule-header">
          <div className="ios-header-content">
            <div className="ios-title-section">
              <h1 className="ios-main-title">{t("schedule")}</h1>
              <p className="ios-subtitle">{t("scheduleDesc")}</p>
            </div>
            <div className="ios-header-controls">
              <div className="ios-view-toggle">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "calendar" | "list")}>
                  <TabsList className="ios-tab-list">
                    <TabsTrigger value="calendar" className="ios-tab-trigger">
                      <CalendarDays className="ios-tab-icon" />
                      <span className="ios-tab-text">{t("calendarView")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="list" className="ios-tab-trigger">
                      <FileText className="ios-tab-icon" />
                      <span className="ios-tab-text">{t("listView")}</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | EventType)}>
                <SelectTrigger className="ios-filter-select">
                  <SelectValue placeholder={t("filter")} />
                </SelectTrigger>
                <SelectContent className="ios-select-content">
                  <SelectItem value="all">{t("allEvents")}</SelectItem>
                  {(Object.entries(eventTypeConfig) as [EventType, (typeof eventTypeConfig)[EventType]][]).map(
                    ([type, config]) => (
                      <SelectItem key={type} value={type}>
                        {config.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* iOS-style Legend */}
          <div className="ios-legend-container">
            {(Object.entries(eventTypeConfig) as [EventType, (typeof eventTypeConfig)[EventType]][]).map(
              ([type, config]) => (
                <div key={type} className="ios-legend-item">
                  <div className={`ios-legend-dot ${config.dotColor}`} />
                  <span className="ios-legend-label">{config.label}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </AnimateIn>

      {/* Overdue Alert with iOS styling */}
      {overdueEvents.length > 0 && (
        <AnimateIn stagger={1}>
          <div className="ios-alert-card ios-alert-destructive">
            <div className="ios-alert-content">
              <div className="ios-alert-icon">
                <AlertCircle className="ios-alert-icon-svg" />
              </div>
              <div className="ios-alert-text">
                <p className="ios-alert-title">
                  {overdueEvents.length} {t("overdueItems")}
                </p>
                <div className="ios-alert-badges">
                  {overdueEvents.map((event) => (
                    <div key={event.id} className="ios-alert-badge">
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimateIn>
      )}

      <div className="ios-schedule-grid">
        {/* Main Content - Calendar/List */}
        <AnimateIn stagger={2} className="ios-main-content">
          <div className="ios-card ios-calendar-card">
            <div className="ios-card-header">
              <div className="ios-card-title">
                <CalendarDays className="ios-card-title-icon" />
                <span>{format(currentMonth, "MMMM yyyy", { locale: dateLocale })}</span>
              </div>
              <div className="ios-calendar-nav">
                <Button
                  variant="ghost"
                  size="icon"
                  className="ios-nav-button"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="ios-nav-icon" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ios-today-button"
                  onClick={() => {
                    setCurrentMonth(new Date())
                    setSelectedDate(new Date())
                  }}
                >
                  {t("today")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ios-nav-button"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="ios-nav-icon" />
                </Button>
              </div>
            </div>
            <div className="ios-card-content">
              {viewMode === "calendar" ? (
                <div className="ios-calendar-wrapper">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    locale={dateLocale}
                    className="ios-calendar"
                    components={{
                      DayButton: CustomDayButton,
                    }}
                  />
                </div>
              ) : (
                <div className="ios-list-view">
                  {monthEvents.length > 0 ? (
                    monthEvents.map((event) => {
                      const config = eventTypeConfig[event.type]
                      const Icon = config.icon

                      return (
                        <div key={event.id} className={`ios-event-item ${config.color}`}>
                          <div className="ios-event-icon">
                            <Icon className="ios-event-icon-svg" />
                          </div>
                          <div className="ios-event-content">
                            <div className="ios-event-header">
                              <p className="ios-event-title">{event.title}</p>
                              <div className="ios-event-date">
                                {format(event.date, "d MMM", { locale: dateLocale })}
                              </div>
                            </div>
                            {event.course && <p className="ios-event-course">{event.course}</p>}
                            {event.description && (
                              <p className="ios-event-description">{event.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="ios-empty-state">
                      <CalendarDays className="ios-empty-icon" />
                      <p className="ios-empty-text">{t("noEvents")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </AnimateIn>

        {/* Sidebar */}
        <div className="ios-sidebar">
          {viewMode === "calendar" && (
            <AnimateIn stagger={3}>
              <div className="ios-card ios-selected-day-card">
                <div className="ios-card-header-simple">
                  <h3 className="ios-card-subtitle">
                    {selectedDate ? formatDateLabel(selectedDate) : t("selectDate")}
                  </h3>
                </div>
                <div className="ios-card-content-simple">
                  {selectedDateEvents.length > 0 ? (
                    <div className="ios-selected-events">
                      {selectedDateEvents.map((event) => {
                        const config = eventTypeConfig[event.type]
                        const Icon = config.icon
                        const link = getEventLink(event)

                        const cardContent = (
                          <div className="ios-selected-event-content">
                            <Icon className="ios-selected-event-icon" />
                            <div className="ios-selected-event-text">
                              <p className="ios-selected-event-title">{event.title}</p>
                              {event.course && <p className="ios-selected-event-course">{event.course}</p>}
                              {event.description && (
                                <p className="ios-selected-event-desc">{event.description}</p>
                              )}
                            </div>
                          </div>
                        )

                        return link ? (
                          <Link 
                            key={event.id} 
                            href={link}
                            className={`ios-selected-event-link ${config.color}`}
                          >
                            {cardContent}
                          </Link>
                        ) : (
                          <div key={event.id} className={`ios-selected-event ${config.color}`}>
                            {cardContent}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="ios-no-events-text">{t("noEvents")}</p>
                  )}
                </div>
              </div>
            </AnimateIn>
          )}

          <AnimateIn stagger={4}>
            <div className="ios-card ios-upcoming-card">
              <div className="ios-card-header-simple">
                <div className="ios-card-subtitle-with-icon">
                  <Clock className="ios-subtitle-icon" />
                  <h3 className="ios-card-subtitle">{t("next7Days")}</h3>
                </div>
              </div>
              <div className="ios-card-content-simple">
                {upcomingEvents.length > 0 ? (
                  <div className="ios-upcoming-events">
                    {upcomingEvents.map((event) => {
                      const config = eventTypeConfig[event.type]
                      const Icon = config.icon
                      const link = getEventLink(event)

                      const content = (
                        <div className="ios-upcoming-event-content">
                          <div className={`ios-upcoming-event-icon ${config.color}`}>
                            <Icon className="ios-upcoming-icon-svg" />
                          </div>
                          <div className="ios-upcoming-event-text">
                            <p className="ios-upcoming-event-title">{event.title}</p>
                            <p className="ios-upcoming-event-date">
                              {format(event.date, "EEEE, d MMM", { locale: dateLocale })}
                            </p>
                          </div>
                        </div>
                      )

                      return link ? (
                        <Link
                          key={event.id}
                          href={link}
                          className="ios-upcoming-event-link"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div
                          key={event.id}
                          className="ios-upcoming-event"
                        >
                          {content}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="ios-no-events-text">{t("noUpcoming")}</p>
                )}
              </div>
            </div>
          </AnimateIn>

          <AnimateIn stagger={5}>
            <div className="ios-card ios-summary-card">
              <div className="ios-card-header-simple">
                <h3 className="ios-card-subtitle">{t("monthSummary")}</h3>
              </div>
              <div className="ios-card-content-simple">
                <div className="ios-summary-grid">
                  {(Object.entries(eventTypeConfig) as [EventType, (typeof eventTypeConfig)[EventType]][]).map(
                    ([type, config]) => {
                      const count = monthEvents.filter((e) => e.type === type).length
                      const Icon = config.icon
                      return (
                        <div
                          key={type}
                          className={`ios-summary-item ${config.color}`}
                        >
                          <Icon className="ios-summary-icon" />
                          <div className="ios-summary-text">
                            <p className="ios-summary-count">{count}</p>
                            <p className="ios-summary-label">{config.label}</p>
                          </div>
                        </div>
                      )
                    },
                  )}
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </div>
  )
}
