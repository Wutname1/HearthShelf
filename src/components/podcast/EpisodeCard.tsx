import { Cover } from '@/components/common/Cover'
import { Icon } from '@/components/common/Icon'
import { formatDuration, stripHtml } from '@/lib/format'
import type { ABSPodcastEpisode } from '@/api/types'

export interface EpisodeCardData extends ABSPodcastEpisode {
  podcastItemId: string
  podTitle: string
  played?: number // 0..1, resolved from /api/me by episodeId
}

interface EpisodeCardProps {
  ep: EpisodeCardData
  onPlay: (ep: EpisodeCardData) => void
  onToast?: (msg: string) => void
}

// Shared episode row used by PodcastDetail and PodcastLatest. Play/Resume/Play
// again follows the played fraction. Queue / Mark finished are deferred
// (@needs-verify episode mutation endpoints) - they toast rather than no-op.
export function EpisodeCard({ ep, onPlay, onToast }: EpisodeCardProps) {
  const played = ep.played ?? 0
  const finished = played >= 1
  const inProgress = played > 0 && played < 1
  const downloaded = Boolean(ep.audioFile)

  const date = ep.publishedAt
    ? new Date(ep.publishedAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''
  const mins = ep.duration ? Math.round(ep.duration / 60) : 0

  const metaTail = finished ? ' · Finished' : inProgress ? ` · ${Math.round(played * 100)}%` : ''

  return (
    <div className="ep-card">
      <Cover
        itemId={ep.podcastItemId}
        title={ep.podTitle}
        kicker="Podcast"
        fs={5}
        className="ep-cover"
      />
      <div className="ep-body">
        <div className="ep-pod">{ep.podTitle}</div>
        <div className="ep-meta">
          {date}
          {mins > 0 && ` · ${formatDuration(ep.duration ?? 0)}`}
          {metaTail}
        </div>
        <div className="ep-title">{ep.title}</div>
        {ep.description && <div className="ep-desc">{stripHtml(ep.description)}</div>}
        <div className="ep-actions">
          <button className="btn-sm btn-accent" onClick={() => onPlay(ep)}>
            <Icon name={finished ? 'replay' : 'play_arrow'} fill />{' '}
            {inProgress ? 'Resume' : finished ? 'Play again' : 'Play'}
          </button>
          <button className="btn-sm btn-ghost" onClick={() => onToast?.('Queue is coming soon')}>
            <Icon name="playlist_add" /> Queue
          </button>
          <button
            className="btn-sm btn-ghost"
            onClick={() => onToast?.('Mark finished is coming soon')}
          >
            <Icon name="task_alt" /> {finished ? 'Finished' : 'Mark finished'}
          </button>
          {downloaded && (
            <span className="chip">
              <Icon name="download_done" /> Downloaded
            </span>
          )}
        </div>
        {inProgress && (
          <div className="ep-prog">
            <i style={{ width: played * 100 + '%' }} />
          </div>
        )}
      </div>
    </div>
  )
}
