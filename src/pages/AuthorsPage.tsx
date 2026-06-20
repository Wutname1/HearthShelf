import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAuthors,
  getAllLibraryItems,
  libraryKeys,
} from '@/api/libraries'
import { renameAuthor, updateAuthor, deleteAuthor } from '@/api/admin'
import { useActiveLibrary } from '@/hooks/useActiveLibrary'
import { useToast } from '@/hooks/useToast'
import { PersonCard, type Person } from '@/components/library/PersonCard'
import {
  PersonEditModal,
  PersonDeleteModal,
} from '@/components/library/PersonModals'
import { MergeModal, type MergeItem } from '@/components/common/MergeModal'
import { Dropdown, MItem } from '@/components/common/Dropdown'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'
import type { ABSLibraryItem } from '@/api/types'

type AuthorSort = 'Name' | 'Books' | 'Added'

export function AuthorsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast, show } = useToast()
  const { activeId } = useActiveLibrary()
  const [sort, setSort] = useState<AuthorSort>('Books')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [merging, setMerging] = useState(false)
  const [editing, setEditing] = useState<Person | null>(null)
  const [deleting, setDeleting] = useState<Person[] | null>(null)
  const [busy, setBusy] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: libraryKeys.authors(activeId ?? ''),
    queryFn: () => getAuthors(activeId as string),
    enabled: activeId !== null,
    staleTime: 5 * 60 * 1000,
  })

  // All items, indexed by author name for mini covers + total hours. One cheap
  // fetch instead of a per-card request.
  const { data: itemsData } = useQuery({
    queryKey: libraryKeys.allItems(activeId ?? ''),
    queryFn: () => getAllLibraryItems(activeId as string),
    enabled: activeId !== null,
    staleTime: 5 * 60 * 1000,
  })

  const byAuthor = useMemo(() => {
    const map = new Map<string, ABSLibraryItem[]>()
    for (const it of itemsData?.results ?? []) {
      const name = it.media.metadata.authorName
      if (!name) continue
      for (const a of name.split(',').map((s) => s.trim())) {
        if (!a) continue
        const arr = map.get(a) ?? []
        arr.push(it as ABSLibraryItem)
        map.set(a, arr)
      }
    }
    return map
  }, [itemsData])

  const people: Person[] = useMemo(() => {
    const list = [...(data?.authors ?? [])]
    if (sort === 'Name') list.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'Books') list.sort((a, b) => b.numBooks - a.numBooks)
    else list.sort((a, b) => b.addedAt - a.addedAt)
    return list.map((a) => {
      const books = byAuthor.get(a.name) ?? []
      const secs = books.reduce((t, b) => t + (b.media.duration ?? 0), 0)
      return {
        id: a.id,
        name: a.name,
        kind: 'author' as const,
        count: a.numBooks,
        imagePath: a.imagePath,
        hours: secs > 0 ? Math.round(secs / 3600) : undefined,
        books,
      }
    })
  }, [data, sort, byAuthor])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectedPeople = people.filter((p) => selected.has(p.id))
  const selectedItems: MergeItem[] = selectedPeople.map((p) => ({
    id: p.id,
    name: p.name,
    numBooks: p.count,
  }))

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: libraryKeys.authors(activeId ?? '') })

  const doMerge = async (canonicalName: string) => {
    for (const item of selectedItems) {
      if (item.name === canonicalName) continue
      await renameAuthor(item.id, canonicalName)
    }
    await invalidate()
    setSelected(new Set())
  }

  const doSave = async (patch: { name: string; description?: string }) => {
    if (!editing) return
    setBusy(true)
    try {
      await updateAuthor(editing.id, patch)
      await invalidate()
      show('Author saved')
      setEditing(null)
    } catch {
      show('Could not save author')
    } finally {
      setBusy(false)
    }
  }

  const doDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      for (const p of deleting) await deleteAuthor(p.id)
      await invalidate()
      show(
        deleting.length === 1
          ? 'Author removed'
          : `${deleting.length} authors removed`
      )
      setSelected(new Set())
      setDeleting(null)
    } catch {
      show('Could not remove author')
    } finally {
      setBusy(false)
    }
  }

  const anySelected = selected.size > 0

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">Who wrote it</div>
        <h1 className="title-xl">Authors</h1>
      </div>

      {isLoading && <LoadingSpinner className="py-12" label="Loading authors..." />}
      {isError && (
        <ErrorState message="Could not load authors." onRetry={refetch} />
      )}

      {data && (
        <>
          <div className={'toolbar2' + (anySelected ? ' sel-bar' : '')}>
            <span className="count-badge">{people.length} authors</span>
            {!anySelected && (
              <span className="text-faint" style={{ fontSize: 12.5 }}>
                Hover a card to select, edit, or merge
              </span>
            )}
            <div className="tb-spacer" />
            {selected.size === 1 && (
              <button
                className="btn-sm btn-ghost"
                onClick={() => setEditing(selectedPeople[0])}
              >
                <Icon name="edit" /> Edit
              </button>
            )}
            {selected.size >= 2 && (
              <button className="btn-sm btn-primary" onClick={() => setMerging(true)}>
                <Icon name="merge" /> Merge {selected.size}
              </button>
            )}
            {anySelected && (
              <button
                className="btn-sm btn-ghost danger"
                onClick={() => setDeleting(selectedPeople)}
              >
                <Icon name="delete" /> Delete {selected.size}
              </button>
            )}
            {anySelected && (
              <button className="btn-sm btn-ghost" onClick={() => setSelected(new Set())}>
                Clear
              </button>
            )}
            <Dropdown icon="swap_vert" label={`Sort: ${sort}`} align="left">
              <div className="mp-label">Sort by</div>
              {(['Name', 'Books', 'Added'] as AuthorSort[]).map((s) => (
                <MItem key={s} label={s} on={s === sort} onClick={() => setSort(s)} />
              ))}
            </Dropdown>
          </div>

          {people.length === 0 ? (
            <div className="empty-state">
              <Icon name="person" />
              <h3>No authors found</h3>
            </div>
          ) : (
            <div className={'person-grid' + (anySelected ? ' selecting' : '')}>
              {people.map((p) => (
                <PersonCard
                  key={p.id}
                  person={p}
                  selected={selected.has(p.id)}
                  anySelected={anySelected}
                  onToggleSelect={() => toggle(p.id)}
                  onOpen={() => navigate(`/author/${p.id}`)}
                  onEdit={() => setEditing(p)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {merging && (
        <MergeModal
          kind="author"
          items={selectedItems}
          onMerge={doMerge}
          onClose={() => setMerging(false)}
        />
      )}
      {editing && (
        <PersonEditModal
          person={editing}
          saving={busy}
          onSave={doSave}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <PersonDeleteModal
          people={deleting}
          deleting={busy}
          onConfirm={doDelete}
          onClose={() => setDeleting(null)}
        />
      )}

      {toast && (
        <div className="p-toast">
          <Icon name="check_circle" fill /> {toast}
        </div>
      )}
    </div>
  )
}
