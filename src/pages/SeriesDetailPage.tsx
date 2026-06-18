import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getLibraries, getOneSeries, libraryKeys } from '@/api/libraries'
import { useAuth } from '@/hooks/useAuth'
import type { ABSLibraryItem, ABSSeries } from '@/api/types'
import { Cover } from '@/components/common/Cover'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

// Count-aware cover cluster: 1 solo, 2 stacked, 3 two+one, 4+ a 2x2 square
// with an optional centered 5th carrying a "+N" overflow chip.
function HeroCovers({ books }: { books: ABSLibraryItem[] }) {
  const n = books.length
  const layout = n >= 4 ? 'square' : n === 3 ? 'tri' : n === 2 ? 'duo' : 'solo'
  const cover = (b: ABSLibraryItem, fs: number) => (
    <Cover key={b.id} itemId={b.id} title={b.media.metadata.title ?? 'Untitled'} fs={fs} />
  )

  return (
    <div className={'hero-covers ' + layout}>
      {layout === 'solo' && cover(books[0], 13)}
      {layout === 'duo' && books.slice(0, 2).map((b) => cover(b, 11))}
      {layout === 'tri' && (
        <>
          <div className="hc-row">{books.slice(0, 2).map((b) => cover(b, 10))}</div>
          <div className="hc-btm">{cover(books[2], 10)}</div>
        </>
      )}
      {layout === 'square' && (
        <>
          <div className="hc-grid">{books.slice(0, 4).map((b) => cover(b, 8))}</div>
          {n >= 5 && (
            <div className="hc-center">
              <div className="hc-fifth">
                {cover(books[4], 8)}
                {n > 5 && <span className="hc-more">+{n - 5}</span>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SeriesDetail({ series }: { series: ABSSeries }) {
  const navigate = useNavigate()
  const books = series.books ?? []
  const author = books[0]?.media.metadata.authorName || ''
  const nextUp = books[0]

  return (
    <div className="page fade-in">
      <button className="pill" style={{ marginBottom: 24 }} onClick={() => navigate('/series')}>
        <Icon name="arrow_back" /> All series
      </button>

      <div className="series-hero">
        <HeroCovers books={books} />
        <div className="series-hero-meta">
          <div className="eyebrow">Series</div>
          <h1 className="title-xl">{series.name}</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 14.5, margin: '8px 0 18px' }}>
            {author && `${author} · `}
            {books.length} {books.length === 1 ? 'book' : 'books'}
          </div>
          {nextUp && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={() => navigate(`/book/${nextUp.id}`)}>
                <Icon name="play_arrow" fill /> Start · Book 1
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <Icon name="format_list_numbered" />
          <h2>In reading order</h2>
        </div>
        <div className="series-list">
          {books.map((b, i) => (
            <div className="sl-row" key={b.id} onClick={() => navigate(`/book/${b.id}`)}>
              <div className="sl-num">{i + 1}</div>
              <Cover
                itemId={b.id}
                title={b.media.metadata.title ?? 'Untitled'}
                fs={6}
                className="sl-cover"
              />
              <div className="sl-meta">
                <div className="sl-title">{b.media.metadata.title}</div>
                <div className="sl-sub">
                  {b.media.metadata.narratorName || b.media.metadata.authorName}
                </div>
              </div>
              <div className="sl-rating" />
              <button
                className="icon-btn sl-play"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/book/${b.id}`)
                }}
                aria-label="Open book"
              >
                <Icon name="play_arrow" fill />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SeriesDetailPage() {
  const { seriesId } = useParams()
  const { defaultLibraryId } = useAuth()
  const { data: librariesData } = useQuery({
    queryKey: libraryKeys.all,
    queryFn: getLibraries,
    staleTime: 5 * 60 * 1000,
  })
  const libraryId = defaultLibraryId ?? librariesData?.libraries[0]?.id ?? null

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['series-detail', libraryId, seriesId],
    queryFn: () => getOneSeries(libraryId!, seriesId!),
    enabled: libraryId !== null && Boolean(seriesId),
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="page">
        <LoadingSpinner className="py-12" label="Loading series..." />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="page">
        <ErrorState message="Could not load this series." onRetry={refetch} />
      </div>
    )
  }
  return <SeriesDetail series={data} />
}
