import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCachedUserEmail, getCachedUserId } from '@/lib/supabase/sync'

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

export interface HiddenVideo {
  videoId: string
  hiddenAt: string
  hiddenBy?: string
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
  hiddenVideos: HiddenVideo[]
  hideVideo: (videoId: string) => Promise<boolean>
  showVideo: (videoId: string) => Promise<boolean>
  isVideoHidden: (videoId: string) => boolean
  exportHiddenVideos: () => string
  issues: AdminIssue[]
  addIssue: (
    videoId: string,
    youtubeId: string,
    type: IssueType,
    description: string,
  ) => Promise<boolean>
  resolveIssue: (id: string) => void
  clearResolved: () => void
  getUnresolvedCount: () => number
  exportIssues: () => string
  exportReportBundle: () => string
}

function flagKey(flag: Pick<SubtitleFlag, 'videoId' | 'entryIndex'>) {
  return `${flag.videoId}:${flag.entryIndex}`
}

function mergeFlags(currentFlags: SubtitleFlag[], flagsToRestore: SubtitleFlag[]) {
  const byKey = new Map<string, SubtitleFlag>()

  for (const flag of [...currentFlags, ...flagsToRestore]) {
    byKey.set(flagKey(flag), flag)
  }

  return [...byKey.values()].sort((left, right) => right.flaggedAt.localeCompare(left.flaggedAt))
}

function mergeIssues(currentIssues: AdminIssue[], issuesToRestore: AdminIssue[]) {
  const byId = new Map<string, AdminIssue>()

  for (const issue of [...currentIssues, ...issuesToRestore]) {
    byId.set(issue.id, issue)
  }

  return [...byId.values()].sort((left, right) => right.timestamp - left.timestamp)
}

function mergeHiddenVideos(currentHiddenVideos: HiddenVideo[], videosToRestore: HiddenVideo[]) {
  const byVideoId = new Map<string, HiddenVideo>()

  for (const hiddenVideo of [...currentHiddenVideos, ...videosToRestore]) {
    byVideoId.set(hiddenVideo.videoId, hiddenVideo)
  }

  return [...byVideoId.values()].sort((left, right) =>
    right.hiddenAt.localeCompare(left.hiddenAt),
  )
}

