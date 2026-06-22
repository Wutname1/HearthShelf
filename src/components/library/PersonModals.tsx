import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Icon } from '@/components/common/Icon'
import { tintFor } from '@/components/common/Cover'
import { useAuthStore } from '@/store/authStore'
import type { Person } from '@/components/library/PersonCard'

interface EditProps {
  person: Person
  saving: boolean
  onSave: (patch: { name: string; description?: string }) => void
  onClose: () => void
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// Rename a person and (authors only) edit their description. Saving a name that
// matches another person in the library merges them, server-side.
export function PersonEditModal({ person, saving, onSave, onClose }: EditProps) {
  const [name, setName] = useState(person.name)
  const [description, setDescription] = useState('')
  const isAuthor = person.kind === 'author'
  const dirty = name.trim() !== '' && name !== person.name

  const token = useAuthStore((s) => s.token)
  const imgParams = token ? `?token=${encodeURIComponent(token)}` : ''
  const hasPhoto = isAuthor && Boolean(person.imagePath)

  return (
    <Modal
      title={`Edit ${isAuthor ? 'author' : 'narrator'}`}
      onClose={onClose}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!dirty || saving}
            onClick={() =>
              onSave({
                name: name.trim(),
                description: isAuthor ? description : undefined,
              })
            }
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="pe-portrait">
        {hasPhoto ? (
          <img
            className="pe-avatar"
            src={`/abs-api/api/authors/${person.id}/image${imgParams}`}
            alt={person.name}
          />
        ) : (
          <span
            className="pe-avatar pe-avatar-fallback"
            style={{ ['--cv' as string]: tintFor(person.name) }}
          >
            {initialsOf(person.name)}
          </span>
        )}
        <div className="pr-d">
          {person.count} {person.count === 1 ? 'book' : 'books'}
        </div>
      </div>

      <label className="fld-label" htmlFor="pe-name">
        Name
      </label>
      <input
        id="pe-name"
        className="fld"
        value={name}
        autoFocus
        onChange={(e) => setName(e.target.value)}
      />
      {isAuthor && (
        <>
          <label
            className="fld-label"
            htmlFor="pe-desc"
            style={{ marginTop: 14 }}
          >
            Description
          </label>
          <textarea
            id="pe-desc"
            className="fld"
            rows={4}
            placeholder={person.id ? 'Add a short bio…' : ''}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </>
      )}
      {name.trim() !== '' && name !== person.name && (
        <p className="pr-d" style={{ marginTop: 12 }}>
          If another {isAuthor ? 'author' : 'narrator'} already has this name,
          they'll be merged.
        </p>
      )}
    </Modal>
  )
}

interface DeleteProps {
  people: Person[]
  deleting: boolean
  onConfirm: () => void
  onClose: () => void
}

// Remove an author record or strip a narrator credit. In both cases the books
// and their files stay - only the credit is removed.
export function PersonDeleteModal({
  people,
  deleting,
  onConfirm,
  onClose,
}: DeleteProps) {
  const isAuthor = people[0]?.kind === 'author'
  const noun = isAuthor ? 'author' : 'narrator'
  const verb = isAuthor ? 'Delete' : 'Remove'

  return (
    <Modal
      title={`${verb} ${people.length} ${
        people.length === 1 ? noun : noun + 's'
      }`}
      onClose={onClose}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? 'Working…' : `${verb} ${people.length}`}
          </button>
        </>
      }
    >
      <div className="sso-warn" style={{ marginBottom: 14 }}>
        <Icon name="info" />
        <span>
          {isAuthor ? (
            <>
              This removes the author credit from{' '}
              {people.length === 1 ? 'their' : 'these'} books. The{' '}
              <b>books and audio files stay</b> in your library.
            </>
          ) : (
            <>
              This removes the narrator credit from{' '}
              {people.length === 1 ? 'their' : 'these'} books. The{' '}
              <b>books and audio files stay</b> in your library.
            </>
          )}
        </span>
      </div>
      <ul className="del-list">
        {people.map((p) => (
          <li key={p.id}>
            <span>{p.name}</span>
            <span className="pr-d">
              {p.count} {p.count === 1 ? 'book' : 'books'}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
