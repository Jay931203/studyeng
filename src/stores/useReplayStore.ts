import { create } from 'zustand'

interface ReplayClip {
  videoId: string
  start: number
  end: number
  expressionText?: string
}

interface ReplayState {
  clip: ReplayClip | null
  isPlaying: boolean
  progress: number
  play: (clip: ReplayClip) => void
  stop: () => void
  setProgress: (progress: number) => void
  setIsPlaying: (playing: boolean) => void
}

export const useReplayStore = create<ReplayState>()((set, get) => ({
  clip: null,
  isPlaying: false,
  progress: 0,

  play: (clip) => {
    set({ clip, isPlaying: true, progress: 0 })
  },

  stop: () => {
    set({ clip: null, isPlaying: false, progress: 0 })
  },

  setProgress: (progress) => {
    if (get().progress !== progress) set({ progress })
  },

  setIsPlaying: (playing) => {
    if (get().isPlaying !== playing) set({ isPlaying: playing })
  },
}))
