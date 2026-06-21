import { useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { AppBar } from '@/components/layout/AppBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { PlayerBar } from '@/components/player/PlayerBar'
import { AudioEngine } from '@/components/player/AudioEngine'
import { useApplySettings } from '@/hooks/useApplySettings'
import { useSettingsSync } from '@/hooks/useSettingsSync'
import { useSettingsStore } from '@/store/settingsStore'
import { useIsMobile } from '@/hooks/useMediaQuery'

// Persistent app frame (design: .app grid + cover-glow bloom). The PlayerBar
// sits outside the routed Outlet so it stays mounted across navigation -
// playback never interrupts on route change.
export function AppShell() {
  const appRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const isPlayerRoute = pathname === '/player'
  const coverStyle = useSettingsStore((s) => s.coverStyle)
  const isMobile = useIsMobile()

  useApplySettings(appRef)
  useSettingsSync()

  return (
    <div
      ref={appRef}
      className={
        'app' +
        (coverStyle === 'cards' ? ' cards' : '') +
        (isPlayerRoute ? ' player-mode' : '') +
        (isMobile ? ' has-mobile-nav' : '')
      }
    >
      <div className="app-glow" />
      <Sidebar />
      <div className="main">
        {!isPlayerRoute && !isMobile && <AppBar />}
        <div className="content">
          <Outlet />
        </div>
        {isMobile && <MobileNav />}
      </div>
      <PlayerBar />
      <AudioEngine />
    </div>
  )
}
