interface BuildShortsUrlOptions {
  seriesPlayback?: boolean
}

export function buildShortsUrl(
  videoId?: string | null,
  seriesId?: string | null,
  options: BuildShortsUrlOptions = {},
) {
  const params = new URLSearchParams()

  if (videoId) {
    params.set('v', videoId)
  }

  if (seriesId) {
    params.set('series', seriesId)
  }

  if (options.seriesPlayback && seriesId) {
    params.set('playlist', 'series')
  }

  const query = params.toString()
  return query ? `/shorts?${query}` : '/shorts'
}
