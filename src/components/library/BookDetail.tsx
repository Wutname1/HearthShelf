import type { ABSLibraryItemDetail } from '@/api/types'
import { Cover } from '@/components/common/Cover'
import { Icon } from '@/components/common/Icon'
import { ChapterList } from '@/components/player/ChapterList'
import { formatDuration, stripHtml } from '@/lib/format'

interface BookDetailProps {
  item: ABSLibraryItemDetail
}

export function BookDetail({ item }: BookDetailProps) {
  const { metadata, audioFiles, chapters } = item.media
  const {
    title,
    subtitle,
    authors,
    narratorName,
    publishedYear,
    genres,
    description,
  } = metadata

  // The detail endpoint doesn't flatten these the way the items list does.
  const authorName = authors.map((a) => a.name).join(', ')
  const duration = audioFiles.reduce((sum, f) => sum + f.duration, 0)

  const chips = [
    publishedYear && { icon: 'calendar_today', text: publishedYear },
    { icon: 'schedule', text: formatDuration(duration) },
    { icon: 'list', text: `${chapters.length} chapters` },
    genres[0] && { icon: 'category', text: genres[0] },
  ].filter(Boolean) as { icon: string; text: string }[]

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', gap: 'var(--s8)', flexWrap: 'wrap' }}>
        <Cover
          itemId={item.id}
          title={title ?? 'Untitled'}
          author={authorName || undefined}
          fs={14}
          style={{ width: 220, height: 220, borderRadius: 16, boxShadow: 'var(--shadow-lift)' }}
        />
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="eyebrow">Audiobook</div>
          <h1 className="title-xl" style={{ marginTop: 4 }}>
            {title ?? 'Untitled'}
          </h1>
          {subtitle && (
            <p className="page-sub" style={{ fontSize: 16 }}>
              {subtitle}
            </p>
          )}
          <div style={{ color: 'var(--text-muted)', fontSize: 14.5, marginTop: 8 }}>
            {authorName || 'Unknown author'}
            {narratorName && ` · Narrated by ${narratorName}`}
          </div>

          <div className="meta-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: 'var(--s5) 0' }}>
            {chips.map((c, i) => (
              <span className="chip" key={i}>
                <Icon name={c.icon} /> {c.text}
              </span>
            ))}
          </div>

          <button className="btn btn-primary">
            <Icon name="play_arrow" fill /> Start listening
          </button>

          {description && (
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.65,
                color: 'var(--text-muted)',
                marginTop: 'var(--s6)',
                maxWidth: '60ch',
                whiteSpace: 'pre-line',
              }}
            >
              {stripHtml(description)}
            </p>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <Icon name="list" />
          <h2>Chapters</h2>
        </div>
        <ChapterList chapters={chapters} />
      </div>
    </div>
  )
}
