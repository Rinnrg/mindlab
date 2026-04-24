import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    /* Liquid Glass: rounded-[25px] pill from ion-button --border-radius: 24px + glass-background */
    "rounded-[25px]",
    /* Transition from tema ion-button.scss: transform + color with 140ms ease-out */
    "transition-[transform,background,box-shadow,opacity,filter,color] duration-[140ms]",
    "ease-[cubic-bezier(0.32,0.72,0,1)]",
    /* Activated scale from ion-button.scss $scaleup-default = 1.25, we use subtle 1.06 for web */
    "active:scale-[1.06]",
    /* GPU compositing from api.scss glass-background mixin: translateZ(0) + backface-visibility */
    "transform-gpu backface-hidden",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          /* Liquid Glass filled — primary with glass refraction from api.scss */
          "bg-primary text-primary-foreground",
          /* Shadow from glass-background mixin: inset glow + outer bloom */
          "shadow-[inset_0_0_8px_0_rgba(255,255,255,0.18),0_0_10px_0_rgba(0,0,0,0.08)]",
          /* Border from api.scss: asymmetric glass refraction */
          "border border-white/30 dark:border-white/10",
          /* Glass filter from api.scss: blur($blur) saturate($saturate) */
          "backdrop-blur-[2px] backdrop-saturate-[360%]",
          /* Hover: opacity 0.72 from ion-button.scss :not(.ion-activated):hover */
          "hover:brightness-110 hover:shadow-[inset_0_0_8px_0_rgba(255,255,255,0.25),0_0_14px_0_rgba(0,0,0,0.12)]",
          /* Activated: compressed shadow from glass-background-button-activated */
          "active:shadow-[inset_0_0_8px_0_rgba(220,220,220,0.2),0_0_8px_-4px_rgba(220,220,220,0.92)]",
        ].join(" "),
        destructive: [
          "bg-destructive text-white",
          "shadow-[inset_0_0_8px_0_rgba(255,255,255,0.12),0_0_10px_0_rgba(220,38,38,0.2)]",
          "border border-white/20 dark:border-white/10",
          "backdrop-blur-[2px] backdrop-saturate-[360%]",
          "hover:brightness-110",
          "active:shadow-[inset_0_0_8px_0_rgba(220,220,220,0.2),0_0_8px_-4px_rgba(220,38,38,0.6)]",
          "focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        ].join(" "),
        outline: [
          /* Glass outline — from ion-button fill:default ::part(native) glass-background */
          "bg-white/72 dark:bg-white/8",
          "backdrop-blur-[2px] backdrop-saturate-[360%]",
          /* Shadow from api.scss glass-background */
          "shadow-[inset_0_0_8px_0_rgba(220,220,220,0.2),0_0_10px_0_rgba(220,220,220,0.5)]",
          "dark:shadow-[inset_0_0_8px_0_rgba(60,60,60,0.35),0_0_10px_0_rgba(0,0,0,0.5)]",
          /* Asymmetric border from api.scss */
          "border-[0.5px] border-white/80 dark:border-white/15",
          "text-foreground",
          /* Hover: opacity 0.72 from ion-button :not(.ion-activated):hover */
          "hover:bg-white/85 dark:hover:bg-white/12 hover:border-primary/30",
          "active:shadow-[inset_0_0_8px_0_rgba(220,220,220,0.2),0_0_8px_-4px_rgba(220,220,220,0.92)]",
        ].join(" "),
        secondary: [
          /* Adaptive Layering — glass-background-overlay-button from api.scss */
          "bg-secondary/80 text-secondary-foreground",
          "backdrop-blur-[1px] backdrop-saturate-[200%]",
          "shadow-[inset_0_0_4px_0_rgba(220,220,220,0.15),0_0_6px_0_rgba(220,220,220,0.3)]",
          "dark:shadow-[inset_0_0_4px_0_rgba(60,60,60,0.2),0_0_6px_0_rgba(0,0,0,0.3)]",
          "border-[0.5px] border-white/60 dark:border-white/10",
          "hover:bg-primary/10 hover:text-primary",
        ].join(" "),
        ghost: [
          /* Ghost — from glass-background-overlay-button: transition background 0.2s ease */
          "hover:bg-white/50 dark:hover:bg-white/8",
          "hover:backdrop-blur-[1px] hover:backdrop-saturate-[200%]",
          "hover:shadow-[inset_0_0_4px_0_rgba(220,220,220,0.1)]",
          "hover:text-accent-foreground",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3 sm:h-10 sm:px-4",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5 sm:h-9 sm:px-3",
        lg: "h-10 px-6 has-[>svg]:px-4 sm:h-11 sm:px-6",
        /* Touch-friendly mobile sizes like mobile alert */
        mobile: "h-[44px] px-4 py-2 text-[17px] font-medium sm:h-10 sm:px-4 sm:text-sm sm:font-medium",
        icon: "size-9 sm:size-10",
        "icon-sm": "size-8 sm:size-9",
        "icon-lg": "size-10 sm:size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
