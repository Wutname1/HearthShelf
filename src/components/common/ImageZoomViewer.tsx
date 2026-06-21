import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/common/Icon'

interface ImageZoomViewerProps {
  src: string
  alt: string
  onClose: () => void
}

// Fullscreen, pinch-zoomable image viewer. On touch devices the scroll
// container's `touch-action: pinch-zoom` gives native two-finger zoom + pan; a
// double-tap (or click on desktop) toggles a 2.5x zoom for one-finger / mouse
// use. Rendered through a portal so it floats above the routed page and the
// persistent player bar.
export function ImageZoomViewer({ src, alt, onClose }: ImageZoomViewerProps) {
  const [open, setOpen] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  const close = () => {
    setOpen(false)
    window.setTimeout(onClose, 220)
  }

  useEffect(() => {
    const r = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(r)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div className={'zoom-scrim' + (open ? ' open' : '')} onClick={close}>
      <button className="zoom-close" onClick={close} aria-label="Close">
        <Icon name="close" />
      </button>
      <div
        className="zoom-pan"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => setZoomed((z) => !z)}
      >
        <img
          className={'zoom-img' + (zoomed ? ' zoomed' : '')}
          src={src}
          alt={alt}
          draggable={false}
        />
      </div>
    </div>,
    document.body
  )
}
