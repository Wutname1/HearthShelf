import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Icon } from '@/components/common/Icon'
import { tintFor } from '@/components/common/Cover'

export interface MergeItem {
  id: string
  name: string
  numBooks: number
}

interface MergeModalProps {
  kind: string
  items: MergeItem[]
  onMerge: (canonicalName: string) => Promise<void>
  onClose: () => void
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// Merge several people records into one. The user picks which record to keep as
// the primary (its name becomes canonical); the others are folded into it. ABS
// performs the merge by renaming the losers to the primary's name.
export function MergeModal({ kind, items, onMerge, onClose }: MergeModalProps) {
  const best = items.reduce((a, b) => (b.numBooks > a.numBooks ? b : a), items[0])
  const [primaryId, setPrimaryId] = useState(best?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const primary = items.find((i) => i.id === primaryId) ?? best
  const others = items.filter((i) => i.id !== primaryId)
  const totalBooks = items.reduce((s, i) => s + i.numBooks, 0)

  const doMerge = async () => {
    if (!primary?.name) return
    setBusy(true)
    setError(null)
    try {
      await onMerge(primary.name)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge failed')
      setBusy(false)
    }
  }

  return (
    <Modal
      title={`Merge ${kind}s`}
      onClose={() => !busy && onClose()}
      foot={
        <>
          <div style={{ flex: 1 }} />
          <button className="btn-sm btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn-sm btn-primary"
            onClick={() => void doMerge()}
            disabled={busy || !primary}
          >
            {busy ? 'Merging…' : `Merge ${items.length} ${kind}s`}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
        Pick the record to keep. The others fold into it and all their books move
        across.
      </p>

      <div className="merge-list">
        {items.map((it) => {
          const on = it.id === primaryId
          return (
            <button
              key={it.id}
              className={'merge-row' + (on ? ' on' : '')}
              onClick={() => setPrimaryId(it.id)}
            >
              <span
                className="merge-avatar"
                style={{ ['--cv' as string]: tintFor(it.name) }}
              >
                {initialsOf(it.name)}
              </span>
              <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span style={{ fontWeight: 600, display: 'block' }}>{it.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {it.numBooks} {it.numBooks === 1 ? 'book' : 'books'}
                </span>
              </span>
              <Icon
                name={on ? 'radio_button_checked' : 'radio_button_unchecked'}
                fill={on}
                style={{ color: on ? 'var(--accent)' : 'var(--text-faint)' }}
              />
            </button>
          )
        })}
      </div>

      {primary && (
        <div className="merge-preview">
          <Icon name="merge" />
          <span>
            Keeping <b>{primary.name}</b>
            {others.length > 0 && (
              <>
                {' '}
                · folding in {others.map((o) => o.name).join(', ')}
              </>
            )}{' '}
            · {totalBooks} {totalBooks === 1 ? 'book' : 'books'} total
          </span>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 13, color: 'var(--color-danger)', marginTop: 8 }}>{error}</p>
      )}
    </Modal>
  )
}
