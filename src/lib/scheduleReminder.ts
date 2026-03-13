/**
 * scheduleReminder.ts
 *
 * MVP approach: service worker-based local notification scheduling.
 * Called after each watch session. Schedules a notification for the next day
 * at approximately the same time of day, if the user hasn't already watched today.
 *
 * Phase 2 (future): replace with Supabase Edge Function + Web Push server-sent push.
 */

const REMINDER_TAG = 'shortee-streak-reminder'

export interface ReminderPayload {
  streakDays: number
  delayMs?: number // override delay (ms from now) — useful for testing
}

export async function scheduleStreakReminder({
  streakDays,
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
  const bodyKo =
    streakDays > 0
      ? `${streakDays}일 연속 기록이 기다리고 있어요!`
      : '오늘도 짧은 영상 하나만 보세요!'

  // Cancel any previously scheduled reminder before setting a new one
  cancelStreakReminder()

  const timerId = window.setTimeout(async () => {
    try {
      const notifOptions: NotificationOptions & { renotify?: boolean } = {
        body: `${body}\n${bodyKo}`,
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
