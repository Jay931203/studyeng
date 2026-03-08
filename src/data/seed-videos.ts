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
    id: 'big-bang-theory',
    title: 'The Big Bang Theory',
    category: 'drama',
    description: '천재 물리학자들의 유쾌한 일상',
    thumbnailEmoji: '',
    episodeCount: 3,
  },
  {
    id: 'brooklyn-99',
    title: 'Brooklyn Nine-Nine',
    category: 'drama',
    description: '경찰서 코미디로 배우는 영어',
    thumbnailEmoji: '',
    episodeCount: 2,
  },
  {
    id: 'friends-s1',
    title: 'Friends S1',
    category: 'drama',
    description: '90년대 뉴욕 친구들의 일상 영어',
    thumbnailEmoji: '',
    episodeCount: 2,
  },
  {
    id: 'modern-family',
    title: 'Modern Family',
    category: 'drama',
    description: '모던패밀리의 웃긴 장면으로 일상 영어를 배워요',
    thumbnailEmoji: '',
    episodeCount: 2,
  },
  {
    id: 'parks-rec',
    title: 'Parks and Recreation',
    category: 'drama',
    description: '공원관리국 공무원들의 좌충우돌',
    thumbnailEmoji: '',
    episodeCount: 2,
  },
  {
    id: 'seinfeld',
    title: 'Seinfeld',
    category: 'drama',
    description: '아무것도 아닌 것에 관한 코미디',
    thumbnailEmoji: '',
    episodeCount: 2,
  },
  {
    id: 'the-office',
    title: 'The Office',
    category: 'drama',
    description: '미국 직장 생활 영어의 정석',
    thumbnailEmoji: '',
    episodeCount: 5,
  },

  // === Movie Series ===
  {
    id: 'devil-wears-prada',
    title: '악마는 프라다를 입는다',
    category: 'movie',
    description: '패션 업계 비즈니스 영어',
    thumbnailEmoji: '',
    episodeCount: 2,
  },
  {
    id: 'forrest-gump',
    title: 'Forrest Gump',
    category: 'movie',
    description: '감동적인 미국 영화 명대사',
    thumbnailEmoji: '',
    episodeCount: 3,
  },
  {
    id: 'harry-potter',
    title: 'Harry Potter',
    category: 'movie',
    description: '호그와트 마법 세계의 영어',
    thumbnailEmoji: '',
    episodeCount: 1,
  },
  {
    id: 'marvel-mcu',
    title: 'Marvel MCU',
    category: 'movie',
    description: '마블 히어로들의 명장면',
    thumbnailEmoji: '',
    episodeCount: 1,
  },
  {
    id: 'mean-girls',
    title: 'Mean Girls',
    category: 'movie',
    description: '퀸카로 살아남는 법 명장면',
    thumbnailEmoji: '',
    episodeCount: 1,
  },
  {
    id: 'notting-hill',
    title: 'Notting Hill',
    category: 'movie',
    description: '런던 서점 주인과 할리우드 스타',
    thumbnailEmoji: '',
    episodeCount: 2,
  },

  // === Entertainment Series ===
  {
    id: 'carpool-karaoke',
    title: 'Carpool Karaoke',
    category: 'entertainment',
    description: '제임스 코든과 스타의 차 안 노래',
    thumbnailEmoji: '',
    episodeCount: 1,
  },
  {
    id: 'conan',
    title: 'Conan',
    category: 'entertainment',
    description: '코난 오브라이언의 레이트 나이트 쇼',
    thumbnailEmoji: '',
    episodeCount: 2,
  },
  {
    id: 'graham-norton',
    title: 'Graham Norton Show',
    category: 'entertainment',
    description: '영국 최고의 토크쇼',
    thumbnailEmoji: '',
    episodeCount: 2,
  },
  {
    id: 'jimmy-fallon',
    title: 'The Tonight Show',
    category: 'entertainment',
    description: '지미 팰런의 투나잇 쇼',
    thumbnailEmoji: '',
    episodeCount: 2,
  },
  {
    id: 'mean-tweets',
    title: 'Mean Tweets',
    category: 'entertainment',
    description: '셀럽들이 자기 악플을 읽는 웃긴 코너',
    thumbnailEmoji: '',
    episodeCount: 1,
  },

  // === Music Series ===
  {
    id: 'pop-hits',
    title: 'Pop Hits',
    category: 'music',
    description: '인기 팝송으로 배우는 영어',
    thumbnailEmoji: '',
    episodeCount: 2,
  },

  // === Animation Series ===
  {
    id: 'pixar-moments',
    title: 'Pixar Classics',
    category: 'animation',
    description: '픽사 애니메이션 베스트',
    thumbnailEmoji: '',
    episodeCount: 2,
  },
]

