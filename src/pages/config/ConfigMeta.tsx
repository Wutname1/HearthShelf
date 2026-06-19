import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAllTags,
  getAllGenres,
  renameTag,
  deleteTag,
  renameGenre,
  deleteGenre,
} from '@/api/admin'
import { Icon } from '@/components/common/Icon'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Modal } from '@/components/common/Modal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

type Kind = 'tags' | 'genres'

export function ConfigMeta() {
  const qc = useQueryClient()
  const [kind, setKind] = useState<Kind>('genres')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ['admin', 'tags'],
    queryFn: getAllTags,
    staleTime: 60 * 1000,
  })
  const { data: genres, isLoading: genresLoading } = useQuery({
    queryKey: ['admin', 'genres'],
    queryFn: getAllGenres,
    staleTime: 60 * 1000,
  })

  const items = (kind === 'tags' ? tags?.tags : genres?.genres) ?? []
  const loading = kind === 'tags' ? tagsLoading : genresLoading

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['admin', kind] })

  const doRename = async () => {
    if (!renaming || !renameVal.trim()) return
    const v = renameVal.trim()
    if (kind === 'tags') await renameTag(renaming, v)
    else await renameGenre(renaming, v)
    setRenaming(null)
    invalidate()
  }
  const doDelete = async (value: string) => {
    if (kind === 'tags') await deleteTag(value)
    else await deleteGenre(value)
    invalidate()
  }

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1 className="title-xl">Metadata Utils</h1>
      </div>

      <div className="toolbar2">
        <div className="seg">
          {(['genres', 'tags'] as Kind[]).map((k) => (
            <button
              key={k}
              className={kind === k ? 'on' : ''}
              onClick={() => setKind(k)}
            >
              {k === 'genres' ? 'Genres' : 'Tags'}
            </button>
          ))}
        </div>
        <span className="count-badge">
          {items.length} {kind}
        </span>
      </div>

      {loading ? (
        <LoadingSpinner className="py-12" label={`Loading ${kind}...`} />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{kind === 'tags' ? 'Tag' : 'Genre'}</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it}>
                  <td style={{ fontWeight: 600 }}>{it}</td>
                  <td>
                    <div className="t-actions">
                      <button
                        className="tbl-icon"
                        title="Rename"
                        onClick={() => {
                          setRenaming(it)
                          setRenameVal(it)
                        }}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        className="tbl-icon"
                        title="Delete"
                        onClick={() => setPendingDelete(it)}
                      >
                        <Icon name="delete" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {renaming && (
        <Modal
          title={`Rename ${kind === 'tags' ? 'tag' : 'genre'}`}
          onClose={() => setRenaming(null)}
          foot={
            <>
              <div style={{ flex: 1 }} />
              <button className="btn-sm btn-ghost" onClick={() => setRenaming(null)}>
                Cancel
              </button>
              <button className="btn-sm btn-green" onClick={() => void doRename()}>
                Rename
              </button>
            </>
          }
        >
          <div className="field full">
            <label>New name</label>
            <input
              className="fld"
              autoFocus
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
            />
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Renaming updates every item using "{renaming}".
          </p>
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete ${kind === 'tags' ? 'tag' : 'genre'}`}
          message={`Remove "${pendingDelete}" from every item that uses it? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => void doDelete(pendingDelete)}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </>
  )
}
