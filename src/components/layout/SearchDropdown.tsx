import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchLibrary } from '@/api/libraries'
import { useActiveLibrary } from '@/hooks/useActiveLibrary'
import { Cover, tintFor } from '@/components/common/Cover'
import { Icon } from '@/components/common/Icon'

const PER_TYPE = 4

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (
      (parts[0].match(/[A-Za-z]/)?.[0] ?? '') +
      (parts[parts.length - 1].match(/[A-Za-z]/)?.[0] ?? '')
    ).toUpperCase()
  }
  return (name.match(/[A-Za-z]/g) ?? []).slice(0, 2).join('').toUpperCase()
}

export function SearchDropdown() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { active, activeId } = useActiveLibrary()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Press "/" anywhere to jump to search, unless already typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Clear the search box whenever we leave the search results page so the
  // query doesn't linger after navigating to a book, author, or other route.
  useEffect(() => {
    if (pathname !== '/search') {
      setQ('')
      setOpen(false)
    }
  }, [pathname])

  const term = q.trim()

  const { data, isLoading } = useQuery({
    queryKey: ['search-live', activeId, term],
    queryFn: () => searchLibrary(activeId as string, term),
    enabled: open && activeId !== null && term.length >= 2,
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  const submit = (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (term) go(`/search?q=${encodeURIComponent(term)}`)
  }

  const books = (data?.book ?? []).slice(0, PER_TYPE)
  const series = (data?.series ?? []).slice(0, PER_TYPE)
  const authors = (data?.authors ?? []).slice(0, PER_TYPE)
  const narrators = (data?.narrators ?? []).slice(0, PER_TYPE)
  const hasResults =
    books.length > 0 ||
    series.length > 0 ||
    authors.length > 0 ||
    narrators.length > 0

  const showPanel = open && term.length >= 2

  return (
    <div className="ab-searchwrap" ref={rootRef}>
      <form className="ab-search" onSubmit={submit}>
        <span
          onClick={() => submit()}
          style={{ display: 'grid', placeItems: 'center', cursor: 'pointer' }}
        >
          <Icon name="search" />
        </span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={`Search ${active?.name ?? 'library'}…`}
          aria-label="Search"
        />
        <kbd>/</kbd>
      </form>

      {showPanel && (
        <div className="search-pop">
          {isLoading && (
            <div className="sp-status">Searching…</div>
          )}

          {data && !hasResults && !isLoading && (
            <div className="sp-status">No results for "{term}"</div>
          )}

          {books.length > 0 && (
            <div className="sp-group">
              <div className="sp-label">Books</div>
              {books.map(({ libraryItem }) => {
                const m = libraryItem.media.metadata
                return (
                  <button
                    key={libraryItem.id}
                    className="sp-row"
                    onClick={() => go(`/book/${libraryItem.id}`)}
                  >
                    <Cover
                      itemId={libraryItem.id}
                      title={m.title ?? 'Untitled'}
                      fs={5}
                      className="sp-cover"
                    />
                    <span className="sp-meta">
                      <span className="sp-title">{m.title ?? 'Untitled'}</span>
                      {m.authorName && (
                        <span className="sp-sub">{m.authorName}</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {series.length > 0 && (
            <div className="sp-group">
              <div className="sp-label">Series</div>
              {series.map((s) => (
                <button
                  key={s.series.id}
                  className="sp-row"
                  onClick={() => go(`/series/${s.series.id}`)}
                >
                  <span className="sp-ico" data-cv={tintFor(s.series.name)}>
                    <Icon name="format_list_numbered" />
                  </span>
                  <span className="sp-meta">
                    <span className="sp-title">{s.series.name}</span>
                    <span className="sp-sub">
                      {s.books.length}{' '}
                      {s.books.length === 1 ? 'book' : 'books'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {authors.length > 0 && (
            <div className="sp-group">
              <div className="sp-label">Authors</div>
              {authors.map((a) => (
                <button
                  key={a.id}
                  className="sp-row"
                  onClick={() => go(`/author/${a.id}`)}
                >
                  <span
                    className="sp-av"
                    style={{
                      background: `linear-gradient(150deg, ${tintFor(a.name)}, color-mix(in oklab, ${tintFor(a.name)} 45%, #000))`,
                    }}
                  >
                    {initialsOf(a.name)}
                  </span>
                  <span className="sp-meta">
                    <span className="sp-title">{a.name}</span>
                    <span className="sp-sub">
                      {a.numBooks} {a.numBooks === 1 ? 'book' : 'books'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {narrators.length > 0 && (
            <div className="sp-group">
              <div className="sp-label">Narrators</div>
              {narrators.map((n) => (
                <button
                  key={n.name}
                  className="sp-row"
                  onClick={() =>
                    go(`/search?q=${encodeURIComponent(n.name)}`)
                  }
                >
                  <span className="sp-ico">
                    <Icon name="mic" fill />
                  </span>
                  <span className="sp-meta">
                    <span className="sp-title">{n.name}</span>
                    <span className="sp-sub">
                      {n.numBooks} {n.numBooks === 1 ? 'book' : 'books'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {hasResults && (
            <button className="sp-more" onClick={() => submit()}>
              More results for "{term}"
              <Icon name="arrow_forward" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
