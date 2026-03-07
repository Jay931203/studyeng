import { create } from 'zustand'
import { usePremiumStore } from './usePremiumStore'

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
  /** Set to true when a non-premium user tries to access en-ko subtitles */
  subtitleGateBlocked: boolean

  toggleSubtitleMode: () => void
  setPlaybackRate: (rate: number) => void
  setLoop: (start: number, end: number) => void
  clearLoop: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void
  setClipBounds: (clipStart: number, clipEnd: number) => void
  setActiveSubIndex: (idx: number) => void
  clearSubtitleGateBlocked: () => void
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
  subtitleGateBlocked: false,

  toggleSubtitleMode: () => {
    const current = subtitleCycle.indexOf(get().subtitleMode)
    const next = subtitleCycle[(current + 1) % subtitleCycle.length]

    // Gate en-ko mode for non-premium users
    if (next === 'en-ko' && !usePremiumStore.getState().isPremium) {
      set({ subtitleGateBlocked: true })
      // Skip en-ko and go to the next mode in the cycle
      const skipNext = subtitleCycle[(current + 2) % subtitleCycle.length]
      set({ subtitleMode: skipNext })
      return
    }

    set({ subtitleMode: next })
  },

  clearSubtitleGateBlocked: () => set({ subtitleGateBlocked: false }),

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
