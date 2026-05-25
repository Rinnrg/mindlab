import { useCallback, useEffect, useMemo, useRef } from 'react'

export interface LongPressOptions {
  /** milliseconds */
  thresholdMs?: number
  /** prevent default touch behavior while pressing */
  preventDefault?: boolean
}

/**
 * Detects a long-press gesture (mouse + touch) and triggers onLongPress.
 *
 * Usage:
 * const bind = useLongPress({ onLongPress: () => setOpen(true) })
 * <Button {...bind} />
 */
export function useLongPress({
  onLongPress,
  onClick,
  thresholdMs = 600,
  preventDefault = true,
}: {
  onLongPress: () => void
  onClick?: () => void
  thresholdMs?: number
  preventDefault?: boolean
}) {
  const timerRef = useRef<number | null>(null)
  const longPressedRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(
    (e: any) => {
      longPressedRef.current = false
      if (preventDefault && e?.cancelable) e.preventDefault()
      clear()
      timerRef.current = window.setTimeout(() => {
        longPressedRef.current = true
        onLongPress()
      }, thresholdMs)
    },
    [clear, onLongPress, preventDefault, thresholdMs]
  )

  const end = useCallback(
    (e: any) => {
      if (preventDefault && e?.cancelable) e.preventDefault()
      const wasLongPressed = longPressedRef.current
      clear()
      if (!wasLongPressed && onClick) onClick()
    },
    [clear, onClick, preventDefault]
  )

  // Cleanup on unmount
  useEffect(() => () => clear(), [clear])

  const bind = useMemo(
    () => ({
      onMouseDown: start,
      onMouseUp: end,
      onMouseLeave: end,
      onTouchStart: start,
      onTouchEnd: end,
      onTouchCancel: end,
      onContextMenu: (e: any) => {
        // avoid context menu on long press (mobile)
        if (preventDefault) e.preventDefault()
      },
    }),
    [end, preventDefault, start]
  )

  return bind
}
