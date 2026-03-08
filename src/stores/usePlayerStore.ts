import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SubtitleMode = 'none' | 'en' | 'en-ko'

type RepeatMode = 'off' | 'x2' | 'x3'

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
  /** How many times to repeat the current video before auto-advancing */
  repeatMode: RepeatMode
  /** How many times the current video has fully played through */
  currentRepeatCount: number
  /** True while the user is swiping between videos */
  isSwiping: boolean
  /** Index of the subtitle currently frozen for looping, or null */
  freezeSubIndex: number | null

  toggleSubtitleMode: () => void
  setPlaybackRate: (rate: number) => void
  setLoop: (start: number, end: number) => void
  clearLoop: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void
  setClipBounds: (clipStart: number, clipEnd: number) => void
  setActiveSubIndex: (idx: number) => void
  setRepeatMode: (mode: RepeatMode) => void
  incrementRepeatCount: () => void
  resetRepeatCount: () => void
  setIsSwiping: (swiping: boolean) => void
  setFreezeSubIndex: (idx: number | null) => void
}

const subtitleCycle: SubtitleMode[] = ['none', 'en', 'en-ko']

/**
 * Shared mutable ref for high-frequency currentTime updates.
 * Components that need 60fps-smooth progress (e.g. ProgressBar) read from
 * this ref via requestAnimationFrame instead of subscribing to Zustand state.
 */
export const currentTimeRef = { current: 0 }

/**
 * Shared mutable ref for the seekTo function.
 * Registered by the active VideoPlayer so that sibling components
 * (e.g. ProgressBar) can seek the YouTube player without prop drilling.
 */
export const seekToRef: { current: ((seconds: number) => void) | null } = { current: null }

/**
 * Shared mutable refs for play/pause functions.
 * Registered by the active VideoPlayer so that sibling components
 * (e.g. FloatingRemote) can control playback without prop drilling.
 */
export const playRef: { current: (() => void) | null } = { current: null }
export const pauseRef: { current: (() => void) | null } = { current: null }

export const usePlayerStore = create<PlayerState>()(persist((set, get) => ({
  subtitleMode: 'en',
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
  repeatMode: 'off',
  currentRepeatCount: 0,
  isSwiping: false,
  freezeSubIndex: null,

  toggleSubtitleMode: () => {
    const current = subtitleCycle.indexOf(get().subtitleMode)
    const next = subtitleCycle[(current + 1) % subtitleCycle.length]
    set({ subtitleMode: next })
  },

  setPlaybackRate: (rate) => {
    if (get().playbackRate !== rate) set({ playbackRate: rate })
  },

  setLoop: (start, end) => {
    const state = get()
    if (state.isLooping && state.loopStart === start && state.loopEnd === end) return
    set({ isLooping: true, loopStart: start, loopEnd: end })
  },

  clearLoop: () => {
    const state = get()
    if (!state.isLooping && state.loopStart === null && state.loopEnd === null) return
    set({ isLooping: false, loopStart: null, loopEnd: null })
  },

  setCurrentTime: (time) => {
    if (get().currentTime !== time) set({ currentTime: time })
  },

  setDuration: (duration) => {
    if (get().duration !== duration) set({ duration })
  },

  setIsPlaying: (playing) => {
    if (get().isPlaying !== playing) set({ isPlaying: playing })
  },

  setClipBounds: (clipStart, clipEnd) => {
    const state = get()
    if (state.clipStart !== clipStart || state.clipEnd !== clipEnd) {
      set({ clipStart, clipEnd })
    }
  },

  setActiveSubIndex: (idx) => {
    if (get().activeSubIndex !== idx) set({ activeSubIndex: idx })
  },

  setRepeatMode: (mode) => {
    const state = get()
    if (state.repeatMode === mode && state.currentRepeatCount === 0) return
    set({ repeatMode: mode, currentRepeatCount: 0 })
  },

  incrementRepeatCount: () => set((state) => ({ currentRepeatCount: state.currentRepeatCount + 1 })),

  resetRepeatCount: () => {
    if (get().currentRepeatCount !== 0) set({ currentRepeatCount: 0 })
  },

  setIsSwiping: (swiping) => {
    if (get().isSwiping !== swiping) set({ isSwiping: swiping })
  },

  setFreezeSubIndex: (idx) => {
    if (get().freezeSubIndex !== idx) set({ freezeSubIndex: idx })
  },
}),
  {
    name: 'studyeng-player',
    partialize: (state) => ({
      subtitleMode: state.subtitleMode,
      playbackRate: state.playbackRate,
    }),
  }
))
