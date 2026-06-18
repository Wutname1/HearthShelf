import { create } from 'zustand'
import type { ABSChapter } from '@/api/types'

interface PlayerState {
  sessionId: string | null
  libraryItemId: string | null
  title: string | null
  author: string | null
  coverPath: string | null
  duration: number
  currentTime: number
  isPlaying: boolean
  chapters: ABSChapter[]
  playbackSpeed: number
  closeSession: () => void
  setCurrentTime: (time: number) => void
  setPlaying: (playing: boolean) => void
  setSpeed: (speed: number) => void
}

const initialState = {
  sessionId: null,
  libraryItemId: null,
  title: null,
  author: null,
  coverPath: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  chapters: [] as ABSChapter[],
  playbackSpeed: 1,
}

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initialState,
  closeSession: () => set({ ...initialState }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setSpeed: (playbackSpeed) => set({ playbackSpeed }),
}))
