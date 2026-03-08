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

function syncAdminMutation(run: (userId: string) => Promise<void>) {
  const userId = getCachedUserId()
  if (!userId) {
    return
  }

  void run(userId).catch(() => {})
}

interface AdminState {
  isAdmin: boolean
  adminEnabled: boolean
  setAdmin: (val: boolean) => void
  setAdminEnabled: (val: boolean) => void
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

      setAdmin: (val) => set({ isAdmin: val }),
      setAdminEnabled: (val) => set({ adminEnabled: val }),
      isAdminActive: () => get().isAdmin && get().adminEnabled,

      flaggedSubtitles: [],

      toggleFlag: (videoId, entryIndex, en) => {
        const existingFlag = get().flaggedSubtitles.find(
          (flag) => flag.videoId === videoId && flag.entryIndex === entryIndex,
        )

        if (existingFlag) {
          set((state) => ({
            flaggedSubtitles: state.flaggedSubtitles.filter(
              (flag) => !(flag.videoId === videoId && flag.entryIndex === entryIndex),
            ),
          }))

          syncAdminMutation(async (userId) => {
            const { removeSubtitleFlagServer } = await import('@/lib/supabase/opsSync')
            await removeSubtitleFlagServer(userId, videoId, entryIndex)
          })
          return
        }

        const nextFlag: SubtitleFlag = {
          videoId,
          entryIndex,
          en,
          flaggedAt: new Date().toISOString(),
        }

        set((state) => ({
          flaggedSubtitles: [...state.flaggedSubtitles, nextFlag],
        }))

        syncAdminMutation(async (userId) => {
          const { syncSubtitleFlag } = await import('@/lib/supabase/opsSync')
          await syncSubtitleFlag(userId, nextFlag)
        })
      },

      isFlagged: (videoId, entryIndex) =>
        get().flaggedSubtitles.some(
          (flag) => flag.videoId === videoId && flag.entryIndex === entryIndex
        ),

      clearFlags: () => {
        const hadFlags = get().flaggedSubtitles.length > 0
        set({ flaggedSubtitles: [] })

        if (!hadFlags) {
          return
        }

        syncAdminMutation(async (userId) => {
          const { clearSubtitleFlagsServer } = await import('@/lib/supabase/opsSync')
          await clearSubtitleFlagsServer(userId)
        })
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

        set((state) => ({
          issues: [...state.issues, issue],
        }))

        syncAdminMutation(async (userId) => {
          const { syncIssueReport } = await import('@/lib/supabase/opsSync')
          await syncIssueReport(userId, issue)
        })
      },

      resolveIssue: (id) => {
        set((state) => ({
          issues: state.issues.map((issue) =>
            issue.id === id ? { ...issue, resolved: true } : issue,
          ),
        }))

        syncAdminMutation(async (userId) => {
          void userId
          const { resolveIssueReportServer } = await import('@/lib/supabase/opsSync')
          await resolveIssueReportServer(id)
        })
      },

      clearResolved: () => {
        const hadResolvedIssues = get().issues.some((issue) => issue.resolved)
        set((state) => ({
          issues: state.issues.filter((issue) => !issue.resolved),
        }))

        if (!hadResolvedIssues) {
          return
        }

        syncAdminMutation(async (userId) => {
          void userId
          const { clearResolvedIssueReportsServer } = await import('@/lib/supabase/opsSync')
          await clearResolvedIssueReportsServer()
        })
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