function withUserId(run: (userId: string) => void) {
  const userId = getCachedUserId()
  if (!userId) return null

  run(userId)
  return userId
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
          set((state) => ({
            adminSyncError: null,
            flaggedSubtitles: state.flaggedSubtitles.filter(
              (flag) => flagKey(flag) !== flagKey(existingFlag),
            ),
          }))

          const userId = withUserId(() => {})
          if (!userId) {
            set((state) => ({
              flaggedSubtitles: mergeFlags(state.flaggedSubtitles, [existingFlag]),
              adminSyncError: '로그인 후 다시 시도해 주세요.',
            }))
            return
          }

          void (async () => {
            try {
              const { removeSubtitleFlagServer } = await import('@/lib/supabase/opsSync')
              await removeSubtitleFlagServer(userId, videoId, entryIndex)
            } catch {
              set((state) => ({
                flaggedSubtitles: mergeFlags(state.flaggedSubtitles, [existingFlag]),
                adminSyncError: '플래그 해제가 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
              }))
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

        set((state) => ({
          adminSyncError: null,
          flaggedSubtitles: [...state.flaggedSubtitles, nextFlag],
        }))

        const userId = withUserId(() => {})
        if (!userId) {
          set((state) => ({
            flaggedSubtitles: state.flaggedSubtitles.filter(
              (flag) => flagKey(flag) !== flagKey(nextFlag),
            ),
            adminSyncError: '로그인 후 다시 시도해 주세요.',
          }))
          return
        }

        void (async () => {
          try {
            const { syncSubtitleFlag } = await import('@/lib/supabase/opsSync')
            await syncSubtitleFlag(userId, nextFlag)
          } catch {
            set((state) => ({
              flaggedSubtitles: state.flaggedSubtitles.filter(
                (flag) => flagKey(flag) !== flagKey(nextFlag),
              ),
              adminSyncError: '플래그 저장이 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
            }))
          }
        })()
      },

      isFlagged: (videoId, entryIndex) =>
        get().flaggedSubtitles.some(
          (flag) => flag.videoId === videoId && flag.entryIndex === entryIndex,
        ),

      clearFlags: () => {
        const removedFlags = get().flaggedSubtitles
        if (removedFlags.length === 0) return

        set({ flaggedSubtitles: [], adminSyncError: null })

        const userId = withUserId(() => {})
        if (!userId) {
          set((state) => ({
            flaggedSubtitles: mergeFlags(state.flaggedSubtitles, removedFlags),
            adminSyncError: '로그인 후 다시 시도해 주세요.',
          }))
          return
        }

        void (async () => {
          try {
            const { clearSubtitleFlagsServer } = await import('@/lib/supabase/opsSync')
            await clearSubtitleFlagsServer(userId)
          } catch {
            set((state) => ({
              flaggedSubtitles: mergeFlags(state.flaggedSubtitles, removedFlags),
              adminSyncError: '플래그 정리가 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
            }))
          }
        })()
      },

      exportFlags: () => JSON.stringify(get().flaggedSubtitles, null, 2),

      hiddenVideos: [],

      hideVideo: async (videoId) => {
        if (get().hiddenVideos.some((hiddenVideo) => hiddenVideo.videoId === videoId)) {
          return true
        }

        if (!get().isAdminActive()) {
          set({ adminSyncError: 'Admin access is required.' })
          return false
        }

        const userId = withUserId(() => {})
        if (!userId) {
          set({ adminSyncError: 'Log in and try again.' })
          return false
        }

        const nextHiddenVideo: HiddenVideo = {
          videoId,
          hiddenAt: new Date().toISOString(),
          hiddenBy: userId,
        }

        set((state) => ({
          adminSyncError: null,
          hiddenVideos: mergeHiddenVideos(state.hiddenVideos, [nextHiddenVideo]),
        }))

        try {
          const { syncHiddenVideo } = await import('@/lib/supabase/opsSync')
          const synced = await syncHiddenVideo(userId, nextHiddenVideo)
          if (!synced) {
            throw new Error('hidden-video-sync-failed')
          }
          return true
        } catch {
          set((state) => ({
            hiddenVideos: state.hiddenVideos.filter((hiddenVideo) => hiddenVideo.videoId !== videoId),
            adminSyncError: 'Hidden video sync failed. Try again.',
          }))
          return false
        }
      },

      showVideo: async (videoId) => {
        const hiddenVideoToRestore = get().hiddenVideos.find(
          (hiddenVideo) => hiddenVideo.videoId === videoId,
        )
        if (!hiddenVideoToRestore) {
          return true
        }

        if (!get().isAdminActive()) {
          set({ adminSyncError: 'Admin access is required.' })
          return false
        }

        const userId = withUserId(() => {})
        if (!userId) {
          set({ adminSyncError: 'Log in and try again.' })
          return false
        }

        set((state) => ({
          adminSyncError: null,
          hiddenVideos: state.hiddenVideos.filter((hiddenVideo) => hiddenVideo.videoId !== videoId),
        }))

        try {
          const { removeHiddenVideoServer } = await import('@/lib/supabase/opsSync')
          const removed = await removeHiddenVideoServer(videoId)
          if (!removed) {
            throw new Error('hidden-video-delete-failed')
          }
          return true
        } catch {
          set((state) => ({
            hiddenVideos: mergeHiddenVideos(state.hiddenVideos, [hiddenVideoToRestore]),
            adminSyncError: 'Hidden video sync failed. Try again.',
          }))
          return false
        }
      },

      isVideoHidden: (videoId) =>
        get().hiddenVideos.some((hiddenVideo) => hiddenVideo.videoId === videoId),

      exportHiddenVideos: () => JSON.stringify(get().hiddenVideos, null, 2),

      issues: [],

      addIssue: async (videoId, youtubeId, type, description) => {
        const issue: AdminIssue = {
          id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          videoId,
          youtubeId,
          type,
          description,
          timestamp: Date.now(),
          resolved: false,
          reporterEmail: getCachedUserEmail() ?? undefined,
        }

        set((state) => ({
          adminSyncError: null,
          issues: [...state.issues, issue],
        }))

        const userId = withUserId(() => {})
        if (!userId) {
          set((state) => ({
            issues: state.issues.filter((currentIssue) => currentIssue.id !== issue.id),
            adminSyncError: '로그인 후 다시 시도해 주세요.',
          }))
          return false
        }

        try {
          const { syncIssueReport } = await import('@/lib/supabase/opsSync')
          const synced = await syncIssueReport(userId, issue)
          if (!synced) {
            throw new Error('issue-report-sync-failed')
          }
          return true
        } catch {
          set((state) => ({
            issues: state.issues.filter((currentIssue) => currentIssue.id !== issue.id),
            adminSyncError: '이슈 등록이 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
          }))
          return false
        }
      },

      resolveIssue: (id) => {
        const issueToRestore = get().issues.find((issue) => issue.id === id)
        set((state) => ({
          adminSyncError: null,
          issues: state.issues.map((issue) =>
            issue.id === id ? { ...issue, resolved: true } : issue,
          ),
        }))

        const userId = withUserId(() => {})
        if (!userId) {
          if (!issueToRestore) return
          set((state) => ({
            issues: mergeIssues(state.issues, [issueToRestore]),
            adminSyncError: '로그인 후 다시 시도해 주세요.',
          }))
          return
        }

        void (async () => {
          try {
            const { resolveIssueReportServer } = await import('@/lib/supabase/opsSync')
            const resolved = await resolveIssueReportServer(id)
            if (!resolved) {
              throw new Error('issue-report-resolve-failed')
            }
          } catch {
            if (!issueToRestore) return
            set((state) => ({
              issues: mergeIssues(state.issues, [issueToRestore]),
              adminSyncError: '이슈 해결 상태가 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
            }))
          }
        })()
      },

      clearResolved: () => {
        const resolvedIssues = get().issues.filter((issue) => issue.resolved)
        if (resolvedIssues.length === 0) return

        set((state) => ({
          adminSyncError: null,
          issues: state.issues.filter((issue) => !issue.resolved),
        }))

        const userId = withUserId(() => {})
        if (!userId) {
          set((state) => ({
            issues: mergeIssues(state.issues, resolvedIssues),
            adminSyncError: '로그인 후 다시 시도해 주세요.',
          }))
          return
        }

        void (async () => {
          try {
            const { clearResolvedIssueReportsServer } = await import('@/lib/supabase/opsSync')
            const cleared = await clearResolvedIssueReportsServer()
            if (!cleared) {
              throw new Error('issue-report-clear-failed')
            }
          } catch {
            set((state) => ({
              issues: mergeIssues(state.issues, resolvedIssues),
              adminSyncError: '해결 이슈 정리가 서버에 반영되지 않았습니다. 다시 시도해 주세요.',
            }))
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
            hiddenVideos: get().hiddenVideos,
          },
          null,
          2,
        ),
    }),
    {
      name: 'studyeng-admin-issues',
      partialize: (state) => ({
        adminEnabled: state.adminEnabled,
        flaggedSubtitles: state.flaggedSubtitles,
        hiddenVideos: state.hiddenVideos,
        issues: state.issues,
      }),
    },
  ),
)
