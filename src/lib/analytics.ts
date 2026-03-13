export function trackEvent(
  name: string,
  params?: Record<string, string | number>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, params)
  }
}

export const AnalyticsEvents = {
  VIDEO_WATCH_COMPLETE: 'video_watch_complete',
  EXPRESSION_SAVED: 'expression_saved',
  EXPRESSION_FAMILIAR: 'expression_familiar',
  GAME_PLAYED: 'game_played',
  LEVEL_UP: 'level_up',
  PREMIUM_MODAL_SHOWN: 'premium_modal_shown',
  PREMIUM_CHECKOUT_START: 'premium_checkout_start',
  PREMIUM_CONVERTED: 'premium_converted',
} as const
