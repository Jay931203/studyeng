/**
 * scheduleReminder.ts
 *
 * MVP approach: service worker-based local notification scheduling.
 * Called after each watch session. Schedules a notification for the next day
 * at approximately the same time of day, if the user hasn't already watched today.
 *
 * Phase 2 (future): replace with Supabase Edge Function + Web Push server-sent push.
 */

import type { SupportedLocale } from '@/stores/useLocaleStore'

const REMINDER_TAG = 'shortee-streak-reminder'

const REMINDER_BODY: Record<
  'streakActive' | 'streakNone',
  Record<SupportedLocale, string | ((days: number) => string)>
> = {
  streakActive: {
    ko: (d: number) => `${d}일 연속 기록이 기다리고 있어요!`,
    ja: (d: number) => `${d}日連続の記録が待っています!`,
    'zh-TW': (d: number) => `${d} 天連續紀錄正在等你!`,
    vi: (d: number) => `Chuoi ${d} ngay lien tiep dang cho ban!`,
  },
  streakNone: {
    ko: '오늘도 짧은 영상 하나만 보세요!',
    ja: '今日も短い動画をひとつ見ましょう!',
    'zh-TW': '今天也來看一段短片吧!',
    vi: 'Hom nay cung xem mot doan phim ngan nhe!',
  },
}

function getReminderBody(streakDays: number, locale: SupportedLocale): string {
  if (streakDays > 0) {
    const tpl = REMINDER_BODY.streakActive[locale]
    return typeof tpl === 'function' ? tpl(streakDays) : tpl
  }
  const val = REMINDER_BODY.streakNone[locale]
  return typeof val === 'function' ? val(streakDays) : val
}

export interface ReminderPayload {
  streakDays: number
  locale?: SupportedLocale
  delayMs?: number // override delay (ms from now) — useful for testing
}

export async function scheduleStreakReminder({
  streakDays,
  locale = 'ko',
  delayMs,
}: ReminderPayload): Promise<void> {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  let reg: ServiceWorkerRegistration | null = null
  try {
    reg = await navigator.serviceWorker.ready
  } catch {
    return
  }

  // Default: 23 hours from now (slightly under 24h so it nudges before the streak breaks)
  const delay = delayMs ?? 23 * 60 * 60 * 1000

  const streakLabel = streakDays > 0 ? `${streakDays}-day` : 'your'
  const title = 'Shortee'
  const body =
    streakDays > 0
      ? `Your ${streakLabel} streak is waiting! Watch a short to keep it going.`
      : 'Come back and keep your streak alive!'
  const localizedBody = getReminderBody(streakDays, locale)

  // Cancel any previously scheduled reminder before setting a new one
  cancelStreakReminder()

  const timerId = window.setTimeout(async () => {
    try {
      const notifOptions: NotificationOptions & { renotify?: boolean } = {
        body: `${body}\n${localizedBody}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: REMINDER_TAG,
        renotify: true,
        data: { url: '/' },
      }
      await reg!.showNotification(title, notifOptions as NotificationOptions)
    } catch {
      // Silently fail — notification may be blocked
    }
    // Clear stored timer id after firing
    sessionStorage.removeItem('shortee-reminder-timer')
  }, delay)

  // Store timer id in sessionStorage so it can be cancelled on same session
  sessionStorage.setItem('shortee-reminder-timer', String(timerId))
}

export function cancelStreakReminder(): void {
  if (typeof window === 'undefined') return
  const stored = sessionStorage.getItem('shortee-reminder-timer')
  if (stored) {
    window.clearTimeout(Number(stored))
    sessionStorage.removeItem('shortee-reminder-timer')
  }
}
