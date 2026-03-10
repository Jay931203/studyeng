export interface HiddenVideoLike {
  videoId: string
}

export function createHiddenVideoIdSet(hiddenVideos: HiddenVideoLike[]) {
  return new Set(hiddenVideos.map((video) => video.videoId))
}

export function filterHiddenVideos<T extends { id: string }>(
  videos: T[],
  hiddenVideoIds: Set<string>,
) {
  return videos.filter((video) => !hiddenVideoIds.has(video.id))
}

export function filterHiddenItemsByVideoId<T extends { videoId: string }>(
  items: T[],
  hiddenVideoIds: Set<string>,
) {
  return items.filter((item) => !hiddenVideoIds.has(item.videoId))
}

export function isHiddenVideo(videoId: string | null | undefined, hiddenVideoIds: Set<string>) {
  return Boolean(videoId && hiddenVideoIds.has(videoId))
}
