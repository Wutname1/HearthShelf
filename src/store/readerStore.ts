import { create } from 'zustand'

// Per-book ebook reader position. Each book's reading state is persisted under
// its own localStorage key ('hs-reader-{bookId}') rather than a single blob, so
// progress is isolated per book and easy to prune. This is client-only and not
// part of the synced settings store; ABS is unaware of HearthShelf's reader.

export interface ReaderState {
  currentChapter: number
  scrollRatio: number
  pageNumber: number
}

const DEFAULT_STATE: ReaderState = {
  currentChapter: 0,
  scrollRatio: 0,
  pageNumber: 0,
}

function keyFor(bookId: string): string {
  return `hs-reader-${bookId}`
}

// Read the persisted reader state for a book, or defaults if none/invalid.
export function restore(bookId: string): ReaderState {
  try {
    const raw = localStorage.getItem(keyFor(bookId))
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw) as Partial<ReaderState>
    return {
      currentChapter: parsed.currentChapter ?? DEFAULT_STATE.currentChapter,
      scrollRatio: parsed.scrollRatio ?? DEFAULT_STATE.scrollRatio,
      pageNumber: parsed.pageNumber ?? DEFAULT_STATE.pageNumber,
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

// Persist a book's reader state to its localStorage key.
export function save(bookId: string, state: ReaderState): void {
  try {
    localStorage.setItem(keyFor(bookId), JSON.stringify(state))
  } catch {
    // Storage full or unavailable - position is best-effort, ignore.
  }
}

interface ReaderStore extends ReaderState {
  // The book currently loaded in the reader, or null when no book is open.
  bookId: string | null
  // Load a book's saved position into the store (call on Reader mount).
  load: (bookId: string) => void
  // Update fields for the active book and persist (call on chapter/scroll change).
  update: (patch: Partial<ReaderState>) => void
  // Clear the active book without touching its persisted state.
  reset: () => void
}

export const useReaderStore = create<ReaderStore>()((set) => ({
  ...DEFAULT_STATE,
  bookId: null,
  load: (bookId) => set({ bookId, ...restore(bookId) }),
  update: (patch) =>
    set((s) => {
      const next: ReaderState = {
        currentChapter: patch.currentChapter ?? s.currentChapter,
        scrollRatio: patch.scrollRatio ?? s.scrollRatio,
        pageNumber: patch.pageNumber ?? s.pageNumber,
      }
      if (s.bookId) save(s.bookId, next)
      return next
    }),
  reset: () => set({ bookId: null, ...DEFAULT_STATE }),
}))
