import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCollection,
  deleteCollection,
  libraryKeys,
} from '@/api/libraries'
import { useActiveLibrary } from '@/hooks/useActiveLibrary'
import { useMediaProgress } from '@/hooks/useMediaProgress'
import { usePlayer } from '@/hooks/usePlayer'
import { formatDuration } from '@/lib/format'
import type { ABSCollection } from '@/api/types'
import { BookTile } from '@/components/library/BookTile'
import { Icon } from '@/components/common/Icon'
import { Dropdown, MItem } from '@/components/common/Dropdown'
import { tintFor } from '@/components/common/Cover'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

function CollectionDetail({ collection }: { collection: ABSCollection }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { activeId } = useActiveLibrary()
  const progressById = useMediaProgress()
  const { playItem } = usePlayer()

  const books = collection.books ?? []
  const totalH = books.reduce((s, b) => s + (b.media.duration ?? 0), 0)
  const cv = tintFor(books[0]?.media.metadata.title ?? collection.name)

  const onDelete = async () => {
    if (!window.confirm(`Delete the collection "${collection.name}"?`)) return
    await deleteCollection(collection.id)
    if (activeId)
      qc.invalidateQueries({ queryKey: libraryKeys.collections(activeId) })
    navigate('/collections')
  }

  return (
    <div className="page fade-in" style={{ ['--glow-accent' as string]: cv }}>
      <div className="crumb">
        <Link className="lnk" to="/collections">
          Collections
        </Link>
        <Icon name="chevron_right" />
        {collection.name}
      </div>

      <div className="page-head">
        <div className="eyebrow">Collection</div>
        <h1 className="title-xl">{collection.name}</h1>
        {collection.description && (
          <p className="page-sub">{collection.description}</p>
        )}
      </div>

      <div className="toolbar2">
        <span className="count-badge">
          {books.length} {books.length === 1 ? 'book' : 'books'} ·{' '}
          {formatDuration(totalH)}
        </span>
        <div className="tb-spacer" />
        {books[0] && (
          <button className="pill" onClick={() => void playItem(books[0].id)}>
            <Icon name="play_arrow" fill /> Play all
          </button>
        )}
        <Dropdown icon="more_horiz" label="">
          <MItem
            icon="delete"
            label="Delete collection"
            danger
            onClick={() => void onDelete()}
          />
        </Dropdown>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">
          <Icon name="auto_stories" />
          <h3>This collection is empty</h3>
        </div>
      ) : (
        <div className="lib-grid">
          {books.map((b) => {
            const p = progressById.get(b.id)
            return (
              <BookTile
                key={b.id}
                item={b}
                progress={p?.progress ?? 0}
                finished={p?.isFinished}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CollectionDetailPage() {
  const { collectionId } = useParams()
  const location = useLocation()
  const passed = (location.state as { collection?: ABSCollection } | null)
    ?.collection

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: libraryKeys.collection(collectionId ?? ''),
    queryFn: () => getCollection(collectionId as string),
    enabled: Boolean(collectionId) && !passed,
    staleTime: 5 * 60 * 1000,
  })

  if (passed) return <CollectionDetail collection={passed} />
  if (isLoading) {
    return (
      <div className="page">
        <LoadingSpinner className="py-12" label="Loading collection..." />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="page">
        <ErrorState message="Could not load this collection." onRetry={refetch} />
      </div>
    )
  }
  return <CollectionDetail collection={data} />
}
