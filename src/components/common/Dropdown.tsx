import { useState, useEffect, type ReactNode } from 'react'
import { Icon } from '@/components/common/Icon'

interface DropdownProps {
  label: ReactNode
  icon?: string
  align?: 'left' | 'right'
  children: ReactNode
}

// Pill trigger + popover menu, closing on click-away. Right-aligned by default;
// `align="left"` left-aligns the popover. Used by toolbars and filter/sort menus.
export function Dropdown({ label, icon, align = 'right', children }: DropdownProps) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])

  return (
    <div className="menu-wrap" onClick={(e) => e.stopPropagation()}>
      <button className={'pill' + (open ? ' on' : '')} onClick={() => setOpen((o) => !o)}>
        {icon && <Icon name={icon} />} {label}
      </button>
      {open && (
        <div
          className={'menu-pop' + (align === 'left' ? ' left' : '')}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface MItemProps {
  icon?: string
  label: ReactNode
  on?: boolean
  tail?: ReactNode
  danger?: boolean
  onClick?: () => void
}

// A row inside a Dropdown menu: icon + label, optional active check, trailing
// text, or danger (red) styling.
export function MItem({ icon, label, on, tail, danger, onClick }: MItemProps) {
  return (
    <button className={'mp-item' + (on ? ' on' : '') + (danger ? ' danger' : '')} onClick={onClick}>
      {icon && <Icon name={icon} />} {label}
      {on && (
        <Icon
          name="check"
          className="mp-tail"
          style={{ marginLeft: 'auto', color: 'var(--accent)' }}
        />
      )}
      {tail && <span className="mp-tail">{tail}</span>}
    </button>
  )
}
