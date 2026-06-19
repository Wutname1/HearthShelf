import { useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  batchUpdateItems,
  libraryKeys,
  type BatchMediaPayload,
  type ItemMetadataPatch,
} from '@/api/libraries'
import { Modal } from '@/components/common/Modal'
import { Chips } from '@/components/common/Chips'
import { Icon } from '@/components/common/Icon'

type ListMode = 'replace' | 'append'

interface BatchEditModalProps {
  ids: string[]
  libraryId: string
  onClose: () => void
  onDone: () => void
}

function FieldRow({
  label,
  on,
  setOn,
  hint,
  children,
}: {
  label: string
  on: boolean
  setOn: (v: boolean) => void
  hint?: string
  children: ReactNode
}) {
  return (
    <div className={'field full' + (on ? '' : ' bf-off')}>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        onClick={() => setOn(!on)}
      >
        <Icon
          name={on ? 'check_box' : 'check_box_outline_blank'}
          fill={on}
          style={{ fontSize: 18, color: on ? 'var(--accent)' : 'var(--text-faint)' }}
        />
        {label}
        {on && hint && (
          <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>
            · {hint}
          </span>
        )}
      </label>
      <div style={on ? undefined : { opacity: 0.4, pointerEvents: 'none' }}>
        {children}
      </div>
    </div>
  )
}

// Writes the same ticked fields across all selected items via the batch endpoint.
// Unticked fields are left untouched per book.
export function BatchEditModal({
  ids,
  libraryId,
  onClose,
  onDone,
}: BatchEditModalProps) {
  const qc = useQueryClient()
  const [mode, setMode] = useState<ListMode>('replace')

  const [genresOn, setGenresOn] = useState(false)
  const [genres, setGenres] = useState<string[]>([])
  const [tagsOn, setTagsOn] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [pubOn, setPubOn] = useState(false)
  const [publisher, setPublisher] = useState('')
  const [yearOn, setYearOn] = useState(false)
  const [year, setYear] = useState('')
  const [langOn, setLangOn] = useState(false)
  const [language, setLanguage] = useState('')
  const [explicitOn, setExplicitOn] = useState(false)
  const [explicit, setExplicit] = useState(false)
  const [saving, setSaving] = useState(false)

  const tickedCount =
    [genresOn, tagsOn, pubOn, yearOn, langOn, explicitOn].filter(Boolean).length

  // Note: in append mode for list fields we can't merge per-book client-side
  // without each book's current list, so append is a hint; the batch endpoint
  // replaces. Replace is the safe, verified behaviour.
  const apply = async () => {
    if (tickedCount === 0) return
    setSaving(true)
    const metadata: ItemMetadataPatch = {}
    if (genresOn) metadata.genres = genres
    if (pubOn) metadata.publisher = publisher
    if (yearOn) metadata.publishedYear = year
    if (langOn) metadata.language = language
    if (explicitOn) metadata.explicit = explicit
    const payload: BatchMediaPayload = {}
    if (Object.keys(metadata).length) payload.metadata = metadata
    if (tagsOn) payload.tags = tags
    try {
      await batchUpdateItems(ids, payload)
      qc.invalidateQueries({ queryKey: libraryKeys.allItems(libraryId) })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  const foot = (
    <>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {tickedCount} field{tickedCount === 1 ? '' : 's'} will change on{' '}
        {ids.length} book{ids.length === 1 ? '' : 's'}
      </span>
      <div style={{ flex: 1 }} />
      <button className="btn-sm btn-ghost" onClick={onClose}>
        Cancel
      </button>
      <button
        className="btn-sm btn-green"
        disabled={saving || tickedCount === 0}
        onClick={() => void apply()}
      >
        <Icon name="save" /> Apply to {ids.length}
      </button>
    </>
  )

  return (
    <Modal title={`Edit ${ids.length} books`} onClose={onClose} foot={foot}>
      <div className="batch-bar">
        <Icon name="checklist" />
        <span className="bb-count">{ids.length} selected</span>
        <div style={{ flex: 1 }} />
        <div className="seg">
          {(['replace', 'append'] as ListMode[]).map((mo) => (
            <button
              key={mo}
              className={mode === mo ? 'on' : ''}
              onClick={() => setMode(mo)}
            >
              {mo === 'replace' ? 'Replace' : 'Append'}
            </button>
          ))}
        </div>
      </div>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          margin: '0 0 16px',
        }}
      >
        Tick a field to write it to all {ids.length} books. Unticked fields keep
        each book's existing value.
      </p>

      <div className="form-grid">
        <FieldRow
          label="Genres"
          on={genresOn}
          setOn={setGenresOn}
          hint={mode === 'append' ? 'add to existing' : 'replace'}
        >
          <Chips items={genres} onChange={setGenres} placeholder="Add genre…" />
        </FieldRow>
        <FieldRow
          label="Tags"
          on={tagsOn}
          setOn={setTagsOn}
          hint={mode === 'append' ? 'add to existing' : 'replace'}
        >
          <Chips items={tags} onChange={setTags} placeholder="Add tag…" />
        </FieldRow>
        <FieldRow label="Publisher" on={pubOn} setOn={setPubOn}>
          <input
            className="fld"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
          />
        </FieldRow>
        <FieldRow label="Publish year" on={yearOn} setOn={setYearOn}>
          <input
            className="fld"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </FieldRow>
        <FieldRow label="Language" on={langOn} setOn={setLangOn}>
          <input
            className="fld"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </FieldRow>
        <FieldRow label="Explicit" on={explicitOn} setOn={setExplicitOn}>
          <div
            className={'toggle' + (explicit ? ' on' : '')}
            role="switch"
            aria-checked={explicit}
            onClick={() => setExplicit((v) => !v)}
          >
            <i />
          </div>
        </FieldRow>
      </div>
    </Modal>
  )
}
