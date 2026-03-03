"use client"

import * as React from "react"
import { useRef } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DockProps {
  className?: string
  children: React.ReactNode
  maxAdditionalSize?: number
  iconSize?: number
}

interface CustomDockIconProps {
  className?: string
  href: string
  name: string
  handleIconHover?: (e: React.MouseEvent<HTMLLIElement>) => void
  children?: React.ReactNode
  iconSize?: number
}

type ScaleValueParams = [number, number]

export const scaleValue = function (
  value: number,
  from: ScaleValueParams,
  to: ScaleValueParams
): number {
  const scale = (to[1] - to[0]) / (from[1] - from[0])
  const capped = Math.min(from[1], Math.max(from[0], value)) - from[0]
  return Math.floor(capped * scale + to[0])
}

export function CustomDockIcon({
  className,
  href,
  name,
  handleIconHover,
  children,
  iconSize,
}: CustomDockIconProps) {
  const ref = useRef<HTMLLIElement | null>(null)

  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--icon-size', `${iconSize}px`)
    }
  }, [iconSize])

  return (
    <li
      ref={ref}
      onMouseMove={handleIconHover}
      className={cn(
        "dock-icon group/li flex cursor-pointer items-center justify-center",
        "h-[var(--icon-size)] w-[var(--icon-size)]",
        "px-[calc(var(--icon-size)*0.075)]",
        "hover:-mt-[calc(var(--icon-size)/2)]",
        "hover:h-[calc(var(--icon-size)*1.5)]", 
        "hover:w-[calc(var(--icon-size)*1.5)]",
        "[&_*]:object-contain",
        className
      )}
    >
      <Link
        href={href}
        className="dock-icon-content group/a relative aspect-square w-full rounded-[10px] border border-gray-100 bg-gradient-to-t from-neutral-100 to-white p-1.5 shadow-[rgba(0,_0,_0,_0.05)_0px_1px_0px_inset] after:absolute after:inset-0 after:rounded-[inherit] after:shadow-md after:shadow-zinc-800/10 dark:border-zinc-900 dark:from-zinc-900 dark:to-zinc-800 dark:shadow-[rgba(255,_255,_255,_0.3)_0px_1px_0px_inset] transition-all duration-200 hover:scale-105"
      >
        <span className="absolute top-[-45px] left-1/2 -translate-x-1/2 rounded-md border border-gray-100 bg-gradient-to-t from-neutral-100 to-white p-1 px-2 text-xs whitespace-nowrap text-black opacity-0 transition-opacity duration-200 group-hover/li:opacity-100 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-800 dark:text-white z-50 pointer-events-none">
          {name}
        </span>
        {children}
      </Link>
    </li>
  )
}

export function CustomDock({
  className,
  children,
  maxAdditionalSize = 5,
  iconSize = 55,
}: DockProps) {
  const dockRef = useRef<HTMLDivElement | null>(null)

  const handleIconHover = (e: React.MouseEvent<HTMLLIElement>) => {
    if (!dockRef.current) return
    const mousePos = e.clientX
    const iconPosLeft = e.currentTarget.getBoundingClientRect().left
    const iconWidth = e.currentTarget.getBoundingClientRect().width

    const cursorDistance = (mousePos - iconPosLeft) / iconWidth
    const offsetPixels = scaleValue(
      cursorDistance,
      [0, 1],
      [maxAdditionalSize * -1, maxAdditionalSize]
    )

    dockRef.current.style.setProperty(
      "--dock-offset-left",
      `${offsetPixels * -1}px`
    )

    dockRef.current.style.setProperty(
      "--dock-offset-right",
      `${offsetPixels}px`
    )
  }

  return (
    <nav ref={dockRef} role="navigation" aria-label="Main Dock">
      <ul
        className={cn(
          "flex items-center rounded-xl border border-gray-100 bg-gradient-to-t from-neutral-50 to-white p-1 dark:border-zinc-900 dark:from-zinc-950 dark:to-zinc-900",
          className
        )}
      >
        {React.Children.map(children, (child) =>
          React.isValidElement<CustomDockIconProps>(child)
            ? React.cloneElement(child as React.ReactElement<CustomDockIconProps>, {
                handleIconHover,
                iconSize,
              })
            : child
        )}
      </ul>
    </nav>
  )
}
