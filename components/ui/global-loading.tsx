'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Loader2, Sparkles } from 'lucide-react'

interface GlobalLoadingProps {
  isLoading: boolean
  message?: string
  className?: string
  variant?: 'default' | 'minimal' | 'gradient'
}

export function GlobalLoading({
  isLoading,
  message = "Loading...",
  className,
  variant = 'default'
}: GlobalLoadingProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isLoading) return null

  const loadingContent = (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      {/* Loading content container with variants */}
      {variant === 'minimal' ? (
        <MinimalLoadingContent message={message} />
      ) : variant === 'gradient' ? (
        <GradientLoadingContent message={message} />
      ) : (
        <DefaultLoadingContent message={message} />
      )}
    </div>
  );

  return createPortal(loadingContent, document.body);
}

// Default glass-morphism loading
function DefaultLoadingContent({ message }: { message: string }) {
  return (
    <div
      className={cn(
        // Enhanced glass-morphism with iOS 26 aesthetic
        'bg-white/90 dark:bg-neutral-900/90',
        'backdrop-blur-[24px] backdrop-saturate-[200%]',
        // Sophisticated shadows with depth
        'shadow-[inset_0_0_12px_0_rgba(220,220,220,0.3),0_12px_48px_-8px_rgba(0,0,0,0.15),0_0_20px_0_rgba(220,220,220,0.4)]',
        'dark:shadow-[inset_0_0_12px_0_rgba(40,40,40,0.4),0_12px_48px_-8px_rgba(0,0,0,0.7),0_0_20px_0_rgba(0,0,0,0.3)]',
        // Refined borders for realism
        'border-[0.5px] border-white/80 dark:border-white/10',
        // Layout and responsive design
        'rounded-3xl px-8 py-6 mx-4',
        'flex flex-col items-center gap-4 min-w-[160px] max-w-[320px]',
        // Performance optimization
        'transform-gpu will-change-auto',
        'animate-in zoom-in-95 fade-in-0 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
      )}
    >
      {/* Enhanced multi-layered spinner */}
      <div className="relative">
        {/* Ambient glow ring */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary/30 to-blue-500/30 blur-lg animate-pulse" />
        
        {/* Outer orbit ring */}
        <div className="absolute -inset-1 rounded-full border-2 border-primary/20 animate-spin [animation-duration:3s]" />
        
        {/* Main spinner with gradient */}
        <div className="relative">
          <Loader2 className="relative size-8 animate-spin text-primary [animation-duration:1s]" />
          
          {/* Dynamic highlight dots */}
          <div className="absolute top-0 left-1/2 w-1 h-1 bg-gradient-to-r from-primary to-blue-500 rounded-full transform -translate-x-1/2 animate-spin [animation-duration:1.5s]" />
          <div className="absolute top-1/2 right-0 w-0.5 h-0.5 bg-primary/70 rounded-full animate-pulse [animation-delay:0.3s]" />
        </div>
      </div>
      
      {/* Loading message with typing effect */}
      {message && (
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground/90 animate-in slide-in-from-bottom-2 duration-700 delay-200">
            {message}
          </p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
            <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
            <div className="w-1 h-1 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}
    </div>
  )
}

// Minimal loading variant
function MinimalLoadingContent({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-4">
      <div className="relative">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
      {message && (
        <p className="text-sm text-foreground/80 font-medium">
          {message}
        </p>
      )}
    </div>
  )
}

// Gradient loading variant
function GradientLoadingContent({ message }: { message: string }) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-primary/10 to-blue-500/10',
        'backdrop-blur-xl border border-white/20',
        'rounded-2xl px-6 py-5 mx-4',
        'flex flex-col items-center gap-4 min-w-[140px]',
        'animate-in zoom-in-95 fade-in-0 duration-400'
      )}
    >
      <div className="relative">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-500 rounded-full opacity-20 blur-md animate-pulse" />
        
        {/* Icon with sparkles */}
        <div className="relative flex items-center justify-center">
          <Sparkles className="size-8 text-primary animate-pulse" />
          <div className="absolute inset-0 animate-spin [animation-duration:3s]">
            <Loader2 className="size-8 text-primary/50" />
          </div>
        </div>
      </div>
      
      {message && (
        <p className="text-sm font-medium text-foreground/90 text-center">
          {message}
        </p>
      )}
    </div>
  )
}

// Hook untuk global loading state
export function useGlobalLoading() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string>()

  const showLoading = React.useCallback((loadingMessage?: string) => {
    setMessage(loadingMessage)
    setIsLoading(true)
  }, [])

  const hideLoading = React.useCallback(() => {
    setIsLoading(false)
    setMessage(undefined)
  }, [])

  const LoadingComponent = React.useCallback(() => (
    <GlobalLoading isLoading={isLoading} message={message} />
  ), [isLoading, message])

  return {
    isLoading,
    showLoading,
    hideLoading,
    LoadingComponent
  }
}
