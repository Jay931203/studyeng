import { createClient } from './client'
import {
  useAdminStore,
  type AdminIssue,
  type HiddenVideo,
  type SubtitleFlag,
} from '@/stores/useAdminStore'
import {
  useRecommendationStore,
  type VideoBehaviorSignal,
} from '@/stores/useRecommendationStore'

const supabase = createClient()

type SyncedAdminIssue = AdminIssue & {
  reporterEmail?: string
}

interface IssueReportRow {
  id: string
  video_id: string
  youtube_id: string
  type: string
  description: string
  created_at: string
  resolved: boolean | null
  reporter_email: string | null
}

interface SubtitleFlagRow {
  video_id: string
  entry_index: number
  en: string
  flagged_at: string
}

interface HiddenVideoRow {
  video_id: string
  hidden_at: string
  hidden_by: string | null
}

interface RecommendationSignalRow {
  video_id: string
  impressions: number | null
  completions: number | null
  skips: number | null
  total_completion_ratio: number | null
  last_interacted_at: string
}

function mergeSignals(
  localSignals: Record<string, VideoBehaviorSignal>,
  remoteSignals: Record<string, VideoBehaviorSignal>,
) {
  const merged: Record<string, VideoBehaviorSignal> = {}

  for (const [videoId, signal] of Object.entries(localSignals)) {
    merged[videoId] = { ...signal }
  }

  for (const [videoId, signal] of Object.entries(remoteSignals)) {
    const existing = merged[videoId]
    if (!existing) {
      merged[videoId] = { ...signal }
      continue
    }

    merged[videoId] = {
      impressions: Math.max(existing.impressions, signal.impressions),
      completions: Math.max(existing.completions, signal.completions),
      skips: Math.max(existing.skips, signal.skips),
      totalCompletionRatio: Math.max(
        existing.totalCompletionRatio,
        signal.totalCompletionRatio,
      ),
      lastInteractedAt: Math.max(existing.lastInteractedAt, signal.lastInteractedAt),
    }
  }

  return merged
}

function deriveRecentVideoIds(videoSignals: Record<string, VideoBehaviorSignal>) {
  return Object.entries(videoSignals)
    .sort((left, right) => right[1].lastInteractedAt - left[1].lastInteractedAt)
    .slice(0, 40)
    .map(([videoId]) => videoId)
}

function mapHiddenVideos(rows: HiddenVideoRow[]) {
  return rows
    .map((row) => ({
      videoId: row.video_id,
      hiddenAt: row.hidden_at,
      hiddenBy: row.hidden_by ?? undefined,
    }))
    .sort((left, right) => right.hiddenAt.localeCompare(left.hiddenAt))
}

export async function resolveAdminAccess(userId: string, email?: string | null) {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('admin_accounts')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[ops-sync] admin_accounts lookup failed:', error.message)
    return null
  }

  void email
  return Boolean(data)
}

export async function syncIssueReport(
  userId: string,
  issue: SyncedAdminIssue,
  reporterEmail?: string | null,
) {
  if (!supabase) return false
  const { error } = await supabase.from('issue_reports').upsert(
    {
      id: issue.id,
      user_id: userId,
      video_id: issue.videoId,
      youtube_id: issue.youtubeId,
      type: issue.type,
      description: issue.description,
      reporter_email: reporterEmail ?? issue.reporterEmail ?? null,
      resolved: issue.resolved,
      created_at: new Date(issue.timestamp).toISOString(),
      resolved_at: issue.resolved ? new Date().toISOString() : null,
    },
    { onConflict: 'id' },
  )

  if (error) {
    console.warn('[ops-sync] issue report upsert failed:', error.message)
    return false
  }

  return true
}

export async function resolveIssueReportServer(id: string) {
  if (!supabase) return false
  const { error } = await supabase
    .from('issue_reports')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.warn('[ops-sync] issue report resolve failed:', error.message)
    return false
  }

  return true
}

