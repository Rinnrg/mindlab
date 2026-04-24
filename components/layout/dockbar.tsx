"use client"

import { usePathname } from "next/navigation"
import { useMemo, useState, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useAutoTranslate } from "@/lib/auto-translate-context"
import { useTransitionRouter } from "@/hooks/use-transition-router"
import { Dock, DockIcon } from "@/components/ui/dock"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LayoutDashboard, BookOpen, FolderKanban, Calendar, Code, Users } from "lucide-react"

interface DockbarProps { className?: string }

export function Dockbar({ className }: DockbarProps) {
  const pathname = usePathname()
  const router = useTransitionRouter()
  const { user } = useAuth()
  const { t } = useAutoTranslate()
  const [bouncingIndex, setBouncingIndex] = useState<number | null>(null)

  const menuItems = useMemo(() => [
    { title: t("Beranda"), href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "GURU", "SISWA"] },
    { title: t("Jadwal"), href: "/schedule", icon: Calendar, roles: ["GURU", "SISWA"] },
    { title: t("Kursus"), href: "/courses", icon: BookOpen, roles: ["GURU", "SISWA"] },
    { title: t("Masalah"), href: "/projects", icon: FolderKanban, roles: ["GURU", "SISWA"] },
    { title: t("Compiler"), href: "/compiler", icon: Code, roles: ["GURU", "SISWA"] },
    { title: t("Kelola"), href: "/users", icon: Users, roles: ["ADMIN"] },
  ], [t])

  const filteredMenu = useMemo(
    () => menuItems.filter((item) => user && item.roles.includes(user.role)),
    [menuItems, user]
  )

  const activeIndex = filteredMenu.findIndex(
    (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
  )

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, index: number, href: string) => {
    e.preventDefault()
    setBouncingIndex(index)
    setTimeout(() => setBouncingIndex(null), 800)
    router.navigate(href)
  }, [router])

  if (!user) return null

  return (
    <motion.div className={cn("fixed bottom-5 z-50", className)} style={{ left: "50%", x: "-50%" }}
      initial={{ opacity: 0, y: 60, scale: 0.85, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 200, damping: 22, mass: 0.9 }}>
      <TooltipProvider>
        <Dock direction="middle">
          {filteredMenu.map((item, index) => {
            const isActive = index === activeIndex
            const isBouncing = bouncingIndex === index
            const Icon = item.icon
            return (
              <DockIcon key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      aria-label={item.title}
                      onClick={(e) => handleClick(e, index, item.href)}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "size-12 rounded-full"
                      )}
                    >
                      <motion.div
                        animate={isBouncing ? { y: [0, -12, 0, -7, 0, -3, 0] } : { y: 0 }}
                        transition={isBouncing ? { duration: 0.7, times: [0, 0.18, 0.36, 0.5, 0.64, 0.78, 1], ease: "easeOut" } : { duration: 0.15 }}>
                        <Icon className={cn(
                          "size-6", 
                          isActive 
                            ? "text-blue-600 dark:text-blue-400" 
                            : "text-muted-foreground"
                        )} />
                      </motion.div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
            )
          })}
        </Dock>
      </TooltipProvider>
    </motion.div>
  )
}
