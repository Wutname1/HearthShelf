import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { prepareAvatar, uploadAvatar, deleteAvatar, avatarKeys } from '@/api/avatars'
import { Avatar } from '@/components/common/Avatar'
import { Icon } from '@/components/common/Icon'

interface AvatarUploadProps {
  userId: string
  name: string
  size?: number
  // Called after a successful upload/clear so the parent can refresh anything
  // showing this avatar (passes the new version, or undefined when cleared).
  onChanged?: (version?: number) => void
}

// Profile-photo picker: shows the current avatar with Change / Remove controls.
// The image is resized + cropped to a square in the browser before upload, so
// the backend stays light. Used by a user on their own photo (Settings) and by
// an admin on anyone's (user edit).
export function AvatarUpload({ userId, name, size = 88, onChanged }: AvatarUploadProps) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Local version bump so the preview updates immediately after a change.
  const [version, setVersion] = useState<number | undefined>(undefined)
  const [hasPhoto, setHasPhoto] = useState(true)

  const pick = () => inputRef.current?.click()

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const blob = await prepareAvatar(file)
      const { version: v } = await uploadAvatar(userId, blob)
      setVersion(v)
      setHasPhoto(true)
      qc.invalidateQueries({ queryKey: avatarKeys.meta(userId) })
      onChanged?.(v)
    } catch {
      setError('Could not upload that image. Try a JPG, PNG, or WebP.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const clear = async () => {
    setBusy(true)
    setError(null)
    try {
      await deleteAvatar(userId)
      // Force the Avatar to drop the image by bumping to a version with no file.
      setHasPhoto(false)
      setVersion((v) => (v ?? 1) + 1)
      qc.invalidateQueries({ queryKey: avatarKeys.meta(userId) })
      onChanged?.(undefined)
    } catch {
      setError('Could not remove the photo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* key forces a remount after clear so the cached image isn't reused. */}
      <Avatar
        key={hasPhoto ? `on-${version}` : `off-${version}`}
        userId={userId}
        name={name}
        size={size}
        version={version}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-sm btn-ghost" disabled={busy} onClick={pick}>
            <Icon name="photo_camera" /> Change photo
          </button>
          <button className="btn-sm btn-ghost" disabled={busy} onClick={() => void clear()}>
            <Icon name="delete" /> Remove
          </button>
        </div>
        {error ? (
          <span style={{ fontSize: 12, color: '#e8897f' }}>{error}</span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            JPG, PNG, or WebP. Cropped to a square.
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  )
}
