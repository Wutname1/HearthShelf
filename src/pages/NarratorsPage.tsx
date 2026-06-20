import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNarrators,
  getAllLibraryItems,
  libraryKeys,
} from '@/api/libraries'
import { renameNarrator } from '@/api/admin'
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

type NarratorSort = 'Name' | 'Books'

export function NarratorsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast, show } = useToast()
  const { activeId } = useActiveLibrary()
  const [sort, setSort] = useState<NarratorSort>('Books')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [merging, setMerging] = useState(false)
  const [editing, setEditing] = useState<Person | null>(null)
  const [deleting, setDeleting] = useState<Person[] | null>(null)
  const [busy, setBusy] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['narrators', activeId],
    queryFn: () => getNarrators(activeId as string),
    enabled: activeId !== null,
    staleTime: 5 * 60 * 1000,
  })

  const { data: itemsData } = useQuery({
    queryKey: libraryKeys.allItems(activeId ?? ''),
    queryFn: () => getAllLibraryItems(activeId as string),
    enabled: activeId !== null,
    staleTime: 5 * 60 * 1000,
  })

  const byNarrator = useMemo(() => {
    const map = new Map<string, ABSLibraryItem[]>()
    for (const it of itemsData?.results ?? []) {
      const raw = it.media.metadata.narratorName
      if (!raw) continue
      for (const n of raw.split(',').map((s) => s.trim())) {
        if (!n) continue
        const arr = map.get(n) ?? []
        arr.push(it as ABSLibraryItem)
        map.set(n, arr)
      }
    }
    return map
  }, [itemsData])

  const people: Person[] = useMemo(() => {
    const list = [...(data?.narrators ?? [])]
    list.sort(
      sort === 'Name'
        ? (a, b) => a.name.localeCompare(b.name)
        : (a, b) => b.numBooks - a.numBooks
    )
    return list.map((n) => ({
      id: n.id,
      name: n.name,
      kind: 'narrator' as const,
      count: n.numBooks,
      books: byNarrator.get(n.name) ?? [],
    }))
  }, [data, sort, byNarrator])

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
    qc.invalidateQueries({ queryKey: ['narrators', activeId] })

  const doMerge = async (canonicalName: string) => {
    if (!activeId) return
    for (const item of selectedItems) {
      if (item.name === canonicalName) continue
      await renameNarrator(activeId, item.name, canonicalName)
    }
    await invalidate()
    setSelected(new Set())
  }

  const doSave = async (patch: { name: string }) => {
    if (!editing || !activeId) return
    setBusy(true)
    try {
      await renameNarrator(activeId, editing.name, patch.name)
      await invalidate()
      show('Narrator saved')
      setEditing(null)
    } catch {
      show('Could not save narrator')
    } finally {
      setBusy(false)
    }
  }

  // Narrators are item string fields, not records - "removing" one rewrites the
  // credit to "Unknown" across their books.
  const doDelete = async () => {
    if (!deleting || !activeId) return
    setBusy(true)
    try {
      for (const p of deleting) await renameNarrator(activeId, p.name, 'Unknown')
      await invalidate()
      show(
        deleting.length === 1
          ? 'Narrator removed'
          : `${deleting.length} narrators removed`
      )
      setSelected(new Set())
      setDeleting(null)
    } catch {
      show('Could not remove narrator')
    } finally {
      setBusy(false)
    }
  }

  const anySelected = selected.size > 0

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">The voices</div>
        <h1 className="title-xl">Narrators</h1>
      </div>

      {isLoading && <LoadingSpinner className="py-12" label="Loading narrators..." />}
      {isError && (
        <ErrorState message="Could not load narrators." onRetry={refetch} />
      )}

      {data && (
        <>
          <div className={'toolbar2' + (anySelected ? ' sel-bar' : '')}>
            <span className="count-badge">{people.length} narrators</span>
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
                <Icon name="delete" /> Remove {selected.size}
              </button>
            )}
            {anySelected && (
              <button className="btn-sm btn-ghost" onClick={() => setSelected(new Set())}>
                Clear
              </button>
            )}
            <Dropdown icon="swap_vert" label={`Sort: ${sort}`} align="left">
              <div className="mp-label">Sort by</div>
              {(['Name', 'Books'] as NarratorSort[]).map((s) => (
                <MItem key={s} label={s} on={s === sort} onClick={() => setSort(s)} />
              ))}
            </Dropdown>
          </div>

          {people.length === 0 ? (
            <div className="empty-state">
              <Icon name="mic" />
              <h3>No narrators found</h3>
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
                  onOpen={() =>
                    navigate(`/library?narrator=${encodeURIComponent(p.name)}`)
                  }
                  onEdit={() => setEditing(p)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {merging && (
        <MergeModal
          kind="narrator"
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
