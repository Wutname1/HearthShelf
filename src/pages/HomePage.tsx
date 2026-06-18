import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getLibraries, getPersonalized, libraryKeys } from '@/api/libraries'
import { getItemsInProgress, meKeys } from '@/api/me'
import { useAuth } from '@/hooks/useAuth'
import type { ABSLibraryItem } from '@/api/types'
import { Cover } from '@/components/common/Cover'
import { Icon } from '@/components/common/Icon'
import { BookTile } from '@/components/library/BookTile'
import { SeriesCard } from '@/components/library/SeriesCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

const SHELF_ICONS: Record<string, string> = {
  'recently-added': 'schedule',
  'recent-series': 'auto_stories',
  discover: 'explore',
  'continue-listening': 'play_circle',
  'continue-series': 'auto_stories',
}

function HeroCard({ book }: { book: ABSLibraryItem }) {
  const navigate = useNavigate()
  const { title, authorName, narratorName } = book.media.metadata
  return (
    <div
      style={{
        display: 'flex',
        gap: 32,
        alignItems: 'center',
        flexWrap: 'wrap',
        background: 'var(--c-high)',
        borderRadius: 20,
        padding: 28,
      }}
    >
      <Cover
        itemId={book.id}
        title={title ?? 'Untitled'}
        author={authorName || undefined}
        fs={20}
        onClick={() => navigate(`/book/${book.id}`)}
        style={{ width: 200, height: 200, borderRadius: 16, boxShadow: 'var(--shadow-lift)', cursor: 'pointer' }}
      />
      <div style={{ flex: 1, minWidth: 260 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          Jump back in
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          {title}
        </h2>
        <div style={{ color: 'var(--text-muted)', fontSize: 14.5, marginBottom: 20 }}>
          {authorName}
          {narratorName && ` · Narrated by ${narratorName}`}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => navigate(`/book/${book.id}`)}>
            <Icon name="play_arrow" fill /> Resume
          </button>
          <button className="pill" onClick={() => navigate(`/book/${book.id}`)}>
            <Icon name="info" /> Details
          </button>
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const { user, defaultLibraryId } = useAuth()

  const { data: librariesData } = useQuery({
    queryKey: libraryKeys.all,
    queryFn: getLibraries,
    staleTime: 5 * 60 * 1000,
  })
  const libraryId =
    defaultLibraryId ?? librariesData?.libraries[0]?.id ?? null

  const { data: progress } = useQuery({
    queryKey: meKeys.itemsInProgress,
    queryFn: getItemsInProgress,
    staleTime: 30 * 1000,
  })

  const {
    data: shelves,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: libraryKeys.personalized(libraryId ?? ''),
    queryFn: () => getPersonalized(libraryId!),
    enabled: libraryId !== null,
    staleTime: 2 * 60 * 1000,
  })

  const inProgress = progress?.libraryItems ?? []
  const hero = inProgress[0]

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">HearthShelf</div>
        <h1 className="title-xl">Good evening, {user?.username}</h1>
        {inProgress.length > 0 && (
          <p className="page-sub">
            {inProgress.length} {inProgress.length === 1 ? 'book' : 'books'} on the go
          </p>
        )}
      </div>

      {hero && <HeroCard book={hero} />}

      {isLoading && <LoadingSpinner className="py-12" label="Loading shelves..." />}
      {isError && (
        <ErrorState message="Could not load your shelves." onRetry={refetch} />
      )}

      {shelves
        ?.filter((sh) => sh.type === 'book' || sh.type === 'series')
        .map((sh) => (
          <div className="section" key={sh.id}>
            <div className="section-head">
              <Icon name={SHELF_ICONS[sh.id] ?? 'library_books'} />
              <h2>{sh.label}</h2>
            </div>
            {sh.type === 'book' && (
              <div className="shelf-row">
                {sh.entities.map((item) => (
                  <BookTile key={item.id} item={item} />
                ))}
              </div>
            )}
            {sh.type === 'series' && (
              <div className="series-grid">
                {sh.entities.map((s) => (
                  <SeriesCard key={s.id} series={s} />
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  )
}
