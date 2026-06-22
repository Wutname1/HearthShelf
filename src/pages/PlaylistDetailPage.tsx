import { useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPlaylist, updatePlaylist, libraryKeys } from '@/api/libraries'
import { useActiveLibrary } from '@/hooks/useActiveLibrary'
import { usePlayer } from '@/hooks/usePlayer'
import { formatDuration } from '@/lib/format'
import type { ABSPlaylist } from '@/api/types'
import { Cover, tintFor } from '@/components/common/Cover'
import { Icon } from '@/components/common/Icon'
import { RenameModal } from '@/components/common/RenameModal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'

function PlaylistDetail({ playlist }: { playlist: ABSPlaylist }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { activeId } = useActiveLibrary()
  const { playItem } = usePlayer()
  const [editing, setEditing] = useState(false)
  const items = playlist.items ?? []

  const onSaveEdit = async (patch: { name: string; description?: string }) => {
    await updatePlaylist(playlist.id, patch)
    qc.invalidateQueries({ queryKey: ['playlist', playlist.id] })
    if (activeId)
      qc.invalidateQueries({ queryKey: libraryKeys.playlists(activeId) })
  }
  const totalH = items.reduce(
    (s, it) => s + (it.libraryItem.media.duration ?? 0),
    0
  )
  const cv = tintFor(items[0]?.libraryItem.media.metadata.title ?? playlist.name)

  return (
    <div className="page fade-in" style={{ ['--glow-accent' as string]: cv }}>
      <div className="crumb">
        <Link className="lnk" to="/playlists">
          Playlists
        </Link>
        <Icon name="chevron_right" />
        {playlist.name}
      </div>

      <div className="page-head">
        <div className="eyebrow">Playlist</div>
        <h1 className="title-xl">{playlist.name}</h1>
        {playlist.description && <p className="page-sub">{playlist.description}</p>}
      </div>

      <div className="toolbar2">
        <span className="count-badge">
          {items.length} {items.length === 1 ? 'item' : 'items'} ·{' '}
          {formatDuration(totalH)}
        </span>
        <div className="tb-spacer" />
        {items[0] && (
          <button
            className="btn btn-primary"
            onClick={() => void playItem(items[0].libraryItemId)}
          >
            <Icon name="play_arrow" fill /> Play
          </button>
        )}
        <button className="pill" onClick={() => setEditing(true)}>
          <Icon name="edit" /> Edit
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Icon name="queue_music" />
          <h3>This playlist is empty</h3>
        </div>
      ) : (
        <div className="pl-list">
          {items.map((it) => {
            const b = it.libraryItem
            const m = b.media.metadata
            const hours = b.media.duration
              ? Math.round(b.media.duration / 360) / 10
              : 0
            return (
              <div
                className="pl-row"
                key={it.libraryItemId}
                data-cv={tintFor(m.title ?? 'Untitled')}
                onClick={() => navigate(`/book/${it.libraryItemId}`)}
              >
                <Icon name="drag_indicator" className="drag" />
                <Cover
                  itemId={it.libraryItemId}
                  title={m.title ?? 'Untitled'}
                  fs={5}
                />
                <div style={{ minWidth: 0 }}>
                  <div className="ll-title">{m.title}</div>
                  <div className="ll-sub">
                    {[m.authorName, m.narratorName].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <span
                  className="ll-col mono"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {hours}h
                </span>
                <button
                  className="ll-play"
                  onClick={(e) => {
                    e.stopPropagation()
                    void playItem(it.libraryItemId)
                  }}
                  aria-label="Play"
                >
                  <Icon name="play_arrow" fill />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <RenameModal
          title="Edit playlist"
          initialName={playlist.name}
          initialDescription={playlist.description ?? ''}
          onSave={onSaveEdit}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}

export function PlaylistDetailPage() {
  const { playlistId } = useParams()
  const location = useLocation()
  const passed = (location.state as { playlist?: ABSPlaylist } | null)?.playlist

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => getPlaylist(playlistId as string),
    enabled: Boolean(playlistId) && !passed,
    staleTime: 5 * 60 * 1000,
  })

  if (passed) return <PlaylistDetail playlist={passed} />
  if (isLoading) {
    return (
      <div className="page">
        <LoadingSpinner className="py-12" label="Loading playlist..." />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="page">
        <ErrorState message="Could not load this playlist." onRetry={refetch} />
      </div>
    )
  }
  return <PlaylistDetail playlist={data} />
}
