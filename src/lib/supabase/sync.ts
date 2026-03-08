import { createClient } from './client'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useBookmarkStore } from '@/stores/useBookmarkStore'
import { useUserStore } from '@/stores/useUserStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useLikeStore } from '@/stores/useLikeStore'
import type { SavedPhrase } from '@/stores/usePhraseStore'

const supabase = createClient()

// ─── Debounce helper ──────────────────────────────────────────────
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {}

function debounced(key: string, fn: () => Promise<void>, ms = 1000) {
  if (debounceTimers[key]) clearTimeout(debounceTimers[key])
  debounceTimers[key] = setTimeout(() => {
    fn().catch((err) => console.warn(`[sync] ${key} failed:`, err))
  }, ms)
}

// ─── Auth helper ──────────────────────────────────────────────────
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// Cached user id for sync calls (set on login, cleared on logout)
let _cachedUserId: string | null = null

export function setCachedUserId(id: string | null) {
  _cachedUserId = id
}

export function getCachedUserId(): string | null {
  return _cachedUserId
}

// ─── Profile sync ─────────────────────────────────────────────────
export async function syncProfileToServer(userId: string) {
  const { level, xp, streakDays, lastActivityDate } = useUserStore.getState()
  const { hasOnboarded, interests, level: onboardingLevel, dailyGoal } = useOnboardingStore.getState()

  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    level,
    xp,
    streak_days: streakDays,
    last_activity_date: lastActivityDate,
    onboarding_completed: hasOnboarded,
    interests,
    onboarding_level: onboardingLevel,
    daily_goal: dailyGoal,
    updated_at: new Date().toISOString(),
  })

  if (error) console.warn('[sync] profile upsert error:', error.message)
}

export function debouncedSyncProfile() {
  const userId = getCachedUserId()
  if (!userId) return
  debounced('profile', () => syncProfileToServer(userId))
}

// ─── Watch history sync ───────────────────────────────────────────
export async function syncWatchHistoryItem(
  userId: string,
  videoId: string,
  viewCount: number,
  completionCount?: number,
) {
  const { error } = await supabase.from('watch_history').upsert(
    {
      user_id: userId,
      video_id: videoId,
      view_count: viewCount,
      ...(typeof completionCount === 'number' ? { completion_count: completionCount } : {}),
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,video_id' }
  )

  if (error) console.warn('[sync] watch_history upsert error:', error.message)
}

export async function removeWatchHistoryItem(userId: string, videoId: string) {
  const { error } = await supabase
    .from('watch_history')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId)

  if (error) console.warn('[sync] watch_history delete error:', error.message)
}

export async function clearWatchHistoryServer(userId: string) {
  const { error } = await supabase
    .from('watch_history')
    .delete()
    .eq('user_id', userId)

  if (error) console.warn('[sync] watch_history clear error:', error.message)
}

// ─── Phrase sync ──────────────────────────────────────────────────
export async function syncSavedPhrase(userId: string, phrase: SavedPhrase) {
  const { error } = await supabase.from('saved_phrases').upsert({
    id: phrase.id,
    user_id: userId,
    video_id: phrase.videoId,
    video_title: phrase.videoTitle,
    en: phrase.en,
    ko: phrase.ko,
    timestamp_start: phrase.timestampStart,
    timestamp_end: phrase.timestampEnd,
    review_count: phrase.reviewCount,
    saved_at: new Date(phrase.savedAt).toISOString(),
  })

  if (error) console.warn('[sync] saved_phrases upsert error:', error.message)
}

export async function removeSavedPhraseServer(userId: string, phraseId: string) {
  const { error } = await supabase
    .from('saved_phrases')
    .delete()
    .eq('user_id', userId)
    .eq('id', phraseId)

  if (error) console.warn('[sync] saved_phrases delete error:', error.message)
}

export function debouncedSyncPhraseReview(phraseId: string, reviewCount: number) {
  const userId = getCachedUserId()
  if (!userId) return
  debounced(`phrase-review-${phraseId}`, async () => {
    const { error } = await supabase
      .from('saved_phrases')
      .update({ review_count: reviewCount })
      .eq('user_id', userId)
      .eq('id', phraseId)

    if (error) console.warn('[sync] phrase review_count update error:', error.message)
  })
}

// ─── Bookmark sync ────────────────────────────────────────────────
export async function syncBookmark(userId: string, videoId: string, isBookmarked: boolean) {
  if (isBookmarked) {
    const { error } = await supabase.from('bookmarks').upsert(
      { user_id: userId, video_id: videoId },
      { onConflict: 'user_id,video_id' }
    )
    if (error) console.warn('[sync] bookmark upsert error:', error.message)
  } else {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId)
    if (error) console.warn('[sync] bookmark delete error:', error.message)
  }
}

