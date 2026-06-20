import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'
import { RmabBadge } from '@/components/requests/RmabBadge'
import { audibleStoreUrl, type AudibleResult } from '@/api/audible'

// A catalog result for the tile. AudibleResult (our search) plus the optional
// request-status fields RMAB's search enriches when it's the source.
export interface CatalogResult extends AudibleResult {
  isRequested?: boolean
  requestStatus?: string
}

// The per-result action depends on what's available:
//  - request backend connected -> Request / live status / In library
//  - otherwise -> Buy on Audible (a plain store link)
function RequestAction({
  result,
  canRequest,
  onRequest,
}: {
  result: CatalogResult
  canRequest: boolean
  onRequest: (r: CatalogResult) => void
}) {
  const navigate = useNavigate()
  const status = result.requestStatus

  if (status === 'available' || status === 'downloaded') {
    return (
      <button
        className="req-btn ghost"
        onClick={() => navigate('/library?q=' + encodeURIComponent(result.title))}
      >
        <Icon name="library_books" /> In library
      </button>
    )
  }
  if (result.isRequested && status) {
    return <RmabBadge status={status} releaseDate={result.releaseDate} showRelease />
  }
  if (canRequest) {
    return (
      <button className="req-btn" onClick={() => onRequest(result)}>
        <Icon name="add" /> Request
      </button>
    )
  }
  return (
    <a className="req-btn ghost" href={audibleStoreUrl(result)} target="_blank" rel="noopener noreferrer">
      <Icon name="open_in_new" /> Buy on Audible
    </a>
  )
}

interface RequestTileProps {
  result: CatalogResult
  // True when the request backend (RMAB) can fulfill this; false falls back to
  // the Buy-on-Audible link.
  canRequest: boolean
  onRequest: (r: CatalogResult) => void
}

// BookTile-shaped card for a catalog result (requestable or buyable).
export function RequestTile({ result, canRequest, onRequest }: RequestTileProps) {
  const hours = result.durationMinutes ? Math.round(result.durationMinutes / 60) : null
  return (
    <div className="req-tile">
      {result.coverArtUrl ? (
        <img className="cover" src={result.coverArtUrl} alt="" />
      ) : (
        <div className="cover" style={{ background: 'var(--c-highest)' }} />
      )}
      <div className="rt-body">
        <div className="rt-title">{result.title}</div>
        <div className="rt-author">
          {result.author}
          {result.narrator ? ' · ' + result.narrator : ''}
        </div>
        <div className="rt-chips">
          {result.series && (
            <span className="rt-chip">
              <Icon name="bookmark" /> {result.series}
            </span>
          )}
          {hours != null && (
            <span className="rt-chip">
              <Icon name="schedule" /> {hours}h
            </span>
          )}
          {result.rating != null && (
            <span className="rt-chip">
              <Icon name="star" fill /> {result.rating}
            </span>
          )}
        </div>
        <div className="rt-action">
          <RequestAction result={result} canRequest={canRequest} onRequest={onRequest} />
        </div>
      </div>
    </div>
  )
}
