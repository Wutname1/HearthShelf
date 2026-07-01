import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCollections,
  getPlaylists,
  addBookToCollection,
  addBooksToCollection,
  createCollection,
  addItemToPlaylist,
  addBooksToPlaylist,
  createPlaylist,
  libraryKeys,
} from '@/api/libraries'
import { Modal } from '@/components/common/Modal'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

type Tab = 'collection' | 'playlist'

interface AddToListModalProps {
  // A single book, or many (batch). Exactly one is supplied by callers.
  libraryItemId?: string
  libraryItemIds?: string[]
  libraryId: string
  // Which tab opens first (defaults to collection).
  initialTab?: Tab
  onClose: () => void
  onToast?: (msg: string) => void
}

// Add a book (or a batch of books) to an existing collection/playlist, or create
// a new one containing them. Endpoints/payloads verified against ABS 2.35.1.
export function AddToListModal({
  libraryItemId,
  libraryItemIds,
  libraryId,
  initialTab = 'collection',
  onClose,
  onToast,
}: AddToListModalProps) {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  // Normalise to a list; batch when >1, single-item endpoints otherwise.
  const ids = libraryItemIds ?? (libraryItemId ? [libraryItemId] : [])
  const many = ids.length > 1
  const countLabel = many ? `${ids.length} books` : ''

  const { data: collections, isLoading: cLoading } = useQuery({
    queryKey: libraryKeys.collections(libraryId),
    queryFn: () => getCollections(libraryId),
    staleTime: 2 * 60 * 1000,
  })
  const { data: playlists, isLoading: pLoading } = useQuery({
    queryKey: libraryKeys.playlists(libraryId),
    queryFn: () => getPlaylists(libraryId),
    staleTime: 2 * 60 * 1000,
  })

  const finish = (msg: string) => {
    onToast?.(msg)
    onClose()
  }

  const addedMsg = (name: string) =>
    many ? `Added ${ids.length} books to ${name}` : `Added to ${name}`

  const addToCollection = async (id: string, name: string) => {
    if (!ids.length) return
    setBusy(true)
    try {
      if (many) await addBooksToCollection(id, ids)
      else await addBookToCollection(id, ids[0])
      qc.invalidateQueries({ queryKey: libraryKeys.collections(libraryId) })
      finish(addedMsg(name))
    } finally {
      setBusy(false)
    }
  }
  const addToPlaylist = async (id: string, name: string) => {
    if (!ids.length) return
    setBusy(true)
    try {
      if (many) await addBooksToPlaylist(id, ids)
      else await addItemToPlaylist(id, ids[0])
      qc.invalidateQueries({ queryKey: libraryKeys.playlists(libraryId) })
      finish(addedMsg(name))
    } finally {
      setBusy(false)
    }
  }
  const createNew = async () => {
    const name = newName.trim()
    if (!name || !ids.length) return
    setBusy(true)
    try {
      if (tab === 'collection') {
        await createCollection(libraryId, name, ids)
        qc.invalidateQueries({ queryKey: libraryKeys.collections(libraryId) })
      } else {
        await createPlaylist(
          libraryId,
          name,
          ids.map((libraryItemId) => ({ libraryItemId })),
        )
        qc.invalidateQueries({ queryKey: libraryKeys.playlists(libraryId) })
      }
      finish(`Created ${name}`)
    } finally {
      setBusy(false)
    }
  }

  const lists =
    tab === 'collection'
      ? (collections?.results ?? []).map((c) => ({ id: c.id, name: c.name }))
      : (playlists?.results ?? []).map((p) => ({ id: p.id, name: p.name }))
  const loading = tab === 'collection' ? cLoading : pLoading

  return (
    <Modal
      title={many ? `Add ${countLabel} to list` : 'Add to list'}
      onClose={onClose}
      tabs={['collection', 'playlist']}
      tab={tab}
      setTab={(t) => setTab(t as Tab)}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          className="fld"
          placeholder={`New ${tab} name…`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void createNew()
          }}
        />
        <button
          className="btn-sm btn-accent"
          style={{ flex: 'none' }}
          disabled={busy || !newName.trim()}
          onClick={() => void createNew()}
        >
          <Icon name="add" /> Create
        </button>
      </div>

      {loading ? (
        <LoadingSpinner className="py-8" label="Loading..." />
      ) : lists.length === 0 ? (
        <div className="pop-empty">No {tab}s yet. Create one above.</div>
      ) : (
        <div className="pop-scroll" style={{ maxHeight: 320 }}>
          {lists.map((l) => (
            <button
              key={l.id}
              className="list-row"
              disabled={busy}
              onClick={() =>
                tab === 'collection'
                  ? void addToCollection(l.id, l.name)
                  : void addToPlaylist(l.id, l.name)
              }
            >
              <span className="lr-ico">
                <Icon name={tab === 'collection' ? 'folder_special' : 'queue_music'} />
              </span>
              <span className="lr-t">{l.name}</span>
              <span className="lr-check">
                <Icon name="add" />
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
