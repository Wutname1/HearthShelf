import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getLibraries, libraryKeys } from '@/api/libraries'
import { scanLibrary, updateLibrary, deleteLibrary } from '@/api/admin'
import { libraryIcon } from '@/hooks/useActiveLibrary'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

export function ConfigLibraries() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: libraryKeys.all,
    queryFn: getLibraries,
    staleTime: 5 * 60 * 1000,
  })

  const libraries = data?.libraries ?? []

  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [scanning, setScanning] = useState<string | null>(null)

  const deleteTarget = libraries.find((l) => l.id === deleteId)

  const scan = async (id: string) => {
    setScanning(id)
    try {
      await scanLibrary(id)
    } finally {
      setScanning(null)
    }
  }

  const saveEdit = async () => {
    if (!editId || !editName.trim()) return
    await updateLibrary(editId, { name: editName.trim() })
    qc.invalidateQueries({ queryKey: libraryKeys.all })
    setEditId(null)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    await deleteLibrary(deleteId)
    qc.invalidateQueries({ queryKey: libraryKeys.all })
  }

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1 className="title-xl">Libraries</h1>
        {data && <p className="page-sub">{libraries.length} libraries</p>}
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" label="Loading libraries..." />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {libraries.map((l) => (
                <tr key={l.id}>
                  <td>
                    {editId === l.id ? (
                      <input
                        className="fld"
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void saveEdit()
                          if (e.key === 'Escape') setEditId(null)
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 10,
                          fontWeight: 600,
                        }}
                      >
                        <Icon name={libraryIcon(l)} style={{ color: 'var(--accent)' }} />
                        {l.name}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {l.mediaType === 'podcast' ? 'Podcasts' : 'Audiobooks'}
                  </td>
                  <td>
                    <div className="t-actions">
                      {editId === l.id ? (
                        <>
                          <button
                            className="tbl-icon"
                            title="Save"
                            onClick={() => void saveEdit()}
                          >
                            <Icon name="check" />
                          </button>
                          <button
                            className="tbl-icon"
                            title="Cancel"
                            onClick={() => setEditId(null)}
                          >
                            <Icon name="close" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="tbl-icon"
                            title="Scan library"
                            disabled={scanning === l.id}
                            onClick={() => void scan(l.id)}
                          >
                            <Icon name={scanning === l.id ? 'hourglass_empty' : 'sync'} />
                          </button>
                          <button
                            className="tbl-icon"
                            title="Rename"
                            onClick={() => {
                              setEditId(l.id)
                              setEditName(l.name)
                            }}
                          >
                            <Icon name="edit" />
                          </button>
                          <button
                            className="tbl-icon"
                            title="Delete library"
                            onClick={() => setDeleteId(l.id)}
                          >
                            <Icon name="delete" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete library?"
          message={`"${deleteTarget.name}" will be removed from AudiobookShelf. Your audio files on disk are not deleted.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => void confirmDelete()}
          onClose={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
