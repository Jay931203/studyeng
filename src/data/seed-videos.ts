export interface SubtitleEntry {
  start: number
  end: number
  en: string
  ko: string
}

export interface VideoData {
  id: string
  youtubeId: string
  title: string
  category: CategoryId
  difficulty: number
  clipStart: number
  clipEnd: number
  seriesId?: string
  episodeNumber?: number
  subtitles: SubtitleEntry[]
}

export interface Series {
  id: string
  title: string
  category: CategoryId
  description: string
  thumbnailEmoji: string
  episodeCount: number
}

export type CategoryId = 'drama' | 'movie' | 'daily' | 'entertainment' | 'music' | 'animation'

export interface Category {
  id: CategoryId
  label: string
  icon: string
}

export const categories: Category[] = [
  { id: 'drama', label: '드라마', icon: '🎭' },
  { id: 'movie', label: '영화', icon: '🎬' },
  { id: 'daily', label: '일상', icon: '☕' },
  { id: 'entertainment', label: '예능', icon: '🎤' },
  { id: 'music', label: '음악', icon: '🎵' },
  { id: 'animation', label: '애니', icon: '🎨' },
]

export const series: Series[] = [
  // === Drama Series ===
  {
    id: 'friends-s1',
    title: 'Friends 시즌1 명장면',
    category: 'drama',
    description: '프렌즈 시즌1의 재밌는 장면으로 일상 영어를 배워요',
    thumbnailEmoji: '🛋️',
    episodeCount: 2,
  },
  {
    id: 'the-office',
    title: 'The Office 명장면',
    category: 'drama',
    description: '오피스 최고의 순간들로 직장 영어를 배워요',
    thumbnailEmoji: '🏢',
    episodeCount: 4,
  },
  {
    id: 'brooklyn-99',
    title: 'Brooklyn Nine-Nine 명장면',
    category: 'drama',
    description: '브루클린 나인나인의 웃긴 장면으로 영어를 배워요',
    thumbnailEmoji: '🚔',
    episodeCount: 2,
  },
  // === Movie Series ===
  {
    id: 'devil-wears-prada',
    title: '악마는 프라다를 입는다',
    category: 'movie',
    description: '패션 업계 영어와 비즈니스 표현을 배워요',
    thumbnailEmoji: '👠',
    episodeCount: 2,
  },
  {
    id: 'forrest-gump',
    title: '포레스트 검프 명장면',
    category: 'movie',
    description: '감동적인 명대사로 영어를 배워요',
    thumbnailEmoji: '🏃',
    episodeCount: 3,
  },
  {
    id: 'harry-potter',
    title: '해리포터 명장면',
    category: 'movie',
    description: '마법 세계의 명장면으로 영어를 배워요',
    thumbnailEmoji: '⚡',
    episodeCount: 1,
  },
  // === Entertainment Series ===
  {
    id: 'graham-norton',
    title: 'Graham Norton 베스트',
    category: 'entertainment',
    description: '영국 최고의 토크쇼에서 배우는 영어',
    thumbnailEmoji: '🇬🇧',
    episodeCount: 2,
  },
  {
    id: 'mean-tweets',
    title: 'Jimmy Kimmel 악플 읽기',
    category: 'entertainment',
    description: '셀럽들이 자기 악플을 읽는 웃긴 코너',
    thumbnailEmoji: '🐦',
    episodeCount: 1,
  },
  // === Music Series ===
  {
    id: 'pop-hits',
    title: '팝송으로 영어 배우기',
    category: 'music',
    description: '인기 팝송 가사로 자연스럽게 영어를 배워요',
    thumbnailEmoji: '🎶',
    episodeCount: 2,
  },
  // === Animation Series ===
  {
    id: 'pixar-moments',
    title: 'Pixar 명장면',
    category: 'animation',
    description: '픽사 애니메이션 명장면으로 영어를 배워요',
    thumbnailEmoji: '🎬',
    episodeCount: 2,
  },
]

