import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { tintFor } from '@/components/common/Cover'
import { Cover } from '@/components/common/Cover'
import { Icon } from '@/components/common/Icon'
import { initialsOf } from '@/components/library/AuthorCard'
import type { ABSLibraryItem } from '@/api/types'

export interface Person {
  id: string
  name: string
  kind: 'author' | 'narrator'
  count: number
  imagePath?: string | null
  hours?: number
  books: ABSLibraryItem[]
}

interface PersonCardProps {
  person: Person
  selected: boolean
  anySelected: boolean
  onToggleSelect: () => void
  onOpen: () => void
  onEdit: () => void
}

// Unified author / narrator card: gradient initials avatar (or real photo for
// authors), a mic badge for narrators, up to four mini covers, and hover
// quick-actions (select / edit). Carries data-cv for the cover-glow.
export function PersonCard({
  person,
  selected,
  anySelected,
  onToggleSelect,
  onOpen,
  onEdit,
}: PersonCardProps) {
  const token = useAuthStore((s) => s.token)
  const [imgOk, setImgOk] = useState(
    person.kind === 'author' && Boolean(person.imagePath)
  )
  const cv = tintFor(person.name)
  const params = token ? `?token=${encodeURIComponent(token)}` : ''
  const covers = person.books.slice(0, 4)
  const more = person.count - covers.length

  return (
    <div
      className={'person-card' + (selected ? ' sel' : '')}
      data-cv={cv}
      onClick={() => (anySelected ? onToggleSelect() : onOpen())}
    >
      <button
        className={'pc-check' + (selected ? ' on' : '')}
        title={selected ? 'Deselect' : 'Select'}
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect()
        }}
      >
        <Icon name="check" />
      </button>
      <div className="pc-actions">
        <button
          className="pc-act"
          title="Edit"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          <Icon name="edit" />
        </button>
      </div>

      <div className="pc-top">
        <div
          className="pc-av"
          style={{
            background: `linear-gradient(150deg, ${cv}, color-mix(in oklab, ${cv} 45%, #000))`,
            overflow: 'hidden',
          }}
        >
          {imgOk ? (
            <img
              src={`/abs-api/api/authors/${person.id}/image${params}`}
              alt={person.name}
              onError={() => setImgOk(false)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            initialsOf(person.name)
          )}
          {person.kind === 'narrator' && (
            <span className="pc-mic">
              <Icon name="mic" />
            </span>
          )}
        </div>
        <div className="pc-info">
          <div className="pc-name">{person.name}</div>
          <div className="pc-role">
            {person.kind === 'author' ? 'Author' : 'Narrator'}
          </div>
          <div className="pc-meta">
            {person.count} {person.count === 1 ? 'book' : 'books'}
            {person.kind === 'author' && person.hours
              ? ` · ${person.hours}h`
              : ''}
          </div>
        </div>
      </div>

      <div className="pc-covers">
        {covers.length === 0 ? (
          <span className="pc-empty">No titles in library</span>
        ) : (
          <>
            {covers.map((b) => (
              <Cover
                key={b.id}
                className="pc-cover"
                itemId={b.id}
                title={b.media.metadata.title ?? ''}
                author={b.media.metadata.authorName}
                fs={4}
              />
            ))}
            {more > 0 && <span className="pc-cover-more">+{more}</span>}
          </>
        )}
      </div>
    </div>
  )
}
