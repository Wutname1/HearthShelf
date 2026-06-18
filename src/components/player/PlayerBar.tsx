import { usePlayerStore } from '@/store/playerStore'
import { usePlayer } from '@/hooks/usePlayer'
import { Icon } from '@/components/common/Icon'
import { Cover } from '@/components/common/Cover'
import { formatTimestamp } from '@/lib/format'

// Persistent across route changes - rendered once by AppShell, never unmounted
// on navigation. Hidden (per the design) until a playback session exists.
export function PlayerBar() {
  const libraryItemId = usePlayerStore((s) => s.libraryItemId)
  const title = usePlayerStore((s) => s.title)
  const author = usePlayerStore((s) => s.author)
  const duration = usePlayerStore((s) => s.duration)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const speed = usePlayerStore((s) => s.playbackSpeed)
  const { togglePlaying, seek, skip, cycleSpeed, chapterStep } = usePlayer()

  if (!libraryItemId || !title) return null

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  const onScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    seek(Math.max(0, Math.min(1, ratio)) * duration)
  }

  return (
    <div className="playbar">
      <div className="pb-now">
        <Cover itemId={libraryItemId} title={title} author={author ?? undefined} fs={5} />
        <div className="pb-meta">
          <div className="pb-title">{title}</div>
          <div className="pb-sub">{author}</div>
        </div>
      </div>

      <div className="pb-center">
        <div className="pb-controls">
          <button className="pb-skip" onClick={() => chapterStep(-1)} aria-label="Previous chapter">
            <Icon name="skip_previous" fill />
          </button>
          <button className="pb-skip" onClick={() => skip(-30)} aria-label="Back 30 seconds">
            <Icon name="replay_30" />
            <small>30</small>
          </button>
          <button
            className="pb-play"
            onClick={togglePlaying}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <Icon name={isPlaying ? 'pause' : 'play_arrow'} fill />
          </button>
          <button className="pb-skip" onClick={() => skip(30)} aria-label="Forward 30 seconds">
            <Icon name="forward_30" />
            <small>30</small>
          </button>
          <button className="pb-skip" onClick={() => chapterStep(1)} aria-label="Next chapter">
            <Icon name="skip_next" fill />
          </button>
        </div>
        <div className="pb-time">
          <span>{formatTimestamp(currentTime)}</span>
          <div className="scrub" onClick={onScrub}>
            <i style={{ width: pct + '%' }} />
            <b style={{ left: pct + '%' }} />
          </div>
          <span>-{formatTimestamp(Math.max(0, duration - currentTime))}</span>
        </div>
      </div>

      <div className="pb-right">
        <button className="pill" onClick={cycleSpeed}>
          {speed}×
        </button>
        <button className="icon-btn" aria-label="Sleep timer">
          <Icon name="bedtime" />
        </button>
        <button className="icon-btn" aria-label="Volume">
          <Icon name="volume_up" />
        </button>
      </div>
    </div>
  )
}
