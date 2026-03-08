import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
}

interface AdminState {
  isAdmin: boolean
  adminEmail: string
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
      adminEmail: 'hyunjae.park93@gmail.com',
      adminEnabled: true,

      setAdmin: (val) => set({ isAdmin: val }),
      setAdminEnabled: (val) => set({ adminEnabled: val }),
      isAdminActive: () => get().isAdmin && get().adminEnabled,

      flaggedSubtitles: [],

      toggleFlag: (videoId, entryIndex, en) =>
        set((state) => {
          const exists = state.flaggedSubtitles.some(
            (flag) => flag.videoId === videoId && flag.entryIndex === entryIndex
          )

          if (exists) {
            return {
              flaggedSubtitles: state.flaggedSubtitles.filter(
                (flag) => !(flag.videoId === videoId && flag.entryIndex === entryIndex)
              ),
            }
          }

          return {
            flaggedSubtitles: [
              ...state.flaggedSubtitles,
              {
                videoId,
                entryIndex,
                en,
                flaggedAt: new Date().toISOString(),
              },
            ],
          }
        }),

      isFlagged: (videoId, entryIndex) =>
        get().flaggedSubtitles.some(
          (flag) => flag.videoId === videoId && flag.entryIndex === entryIndex
        ),

      clearFlags: () => set({ flaggedSubtitles: [] }),

      exportFlags: () => JSON.stringify(get().flaggedSubtitles, null, 2),

      issues: [],

      addIssue: (videoId, youtubeId, type, description) =>
        set((state) => ({
          issues: [
            ...state.issues,
            {
              id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              videoId,
              youtubeId,
              type,
              description,
              timestamp: Date.now(),
              resolved: false,
            },
          ],
        })),

      resolveIssue: (id) =>
        set((state) => ({
          issues: state.issues.map((issue) =>
            issue.id === id ? { ...issue, resolved: true } : issue
          ),
        })),

      clearResolved: () =>
        set((state) => ({
          issues: state.issues.filter((issue) => !issue.resolved),
        })),

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
    { name: 'studyeng-admin-issues' }
  )
)
