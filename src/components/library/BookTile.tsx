import { useNavigate } from 'react-router-dom'
import type { ABSLibraryItem } from '@/api/types'
import { Cover } from '@/components/common/Cover'
import { Icon } from '@/components/common/Icon'

interface BookTileProps {
  item: ABSLibraryItem
  fs?: number
}

// Library/shelf tile: cover with hover-reveal actions, title, author, and a
// progress bar when the book is in progress.
export function BookTile({ item, fs = 15 }: BookTileProps) {
  const navigate = useNavigate()
  const { title, authorName } = item.media.metadata
  const open = () => navigate(`/book/${item.id}`)
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    fn()
  }

  return (
    <div className="book fade-in" onClick={open}>
      <Cover
        itemId={item.id}
        title={title ?? 'Untitled'}
        author={authorName || undefined}
        fs={fs}
        overlay={
          <div className="hover-actions" onClick={(e) => e.stopPropagation()}>
            <button className="ha-btn" title="Add to list" onClick={stop(() => {})}>
              <Icon name="playlist_add" />
            </button>
            <button className="ha-play" title="Play" onClick={stop(open)}>
              <Icon name="play_arrow" fill />
            </button>
            <button className="ha-btn" title="Mark finished" onClick={stop(() => {})}>
              <Icon name="check" />
            </button>
          </div>
        }
      />
      <div className="b-meta">
        <div className="b-title">{title ?? 'Untitled'}</div>
        <div className="b-author">{authorName || 'Unknown author'}</div>
      </div>
    </div>
  )
}
