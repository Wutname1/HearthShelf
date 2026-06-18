import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { PlayerBar } from '@/components/player/PlayerBar'
import { AudioEngine } from '@/components/player/AudioEngine'

// Persistent app frame (design: .app grid + cover-glow bloom). The PlayerBar
// sits outside the routed Outlet so it stays mounted across navigation -
// playback never interrupts on route change.
export function AppShell() {
  return (
    <div className="app">
      <div className="app-glow" />
      <Sidebar />
      <div className="content">
        <Outlet />
      </div>
      <PlayerBar />
      <AudioEngine />
    </div>
  )
}
