import type { ABSChapter } from '@/api/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatTimestamp } from '@/lib/format'

interface ChapterListProps {
  chapters: ABSChapter[]
  onJump?: (chapter: ABSChapter) => void
}

export function ChapterList({ chapters, onJump }: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No chapters available.</p>
    )
  }

  return (
    <ScrollArea className="h-80 rounded-md border">
      <ul className="divide-y">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <button
              type="button"
              onClick={() => onJump?.(chapter)}
              className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left text-sm hover:bg-secondary/50"
            >
              <span className="truncate">{chapter.title}</span>
              <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                {formatTimestamp(chapter.start)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
