import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Wordmark } from '@/components/common/Wordmark'
import { Icon } from '@/components/common/Icon'

const NAV = [
  { to: '/', icon: 'home', label: 'Home', end: true },
  { to: '/library', icon: 'grid_view', label: 'Library', end: false },
  { to: '/series', icon: 'auto_stories', label: 'Series', end: false },
]

function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])

  const initial = (user?.username ?? '?').trim()[0]?.toUpperCase()

  return (
    <div className="user-wrap" onClick={(e) => e.stopPropagation()}>
      {open && (
        <div className="user-menu">
          <button>
            <Icon name="person" /> Profile
          </button>
          <button>
            <Icon name="manage_accounts" /> Account &amp; server
          </button>
          <div className="sep" />
          <button className="danger" onClick={signOut}>
            <Icon name="logout" /> Log out
          </button>
        </div>
      )}
      <button
        className={'user-chip' + (open ? ' on' : '')}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sb-avatar">{initial}</span>
        <span className="u-meta">
          <span className="u-name">{user?.username}</span>
          <span className="u-sub">{user?.type}</span>
        </span>
        <Icon name="expand_less" className="u-chev" />
      </button>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Icon name="local_fire_department" fill className="mark" />
        <Wordmark />
      </div>

      <nav className="nav">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            {({ isActive }) => (
              <>
                <Icon name={n.icon} fill={isActive} />
                {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <UserMenu />
    </aside>
  )
}
