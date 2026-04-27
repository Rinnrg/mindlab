import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle, Loader2 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import "./mobile-alert.css"

type AlertType = "success" | "error" | "warning" | "info" | "question"

interface MobileAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type?: AlertType
  title?: string
  subtitle?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  showCancelButton?: boolean
  isLoading?: boolean
}

const alertConfig: Record<AlertType, { icon: React.ElementType; color: string }> = {
  success: {
    icon: CheckCircle2,
    color: "text-green-600",
  },
  error: {
    icon: XCircle,
    color: "text-red-600",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
  },
  question: {
    icon: HelpCircle,
    color: "text-blue-600",
  },
}

export function MobileAlert({
  open,
  onOpenChange,
  type = "info",
  title,
  subtitle,
  message,
  confirmText = "OK",
  cancelText = "Batal",
  onConfirm,
  onCancel,
  showCancelButton = false,
  isLoading = false,
}: MobileAlertProps) {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(false)
  const [shouldRender, setShouldRender] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Handle animasi masuk dan keluar
  React.useEffect(() => {
    if (open && mounted) {
      setShouldRender(true)
      // Delay sedikit untuk memastikan DOM ready
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      // Tunggu animasi keluar selesai
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open, mounted])
  
  // Jika bukan mobile, belum mounted, atau tidak should render
  if (!isMobile || !mounted || !shouldRender) return null

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

  if (!open) return null

  const alertContent = (
    <div 
      className={cn(
        "fixed inset-0 flex items-center justify-center p-4",
        isVisible ? "mobile-alert-backdrop-enter" : "mobile-alert-backdrop-exit"
      )}
      style={{
        backgroundColor: isVisible ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0)",
        backdropFilter: isVisible ? "blur(20px) saturate(180%)" : "blur(0px)",
        zIndex: 99999,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
      />

      {/* Alert wrapper dengan liquid drop animation */}
      <div
        className={cn(
          "relative w-full max-w-[270px] rounded-[13px] overflow-hidden z-10",
          "mobile-alert-glass",
          isVisible ? "mobile-alert-enter" : "mobile-alert-exit"
        )}
        style={{
          background: "rgba(248, 248, 248, 0.8)",
          border: "0.5px solid rgba(0, 0, 0, 0.04)",
          boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.05), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 5px rgba(0, 0, 0, 0.1)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Content area */}
        <div className="px-4 py-5 text-center">
          {/* Alert header */}
          {title && (
            <h3 className="text-[17px] font-semibold text-black leading-tight mb-1">
              {title}
            </h3>
          )}

          {/* Alert subtitle */}
          {subtitle && (
            <p className="text-[13px] text-black/70 leading-[18px] mb-1">
              {subtitle}
            </p>
          )}

          {/* Alert message */}
          {message && (
            <p className="text-[13px] text-black/70 leading-[18px]">
              {message}
            </p>
          )}
        </div>

        {/* Button separator line */}
        <div 
          className="h-[0.33px]" 
          style={{ backgroundColor: "rgba(60, 60, 67, 0.36)" }} 
        />

        {/* Alert buttons */}
        <div className={cn(
          "flex",
          showCancelButton ? "" : ""
        )}>
          {/* Cancel button */}
          {showCancelButton && (
            <>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className={cn(
                  "mobile-alert-button",
                  "flex-1 h-[44px] text-[17px] font-normal",
                  "flex items-center justify-center",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                style={{ color: "#007AFF" }}
              >
                {cancelText}
              </button>
              {/* Vertical divider */}
              <div 
                className="w-[0.33px] h-[44px]" 
                style={{ backgroundColor: "rgba(60, 60, 67, 0.36)" }} 
              />
            </>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "mobile-alert-button",
              showCancelButton ? "flex-1" : "w-full",
              "h-[44px] text-[17px] font-semibold flex items-center justify-center gap-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{
              color: type === "error" ? "#FF3B30" : 
                     type === "warning" ? "#FF9500" : 
                     type === "success" ? "#34C759" : "#007AFF"
            }}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )

  // Use portal to render at document.body level
  return createPortal(alertContent, document.body)
}

// Hook untuk menggunakan MobileAlert secara programatik
interface MobileAlertState {
  open: boolean
  type: AlertType
  title?: string
  subtitle?: string
  message?: string
  confirmText?: string
  cancelText?: string
  showCancelButton?: boolean
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

const initialState: MobileAlertState = {
  open: false,
  type: "info",
  title: undefined,
  subtitle: undefined,
  message: undefined,
  confirmText: "OK",
  cancelText: "Batal",
  showCancelButton: false,
  onConfirm: undefined,
  onCancel: undefined,
}

export function useMobileAlert() {
  const [state, setState] = React.useState<MobileAlertState>(initialState)
  const [isLoading, setIsLoading] = React.useState(false)
  const isMobile = useIsMobile()

  const showAlert = React.useCallback(
    (options: Omit<MobileAlertState, "open">) => {
      // Selalu set state, biarkan komponen yang handle kondisi mobile
      setState({ ...options, open: true })
    },
    []
  )

  const hideAlert = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
    setIsLoading(false)
  }, [])

  const success = React.useCallback(
    (title: string, message?: string) => {
      showAlert({ type: "success", title, message })
    },
    [showAlert]
  )

  const error = React.useCallback(
    (title: string, message?: string) => {
      showAlert({ type: "error", title, message })
    },
    [showAlert]
  )

  const warning = React.useCallback(
    (title: string, message?: string) => {
      showAlert({ type: "warning", title, message })
    },
    [showAlert]
  )

  const info = React.useCallback(
    (title: string, message?: string) => {
      showAlert({ type: "info", title, message })
    },
    [showAlert]
  )

  const confirm = React.useCallback(
    (
      title: string,
      options?: {
        message?: string
        subtitle?: string
        confirmText?: string
        cancelText?: string
        onConfirm?: () => void | Promise<void>
        onCancel?: () => void
        type?: AlertType
      }
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        showAlert({
          type: options?.type || "question",
          title,
          subtitle: options?.subtitle,
          message: options?.message,
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
    [showAlert]
  )

  const hideAlertRef = React.useRef(hideAlert)
  hideAlertRef.current = hideAlert
  
  const stateRef = React.useRef({ state, isLoading })
  stateRef.current = { state, isLoading }

  const AlertComponent = React.useCallback(
    () => {
      const { state, isLoading } = stateRef.current
      return (
        <MobileAlert
          open={state.open}
          onOpenChange={(open) => {
            if (!open) hideAlertRef.current()
          }}
          type={state.type}
          title={state.title}
          subtitle={state.subtitle}
          message={state.message}
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
    isMobile,
  }
}