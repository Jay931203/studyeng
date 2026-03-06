import { create } from 'zustand'

type SubtitleMode = 'none' | 'en' | 'en-ko'

interface PlayerState {
  subtitleMode: SubtitleMode
  playbackRate: number
  isLooping: boolean
  loopStart: number | null
  loopEnd: number | null
  currentTime: number
  duration: number
  isPlaying: boolean
  clipStart: number
  clipEnd: number
  activeSubIndex: number

  toggleSubtitleMode: () => void
  setPlaybackRate: (rate: number) => void
  setLoop: (start: number, end: number) => void
  clearLoop: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void
  setClipBounds: (clipStart: number, clipEnd: number) => void
  setActiveSubIndex: (idx: number) => void
}

const subtitleCycle: SubtitleMode[] = ['none', 'en', 'en-ko']

/**
 * Shared mutable ref for high-frequency currentTime updates.
 * Components that need 60fps-smooth progress (e.g. ProgressBar) read from
 * this ref via requestAnimationFrame instead of subscribing to Zustand state.
 */
export const currentTimeRef = { current: 0 }

export const usePlayerStore = create<PlayerState>((set, get) => ({
  subtitleMode: 'none',
  playbackRate: 1,
  isLooping: false,
  loopStart: null,
  loopEnd: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  clipStart: 0,
  clipEnd: 0,
  activeSubIndex: -1,

  toggleSubtitleMode: () => {
    const current = subtitleCycle.indexOf(get().subtitleMode)
    const next = subtitleCycle[(current + 1) % subtitleCycle.length]
    set({ subtitleMode: next })
  },

  setPlaybackRate: (rate) => set({ playbackRate: rate }),

  setLoop: (start, end) => set({ isLooping: true, loopStart: start, loopEnd: end }),

  clearLoop: () => set({ isLooping: false, loopStart: null, loopEnd: null }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setClipBounds: (clipStart, clipEnd) => set({ clipStart, clipEnd }),

  setActiveSubIndex: (idx) => {
    if (get().activeSubIndex !== idx) set({ activeSubIndex: idx })
  },
}))
