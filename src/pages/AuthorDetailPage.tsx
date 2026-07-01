import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { WatchAuthorButton } from '@/components/requests/WatchButton'
import { getAuthor } from '@/api/libraries'
import { useAuthStore } from '@/store/authStore'
import { useMediaProgress } from '@/hooks/useMediaProgress'
import { usePlayer } from '@/hooks/usePlayer'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { formatDuration } from '@/lib/format'
import { tintFor } from '@/components/common/Cover'
import { initialsOf } from '@/components/library/AuthorCard'
import { BookTile } from '@/components/library/BookTile'
import { SectionHead } from '@/components/common/SectionHead'
import { Icon } from '@/components/common/Icon'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

export function AuthorDetailPage() {
  const { authorId } = useParams()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const progressById = useMediaProgress()
  const { playItem } = usePlayer()
  const isMobile = useIsMobile()
  const [imgOk, setImgOk] = useState(true)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['author', authorId],
    queryFn: () => getAuthor(authorId as string),
    enabled: Boolean(authorId),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="page">
        <LoadingSpinner className="py-12" label="Loading author..." />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="page">
        <ErrorState message="Could not load this author." onRetry={refetch} />
      </div>
    )
  }

  const books = data.libraryItems ?? []
  const totalH = books.reduce((s, b) => s + (b.media.duration ?? 0), 0)
  const finished = books.filter((b) => progressById.get(b.id)?.isFinished).length
  const cv = tintFor(data.name)
  const params = token ? `?token=${encodeURIComponent(token)}` : ''
  const hasImg = imgOk && Boolean(data.imagePath)

  const avatar = (
    <div
      className="author-av"
      style={{
        background: `linear-gradient(150deg, ${cv}, color-mix(in oklab, ${cv} 45%, #000))`,
      }}
    >
      {hasImg ? (
        <img
          className="author-photo"
          src={`/abs-api/api/authors/${data.id}/image${params}`}
          alt={data.name}
          onError={() => setImgOk(false)}
        />
      ) : (
        initialsOf(data.name)
      )}
    </div>
  )

  const startListening = () => {
    const target = books.find((b) => !progressById.get(b.id)?.isFinished) ?? books[0]
    if (target) void playItem(target.id)
  }

  const bookGrid = (
    <div className={'lib-grid' + (isMobile ? ' compact' : '')}>
      {books.map((b) => {
        const p = progressById.get(b.id)
        return (
          <BookTile
            key={b.id}
            item={b}
            progress={p?.progress ?? 0}
            finished={p?.isFinished}
            compact={isMobile}
          />
        )
      })}
    </div>
  )

  if (isMobile) {
    return (
      <div className="page fade-in" style={{ ['--glow-accent' as string]: cv }}>
        <button className="pill" style={{ marginBottom: 14 }} onClick={() => navigate('/authors')}>
          <Icon name="arrow_back" /> Authors
        </button>
        <div className="author-hero mob">
          <div className="ah-row">
            {avatar}
            <div className="ah-id">
              <div className="eyebrow">Author</div>
              <h1 className="author-mtitle">{data.name}</h1>
              <div className="ah-meta">
                {books.length} {books.length === 1 ? 'book' : 'books'} · {formatDuration(totalH)} ·{' '}
                {finished} finished
              </div>
            </div>
          </div>
          {data.description && <p className="author-mbio">{data.description}</p>}
          <div className="ah-actions">
            {books[0] && (
              <button className="btn btn-primary ah-cta" onClick={startListening}>
                <Icon name="play_arrow" fill /> Listen
              </button>
            )}
            <WatchAuthorButton asin={data.asin} name={data.name} />
          </div>
        </div>
        <div className="section">
          <SectionHead icon="auto_stories" title={`Books · ${books.length}`} />
          {bookGrid}
        </div>
      </div>
    )
  }

  return (
    <div className="page fade-in" style={{ ['--glow-accent' as string]: cv }}>
      <div className="crumb">
        <Link className="lnk" to="/authors">
          Authors
        </Link>
        <Icon name="chevron_right" />
        {data.name}
      </div>

      <div className="author-hero">
        {avatar}
        <div>
          <div className="eyebrow">Author</div>
          <h1>{data.name}</h1>
          <div className="page-sub" style={{ marginTop: 6 }}>
            {books.length} {books.length === 1 ? 'book' : 'books'} · {formatDuration(totalH)} total
          </div>
          {data.description && <p className="bio">{data.description}</p>}
          <div style={{ marginTop: 12 }}>
            <WatchAuthorButton asin={data.asin} name={data.name} />
          </div>
        </div>
      </div>

      <div className="section">
        <SectionHead icon="auto_stories" title="Books" />
        {bookGrid}
      </div>
    </div>
  )
}
