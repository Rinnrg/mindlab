'use client'

import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        /* iOS mobile alert backdrop */
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'fixed inset-0 z-50',
        'bg-black/50 backdrop-blur-[20px] backdrop-saturate-[180%]',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
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
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-center', className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <>
      {/* Button separator line like mobile alert */}
      <div className="h-[0.33px] -mx-4 sm:-mx-6 bg-[rgba(60,60,67,0.36)]" />
      <div
        data-slot="alert-dialog-footer"
        className={cn(
          'flex gap-0', // No gap between buttons like mobile alert
          className,
        )}
        {...props}
      />
    </>
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-[17px] font-semibold text-black dark:text-white leading-tight', className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-[13px] text-black/70 dark:text-white/70 leading-[18px]', className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(
        /* Mobile alert button style */
        'flex-1 h-[44px] text-[17px] font-semibold',
        'flex items-center justify-center',
        'text-[#007AFF] dark:text-[#007AFF]',
        'transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'active:scale-[0.98] active:bg-black/5 dark:active:bg-white/5',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(
        /* Mobile alert button style */
        'flex-1 h-[44px] text-[17px] font-normal',
        'flex items-center justify-center',
        'text-[#007AFF] dark:text-[#007AFF]',
        'transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'active:scale-[0.98] active:bg-black/5 dark:active:bg-white/5',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
