import { cn } from '@/lib/utils'

interface SkeletonProps extends React.ComponentProps<'div'> {
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

function Skeleton({ 
  className, 
  variant = 'shimmer',
  rounded = 'md',
  ...props 
}: SkeletonProps) {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md', 
    lg: 'rounded-[12px]',
    xl: 'rounded-[16px]',
    full: 'rounded-full'
  }

  const variantClasses = {
    default: 'bg-muted/80 animate-pulse',
    shimmer: 'bg-gradient-to-r from-muted/50 via-muted/90 to-muted/50 bg-[length:400%_100%] animate-shimmer',
    wave: 'bg-muted animate-wave',
    pulse: 'bg-muted/60 animate-pulse'
  }

  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        variantClasses[variant],
        roundedClasses[rounded],
        className
      )}
      {...props}
    />
  )
}

// Specialized skeleton components for common use cases
function SkeletonText({ 
  lines = 1, 
  className,
  ...props 
}: { lines?: number } & SkeletonProps) {
  if (lines === 1) {
    return <Skeleton className={cn('h-3.5', className)} {...props} />
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          className={cn(
            'h-3.5',
            i === lines - 1 ? 'w-2/3' : i === lines - 2 ? 'w-[85%]' : 'w-full',
            className
          )} 
          {...props} 
        />
      ))}
    </div>
  )
}

function SkeletonAvatar({ 
  size = 'md',
  className,
  ...props 
}: { size?: 'sm' | 'md' | 'lg' | 'xl' } & SkeletonProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  return (
    <Skeleton 
      rounded="full"
      className={cn(sizeClasses[size], className)} 
      {...props} 
    />
  )
}

function SkeletonButton({ 
  size = 'md',
  className,
  ...props 
}: { size?: 'sm' | 'md' | 'lg' } & SkeletonProps) {
  const sizeClasses = {
    sm: 'h-9 w-24',
    md: 'h-10 w-28',
    lg: 'h-11 w-32'
  }

  return (
    <Skeleton 
      rounded="lg"
      className={cn(sizeClasses[size], className)} 
      {...props} 
    />
  )
}

function SkeletonCard({ className, children, ...props }: SkeletonProps) {
  return (
    <div className={cn('p-4 sm:p-6 space-y-4', className)}>
      {children}
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonCard 
}
