"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import "./mobile-alert.css" // Import CSS for animations

type AlertType = "success" | "error" | "warning" | "info" | "question"

interface SweetAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type?: AlertType
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  showCancelButton?: boolean
  isLoading?: boolean
}

/**
 * iOS 26 Liquid Glass Alert Config
 * From tema/src/styles/components/ion-alert.scss:
 * - glass-background-overlay on .alert-wrapper
 * - border-radius: 32px
 * - scale(1.016) on :has(.ion-activated)
 * - buttons: glass-background-overlay-button, border-radius: 32px, height: 48px
 */
const alertConfig: Record<AlertType, { icon: React.ElementType; color: string; bgColor: string }> = {
  success: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100/80 dark:bg-green-900/30 backdrop-blur-[2px]",
  },
  error: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100/80 dark:bg-red-900/30 backdrop-blur-[2px]",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100/80 dark:bg-yellow-900/30 backdrop-blur-[2px]",
  },
  info: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-[2px]",
  },
  question: {
    icon: HelpCircle,
    color: "text-primary",
    bgColor: "bg-primary/10 backdrop-blur-[2px]",
  },
}

export function SweetAlert({
  open,
  onOpenChange,
  type = "info",
  title,
  description,
  confirmText = "OK",
  cancelText = "Batal",
  onConfirm,
  onCancel,
  showCancelButton = false,
  isLoading = false,
}: SweetAlertProps) {
  const config = alertConfig[type]
  const Icon = config.icon

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm()
    }
    onOpenChange(false)
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent 
        style={{
          /* Direct style override for iOS look */
          background: "rgba(248, 248, 248, 0.8)",
          border: "0.5px solid rgba(0, 0, 0, 0.04)",
          boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.05), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 5px rgba(0, 0, 0, 0.1)",
          borderRadius: "13px",
          backdropFilter: "blur(25px) saturate(180%) brightness(1.1)",
          maxWidth: "270px",
          width: "100%",
          padding: "0", /* Remove padding to match mobile alert */
        }}
        className="mx-4"
      >
        {/* Content wrapper with proper padding */}
        <div className="px-4 py-5">
          <AlertDialogHeader>
            <AlertDialogTitle 
              style={{ 
                fontSize: "17px", 
                fontWeight: "600", 
                color: "black", 
                lineHeight: "1.2", 
                marginBottom: "4px" 
              }}
            >
              {title}
            </AlertDialogTitle>
            {description && (
              <AlertDialogDescription 
                style={{ 
                  fontSize: "13px", 
                  color: "rgba(0, 0, 0, 0.7)", 
                  lineHeight: "18px" 
                }}
              >
                {description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
        </div>
        
        {/* Button separator line */}
        <div className="h-[0.33px] bg-[rgba(60,60,67,0.36)]" />
        
        <AlertDialogFooter>
          {showCancelButton && (
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 h-[44px] text-[17px] font-normal flex items-center justify-center text-[#007AFF] transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.98] active:bg-black/5 hover:bg-transparent border-0 shadow-none disabled:opacity-50 disabled:cursor-not-allowed rounded-none bg-transparent"
            >
              {cancelText}
            </Button>
          )}
          {/* Vertical separator like iOS */}
          {showCancelButton && (
            <div className="w-[0.33px] h-[44px] bg-[rgba(60,60,67,0.36)]" />
          )}
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant="ghost"
            className={cn(
              /* iOS alert button style - exactly like MobileAlert */
              showCancelButton ? 'flex-1' : 'w-full',
              'h-[44px] text-[17px] font-semibold',
              'flex items-center justify-center gap-2',
              'text-[#007AFF]',
              'transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
              'active:scale-[0.98] active:bg-black/5',
              'hover:bg-transparent border-0 shadow-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'rounded-none bg-transparent', // Remove border radius for iOS style
            )}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook untuk menggunakan SweetAlert secara programatik
interface AlertState {
  open: boolean
  type: AlertType
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  showCancelButton?: boolean
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

const initialState: AlertState = {
  open: false,
  type: "info",
  title: "",
  description: undefined,
  confirmText: "OK",
  cancelText: "Batal",
  showCancelButton: false,
  onConfirm: undefined,
  onCancel: undefined,
}

export function useSweetAlert() {
  const [state, setState] = React.useState<AlertState>(initialState)
  const [isLoading, setIsLoading] = React.useState(false)

  const showAlert = React.useCallback((options: Omit<AlertState, "open">) => {
    setState({ ...options, open: true })
  }, [])

  const hideAlert = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
    setIsLoading(false)
  }, [])

  const success = React.useCallback(
    (title: string, description?: string) => {
      showAlert({ type: "success", title, description })
    },
    [showAlert],
  )

  const error = React.useCallback(
    (title: string, description?: string) => {
      showAlert({ type: "error", title, description })
    },
    [showAlert],
  )

  const warning = React.useCallback(
    (title: string, description?: string) => {
      showAlert({ type: "warning", title, description })
    },
    [showAlert],
  )

  const info = React.useCallback(
    (title: string, description?: string) => {
      showAlert({ type: "info", title, description })
    },
    [showAlert],
  )

  const confirm = React.useCallback(
    (
      title: string,
      options?: {
        description?: string
        confirmText?: string
        cancelText?: string
        onConfirm?: () => void | Promise<void>
        onCancel?: () => void
        type?: AlertType
      },
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        showAlert({
          type: options?.type || "question",
          title,
          description: options?.description,
          confirmText: options?.confirmText || "Ya",
          cancelText: options?.cancelText || "Batal",
          showCancelButton: true,
          onConfirm: async () => {
            if (options?.onConfirm) {
              setIsLoading(true)
              await options.onConfirm()
              setIsLoading(false)
            }
            resolve(true)
          },
          onCancel: () => {
            if (options?.onCancel) {
              options.onCancel()
            }
            resolve(false)
          },
        })
      })
    },
    [showAlert],
  )

  const hideAlertRef = React.useRef(hideAlert)
  hideAlertRef.current = hideAlert
  
  const stateRef = React.useRef({ state, isLoading })
  stateRef.current = { state, isLoading }

  const AlertComponent = React.useCallback(
    () => {
      const { state, isLoading } = stateRef.current
      return (
        <SweetAlert
          open={state.open}
          onOpenChange={(open) => {
            if (!open) hideAlertRef.current()
          }}
          type={state.type}
          title={state.title}
          description={state.description}
          confirmText={state.confirmText}
          cancelText={state.cancelText}
          showCancelButton={state.showCancelButton}
          onConfirm={state.onConfirm}
          onCancel={state.onCancel}
          isLoading={isLoading}
        />
      )
    },
    []
  )

  return {
    showAlert,
    hideAlert,
    success,
    error,
    warning,
    info,
    confirm,
    AlertComponent,
    isOpen: state.open,
  }
}