export const seedVideos: VideoData[] = [
  // ============================================================
  // === DRAMA (18 videos) ======================================
  // ============================================================

  // --- Friends 시즌1 시리즈 ---
  {
    id: 'friends-1',
    youtubeId: 'RjpvuPAzJUw',
    title: '최고 웃긴 장면 모음',
    category: 'drama',
    difficulty: 2,
    clipStart: 4,
    clipEnd: 66,
    seriesId: 'friends-s1',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'friends-3',
    youtubeId: 'E6LpBIwGyA4',
    title: '다들 챈들러 싫어해',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 69,
    seriesId: 'friends-s1',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- The Office 시리즈 ---
  {
    id: 'office-fire',
    youtubeId: 'gO8N3L_aERg',
    title: '드와이트의 화재 훈련',
    category: 'drama',
    difficulty: 3,
    clipStart: 10,
    clipEnd: 55,
    seriesId: 'the-office',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'office-jim-dwight',
    youtubeId: 'WaaANll8h18',
    title: '짐이 드와이트 흉내내기',
    category: 'drama',
    difficulty: 2,
    clipStart: 12,
    clipEnd: 67,
    seriesId: 'the-office',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'office-pranks',
    youtubeId: 'Xnk4seEHmgw',
    title: '짐의 장난 모음',
    category: 'drama',
    difficulty: 3,
    clipStart: 6,
    clipEnd: 64,
    seriesId: 'the-office',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'office-morse',
    youtubeId: '8zfNfilNOIE',
    title: '모스 부호 장난',
    category: 'drama',
    difficulty: 3,
    clipStart: 11,
    clipEnd: 61,
    seriesId: 'the-office',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'office-kevin-chili',
    youtubeId: 'WcYG-5b7448',
    title: '케빈의 칠리 대참사',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 50,
    seriesId: 'the-office',
    episodeNumber: 5,
    subtitles: [],
  },

  // --- Brooklyn Nine-Nine 시리즈 ---
  {
    id: 'b99-want-it',
    youtubeId: 'HlBYdiXdUa8',
    title: 'I Want It That Way 라인업',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 63,
    seriesId: 'brooklyn-99',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'b99-sing',
    youtubeId: 'ffyKY3Dj5ZE',
    title: '범인들이 노래 부르게 만든 제이크',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 65,
    seriesId: 'brooklyn-99',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- The Big Bang Theory 시리즈 ---
  {
    id: 'bbt-02',
    youtubeId: 'AEIn3T6nDAo',
    title: '물리학이란 무엇인가',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 55,
    seriesId: 'big-bang-theory',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'bbt-03',
    youtubeId: 'r0ov89KPtDQ',
    title: '드레이크 방정식 논쟁',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'big-bang-theory',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'bbt-05',
    youtubeId: '-e5CtbbZL-k',
    title: '레이저로 달까지 거리 재기',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 55,
    seriesId: 'big-bang-theory',
    episodeNumber: 3,
    subtitles: [],
  },

  // --- Seinfeld 시리즈 ---
  {
    id: 'seinfeld-01',
    youtubeId: '0u8KUgUqprw',
    title: '조지의 해양학자 연설',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'seinfeld',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'seinfeld-02',
    youtubeId: 'QRh1CMC3OVw',
    title: '텔레마케터 역관광',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 50,
    seriesId: 'seinfeld',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- Parks and Recreation 시리즈 ---
  {
    id: 'parks-01',
    youtubeId: 'HrIeP798hiQ',
    title: '론의 베이컨과 달걀 전부',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 50,
    seriesId: 'parks-rec',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'parks-02',
    youtubeId: 'LinpRhB4aWU',
    title: '앤디의 네트워크 연결 문제 진단',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 55,
    seriesId: 'parks-rec',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- Modern Family 시리즈 ---
  {
    id: 'restaurant-modern',
    youtubeId: 'ajb-YbY3-rw',
    title: '베트남 레스토랑',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 66,
    seriesId: 'modern-family',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'daily-modernfamily',
    youtubeId: '0mapwWviBEM',
    title: '월리 코스튬의 릴리',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 65,
    seriesId: 'modern-family',
    episodeNumber: 2,
    subtitles: [],
  },

  // ============================================================
  // === MOVIE (10 videos) ======================================
  // ============================================================

  // --- 악마는 프라다를 입는다 시리즈 ---
  {
    id: 'prada-1',
    youtubeId: '2PjZAeiU7uM',
    title: '미란다 등장!',
    category: 'movie',
    difficulty: 3,
    clipStart: 4,
    clipEnd: 45,
    seriesId: 'devil-wears-prada',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'prada-2',
    youtubeId: 'b2f2Kqt_KcE',
    title: '앤디의 면접',
    category: 'movie',
    difficulty: 4,
    clipStart: 4,
    clipEnd: 65,
    seriesId: 'devil-wears-prada',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- 포레스트 검프 시리즈 ---
  {
    id: 'forrest-run',
    youtubeId: 'x2-MCPa_3rU',
    title: '달려라, 포레스트!',
    category: 'movie',
    difficulty: 2,
    clipStart: 2,
    clipEnd: 48,
    seriesId: 'forrest-gump',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'forrest-chocolates',
    youtubeId: 'SqOnkiQRCUU',
    title: '인생은 초콜릿 상자',
    category: 'movie',
    difficulty: 2,
    clipStart: 4,
    clipEnd: 70,
    seriesId: 'forrest-gump',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'forrest-peas',
    youtubeId: 'tvKzyYy6qvY',
    title: '완두콩과 당근',
    category: 'movie',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 67,
    seriesId: 'forrest-gump',
    episodeNumber: 3,
    subtitles: [],
  },

  // --- Harry Potter 시리즈 ---
  {
    id: 'hp-moody',
    youtubeId: 'wsl5fS7KGZc',
    title: '매드아이 무디의 수업',
    category: 'movie',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 66,
    seriesId: 'harry-potter',
    episodeNumber: 1,
    subtitles: [],
  },

  // --- Marvel MCU 시리즈 ---
  {
    id: 'marvel-avengers',
    youtubeId: 'udKE1ksKWDE',
    title: '어벤져스 뉴욕 전투',
    category: 'movie',
    difficulty: 3,
    clipStart: 10,
    clipEnd: 65,
    seriesId: 'marvel-mcu',
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
    clipEnd: 59,
    seriesId: 'mean-girls',
    episodeNumber: 1,
    subtitles: [],
  },

  // --- Notting Hill 시리즈 ---
  {
    id: 'nottinghill-01',
    youtubeId: 'RESwG23_YGw',
    title: '그냥 한 소녀의 고백',
    category: 'movie',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'notting-hill',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'nottinghill-02',
    youtubeId: 'kE5IzU8KiJ4',
    title: '기자회견에서의 재회',
    category: 'movie',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 55,
    seriesId: 'notting-hill',
    episodeNumber: 2,
    subtitles: [],
  },

  // ============================================================
  // === ENTERTAINMENT (8 videos) ===============================
  // ============================================================

  // --- Graham Norton 시리즈 ---
  {
    id: 'norton-1',
    youtubeId: 'ZwS14TiO7Pk',
    title: '윌 스미스 팀 랩',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 65,
    seriesId: 'graham-norton',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'norton-2',
    youtubeId: 'yuXGpUR7fXA',
    title: '라이언 고슬링 웃음 참기',
    category: 'entertainment',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 64,
    seriesId: 'graham-norton',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- Jimmy Kimmel 악플 읽기 ---
  {
    id: 'mean-tweets-1',
    youtubeId: 'RRBoPveyETc',
    title: '셀럽 악플 읽기 #1',
    category: 'entertainment',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 68,
    seriesId: 'mean-tweets',
    episodeNumber: 1,
    subtitles: [],
  },

  // --- Jimmy Fallon 시리즈 ---
  {
    id: 'fallon-01',
    youtubeId: 'sMKoNBRZM1M',
    title: '히스토리 오브 랩 with JT',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 10,
    clipEnd: 65,
    seriesId: 'jimmy-fallon',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'fallon-03',
    youtubeId: 'gJ_cx3AmCuI',
    title: '해리슨 포드가 귀를 뚫어준 날',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 55,
    seriesId: 'jimmy-fallon',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- Carpool Karaoke 시리즈 ---
  {
    id: 'carpool-01',
    youtubeId: 'JKJExBXRorA',
    title: '아델과 카풀 노래방',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 30,
    clipEnd: 90,
    seriesId: 'carpool-karaoke',
    episodeNumber: 1,
    subtitles: [],
  },

  // --- Conan 시리즈 ---
  {
    id: 'conan-supercut',
    youtubeId: 'wyDU93xVAJs',
    title: '시즌4 하이라이트',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 49,
    seriesId: 'conan',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'conan-korea',
    youtubeId: 'k70xBg8en-4',
    title: '코난의 한국 찜질방 체험',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 10,
    clipEnd: 65,
    seriesId: 'conan',
    episodeNumber: 2,
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
    clipStart: 14,
    clipEnd: 67,
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
    clipEnd: 66,
    seriesId: 'pop-hits',
    episodeNumber: 2,
    subtitles: [],
  },

  // ============================================================
  // === ANIMATION (2 videos) ==================================
  // ============================================================

  // --- Pixar Classics 시리즈 ---
  {
    id: 'anim-insideout',
    youtubeId: 'M7KelAaqsCg',
    title: '인사이드 아웃 2',
    category: 'animation',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 67,
    seriesId: 'pixar-moments',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'anim-toystory',
    youtubeId: 'w7UGkviTIpY',
    title: '토이스토리 3',
    category: 'animation',
    difficulty: 2,
    clipStart: 11,
    clipEnd: 66,
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
