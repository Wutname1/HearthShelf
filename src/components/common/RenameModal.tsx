import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Icon } from '@/components/common/Icon'

interface RenameModalProps {
  title: string
  label?: string
  initialName: string
  initialDescription?: string
  withDescription?: boolean
  onSave: (patch: { name: string; description?: string }) => Promise<void> | void
  onClose: () => void
}

// A small edit overlay for renaming (and optionally re-describing) a record -
// collections, playlists, and similar single-field edits.
export function RenameModal({
  title,
  label = 'Name',
  initialName,
  initialDescription = '',
  withDescription = true,
  onSave,
  onClose,
}: RenameModalProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        ...(withDescription ? { description } : {}),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const foot = (
    <>
      <div style={{ flex: 1 }} />
      <button className="btn-sm btn-ghost" onClick={onClose}>
        Cancel
      </button>
      <button
        className="btn-sm btn-green"
        disabled={saving || !name.trim()}
        onClick={() => void save()}
      >
        <Icon name="save" /> Save
      </button>
    </>
  )

  return (
    <Modal title={title} onClose={onClose} foot={foot}>
      <label className="fld-label">{label}</label>
      <input
        className="fld"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !withDescription) void save()
        }}
      />
      {withDescription && (
        <>
          <label className="fld-label" style={{ marginTop: 14 }}>
            Description
          </label>
          <textarea
            className="fld"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </>
      )}
    </Modal>
  )
}
