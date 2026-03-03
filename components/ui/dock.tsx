"use client"

import * as React from "react"
import { useRef } from "react"

import { cn } from "@/lib/utils"

interface DockProps {
  className?: string
  children: React.ReactNode
  maxAdditionalSize?: number
  iconSize?: number
}

interface DockIconProps {
  className?: string
  src?: string
  href: string
  name: string
  handleIconHover?: (e: React.MouseEvent<HTMLLIElement>) => void
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
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

export function DockIcon({
  className,
  src,
  href,
  name,
  handleIconHover,
  onClick,
  children,
  iconSize,
}: DockIconProps) {
  const ref = useRef<HTMLLIElement | null>(null)

  return (
    <li
      ref={ref}
      style={
        {
          "--icon-size": `${iconSize}px`,
        } as React.CSSProperties
      }
      onMouseMove={handleIconHover}
      className={cn(
        "dock-icon group/li flex h-[var(--icon-size)] w-[var(--icon-size)] cursor-pointer items-center justify-center px-[calc(var(--icon-size)*0.075)] hover:-mt-[calc(var(--icon-size)/2)] hover:h-[calc(var(--icon-size)*1.5)] hover:w-[calc(var(--icon-size)*1.5)] [&_img]:object-contain",
        className
      )}
    >
      <a
        href={href}
        onClick={onClick}
        className="group/a relative aspect-square w-full rounded-[10px] border-0 bg-transparent p-1.5 shadow-none"
      >
        <span className="absolute top-[-40px] left-1/2 -translate-x-1/2 rounded-md bg-black/80 text-white p-1 px-2 text-xs whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/li:opacity-100 backdrop-blur-sm">
          {name}
        </span>
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full rounded-[inherit]"
          />
        ) : (
          children
        )}
      </a>
    </li>
  )
}

export function Dock({
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
          "flex items-center rounded-xl border-0 bg-transparent p-1",
          className
        )}
      >
        {React.Children.map(children, (child) =>
          React.isValidElement<DockIconProps>(child)
            ? React.cloneElement(child as React.ReactElement<DockIconProps>, {
                handleIconHover,
                iconSize,
              })
            : child
        )}
      </ul>
    </nav>
  )
}