export async function clearResolvedIssueReportsServer() {
  if (!supabase) return false
  const { error } = await supabase.from('issue_reports').delete().eq('resolved', true)

  if (error) {
    console.warn('[ops-sync] issue report prune failed:', error.message)
    return false
  }

  return true
}

export async function syncHiddenVideo(userId: string, hiddenVideo: HiddenVideo) {
  if (!supabase) return false
  const { error } = await supabase.from('hidden_videos').upsert(
    {
      video_id: hiddenVideo.videoId,
      hidden_by: hiddenVideo.hiddenBy ?? userId,
      hidden_at: hiddenVideo.hiddenAt,
    },
    { onConflict: 'video_id' },
  )

  if (error) {
    console.warn('[ops-sync] hidden video upsert failed:', error.message)
    return false
  }

  return true
}

export async function removeHiddenVideoServer(videoId: string) {
  if (!supabase) return false
  const { error } = await supabase.from('hidden_videos').delete().eq('video_id', videoId)

  if (error) {
    console.warn('[ops-sync] hidden video delete failed:', error.message)
    return false
  }

  return true
}

export async function syncPublicOps() {
  if (!supabase) return

  const { data, error } = await supabase
    .from('hidden_videos')
    .select('*')
    .order('hidden_at', { ascending: false })

  if (error) {
    console.warn('[ops-sync] hidden videos pull failed:', error.message)
    return
  }

  useAdminStore.setState({
    hiddenVideos: mapHiddenVideos((data ?? []) as HiddenVideoRow[]),
  })
}

export async function syncSubtitleFlag(userId: string, flag: SubtitleFlag) {
  if (!supabase) return
  const { error } = await supabase.from('subtitle_flags').upsert(
    {
      user_id: userId,
      video_id: flag.videoId,
      entry_index: flag.entryIndex,
      en: flag.en,
      flagged_at: flag.flaggedAt,
    },
    { onConflict: 'user_id,video_id,entry_index' },
  )

  if (error) console.warn('[ops-sync] subtitle flag upsert failed:', error.message)
}

export async function removeSubtitleFlagServer(
  userId: string,
  videoId: string,
  entryIndex: number,
) {
  if (!supabase) return
  const { error } = await supabase
    .from('subtitle_flags')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .eq('entry_index', entryIndex)

  if (error) console.warn('[ops-sync] subtitle flag delete failed:', error.message)
}

export async function clearSubtitleFlagsServer(userId: string) {
  if (!supabase) return
  const { error } = await supabase.from('subtitle_flags').delete().eq('user_id', userId)

  if (error) console.warn('[ops-sync] subtitle flag clear failed:', error.message)
}

export async function syncRecommendationSignal(
  userId: string,
  videoId: string,
  signal: VideoBehaviorSignal,
) {
  if (!supabase) return
  const { error } = await supabase.from('recommendation_signals').upsert(
    {
      user_id: userId,
      video_id: videoId,
      impressions: signal.impressions,
      completions: signal.completions,
      skips: signal.skips,
      total_completion_ratio: signal.totalCompletionRatio,
      last_interacted_at: new Date(signal.lastInteractedAt).toISOString(),
    },
    { onConflict: 'user_id,video_id' },
  )

  if (error) console.warn('[ops-sync] recommendation signal upsert failed:', error.message)
}

