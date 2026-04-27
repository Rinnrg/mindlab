"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageCircle,
  Send,
  Reply,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  GraduationCap,
  User as UserIcon,
  Lock,
} from "lucide-react"

interface ForumUser {
  id: string
  nama: string
  foto?: string
  role: string
}

interface BalasanForum {
  id: string
  pesan: string
  createdAt: string
  user: ForumUser
}

interface ForumDiskusi {
  id: string
  pesan: string
  createdAt: string
  user: ForumUser
  balasan: BalasanForum[]
  _count: { balasan: number }
}

interface ForumDiskusiAsesmenProps {
  asesmenId: string
  userId: string
  userRole: string
  userName: string
  userFoto?: string
  hasCompleted: boolean // Siswa sudah selesai mengerjakan?
  isTeacherOrAdmin: boolean
}

export function ForumDiskusiAsesmen({
  asesmenId,
  userId,
  userRole,
  userName,
  userFoto,
  hasCompleted,
  isTeacherOrAdmin,
}: ForumDiskusiAsesmenProps) {
  const [discussions, setDiscussions] = useState<ForumDiskusi[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [expandedDiscussions, setExpandedDiscussions] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)

  // Allow students to participate (including multiple replies) as long as they're enrolled.
  // Enrollment validation is enforced in the API.
  const canParticipate = true

  useEffect(() => {
    if (canParticipate) {
      fetchDiscussions()
    }
  }, [asesmenId, canParticipate])

  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus()
    }
  }, [replyingTo])

  const fetchDiscussions = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/asesmen/${asesmenId}/forum?userId=${userId}&userRole=${userRole}`
      )
      if (res.ok) {
        const data = await res.json()
        setDiscussions(data.discussions)
      }
    } catch (error) {
      console.error("Error fetching forum:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const res = await fetch(`/api/asesmen/${asesmenId}/forum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userRole,
          pesan: newMessage.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setDiscussions((prev) => [data.discussion, ...prev])
        setNewMessage("")
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleSendReply = async (forumId: string) => {
    if (!replyMessage.trim() || sendingReply) return

    try {
      setSendingReply(true)
      const res = await fetch(`/api/asesmen/${asesmenId}/forum/${forumId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userRole,
          pesan: replyMessage.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setDiscussions((prev) =>
          prev.map((d) =>
            d.id === forumId
              ? {
                  ...d,
                  balasan: [...d.balasan, data.reply],
                  _count: { balasan: d._count.balasan + 1 },
                }
              : d
          )
        )
        setReplyMessage("")
        setReplyingTo(null)
        // Auto expand the discussion to show the new reply
        setExpandedDiscussions((prev) => new Set([...prev, forumId]))
      }
    } catch (error) {
      console.error("Error sending reply:", error)
    } finally {
      setSendingReply(false)
    }
  }

  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!confirm("Hapus diskusi ini beserta semua balasannya?")) return

    try {
      setDeletingId(discussionId)
      const res = await fetch(
        `/api/asesmen/${asesmenId}/forum?userId=${userId}&userRole=${userRole}&discussionId=${discussionId}`,
        { method: "DELETE" }
      )

      if (res.ok) {
        setDiscussions((prev) => prev.filter((d) => d.id !== discussionId))
      }
    } catch (error) {
      console.error("Error deleting discussion:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteReply = async (forumId: string, replyId: string) => {
    if (!confirm("Hapus balasan ini?")) return

    try {
      setDeletingId(replyId)
      const res = await fetch(
        `/api/asesmen/${asesmenId}/forum/${forumId}?userId=${userId}&userRole=${userRole}&replyId=${replyId}`,
        { method: "DELETE" }
      )

      if (res.ok) {
        setDiscussions((prev) =>
          prev.map((d) =>
            d.id === forumId
              ? {
                  ...d,
                  balasan: d.balasan.filter((b) => b.id !== replyId),
                  _count: { balasan: d._count.balasan - 1 },
                }
              : d
          )
        )
      }
    } catch (error) {
      console.error("Error deleting reply:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const toggleExpand = (discussionId: string) => {
    setExpandedDiscussions((prev) => {
      const next = new Set(prev)
      if (next.has(discussionId)) {
        next.delete(discussionId)
      } else {
        next.add(discussionId)
      }
      return next
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return "Baru saja"
    if (diffMin < 60) return `${diffMin} menit lalu`
    if (diffHour < 24) return `${diffHour} jam lalu`
    if (diffDay < 7) return `${diffDay} hari lalu`

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // If student hasn't completed, show locked state
  if (!canParticipate) {
    return (
      <Card className="ios-glass-card border-border/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Forum Diskusi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg mb-2">
              Forum Terkunci
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Selesaikan asesmen ini terlebih dahulu untuk bergabung dalam forum diskusi bersama teman-teman dan guru.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="ios-glass-card border-border/30 rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Forum Diskusi
          </CardTitle>
          <Badge variant="secondary" className="rounded-lg">
            {discussions.length} Diskusi
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Discussion Input */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 mt-1 shrink-0">
              {userFoto ? (
                <AvatarImage src={userFoto} alt={userName} />
              ) : null}
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Tulis diskusi atau pertanyaan..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    handleSendMessage()
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Ctrl+Enter untuk mengirim
                </p>
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Kirim
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Discussions List */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Memuat diskusi...
            </span>
          </div>
        ) : discussions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <MessageSquarePlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base mb-1">Belum Ada Diskusi</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Jadilah yang pertama memulai diskusi tentang asesmen ini!
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-4 pr-2">
              {discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className="rounded-xl border bg-card/50 p-4 space-y-3 transition-all hover:bg-card/80"
                >
                  {/* Discussion Header */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      {discussion.user.foto ? (
                        <AvatarImage
                          src={discussion.user.foto}
                          alt={discussion.user.nama}
                        />
                      ) : null}
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(discussion.user.nama)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          {discussion.user.nama}
                        </span>
                        <Badge
                          variant={
                            discussion.user.role === "GURU"
                              ? "default"
                              : "secondary"
                          }
                          className="rounded-md text-[10px] px-1.5 py-0"
                        >
                          {discussion.user.role === "GURU" ? (
                            <GraduationCap className="mr-1 h-3 w-3" />
                          ) : (
                            <UserIcon className="mr-1 h-3 w-3" />
                          )}
                          {discussion.user.role === "GURU"
                            ? "Guru"
                            : discussion.user.role === "ADMIN"
                            ? "Admin"
                            : "Siswa"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(discussion.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm mt-1.5 whitespace-pre-wrap break-words">
                        {discussion.pesan}
                      </p>
                    </div>
                    {/* Delete button */}
                    {(discussion.user.id === userId || isTeacherOrAdmin) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteDiscussion(discussion.id)}
                        disabled={deletingId === discussion.id}
                      >
                        {deletingId === discussion.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Action bar */}
                  <div className="flex items-center gap-2 pl-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setReplyingTo(
                          replyingTo === discussion.id ? null : discussion.id
                        )
                        setReplyMessage("")
                      }}
                    >
                      <Reply className="mr-1 h-3.5 w-3.5" />
                      Balas
                    </Button>
                    {discussion._count.balasan > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => toggleExpand(discussion.id)}
                      >
                        {expandedDiscussions.has(discussion.id) ? (
                          <>
                            <ChevronUp className="mr-1 h-3.5 w-3.5" />
                            Sembunyikan {discussion._count.balasan} balasan
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-1 h-3.5 w-3.5" />
                            Lihat {discussion._count.balasan} balasan
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Replies */}
                  {expandedDiscussions.has(discussion.id) &&
                    discussion.balasan.length > 0 && (
                      <div className="ml-6 sm:ml-12 space-y-3 border-l-2 border-border/50 pl-4">
                        {discussion.balasan.map((balasan) => (
                          <div
                            key={balasan.id}
                            className="flex items-start gap-3"
                          >
                            <Avatar className="h-7 w-7 shrink-0">
                              {balasan.user.foto ? (
                                <AvatarImage
                                  src={balasan.user.foto}
                                  alt={balasan.user.nama}
                                />
                              ) : null}
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {getInitials(balasan.user.nama)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs">
                                  {balasan.user.nama}
                                </span>
                                <Badge
                                  variant={
                                    balasan.user.role === "GURU"
                                      ? "default"
                                      : "outline"
                                  }
                                  className="rounded-md text-[9px] px-1 py-0"
                                >
                                  {balasan.user.role === "GURU"
                                    ? "Guru"
                                    : balasan.user.role === "ADMIN"
                                    ? "Admin"
                                    : "Siswa"}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {formatTime(balasan.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                                {balasan.pesan}
                              </p>
                            </div>
                            {(balasan.user.id === userId ||
                              isTeacherOrAdmin) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  handleDeleteReply(discussion.id, balasan.id)
                                }
                                disabled={deletingId === balasan.id}
                              >
                                {deletingId === balasan.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Reply Input */}
                  {replyingTo === discussion.id && (
                    <div className="ml-6 sm:ml-12 flex items-start gap-2">
                      <Avatar className="h-7 w-7 mt-1 shrink-0">
                        {userFoto ? (
                          <AvatarImage src={userFoto} alt={userName} />
                        ) : null}
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          ref={replyInputRef}
                          placeholder="Tulis balasan..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          className="min-h-[60px] resize-none text-sm"
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              (e.ctrlKey || e.metaKey)
                            ) {
                              handleSendReply(discussion.id)
                            }
                          }}
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyMessage("")
                            }}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSendReply(discussion.id)}
                            disabled={!replyMessage.trim() || sendingReply}
                          >
                            {sendingReply ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="mr-1 h-3 w-3" />
                            )}
                            Balas
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
