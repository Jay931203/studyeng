const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'had',
  'has',
  'have',
  'he',
  'her',
  'him',
  'his',
  'how',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'me',
  'my',
  'not',
  'of',
  'on',
  'or',
  'our',
  'out',
  'she',
  'so',
  'than',
  'that',
  'the',
  'their',
  'them',
  'there',
  'they',
  'this',
  'to',
  'up',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'who',
  'why',
  'will',
  'with',
  'would',
  'you',
  'your',
])

export function buildAssetRecommendationSignals({
  coverage,
  transcriptEntries,
}) {
  const subtitleTokenCounts = countTokens(
    transcriptEntries.flatMap((entry) => tokenizeText(entry.en ?? ''))
  )

  return {
    englishSubtitleStatus: coverage.englishStatus,
    koreanSubtitleStatus: coverage.koreanStatus,
    subtitleKeywordCount: Object.keys(subtitleTokenCounts).length,
    subtitleTokens: rankTokens(subtitleTokenCounts, 20),
    transcriptEntryCount: coverage.entryCount,
  }
}

export function buildRecommendationManifest({
  assets,
  assetSignals,
  generatedAt,
  sourceManifestGeneratedAt,
  videos,
}) {
  const assetMap = new Map(assets.map((asset) => [asset.youtubeId, asset]))

  const manifestVideos = videos.map((video, index) => {
    const asset = assetMap.get(video.youtubeId) ?? null
    const signals = assetSignals.get(video.youtubeId) ?? emptyAssetSignals()
    const titleTokens = rankTokens(countTokens(tokenizeText(video.title)), 10)
    const topicTokens = unique([...titleTokens, ...signals.subtitleTokens]).slice(0, 24)
    const recommendable = asset?.externalPlaybackStatus !== 'blocked'
    const qualityTier =
      asset?.workflowStatus === 'ready'
        ? 'ready'
        : asset?.workflowStatus === 'blocked_external' || video.workflowStatus === 'blocked_external'
        ? 'blocked'
        : video.workflowStatus === 'needs_clip_review'
        ? 'needs_clip_review'
        : 'candidate'

    return {
      id: video.id,
      youtubeId: video.youtubeId,
      title: video.title,
      category: video.category,
      seriesId: video.seriesId,
      episodeNumber: video.episodeNumber,
      difficulty: video.difficulty,
      clipDurationSec: video.clipDurationSec,
      catalogIndex: index,
      workflowStatus: video.workflowStatus,
      assetWorkflowStatus: asset?.workflowStatus ?? 'missing',
      externalPlaybackStatus: asset?.externalPlaybackStatus ?? 'unchecked',
      englishSubtitleStatus: signals.englishSubtitleStatus,
      koreanSubtitleStatus: signals.koreanSubtitleStatus,
      transcriptEntryCount: signals.transcriptEntryCount,
      subtitleKeywordCount: signals.subtitleKeywordCount,
      recommendable,
      qualityTier,
      titleTokens,
      subtitleTokens: signals.subtitleTokens,
      topicTokens,
      keywordFingerprint: topicTokens.slice(0, 8).join('|'),
    }
  })

  const summary = {
    blockedVideos: manifestVideos.filter((video) => video.externalPlaybackStatus === 'blocked').length,
    recommendableVideos: manifestVideos.filter((video) => video.recommendable).length,
    totalVideos: manifestVideos.length,
    unreadyVideos: manifestVideos.filter((video) => !video.recommendable).length,
  }

  return {
    generatedAt,
    sourceManifestGeneratedAt,
    summary,
    videos: manifestVideos,
  }
}

function emptyAssetSignals() {
  return {
    englishSubtitleStatus: 'missing',
    koreanSubtitleStatus: 'missing',
    subtitleKeywordCount: 0,
    subtitleTokens: [],
    transcriptEntryCount: 0,
  }
}

function tokenizeText(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token) && !/^\d+$/.test(token))
}

function countTokens(tokens) {
  const counts = {}
  for (const token of tokens) {
    counts[token] = (counts[token] ?? 0) + 1
  }
  return counts
}

function rankTokens(counts, limit) {
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([token]) => token)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}
