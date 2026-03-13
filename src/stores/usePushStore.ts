import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PushPermission = 'default' | 'granted' | 'denied'

interface PushState {
  permission: PushPermission
  subscription: PushSubscription | null
  /** Timestamp (ms) when user clicked "Not now" — used to re-prompt after 3 days */
  dismissedAt: number | null
  /** Whether the prompt has been shown and dismissed at least once */
  promptDismissed: boolean

  setPermission: (permission: PushPermission) => void
  setSubscription: (subscription: PushSubscription | null) => void
  dismiss: () => void
  resetDismiss: () => void

  /** Register SW and request browser notification permission, then subscribe */
  requestPermission: () => Promise<PushPermission>
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<void>

  /** Returns true if the in-app prompt should be shown */
  shouldShowPrompt: () => boolean
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch {
    return null
  }
}

export const usePushStore = create<PushState>()(
  persist(
    (set, get) => ({
      permission: 'default',
      subscription: null,
      dismissedAt: null,
      promptDismissed: false,

      setPermission: (permission) => set({ permission }),
      setSubscription: (subscription) => set({ subscription }),

      dismiss: () => set({ dismissedAt: Date.now(), promptDismissed: true }),
      resetDismiss: () => set({ dismissedAt: null, promptDismissed: false }),

      shouldShowPrompt: () => {
        const { permission, dismissedAt } = get()
        // Already granted or permanently denied by browser
        if (permission === 'granted' || permission === 'denied') return false
        // Never dismissed → show
        if (dismissedAt === null) return true
        // Show again after 3 days
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
        return Date.now() - dismissedAt > THREE_DAYS_MS
      },

      requestPermission: async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
          return 'denied'
        }
        const result = await Notification.requestPermission()
        const mapped = result as PushPermission
        set({ permission: mapped })
        return mapped
      },

      subscribe: async () => {
        const { requestPermission } = get()
        const permission = await requestPermission()
        if (permission !== 'granted') return false

        const reg = await registerServiceWorker()
        if (!reg) return false

        try {
          // MVP: no VAPID server — subscribe without applicationServerKey
          // This enables local notifications via service worker
          const existing = await reg.pushManager.getSubscription()
          const sub = existing ?? await reg.pushManager.subscribe({
            userVisibleOnly: true,
          })
          set({ subscription: sub })
          return true
        } catch {
          // PushManager may reject without VAPID key in some browsers — that's fine for MVP
          // The SW is still registered and can show notifications via scheduleReminder
          return true
        }
      },

      unsubscribe: async () => {
        const { subscription } = get()
        if (subscription) {
          try {
            await subscription.unsubscribe()
          } catch {
            // ignore
          }
        }
        set({ subscription: null, permission: 'default' })
      },
    }),
    {
      name: 'studyeng-push',
      // Don't persist the actual PushSubscription object (not serializable)
      partialize: (state) => ({
        permission: state.permission,
        dismissedAt: state.dismissedAt,
        promptDismissed: state.promptDismissed,
      }),
    }
  )
)
