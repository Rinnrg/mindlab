"use client"

import React from "react"
import { useSweetAlert } from "./sweet-alert"
import { useMobileAlert } from "./mobile-alert"
import { useIsMobile } from "@/hooks/use-mobile"

/**
 * Hook gabungan yang otomatis menggunakan MobileAlert untuk mobile 
 * dan SweetAlert untuk desktop
 */
export function useAdaptiveAlert() {
  const isMobile = useIsMobile()
  const sweetAlert = useSweetAlert()
  const mobileAlert = useMobileAlert()

  // Gunakan mobile alert jika di mobile, sweet alert jika desktop
  const activeAlert = isMobile ? mobileAlert : sweetAlert

  return {
    ...activeAlert,
    isMobile,
    // Komponen yang hanya render alert yang sesuai
    AlertComponent: React.useCallback(() => {
      if (isMobile) {
        const MobileComponent = mobileAlert.AlertComponent
        return <MobileComponent />
      } else {
        const SweetComponent = sweetAlert.AlertComponent
        return <SweetComponent />
      }
    }, [isMobile, mobileAlert.AlertComponent, sweetAlert.AlertComponent]),
  }
}
