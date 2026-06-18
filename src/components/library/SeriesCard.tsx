import { useNavigate } from 'react-router-dom'
import type { ABSSeries } from '@/api/types'
import { Cover } from '@/components/common/Cover'

interface SeriesCardProps {
  series: ABSSeries
}

export function SeriesCard({ series }: SeriesCardProps) {
  const navigate = useNavigate()
  const books = series.books ?? []
  const shown = books.slice(0, 4)
  const extra = books.length - shown.length
  const author = books[0]?.media.metadata.authorName || ''

  return (
    <div className="series-card" onClick={() => navigate(`/series/${series.id}`)}>
      <div className="series-stack">
        {shown.map((b) => (
          <Cover
            key={b.id}
            itemId={b.id}
            title={b.media.metadata.title ?? 'Untitled'}
            fs={7}
          />
        ))}
        {extra > 0 && <div className="stack-more sm">+{extra}</div>}
      </div>
      <div className="series-meta">
        <h3>{series.name}</h3>
        <p>
          {author && `${author} · `}
          {books.length} {books.length === 1 ? 'book' : 'books'}
        </p>
      </div>
    </div>
  )
}
