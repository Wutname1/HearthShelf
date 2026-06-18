import type { ABSChapter } from '@/api/types'
import { formatTimestamp } from '@/lib/format'

interface ChapterListProps {
  chapters: ABSChapter[]
  onJump?: (chapter: ABSChapter) => void
}

export function ChapterList({ chapters, onJump }: ChapterListProps) {
  if (chapters.length === 0) {
    return <p className="page-sub">No chapters available.</p>
  }

  return (
    <div
      className="chap-list"
      style={{
        maxHeight: 420,
        overflowY: 'auto',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-card)',
        padding: 6,
      }}
    >
      {chapters.map((chapter, i) => (
        <button
          type="button"
          className="chap"
          key={chapter.id}
          onClick={() => onJump?.(chapter)}
        >
          <span className="n">{i + 1}</span>
          <span className="ct">{chapter.title}</span>
          <span className="cd">{formatTimestamp(chapter.start)}</span>
        </button>
      ))}
    </div>
  )
}
