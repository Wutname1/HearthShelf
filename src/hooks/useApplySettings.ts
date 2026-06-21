import { useEffect } from 'react'
import { useSettingsStore, onColor, EMBER } from '@/store/settingsStore'
import { usePlayerStore } from '@/store/playerStore'
import { tintFor } from '@/components/common/Cover'

// Applies the appearance settings to the document root. Ported from the design
// reference (prototype/app.jsx): the effect that sets the --accent / --glow-*
// tokens. The signature bloom derives from the now-playing book's typeset hue
// (cv); sampling real artwork is deferred, so with no session the accent falls
// back to the ember default. The former data-cv hover swap was removed - covers
// no longer glow on mouseover.
export function useApplySettings() {
  const theme = useSettingsStore((s) => s.theme)
  const accentHex = useSettingsStore((s) => s.accentHex)
  const glow = useSettingsStore((s) => s.glow)

  const nowTitle = usePlayerStore((s) => s.title)
  const nowCv = nowTitle ? tintFor(nowTitle) : null

  // Accent is a fixed, user-chosen colour (default ember). The signature glow
  // still blooms from the now-playing cover, independent of the accent.
  const effectiveAccent = accentHex || EMBER
  const glowBase = nowCv ?? effectiveAccent

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.style.setProperty('--accent', effectiveAccent)
    root.style.setProperty('--on-accent', onColor(effectiveAccent))
    root.style.setProperty('--glow-strength', String(glow))
    root.style.setProperty('--glow-accent', glowBase)
  }, [theme, glow, effectiveAccent, glowBase])
}
