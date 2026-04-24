'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  const contentRef = React.useRef<HTMLDivElement>(null)

  // iOS 26 Control Center blob entrance — Web Animations API
  React.useEffect(() => {
    const el = contentRef.current
    if (!el) return

    // Blob morph: starts as small compressed blob, expands with elastic overshoot
    el.animate([
      {
        transform: 'scale(0.4, 0.3)',
        borderRadius: '28px',
        opacity: 0,
        filter: 'blur(8px)',
        offset: 0,
      },
      {
        transform: 'scale(1.06, 1.08)',
        borderRadius: '18px',
        opacity: 1,
        filter: 'blur(0px)',
        offset: 0.55,
      },
      {
        transform: 'scale(0.98, 0.99)',
        borderRadius: '15px',
        opacity: 1,
        filter: 'blur(0px)',
        offset: 0.78,
      },
      {
        transform: 'scale(1, 1)',
        borderRadius: '16px',
        opacity: 1,
        filter: 'blur(0px)',
        offset: 1,
      },
    ], {
      duration: 420,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      fill: 'forwards',
    })
  }, [])

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={contentRef}
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          /* Liquid Glass dropdown — Control Center glass panel */
          'bg-popover/80 dark:bg-popover/75 text-popover-foreground',
          'backdrop-blur-[24px] backdrop-saturate-[280%]',
          /* Asymmetric glass borders from tema api.scss */
          'border-[0.5px] border-white/70 dark:border-white/12',
          /* Water-glass shadow */
          'shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.4),inset_0_0_6px_0_rgba(255,255,255,0.06),0_4px_24px_-4px_rgba(0,0,0,0.14),0_1px_4px_0_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.03)]',
          'dark:shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.05),inset_0_0_6px_0_rgba(255,255,255,0.02),0_4px_24px_-4px_rgba(0,0,0,0.5),0_1px_4px_0_rgba(0,0,0,0.2),0_0_0_0.5px_rgba(255,255,255,0.04)]',
          'rounded-2xl p-1.5',
          /* Close animation — CSS fallback for exit (blob can't animate exit via WAAPI easily) */
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          'data-[state=closed]:zoom-out-[0.85]',
          'data-[state=closed]:duration-[200ms] data-[state=closed]:ease-[cubic-bezier(0.32,0.72,0,1)]',
          'z-50 max-h-(--radix-dropdown-menu-content-available-height)',
          /* Responsive sizing: mobile optimized like mobile alert */
          'min-w-[8rem] sm:min-w-[10rem]',
          'max-w-[270px] sm:max-w-[300px]',
          'w-auto sm:w-auto',
          'origin-(--radix-dropdown-menu-content-transform-origin)',
          'overflow-x-hidden overflow-y-auto',
          'transform-gpu backface-hidden will-change-[transform,border-radius,opacity,filter]',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        /* Liquid Glass menu item — rounded pill with fluid water transition */
        "focus:bg-accent/50 focus:text-accent-foreground",
        "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10",
        "dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive",
        "data-[variant=destructive]:*:[svg]:!text-destructive",
        "[&_svg:not([class*='text-'])]:text-muted-foreground",
        /* Responsive sizing like mobile alert */
        "relative flex cursor-default items-center gap-2 rounded-xl outline-hidden select-none",
        "px-2.5 py-2 text-sm sm:px-3 sm:py-2.5 sm:text-[15px]",
        "min-h-[44px] sm:min-h-[36px]", // Touch-friendly height on mobile
        /* Liquid blob transition — smooth morphing color/bg/scale/shadow */
        "transition-[background,color,transform,box-shadow,filter] duration-[350ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
        /* Hover: liquid glass glow — water surface refraction */
        "hover:shadow-[inset_0_0_10px_0_rgba(0,0,0,0.03),0_0_8px_0_rgba(0,0,0,0.02)]",
        "dark:hover:shadow-[inset_0_0_10px_0_rgba(255,255,255,0.04),0_0_8px_0_rgba(255,255,255,0.02)]",
        /* Active: liquid blob squish with brightness pulse */
        "active:scale-[1.03] active:brightness-[1.03]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "transform-gpu backface-hidden",
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent/50 focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xl outline-hidden select-none",
        "py-2 pr-2.5 pl-8 text-sm sm:py-2.5 sm:text-[15px]",
        "min-h-[44px] sm:min-h-[36px]", // Touch-friendly height on mobile
        "transition-[background,color,transform,box-shadow,filter] duration-[350ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
        "active:scale-[1.03] active:brightness-[1.03] transform-gpu backface-hidden",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent/50 focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xl outline-hidden select-none",
        "py-2 pr-2.5 pl-8 text-sm sm:py-2.5 sm:text-[15px]",
        "min-h-[44px] sm:min-h-[36px]", // Touch-friendly height on mobile
        "transition-[background,color,transform,box-shadow,filter] duration-[350ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
        "active:scale-[1.03] active:brightness-[1.03] transform-gpu backface-hidden",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        'px-2 py-1.5 text-sm font-medium data-[inset]:pl-8',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('bg-border/50 -mx-1.5 my-1 h-px', className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'text-muted-foreground ml-auto text-xs tracking-widest',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent/50 focus:text-accent-foreground data-[state=open]:bg-accent/40 data-[state=open]:text-accent-foreground",
        "[&_svg:not([class*='text-'])]:text-muted-foreground flex cursor-default items-center gap-2 rounded-xl px-2.5 py-2 text-sm outline-hidden select-none",
        /* Liquid blob transition — smooth morphing with settle easing */
        "transition-[background,color,transform,box-shadow,filter] duration-[350ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
        "active:scale-[1.03] active:brightness-[1.03] transform-gpu backface-hidden",
        "data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  const subRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = subRef.current
    if (!el) return
    el.animate([
      { transform: 'scale(0.4, 0.3)', borderRadius: '28px', opacity: 0, filter: 'blur(8px)', offset: 0 },
      { transform: 'scale(1.06, 1.08)', borderRadius: '18px', opacity: 1, filter: 'blur(0px)', offset: 0.55 },
      { transform: 'scale(0.98, 0.99)', borderRadius: '15px', opacity: 1, filter: 'blur(0px)', offset: 0.78 },
      { transform: 'scale(1, 1)', borderRadius: '16px', opacity: 1, filter: 'blur(0px)', offset: 1 },
    ], { duration: 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' })
  }, [])

  return (
    <DropdownMenuPrimitive.SubContent
      ref={subRef}
      data-slot="dropdown-menu-sub-content"
      className={cn(
        'bg-popover/80 dark:bg-popover/75 text-popover-foreground',
        'backdrop-blur-[24px] backdrop-saturate-[280%]',
        'border-[0.5px] border-white/70 dark:border-white/12',
        'shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.4),inset_0_0_6px_0_rgba(255,255,255,0.06),0_4px_24px_-4px_rgba(0,0,0,0.14),0_1px_4px_0_rgba(0,0,0,0.06)]',
        'dark:shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.05),inset_0_0_6px_0_rgba(255,255,255,0.02),0_4px_24px_-4px_rgba(0,0,0,0.5),0_1px_4px_0_rgba(0,0,0,0.2)]',
        /* Close animation fallback */
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.85]',
        'data-[state=closed]:duration-[200ms] data-[state=closed]:ease-[cubic-bezier(0.32,0.72,0,1)]',
        'z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-2xl p-1.5',
        'transform-gpu backface-hidden will-change-[transform,border-radius,opacity,filter]',
        className,
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
