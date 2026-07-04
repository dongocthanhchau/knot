"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type FocusModeContextType = {
  focusMode: boolean
  setFocusMode: (v: boolean) => void
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined)

const STORAGE_KEY = "knot-focus-mode"

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [focusMode, setFocusMode] = useState<boolean>(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setFocusMode(stored === "true")
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      sessionStorage.setItem(STORAGE_KEY, String(focusMode))
    }
  }, [focusMode, hydrated])

  return (
    <FocusModeContext.Provider value={{ focusMode, setFocusMode }}>
      {children}
    </FocusModeContext.Provider>
  )
}

export function useFocusMode(): FocusModeContextType {
  const context = useContext(FocusModeContext)
  if (context === undefined) {
    throw new Error("useFocusMode must be used within a FocusModeProvider")
  }
  return context
}