async function pullAdminState(userId: string, email?: string | null) {
  if (!supabase) return false
  const isAdmin = await resolveAdminAccess(userId, email)
  if (isAdmin === null) {
    useAdminStore.setState({
      adminSyncError: 'Could not verify admin access. Please try again later.',
    })
    return false
  }
  const issueQuery = supabase.from('issue_reports').select('*').order('created_at', { ascending: false })
  const flagQuery = supabase.from('subtitle_flags').select('*').order('flagged_at', { ascending: false })
  const hiddenQuery = supabase.from('hidden_videos').select('*').order('hidden_at', { ascending: false })

  const [issueResponse, flagResponse, hiddenResponse] = await Promise.all([
    isAdmin ? issueQuery : issueQuery.eq('user_id', userId),
    isAdmin ? flagQuery : flagQuery.eq('user_id', userId),
    hiddenQuery,
  ])

  if (issueResponse.error) {
    console.warn('[ops-sync] issue reports pull failed:', issueResponse.error.message)
    useAdminStore.setState({
      adminSyncError: 'Could not load issue reports from the server. Please try again later.',
    })
    return false
  }

  if (flagResponse.error) {
    console.warn('[ops-sync] subtitle flags pull failed:', flagResponse.error.message)
    useAdminStore.setState({
      adminSyncError: 'Could not load subtitle flags from the server. Please try again later.',
    })
    return false
  }

  if (hiddenResponse.error) {
    console.warn('[ops-sync] hidden videos pull failed:', hiddenResponse.error.message)
    useAdminStore.setState({
      adminSyncError: 'Hidden videos could not be loaded from the server. Try again.',
    })
    return false
  }

  const remoteIssues: SyncedAdminIssue[] = ((issueResponse.data ?? []) as IssueReportRow[]).map((row) => ({
    id: row.id,
    videoId: row.video_id,
    youtubeId: row.youtube_id,
    type: row.type as SyncedAdminIssue['type'],
    description: row.description,
    timestamp: new Date(row.created_at).getTime(),
    resolved: Boolean(row.resolved),
    reporterEmail: row.reporter_email ?? undefined,
  }))

  const remoteFlags: SubtitleFlag[] = ((flagResponse.data ?? []) as SubtitleFlagRow[]).map((row) => ({
    videoId: row.video_id,
    entryIndex: row.entry_index,
    en: row.en,
    flaggedAt: row.flagged_at,
  }))

  const remoteHiddenVideos = mapHiddenVideos((hiddenResponse.data ?? []) as HiddenVideoRow[])

  useAdminStore.setState({
    isAdmin,
    adminSyncError: null,
    issues: remoteIssues.sort((left, right) => right.timestamp - left.timestamp),
    flaggedSubtitles: remoteFlags.sort((left, right) =>
      right.flaggedAt.localeCompare(left.flaggedAt),
    ),
    hiddenVideos: remoteHiddenVideos,
  })

  return true
}

async function pullRecommendationSignals(userId: string) {
  if (!supabase) return
  const { data, error } = await supabase
    .from('recommendation_signals')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.warn('[ops-sync] recommendation signals pull failed:', error.message)
    return
  }

  const remoteSignals: Record<string, VideoBehaviorSignal> = {}

  for (const row of (data ?? []) as RecommendationSignalRow[]) {
    remoteSignals[row.video_id] = {
      impressions: row.impressions ?? 0,
      completions: row.completions ?? 0,
      skips: row.skips ?? 0,
      totalCompletionRatio: row.total_completion_ratio ?? 0,
      lastInteractedAt: new Date(row.last_interacted_at).getTime(),
    }
  }

  const { videoSignals: localSignals } = useRecommendationStore.getState()
  const mergedSignals = mergeSignals(localSignals, remoteSignals)

  useRecommendationStore.setState({
    videoSignals: mergedSignals,
    recentVideoIds: deriveRecentVideoIds(mergedSignals),
  })
}

async function pushRecommendationSignals(userId: string) {
  if (!supabase) return
  const { videoSignals } = useRecommendationStore.getState()
  const entries = Object.entries(videoSignals)

  for (const [videoId, signal] of entries) {
    await syncRecommendationSignal(userId, videoId, signal)
  }
}

export async function syncOpsOnLogin(userId: string, email?: string | null) {
  if (!supabase) return
  try {
    await Promise.all([
      syncPublicOps(),
      pullAdminState(userId, email),
      pullRecommendationSignals(userId),
    ])
  } catch (err) {
    console.warn('[ops-sync] initial pull failed:', err)
  }

  try {
    await pushRecommendationSignals(userId)
  } catch (err) {
    console.warn('[ops-sync] push-back failed:', err)
  }
}
