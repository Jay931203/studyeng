export function buildShortsUrl(videoId?: string | null, seriesId?: string | null) {
  const params = new URLSearchParams()

  if (videoId) {
    params.set('v', videoId)
  }

  if (seriesId) {
    params.set('series', seriesId)
  }

  const query = params.toString()
  return query ? `/shorts?${query}` : '/shorts'
}