// ─── Like sync ────────────────────────────────────────────────────
export async function syncLike(userId: string, videoId: string, isLiked: boolean) {
  if (isLiked) {
    const { error } = await supabase.from('likes').upsert(
      { user_id: userId, video_id: videoId },
      { onConflict: 'user_id,video_id' }
    )
    if (error) console.warn('[sync] like upsert error:', error.message)
  } else {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId)
    if (error) console.warn('[sync] like delete error:', error.message)
  }
}

// ─── Full sync on login (pull server → merge with local) ──────────
export async function syncOnLogin(userId: string) {
  setCachedUserId(userId)

  try {
    await Promise.all([
      pullProfile(userId),
      pullWatchHistory(userId),
      pullSavedPhrases(userId),
      pullBookmarks(userId),
      pullLikes(userId),
    ])
  } catch (err) {
    console.warn('[sync] syncOnLogin error:', err)
  }

  // After pulling, push local-only data to server
  try {
    await Promise.all([
      pushProfile(userId),
      pushWatchHistory(userId),
      pushSavedPhrases(userId),
      pushBookmarks(userId),
      pushLikes(userId),
    ])
  } catch (err) {
    console.warn('[sync] push-back error:', err)
  }
}

// ─── Pull functions (server → local, merge) ──────────────────────

async function pullProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return

  // Server wins for profile fields — take max of streak/level/xp
  const userState = useUserStore.getState()
  const serverLevel = data.level ?? 1
  const serverXp = data.xp ?? 0
  const serverStreak = data.streak_days ?? 0

  useUserStore.setState({
    level: Math.max(userState.level, serverLevel),
    xp: Math.max(userState.xp, serverXp),
    streakDays: Math.max(userState.streakDays, serverStreak),
    lastActivityDate: data.last_activity_date || userState.lastActivityDate,
  })

  // Onboarding: server wins if completed
  const onboardingState = useOnboardingStore.getState()
  if (data.onboarding_completed && !onboardingState.hasOnboarded) {
    useOnboardingStore.setState({
      hasOnboarded: true,
      hasSeenWelcome: true,
      interests: data.interests ?? onboardingState.interests,
      level: (data.onboarding_level as 'beginner' | 'intermediate' | 'advanced') ?? onboardingState.level,
      dailyGoal: data.daily_goal ?? onboardingState.dailyGoal,
    })
  }
}

async function pullWatchHistory(userId: string) {
  const { data, error } = await supabase
    .from('watch_history')
    .select('video_id, view_count, completion_count, last_watched_at')
    .eq('user_id', userId)

  if (error || !data) return

  const store = useWatchHistoryStore.getState()
  const localCounts = { ...store.viewCounts }
  const localCompletionCounts = { ...store.completionCounts }
  const localWatchedIds = [...store.watchedVideoIds]
  const localRecords = [...store.watchRecords]
  let changed = false

  for (const row of data) {
    const vid = row.video_id
    const serverCount = row.view_count ?? 1
    const serverCompletionCount = row.completion_count ?? 0
    const localCount = localCounts[vid] ?? 0
    const localCompletionCount = localCompletionCounts[vid] ?? 0

    // Take max view count
    if (serverCount > localCount) {
      localCounts[vid] = serverCount
      changed = true
    }

    if (serverCompletionCount > localCompletionCount) {
      localCompletionCounts[vid] = serverCompletionCount
      changed = true
    }

    // Add to watched list if not present
    if (!localWatchedIds.includes(vid)) {
      localWatchedIds.push(vid)
      localRecords.push({
        videoId: vid,
        watchedAt: new Date(row.last_watched_at).getTime(),
      })
      changed = true
    }
  }

  if (changed) {
    // Sort records by most recent first
    localRecords.sort((a, b) => b.watchedAt - a.watchedAt)
    // Re-derive watchedVideoIds from sorted records
    const sortedIds = [...new Set(localRecords.map((r) => r.videoId))]

    useWatchHistoryStore.setState({
      completionCounts: localCompletionCounts,
      viewCounts: localCounts,
      watchedVideoIds: sortedIds,
      watchRecords: localRecords.slice(0, 200),
    })
  }
}

