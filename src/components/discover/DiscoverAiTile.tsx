import { Icon } from '@/components/common/Icon'
import { BookTile } from '@/components/library/BookTile'
import type { ABSLibraryItem } from '@/api/types'
import type { DiscoverFeedbackEntry, DiscoverVote } from '@/api/discover'

interface DiscoverAiTileProps {
  item: ABSLibraryItem
  reason?: string
  progress?: number
  finished?: boolean
  feedback?: DiscoverFeedbackEntry
  onVote: (itemKey: string, vote: DiscoverVote | null) => void
  onRate: (itemKey: string, rating: number | null) => void
  onNotInterested: (itemKey: string) => void
}

// An AI-shelf tile: the standard BookTile plus a compact feedback bar (thumb
// up/down, 1-5 stars, not-interested) that drives next month's generation.
export function DiscoverAiTile({
  item,
  reason,
  progress,
  finished,
  feedback,
  onVote,
  onRate,
  onNotInterested,
}: DiscoverAiTileProps) {
  const fb = feedback ?? {}
  const rating = fb.rating ?? 0
  const toggle = (v: DiscoverVote) => onVote(item.id, fb.vote === v ? null : v)

  return (
    <div className="disc-ai-tile">
      <BookTile item={item} progress={progress ?? 0} finished={finished} />
      {reason && <p className="disc-ai-why">{reason}</p>}
      <div className="disc-fb">
        <button
          className={'qg-vote' + (fb.vote === 'like' ? ' up' : '')}
          title="Like"
          onClick={() => toggle('like')}
          type="button"
        >
          <Icon name="thumb_up" fill={fb.vote === 'like'} />
        </button>
        <button
          className={'qg-vote' + (fb.vote === 'dislike' ? ' down' : '')}
          title="Dislike"
          onClick={() => toggle('dislike')}
          type="button"
        >
          <Icon name="thumb_down" fill={fb.vote === 'dislike'} />
        </button>
        <div className="disc-stars" role="radiogroup" aria-label="Rate">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={'disc-star' + (n <= rating ? ' on' : '')}
              title={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => onRate(item.id, rating === n ? null : n)}
            >
              <Icon name="star" fill={n <= rating} />
            </button>
          ))}
        </div>
        <button
          className="disc-not"
          title="Not interested - hide and stop suggesting"
          onClick={() => onNotInterested(item.id)}
          type="button"
        >
          <Icon name="block" /> Not for me
        </button>
      </div>
    </div>
  )
}
