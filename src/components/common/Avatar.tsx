import { useState } from 'react'
import { avatarUrl } from '@/api/avatars'

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

// A stable accent color per name, so initials fallbacks are distinguishable and
// consistent across the app (same name -> same color).
function colorFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffff
  }
  const hue = hash % 360
  return `hsl(${hue} 42% 38%)`
}

interface AvatarProps {
  userId: string
  name: string
  size?: number
  // Bumped after an upload to cache-bust the image. Omit when unknown.
  version?: number
  className?: string
}

// A user's profile photo with a graceful initials fallback. The photo lives on
// the HearthShelf backend (GET /hs/avatars/:userId, 404 when none), so we render
// initials first and reveal the image only once it actually loads. Used wherever
// a user appears (header, user lists, leaderboard).
export function Avatar({ userId, name, size = 36, version, className }: AvatarProps) {
  // Track load state per image identity. The <img> is keyed by userId+version, so
  // when either changes React remounts it - resetting this state without an
  // effect (the keyed remount IS the reset). loadedKey holds the identity that
  // successfully loaded, so a stale success never bleeds onto a new src.
  const imgKey = `${userId}:${version ?? ''}`
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const loaded = loadedKey === imgKey

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
        overflow: 'hidden',
        position: 'relative',
        background: colorFor(name),
        color: '#fff',
        fontWeight: 700,
        fontSize: Math.round(size * 0.36),
        userSelect: 'none',
      }}
    >
      {!loaded && initials(name)}
      <img
        key={imgKey}
        src={avatarUrl(userId, version)}
        alt=""
        onLoad={() => setLoadedKey(imgKey)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
        }}
      />
    </span>
  )
}