async function pullSavedPhrases(userId: string) {
  const { data, error } = await supabase
    .from('saved_phrases')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })

  if (error || !data) return

  const store = usePhraseStore.getState()
  const localPhrases = [...store.phrases]
  const localIds = new Set(localPhrases.map((p) => p.id))
  // Also track by videoId+en to prevent content duplicates
  const localContentKeys = new Set(
    localPhrases.map((p) => `${p.videoId}::${p.en}`)
  )
  let changed = false

  for (const row of data) {
    const contentKey = `${row.video_id}::${row.en}`
    if (!localIds.has(row.id) && !localContentKeys.has(contentKey)) {
      localPhrases.push({
        id: row.id,
        videoId: row.video_id,
        videoTitle: row.video_title ?? '',
        en: row.en,
        ko: row.ko,
        timestampStart: row.timestamp_start ?? 0,
        timestampEnd: row.timestamp_end ?? 0,
        savedAt: new Date(row.saved_at).getTime(),
        reviewCount: row.review_count ?? 0,
      })
      localIds.add(row.id)
      localContentKeys.add(contentKey)
      changed = true
    } else if (localIds.has(row.id)) {
      // Update review count to max
      const idx = localPhrases.findIndex((p) => p.id === row.id)
      if (idx !== -1) {
        const serverReview = row.review_count ?? 0
        if (serverReview > localPhrases[idx].reviewCount) {
          localPhrases[idx] = { ...localPhrases[idx], reviewCount: serverReview }
          changed = true
        }
      }
    }
  }

  if (changed) {
    localPhrases.sort((a, b) => b.savedAt - a.savedAt)
    usePhraseStore.setState({ phrases: localPhrases })
  }
}

async function pullBookmarks(userId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('video_id')
    .eq('user_id', userId)

  if (error || !data) return

  const store = useBookmarkStore.getState()
  const localBookmarks = new Set(store.bookmarks)
  let changed = false

  for (const row of data) {
    if (!localBookmarks.has(row.video_id)) {
      localBookmarks.add(row.video_id)
      changed = true
    }
  }

  if (changed) {
    useBookmarkStore.setState({ bookmarks: [...localBookmarks] })
  }
}

async function pullLikes(userId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select('video_id')
    .eq('user_id', userId)

  if (error || !data) return

  const store = useLikeStore.getState()
  const localLikes = { ...store.likes }
  let changed = false

  for (const row of data) {
    if (!localLikes[row.video_id]) {
      localLikes[row.video_id] = true
      changed = true
    }
  }

  if (changed) {
    useLikeStore.setState({ likes: localLikes })
  }
}

// ─── Push functions (local → server, fill gaps) ──────────────────

async function pushProfile(userId: string) {
  await syncProfileToServer(userId)
}

async function pushWatchHistory(userId: string) {
  const { viewCounts, completionCounts } = useWatchHistoryStore.getState()
  const entries = Object.entries(viewCounts)
  if (entries.length === 0) return

  // Batch upsert: build rows
  const rows = entries.map(([videoId, count]) => ({
    user_id: userId,
    video_id: videoId,
    view_count: count,
    completion_count: completionCounts[videoId] ?? 0,
    last_watched_at: new Date().toISOString(),
  }))

  // Upsert in chunks of 50
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50)
    const { error } = await supabase
      .from('watch_history')
      .upsert(chunk, { onConflict: 'user_id,video_id' })
    if (error) console.warn('[sync] push watch_history error:', error.message)
  }
}

async function pushSavedPhrases(userId: string) {
  const { phrases } = usePhraseStore.getState()
  if (phrases.length === 0) return

  const rows = phrases.map((p) => ({
    id: p.id,
    user_id: userId,
    video_id: p.videoId,
    video_title: p.videoTitle,
    en: p.en,
    ko: p.ko,
    timestamp_start: p.timestampStart,
    timestamp_end: p.timestampEnd,
    review_count: p.reviewCount,
    saved_at: new Date(p.savedAt).toISOString(),
  }))

  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50)
    const { error } = await supabase
      .from('saved_phrases')
      .upsert(chunk, { onConflict: 'id' })
    if (error) console.warn('[sync] push saved_phrases error:', error.message)
  }
}

async function pushBookmarks(userId: string) {
  const { bookmarks } = useBookmarkStore.getState()
  if (bookmarks.length === 0) return

  const rows = bookmarks.map((videoId) => ({
    user_id: userId,
    video_id: videoId,
  }))

  const { error } = await supabase
    .from('bookmarks')
    .upsert(rows, { onConflict: 'user_id,video_id' })
  if (error) console.warn('[sync] push bookmarks error:', error.message)
}

async function pushLikes(userId: string) {
  const { likes } = useLikeStore.getState()
  const likedIds = Object.keys(likes)
  if (likedIds.length === 0) return

  const rows = likedIds.map((videoId) => ({
    user_id: userId,
    video_id: videoId,
  }))

  const { error } = await supabase
    .from('likes')
    .upsert(rows, { onConflict: 'user_id,video_id' })
  if (error) console.warn('[sync] push likes error:', error.message)
}

// ─── Logout cleanup ──────────────────────────────────────────────
export function onLogout() {
  setCachedUserId(null)
  // Clear all debounce timers
  for (const key of Object.keys(debounceTimers)) {
    clearTimeout(debounceTimers[key])
    delete debounceTimers[key]
  }
}
