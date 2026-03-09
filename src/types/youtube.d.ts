interface YT {
  Player: new (
    elementId: string | HTMLElement,
    options: YT.PlayerOptions
  ) => YT.Player
  PlayerState: {
    UNSTARTED: -1
    ENDED: 0
    PLAYING: 1
    PAUSED: 2
    BUFFERING: 3
    CUED: 5
  }
}

declare namespace YT {
  interface PlayerOptions {
    height?: string | number
    width?: string | number
    videoId?: string
    playerVars?: PlayerVars
    events?: Events
  }

  interface PlayerVars {
    autoplay?: 0 | 1
    controls?: 0 | 1
    disablekb?: 0 | 1
    fs?: 0 | 1
    modestbranding?: 0 | 1
    playsinline?: 0 | 1
    rel?: 0 | 1
    cc_load_policy?: 0 | 1
    iv_load_policy?: 1 | 3
    start?: number
    end?: number
  }

  interface Events {
    onReady?: (event: PlayerEvent) => void
    onStateChange?: (event: OnStateChangeEvent) => void
    onError?: (event: OnErrorEvent) => void
  }

  interface Player {
    playVideo(): void
    pauseVideo(): void
    seekTo(seconds: number, allowSeekAhead?: boolean): void
    getCurrentTime(): number
    getDuration(): number
    setPlaybackRate(rate: number): void
    setVolume?(volume: number): void
    mute?(): void
    unMute?(): void
    isMuted?(): boolean
    getPlayerState(): number
    destroy(): void
  }

  interface PlayerEvent {
    target: Player
  }

  interface OnStateChangeEvent {
    target: Player
    data: number
  }

  interface OnErrorEvent {
    target: Player
    data: number
  }
}

interface Window {
  YT: YT
  onYouTubeIframeAPIReady: () => void
}
