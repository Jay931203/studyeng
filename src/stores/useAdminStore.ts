import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCachedUserId } from '@/lib/supabase/sync'

export interface SubtitleFlag {
  videoId: string
  entryIndex: number
  en: string
  flaggedAt: string
}

export type IssueType = 'subtitle' | 'video' | 'other'

export interface AdminIssue {
  id: string
  videoId: string
  youtubeId: string
  type: IssueType
  description: string
  timestamp: number
  resolved: boolean
  reporterEmail?: string
}

interface AdminState {
  isAdmin: boolean
  adminEnabled: boolean
  adminSyncError: string | null
  setAdmin: (val: boolean) => void
  setAdminEnabled: (val: boolean) => void
  setAdminSyncError: (message: string | null) => void
  isAdminActive: () => boolean
  flaggedSubtitles: SubtitleFlag[]
  toggleFlag: (videoId: string, entryIndex: number, en: string) => void
  isFlagged: (videoId: string, entryIndex: number) => boolean
  clearFlags: () => void
  exportFlags: () => string
  issues: AdminIssue[]
  addIssue: (videoId: string, youtubeId: string, type: IssueType, description: string) => void
  resolveIssue: (id: string) => void
  clearResolved: () => void
  getUnresolvedCount: () => number
  exportIssues: () => string
  exportReportBundle: () => string
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      isAdmin: false,
      adminEnabled: true,
      adminSyncError: null,

      setAdmin: (val) => set({ isAdmin: val }),
      setAdminEnabled: (val) => set({ adminEnabled: val }),
      setAdminSyncError: (message) => set({ adminSyncError: message }),
      isAdminActive: () => get().isAdmin && get().adminEnabled,

      flaggedSubtitles: [],

      toggleFlag: (videoId, entryIndex, en) => {
        const existingFlag = get().flaggedSubtitles.find(
          (flag) => flag.videoId === videoId && flag.entryIndex === entryIndex,
        )

        if (existingFlag) {
          const previousFlags = get().flaggedSubtitles
          set((state) => ({
            adminSyncError: null,
            flaggedSubtitles: state.flaggedSubtitles.filter(
              (flag) => !(flag.videoId === videoId && flag.entryIndex === entryIndex),
            ),
          }))

          const userId = getCachedUserId()
          if (!userId) {
            set({ flaggedSubtitles: previousFlags, adminSyncError: '로그인 후 다시 시도해 주세요.' })
            return
          }

          void (async () => {
            try {
              const { removeSubtitleFlagServer } = await import('@/lib/supabase/opsSync')
              await removeSubtitleFlagServer(userId, videoId, entryIndex)
            } catch {
              set({
                flaggedSubtitles: previousFlags,
                adminSyncError: '플래그 해제가 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
              })
            }
          })()
          return
        }

        const nextFlag: SubtitleFlag = {
          videoId,
          entryIndex,
          en,
          flaggedAt: new Date().toISOString(),
        }

        const previousFlags = get().flaggedSubtitles
        set((state) => ({
          adminSyncError: null,
          flaggedSubtitles: [...state.flaggedSubtitles, nextFlag],
        }))

        const userId = getCachedUserId()
        if (!userId) {
          set({ flaggedSubtitles: previousFlags, adminSyncError: '로그인 후 다시 시도해 주세요.' })
          return
        }

        void (async () => {
          try {
            const { syncSubtitleFlag } = await import('@/lib/supabase/opsSync')
            await syncSubtitleFlag(userId, nextFlag)
          } catch {
            set({
              flaggedSubtitles: previousFlags,
              adminSyncError: '플래그 저장이 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
            })
          }
        })()
      },

      isFlagged: (videoId, entryIndex) =>
        get().flaggedSubtitles.some(
          (flag) => flag.videoId === videoId && flag.entryIndex === entryIndex
        ),

      clearFlags: () => {
        const previousFlags = get().flaggedSubtitles
        const hadFlags = get().flaggedSubtitles.length > 0
        set({ flaggedSubtitles: [], adminSyncError: null })

        if (!hadFlags) {
          return
        }

        const userId = getCachedUserId()
        if (!userId) {
          set({ flaggedSubtitles: previousFlags, adminSyncError: '로그인 후 다시 시도해 주세요.' })
          return
        }

        void (async () => {
          try {
            const { clearSubtitleFlagsServer } = await import('@/lib/supabase/opsSync')
            await clearSubtitleFlagsServer(userId)
          } catch {
            set({
              flaggedSubtitles: previousFlags,
              adminSyncError: '플래그 정리가 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
            })
          }
        })()
      },

      exportFlags: () => JSON.stringify(get().flaggedSubtitles, null, 2),

      issues: [],

      addIssue: (videoId, youtubeId, type, description) => {
        const issue: AdminIssue = {
          id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          videoId,
          youtubeId,
          type,
          description,
          timestamp: Date.now(),
          resolved: false,
        }

        const previousIssues = get().issues
        set((state) => ({
          adminSyncError: null,
          issues: [...state.issues, issue],
        }))

        const userId = getCachedUserId()
        if (!userId) {
          set({ issues: previousIssues, adminSyncError: '로그인 후 다시 시도해 주세요.' })
          return
        }

        void (async () => {
          try {
            const { syncIssueReport } = await import('@/lib/supabase/opsSync')
            await syncIssueReport(userId, issue)
          } catch {
            set({
              issues: previousIssues,
              adminSyncError: '이슈 등록이 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
            })
          }
        })()
      },

      resolveIssue: (id) => {
        const previousIssues = get().issues
        set((state) => ({
          adminSyncError: null,
          issues: state.issues.map((issue) =>
            issue.id === id ? { ...issue, resolved: true } : issue,
          ),
        }))

        const userId = getCachedUserId()
        if (!userId) {
          set({ issues: previousIssues, adminSyncError: '로그인 후 다시 시도해 주세요.' })
          return
        }

        void (async () => {
          try {
            const { resolveIssueReportServer } = await import('@/lib/supabase/opsSync')
            await resolveIssueReportServer(id)
          } catch {
            set({
              issues: previousIssues,
              adminSyncError: '이슈 해결 상태가 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
            })
          }
        })()
      },

      clearResolved: () => {
        const previousIssues = get().issues
        const hadResolvedIssues = get().issues.some((issue) => issue.resolved)
        set((state) => ({
          adminSyncError: null,
          issues: state.issues.filter((issue) => !issue.resolved),
        }))

        if (!hadResolvedIssues) {
          return
        }

        const userId = getCachedUserId()
        if (!userId) {
          set({ issues: previousIssues, adminSyncError: '로그인 후 다시 시도해 주세요.' })
          return
        }

        void (async () => {
          try {
            const { clearResolvedIssueReportsServer } = await import('@/lib/supabase/opsSync')
            await clearResolvedIssueReportsServer()
          } catch {
            set({
              issues: previousIssues,
              adminSyncError: '해결 이슈 정리가 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
            })
          }
        })()
      },

      getUnresolvedCount: () => get().issues.filter((issue) => !issue.resolved).length,

      exportIssues: () => JSON.stringify(get().issues, null, 2),

      exportReportBundle: () =>
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            unresolvedIssues: get().issues.filter((issue) => !issue.resolved),
            resolvedIssues: get().issues.filter((issue) => issue.resolved),
            subtitleFlags: get().flaggedSubtitles,
          },
          null,
          2
        ),
    }),
    {
      name: 'studyeng-admin-issues',
      partialize: (state) => ({
        adminEnabled: state.adminEnabled,
        flaggedSubtitles: state.flaggedSubtitles,
        issues: state.issues,
      }),
    }
  )
)
