import { create } from 'zustand'

export interface ReplayClip {
  videoId: string
  start: number
  end: number
  expressionText?: string
  sentenceEn?: string
  sentenceKo?: string
  videoTitle?: string
  sentenceIdx?: number
  source?: 'default' | 'learn'
}

interface ReplayState {
  clip: ReplayClip | null
  queue: ReplayClip[]
  queueIndex: number
  isPlaying: boolean
  progress: number
  play: (clip: ReplayClip) => void
  playQueue: (clips: ReplayClip[], startIndex?: number) => void
  stop: () => void
  next: () => void
  prev: () => void
  updateCurrentClip: (patch: Partial<ReplayClip>) => void
  setProgress: (progress: number) => void
  setIsPlaying: (playing: boolean) => void
}

export const useReplayStore = create<ReplayState>()((set, get) => ({
  clip: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  progress: 0,

  play: (clip) => {
    set({ clip, queue: [clip], queueIndex: 0, isPlaying: true, progress: 0 })
  },

  playQueue: (clips, startIndex = 0) => {
    const safeIndex = Math.max(0, Math.min(startIndex, clips.length - 1))
    const clip = clips[safeIndex] ?? null
    set({
      clip,
      queue: clips,
      queueIndex: safeIndex,
      isPlaying: Boolean(clip),
      progress: 0,
    })
  },

  stop: () => {
    set({ clip: null, queue: [], queueIndex: 0, isPlaying: false, progress: 0 })
  },

  next: () => {
    const { queue, queueIndex } = get()
    const nextIndex = queueIndex + 1
    const nextClip = queue[nextIndex]
    if (!nextClip) {
      set({ clip: null, queue: [], queueIndex: 0, isPlaying: false, progress: 0 })
      return
    }

    set({
      clip: nextClip,
      queueIndex: nextIndex,
      isPlaying: true,
      progress: 0,
    })
  },

  prev: () => {
    const { queue, queueIndex } = get()
    const prevIndex = queueIndex - 1
    const prevClip = queue[prevIndex]
    if (!prevClip) return

    set({
      clip: prevClip,
      queueIndex: prevIndex,
      isPlaying: true,
      progress: 0,
    })
  },

  updateCurrentClip: (patch) => {
    const { clip, queue, queueIndex } = get()
    if (!clip) return

    const nextClip = { ...clip, ...patch }
    const nextQueue =
      queue.length > 0
        ? queue.map((item, index) => (index === queueIndex ? nextClip : item))
        : queue

    set({ clip: nextClip, queue: nextQueue })
  },

  setProgress: (progress) => {
    if (get().progress !== progress) set({ progress })
  },

  setIsPlaying: (playing) => {
    if (get().isPlaying !== playing) set({ isPlaying: playing })
  },
}))