export const seedVideos: VideoData[] = [
  // ============================================================
  // === DRAMA (8 videos) =======================================
  // ============================================================

  // --- Friends 시즌1 시리즈 ---
  {
    id: 'friends-1',
    youtubeId: 'RjpvuPAzJUw',
    title: 'Friends: 최고 웃긴 장면 모음',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'friends-s1',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'friends-3',
    youtubeId: 'E6LpBIwGyA4',
    title: 'Friends: 다들 챈들러 싫어해',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'friends-s1',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- The Office 시리즈 ---
  {
    id: 'office-fire',
    youtubeId: 'gO8N3L_aERg',
    title: 'The Office: 드와이트의 화재 훈련',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-office',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'office-jim-dwight',
    youtubeId: 'WaaANll8h18',
    title: 'The Office: 짐이 드와이트 흉내내기',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-office',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'office-pranks',
    youtubeId: 'Xnk4seEHmgw',
    title: 'The Office: 짐의 장난 12분 모음',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-office',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'office-morse',
    youtubeId: '8zfNfilNOIE',
    title: 'The Office: 모스 부호 장난',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-office',
    episodeNumber: 4,
    subtitles: [],
  },

  // --- Brooklyn Nine-Nine 시리즈 ---
  {
    id: 'b99-want-it',
    youtubeId: 'HlBYdiXdUa8',
    title: 'B99: I Want It That Way 라인업',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'brooklyn-99',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'b99-sing',
    youtubeId: 'ffyKY3Dj5ZE',
    title: 'B99: 범인들이 노래를 부르게 만든 제이크',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'brooklyn-99',
    episodeNumber: 2,
    subtitles: [],
  },

  // ============================================================
  // === MOVIE (7 videos) =======================================
  // ============================================================

  // --- 악마는 프라다를 입는다 시리즈 ---
  {
    id: 'prada-1',
    youtubeId: '2PjZAeiU7uM',
    title: '프라다 EP1: 미란다 등장!',
    category: 'movie',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'devil-wears-prada',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'prada-2',
    youtubeId: 'b2f2Kqt_KcE',
    title: '프라다 EP2: 앤디의 면접',
    category: 'movie',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'devil-wears-prada',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- 포레스트 검프 시리즈 ---
  {
    id: 'forrest-run',
    youtubeId: 'x2-MCPa_3rU',
    title: '포레스트 검프: 달려라, 포레스트!',
    category: 'movie',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'forrest-gump',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'forrest-chocolates',
    youtubeId: 'SqOnkiQRCUU',
    title: '포레스트 검프: 인생은 초콜릿 상자',
    category: 'movie',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'forrest-gump',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'forrest-peas',
    youtubeId: 'tvKzyYy6qvY',
    title: '포레스트 검프: 완두콩과 당근',
    category: 'movie',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'forrest-gump',
    episodeNumber: 3,
    subtitles: [],
  },

  {
    id: 'hp-moody',
    youtubeId: 'wsl5fS7KGZc',
    title: '해리포터: 매드아이 무디의 수업',
    category: 'movie',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'harry-potter',
    episodeNumber: 1,
    subtitles: [],
  },

  // --- Mean Girls ---
  {
    id: 'meangirls-plastics',
    youtubeId: 're5veV2F7eY',
    title: '퀸카로 살아남는 법: 플라스틱들',
    category: 'movie',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // ============================================================
  // === DAILY (2 videos) =======================================
  // ============================================================

  {
    id: 'restaurant-modern',
    youtubeId: 'ajb-YbY3-rw',
    title: '모던패밀리: 베트남 레스토랑',
    category: 'daily',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },
  {
    id: 'daily-modernfamily',
    youtubeId: '0mapwWviBEM',
    title: '모던패밀리: 월리 코스튬의 릴리',
    category: 'daily',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // ============================================================
  // === ENTERTAINMENT (4 videos) ===============================
  // ============================================================

  // --- Graham Norton 시리즈 ---
  {
    id: 'norton-1',
    youtubeId: 'ZwS14TiO7Pk',
    title: 'Graham Norton: 윌 스미스 팀 랩',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'graham-norton',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'norton-2',
    youtubeId: 'yuXGpUR7fXA',
    title: 'Graham Norton: 라이언 고슬링 웃음 참기',
    category: 'entertainment',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'graham-norton',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- Jimmy Kimmel 악플 읽기 ---
  {
    id: 'mean-tweets-1',
    youtubeId: 'RRBoPveyETc',
    title: '지미 키멜: 셀럽 악플 읽기 #1',
    category: 'entertainment',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'mean-tweets',
    episodeNumber: 1,
    subtitles: [],
  },

  // --- Conan ---
  {
    id: 'conan-supercut',
    youtubeId: 'wyDU93xVAJs',
    title: '코난: 시즌4 하이라이트',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // ============================================================
  // === MUSIC (2 videos) =======================================
  // ============================================================

  {
    id: 'music-shapeofyou',
    youtubeId: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You',
    category: 'music',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pop-hits',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'music-hello',
    youtubeId: 'YQHsXMglC9A',
    title: 'Adele - Hello',
    category: 'music',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pop-hits',
    episodeNumber: 2,
    subtitles: [],
  },

  // ============================================================
  // === ANIMATION (2 videos) ===================================
  // ============================================================

  {
    id: 'anim-insideout',
    youtubeId: 'M7KelAaqsCg',
    title: '인사이드 아웃 2: 명장면 모음',
    category: 'animation',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pixar-moments',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'anim-toystory',
    youtubeId: 'w7UGkviTIpY',
    title: '토이스토리 3: 명장면',
    category: 'animation',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pixar-moments',
    episodeNumber: 2,
    subtitles: [],
  },
]

// Helper functions
export function getSeriesById(seriesId: string): Series | undefined {
  return series.find(s => s.id === seriesId)
}

export function getVideosBySeries(seriesId: string): VideoData[] {
  return seedVideos
    .filter(v => v.seriesId === seriesId)
    .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
}

export function getVideosByCategory(categoryId: CategoryId): VideoData[] {
  return seedVideos.filter(v => v.category === categoryId)
}

export function getSeriesByCategory(categoryId: CategoryId): Series[] {
  return series.filter(s => s.category === categoryId)
}

export function getAllPhrases(): SubtitleEntry[] {
  return seedVideos.flatMap(v => v.subtitles)
}
