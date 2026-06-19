import { useState, useEffect, useCallback } from 'react'

// Minimal transient toast: one message at a time, auto-dismiss after 2.2s.
export function useToast() {
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(id)
  }, [toast])

  const show = useCallback((msg: string) => setToast(msg), [])
  return { toast, show }
}
