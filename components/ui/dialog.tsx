'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        /**
         * Enhanced Liquid Glass overlay with full coverage blur using utility class
         * From tema/src/styles/components/ion-modal.scss: --backdrop-opacity: 0.2
         */
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'fixed inset-0 z-50',
        'bg-black/30 backdrop-modal',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          /**
           * Mobile alert style with liquid glass effect
           * Consistent with MobileAlert component styling
           */
          /* Mobile-first responsive background like mobile alert */
          'bg-[rgba(248,248,248,0.8)] dark:bg-[rgba(28,28,30,0.8)]',
          'backdrop-blur-[25px] backdrop-saturate-[180%] backdrop-brightness-[1.1]',
          /* Border like mobile alert */
          'border-[0.5px] border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.1)]',
          /* Shadow like mobile alert */
          'shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.05),0_2px_5px_rgba(0,0,0,0.1)]',
          'dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_1px_1px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.2),0_2px_5px_rgba(0,0,0,0.3)]',
          /* Responsive border radius like mobile alert */
          'rounded-[13px] sm:rounded-[20px]',
          'overflow-hidden',
          /* Responsive sizing like mobile alert */
          'w-full max-w-[270px] sm:max-w-[400px] md:max-w-lg',
          'mx-4 sm:mx-auto',
          /* Position and animations */
          'fixed top-[50%] left-[50%] z-50',
          'translate-x-[-50%] translate-y-[-50%]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          'transform-gpu backface-hidden',
          className,
        )}
        {...props}
      >
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "ring-offset-background focus:ring-ring",
              "data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
              "absolute top-4 right-4 rounded-full opacity-70",
              /* Transition: 140ms from default-variables.scss */
              "transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
              "hover:opacity-100 hover:scale-[1.1]",
              "focus:ring-2 focus:ring-offset-2 focus:outline-hidden",
              "disabled:pointer-events-none",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <>
      {/* Button separator line like mobile alert */}
      <div className="h-[0.33px] -mx-4 sm:-mx-6 bg-[rgba(60,60,67,0.36)]" />
      <div
        data-slot="dialog-footer"
        className={cn(
          'flex gap-0', // No gap between buttons like mobile alert
          className,
        )}
        {...props}
      />
    </>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-[17px] font-semibold text-black dark:text-white leading-tight', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-[13px] text-black/70 dark:text-white/70 leading-[18px]', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
