import { createClient } from './client'
import { useAdminStore, type AdminIssue, type SubtitleFlag } from '@/stores/useAdminStore'
import {
  useRecommendationStore,
  type VideoBehaviorSignal,
} from '@/stores/useRecommendationStore'

const supabase = createClient()

type SyncedAdminIssue = AdminIssue & {
  reporterEmail?: string
}

function buildFlagKey(flag: Pick<SubtitleFlag, 'videoId' | 'entryIndex'>) {
  return `${flag.videoId}::${flag.entryIndex}`
}

function mergeIssues(localIssues: SyncedAdminIssue[], remoteIssues: SyncedAdminIssue[]) {
  const byId = new Map<string, SyncedAdminIssue>()

  for (const issue of [...localIssues, ...remoteIssues]) {
    const existing = byId.get(issue.id)
    if (!existing) {
      byId.set(issue.id, issue)
      continue
    }

    byId.set(issue.id, {
      ...existing,
      ...issue,
      reporterEmail: issue.reporterEmail ?? existing.reporterEmail,
      resolved: existing.resolved || issue.resolved,
      timestamp: Math.max(existing.timestamp, issue.timestamp),
    })
  }

  return [...byId.values()].sort((left, right) => right.timestamp - left.timestamp)
}

function mergeFlags(localFlags: SubtitleFlag[], remoteFlags: SubtitleFlag[]) {
  const byKey = new Map<string, SubtitleFlag>()

  for (const flag of [...localFlags, ...remoteFlags]) {
    const key = buildFlagKey(flag)
    const existing = byKey.get(key)

    if (!existing) {
      byKey.set(key, flag)
      continue
    }

    byKey.set(key, existing.flaggedAt >= flag.flaggedAt ? existing : flag)
  }

  return [...byKey.values()].sort((left, right) => right.flaggedAt.localeCompare(left.flaggedAt))
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

export async function resolveAdminAccess(userId: string, email?: string | null) {
  const fallbackAdminEmail = useAdminStore.getState().adminEmail

  const { data, error } = await supabase
    .from('admin_accounts')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[ops-sync] admin_accounts lookup failed:', error.message)
  }

  return Boolean(data) || Boolean(email && email === fallbackAdminEmail)
}

export async function syncIssueReport(
  userId: string,
  issue: SyncedAdminIssue,
  reporterEmail?: string | null,
) {
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

  if (error) console.warn('[ops-sync] issue report upsert failed:', error.message)
}

export async function resolveIssueReportServer(id: string) {
  const { error } = await supabase
    .from('issue_reports')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) console.warn('[ops-sync] issue report resolve failed:', error.message)
}

export async function clearResolvedIssueReportsServer() {
  const { error } = await supabase.from('issue_reports').delete().eq('resolved', true)

  if (error) console.warn('[ops-sync] issue report prune failed:', error.message)
}

export async function syncSubtitleFlag(userId: string, flag: SubtitleFlag) {
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
  const { error } = await supabase
    .from('subtitle_flags')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .eq('entry_index', entryIndex)

  if (error) console.warn('[ops-sync] subtitle flag delete failed:', error.message)
}

export async function clearSubtitleFlagsServer(userId: string) {
  const { error } = await supabase.from('subtitle_flags').delete().eq('user_id', userId)

  if (error) console.warn('[ops-sync] subtitle flag clear failed:', error.message)
}

export async function syncRecommendationSignal(
  userId: string,
  videoId: string,
  signal: VideoBehaviorSignal,
) {
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
  const isAdmin = await resolveAdminAccess(userId, email)

  const [issueResponse, flagResponse] = await Promise.all([
    supabase.from('issue_reports').select('*').order('created_at', { ascending: false }),
    supabase.from('subtitle_flags').select('*').order('flagged_at', { ascending: false }),
  ])

  if (issueResponse.error) {
    console.warn('[ops-sync] issue reports pull failed:', issueResponse.error.message)
  }

  if (flagResponse.error) {
    console.warn('[ops-sync] subtitle flags pull failed:', flagResponse.error.message)
  }

  const remoteIssues: SyncedAdminIssue[] = (issueResponse.data ?? []).map((row) => ({
    id: row.id,
    videoId: row.video_id,
    youtubeId: row.youtube_id,
    type: row.type,
    description: row.description,
    timestamp: new Date(row.created_at).getTime(),
    resolved: Boolean(row.resolved),
    reporterEmail: row.reporter_email ?? undefined,
  }))

  const remoteFlags: SubtitleFlag[] = (flagResponse.data ?? []).map((row) => ({
    videoId: row.video_id,
    entryIndex: row.entry_index,
    en: row.en,
    flaggedAt: row.flagged_at,
  }))

  const { issues: localIssues, flaggedSubtitles: localFlags } = useAdminStore.getState()

  useAdminStore.setState({
    isAdmin,
    issues: mergeIssues(localIssues, remoteIssues),
    flaggedSubtitles: mergeFlags(localFlags, remoteFlags),
  })
}

async function pushAdminState(userId: string) {
  const { issues, flaggedSubtitles } = useAdminStore.getState()

  if (issues.length > 0) {
    for (const issue of issues) {
      await syncIssueReport(userId, issue as SyncedAdminIssue, issue.reporterEmail ?? null)
    }
  }

  if (flaggedSubtitles.length > 0) {
    for (const flag of flaggedSubtitles) {
      await syncSubtitleFlag(userId, flag)
    }
  }
}

async function pullRecommendationSignals(userId: string) {
  const { data, error } = await supabase
    .from('recommendation_signals')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.warn('[ops-sync] recommendation signals pull failed:', error.message)
    return
  }

  const remoteSignals: Record<string, VideoBehaviorSignal> = {}

  for (const row of data ?? []) {
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
  const { videoSignals } = useRecommendationStore.getState()
  const entries = Object.entries(videoSignals)

  for (const [videoId, signal] of entries) {
    await syncRecommendationSignal(userId, videoId, signal)
  }
}

export async function syncOpsOnLogin(userId: string, email?: string | null) {
  try {
    await Promise.all([pullAdminState(userId, email), pullRecommendationSignals(userId)])
  } catch (err) {
    console.warn('[ops-sync] initial pull failed:', err)
  }

  try {
    await Promise.all([pushAdminState(userId), pushRecommendationSignals(userId)])
  } catch (err) {
    console.warn('[ops-sync] push-back failed:', err)
  }
}
