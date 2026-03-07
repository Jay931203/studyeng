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

export type CategoryId = 'drama' | 'movie' | 'daily' | 'travel' | 'business' | 'entertainment' | 'music' | 'animation'

export interface Category {
  id: CategoryId
  label: string
  icon: string
}

export const categories: Category[] = [
  { id: 'drama', label: '드라마', icon: '🎭' },
  { id: 'movie', label: '영화', icon: '🎬' },
  { id: 'daily', label: '일상', icon: '☕' },
  { id: 'travel', label: '여행', icon: '✈️' },
  { id: 'business', label: '비즈니스', icon: '💼' },
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
    episodeCount: 4,
  },
  {
    id: 'the-office',
    title: 'The Office 명장면',
    category: 'drama',
    description: '오피스 최고의 순간들로 직장 영어를 배워요',
    thumbnailEmoji: '🏢',
    episodeCount: 5,
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
    episodeCount: 3,
  },
  {
    id: 'forrest-gump',
    title: '포레스트 검프 명장면',
    category: 'movie',
    description: '감동적인 명대사로 영어를 배워요',
    thumbnailEmoji: '🏃',
    episodeCount: 2,
  },
  {
    id: 'harry-potter',
    title: '해리포터 명장면',
    category: 'movie',
    description: '마법 세계의 명장면으로 영어를 배워요',
    thumbnailEmoji: '⚡',
    episodeCount: 3,
  },
  // === Daily Series ===
  {
    id: 'coffee-english',
    title: '카페 영어 마스터',
    category: 'daily',
    description: '카페에서 자주 쓰는 영어 표현 총정리',
    thumbnailEmoji: '☕',
    episodeCount: 3,
  },
  {
    id: 'restaurant-english',
    title: '레스토랑 영어',
    category: 'daily',
    description: '레스토랑에서 주문하고 대화하는 영어',
    thumbnailEmoji: '🍽️',
    episodeCount: 2,
  },
  {
    id: 'shopping-english',
    title: '쇼핑 영어',
    category: 'daily',
    description: '마트에서 쇼핑할 때 쓰는 영어 표현',
    thumbnailEmoji: '🛒',
    episodeCount: 1,
  },
  // === Travel Series ===
  {
    id: 'airport-survival',
    title: '공항 서바이벌 영어',
    category: 'travel',
    description: '공항에서 살아남기 위한 필수 표현',
    thumbnailEmoji: '🛫',
    episodeCount: 3,
  },
  {
    id: 'hotel-english',
    title: '호텔 영어',
    category: 'travel',
    description: '호텔 예약부터 체크인까지',
    thumbnailEmoji: '🏨',
    episodeCount: 1,
  },
  // === Business Series ===
  {
    id: 'office-talk',
    title: '직장인 영어 회화',
    category: 'business',
    description: '회의, 이메일, 스몰톡까지',
    thumbnailEmoji: '🏢',
    episodeCount: 3,
  },
  {
    id: 'job-interview',
    title: '영어 면접 마스터',
    category: 'business',
    description: '영어 면접에서 자주 나오는 표현',
    thumbnailEmoji: '👔',
    episodeCount: 1,
  },
  // === Entertainment Series ===
  {
    id: 'talk-show-best',
    title: '토크쇼 베스트 모먼트',
    category: 'entertainment',
    description: '미국 토크쇼에서 배우는 자연스러운 영어',
    thumbnailEmoji: '🎙️',
    episodeCount: 5,
  },
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
    episodeCount: 4,
  },
  // === Animation Series ===
  {
    id: 'pixar-moments',
    title: 'Pixar 명장면',
    category: 'animation',
    description: '픽사 애니메이션 명장면으로 영어를 배워요',
    thumbnailEmoji: '🎬',
    episodeCount: 4,
  },
]

export const seedVideos: VideoData[] = [
  // ============================================================
  // === DRAMA (10 videos) =======================================
  // ============================================================

  // --- Friends 시즌1 시리즈 ---
  {
    id: 'friends-1',
    youtubeId: 'RjpvuPAzJUw',  // VERIFIED: Friends Funniest Moments! | Warner Bros. TV
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
    id: 'friends-2',
    youtubeId: '2_XiKIvXVEw',  // VERIFIED: Learn English with Friends TV show
    title: 'Friends EP2: 프렌즈로 영어 배우기',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 30,
    seriesId: 'friends-s1',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'friends-3',
    youtubeId: 'E6LpBIwGyA4',  // VERIFIED: Friends: Everybody Hates Chandler (Season 1 Clip) | TBS
    title: 'Friends EP3: 다들 챈들러 싫어해',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'friends-s1',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'friends-4',
    youtubeId: 'jHOMQt_hSDg',  // VERIFIED: Rachel Can't Stand Her New Coworker | Friends | TBS
    title: 'Friends EP4: 새 동료가 싫은 레이첼',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'friends-s1',
    episodeNumber: 4,
    subtitles: [],
  },

  // --- The Office 시리즈 ---
  {
    id: 'office-fire',
    youtubeId: 'gO8N3L_aERg',  // VERIFIED: Fire Drill - The Office US | The Office
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
    id: 'office-firstaid',
    youtubeId: 'Vmb1tqYqyII',  // VERIFIED: First Aid Fail - The Office US | The Office
    title: 'The Office: 응급처치 대참사',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-office',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'office-jim-dwight',
    youtubeId: 'WaaANll8h18',  // VERIFIED: Jim vs Dwight - Jim Impersonates Dwight | The Office
    title: 'The Office: 짐이 드와이트 흉내내기',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-office',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'office-pranks',
    youtubeId: 'Xnk4seEHmgw',  // VERIFIED: Jim Pranking Dwight for 12 Minutes | The Office
    title: 'The Office: 짐의 장난 12분 모음',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-office',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'office-morse',
    youtubeId: '8zfNfilNOIE',  // VERIFIED: Morse Code - The Office US | The Office
    title: 'The Office: 모스 부호 장난',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-office',
    episodeNumber: 5,
    subtitles: [],
  },

  // --- Brooklyn Nine-Nine 시리즈 ---
  {
    id: 'b99-want-it',
    youtubeId: 'HlBYdiXdUa8',  // VERIFIED: I Want It That Way | Brooklyn Nine-Nine
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
    youtubeId: 'ffyKY3Dj5ZE',  // VERIFIED: Jake Makes the Criminals Sing | Brooklyn Nine-Nine
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
  // === MOVIE (10 videos) =======================================
  // ============================================================

  // --- 악마는 프라다를 입는다 시리즈 ---
  {
    id: 'prada-1',
    youtubeId: '2PjZAeiU7uM',  // VERIFIED: The Devil Wears Prada (1/5) - Gird Your Loins! | Movieclips
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
    youtubeId: 'b2f2Kqt_KcE',  // VERIFIED: The Devil Wears Prada (2/5) - Andy's Interview | Movieclips
    title: '프라다 EP2: 앤디의 면접',
    category: 'movie',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'devil-wears-prada',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'prada-3',
    youtubeId: '-qdHE9-8spU',  // VERIFIED: The Devil Wears Prada (5/5) - Everyone Wants to Be Us | Movieclips
    title: '프라다 EP3: 모두가 우리가 되고 싶어해',
    category: 'movie',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'devil-wears-prada',
    episodeNumber: 3,
    subtitles: [],
  },

  // --- 포레스트 검프 시리즈 ---
  {
    id: 'forrest-run',
    youtubeId: 'x2-MCPa_3rU',  // VERIFIED: Run, Forrest, Run! - Forrest Gump (2/9) Movie CLIP | Movieclips
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
    youtubeId: 'SqOnkiQRCUU',  // VERIFIED: Life is a Box of Chocolates - Forrest Gump (7/9) | Movieclips
    title: '포레스트 검프: 인생은 초콜릿 상자',
    category: 'movie',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'forrest-gump',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- 해리포터 시리즈 ---
  {
    id: 'hp-birthday',
    youtubeId: '50N2eB0JI80',  // VERIFIED: Harry Potter Sorcerer's Stone (1/5) - Harry's Birthday | Movieclips
    title: '해리포터: 해리의 생일',
    category: 'movie',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'harry-potter',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'hp-voldemort',
    youtubeId: '2bujRZhOt9w',  // VERIFIED: Harry Battles Voldemort - Goblet of Fire (4/5) | Movieclips
    title: '해리포터: 볼드모트와의 대결',
    category: 'movie',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'harry-potter',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'hp-moody',
    youtubeId: 'wsl5fS7KGZc',  // VERIFIED: Harry Potter Goblet of Fire (1/5) - Mad-Eye Moody's Class | Movieclips
    title: '해리포터: 매드아이 무디의 수업',
    category: 'movie',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'harry-potter',
    episodeNumber: 3,
    subtitles: [],
  },

  // --- Mean Girls ---
  {
    id: 'meangirls-plastics',
    youtubeId: 're5veV2F7eY',  // VERIFIED: Mean Girls (1/10) - Meeting the Plastics | Movieclips
    title: '퀸카로 살아남는 법: 플라스틱들',
    category: 'movie',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // --- Titanic ---
  {
    id: 'titanic-wontletgo',
    youtubeId: 'zSRvmHSgaBg',  // VERIFIED: TITANIC | "Won't Let Go" Clip | Paramount Movies
    title: '타이타닉: 절대 놓지 않을게',
    category: 'movie',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // ============================================================
  // === DAILY (8 videos) ========================================
  // ============================================================

  // --- 카페 영어 시리즈 ---
  {
    id: 'cafe-1',
    youtubeId: 'jhEtBuuYNj4',  // VERIFIED: How To Order Coffee In English | Ariannita la Gringa
    title: '카페 EP1: 기본 주문',
    category: 'daily',
    difficulty: 1,
    clipStart: 0,
    clipEnd: 30,
    seriesId: 'coffee-english',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'cafe-2',
    youtubeId: 'v-jIvacpsxI',  // VERIFIED: How to ORDER COFFEE in English at Starbucks | Cloud English
    title: '카페 EP2: 스타벅스 주문하기',
    category: 'daily',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 30,
    seriesId: 'coffee-english',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'cafe-3',
    youtubeId: 'CjzrznCrUTI',  // VERIFIED: At the Restaurant English Conversation | EverydayEnglish
    title: '카페 EP3: 문제 해결하기',
    category: 'daily',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 30,
    seriesId: 'coffee-english',
    episodeNumber: 3,
    subtitles: [],
  },

  // --- 레스토랑 영어 시리즈 ---
  {
    id: 'restaurant-1',
    youtubeId: 'LFAmeYrB3UA',  // VERIFIED: English Conversations at the Restaurant | Learn English with Jessica
    title: '레스토랑 EP1: 영어로 주문하기',
    category: 'daily',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'restaurant-english',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'restaurant-modern',
    youtubeId: 'ajb-YbY3-rw',  // VERIFIED: Modern Family | Lily Vietnamese Restaurant | Peacock
    title: '레스토랑 EP2: 모던패밀리 레스토랑',
    category: 'daily',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'restaurant-english',
    episodeNumber: 2,
    subtitles: [],
  },

  // --- 쇼핑 영어 ---
  {
    id: 'shopping-grocery',
    youtubeId: 'SwfQ_GpYBNw',  // VERIFIED: English Conversation - Grocery Store | Rachel's English
    title: '마트에서 쇼핑 영어',
    category: 'daily',
    difficulty: 1,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'shopping-english',
    episodeNumber: 1,
    subtitles: [],
  },

  // --- 모던패밀리 (일상) ---
  {
    id: 'daily-modernfamily',
    youtubeId: '0mapwWviBEM',  // VERIFIED: Cam Can't Find Lily in Her Waldo Costume | Modern Family | TBS
    title: '모던패밀리: 월리 코스튬의 릴리',
    category: 'daily',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // --- HIMYM ---
  {
    id: 'daily-himym',
    youtubeId: 'IY_bhVSGKEg',  // VERIFIED: Robin Sparkles - Let's Go To The Mall (full version)
    title: 'HIMYM: 로빈 스파클스 - 몰에 가자!',
    category: 'daily',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // ============================================================
  // === TRAVEL (6 videos) =======================================
  // ============================================================

  // --- 공항 서바이벌 시리즈 ---
  {
    id: 'airport-1',
    youtubeId: 'f-d-R_6Wtlc',  // VERIFIED: At the Airport | Learn through English conversation | EverydayEnglish
    title: '공항 EP1: 체크인',
    category: 'travel',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 30,
    seriesId: 'airport-survival',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'airport-2',
    youtubeId: 'Lympa-566Ek',  // VERIFIED: English Conversation - Checking in at an airport | Rachel's English
    title: '공항 EP2: 보안검색',
    category: 'travel',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 30,
    seriesId: 'airport-survival',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'airport-3',
    youtubeId: 'jJI5AsI5lBc',  // VERIFIED: Checking in at an airport | Bill Cooper
    title: '공항 EP3: 길 찾기',
    category: 'travel',
    difficulty: 1,
    clipStart: 0,
    clipEnd: 30,
    seriesId: 'airport-survival',
    episodeNumber: 3,
    subtitles: [],
  },

  // --- 호텔 영어 시리즈 ---
  {
    id: 'hotel-1',
    youtubeId: 'KY0K5f06adg',  // VERIFIED: English conversation with subtitles | Hotel reservation | Crown Academy
    title: '호텔 EP1: 전화로 예약하기',
    category: 'travel',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'hotel-english',
    episodeNumber: 1,
    subtitles: [],
  },

  // --- 여행 영어 더 배우기 ---
  {
    id: 'travel-directions',
    youtubeId: '1lfyb9sIxuc',  // VERIFIED: Learn English With Friends | What Do You Feel When You Turn 30?
    title: '프렌즈로 여행 영어 배우기',
    category: 'travel',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // --- 영화로 여행 꿈꾸기 ---
  {
    id: 'travel-forrest',
    youtubeId: 'tvKzyYy6qvY',  // VERIFIED: Forrest Gump (1/9) - Peas and Carrots | Movieclips
    title: '포레스트 검프: 완두콩과 당근',
    category: 'travel',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // ============================================================
  // === BUSINESS (6 videos) =====================================
  // ============================================================

  // --- 직장인 영어 시리즈 ---
  {
    id: 'office-1',
    youtubeId: 'MTM_bnkrz-c',  // VERIFIED: Business English - English Dialogues at Work | Boston English Centre
    title: '직장 EP1: 회의 스몰톡',
    category: 'business',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'office-talk',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'office-2',
    youtubeId: 'XFkDSotI-Z8',  // VERIFIED: Improve English Listening and Speaking | Business English
    title: '직장 EP2: 이메일 표현',
    category: 'business',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'office-talk',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'office-3',
    youtubeId: 'vwxIz4sYpBw',  // VERIFIED: Global Business Speaks English | Delightful to Speak
    title: '직장 EP3: 프레젠테이션',
    category: 'business',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'office-talk',
    episodeNumber: 3,
    subtitles: [],
  },

  // --- 영어 면접 시리즈 ---
  {
    id: 'interview-1',
    youtubeId: '-JNjsOX0N0c',  // VERIFIED: English Job Interview Dos & Don'ts! | Rachel's English
    title: '영어 면접: Do & Don\'t',
    category: 'business',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'job-interview',
    episodeNumber: 1,
    subtitles: [],
  },

  // --- ESL 면접 ---
  {
    id: 'interview-esl',
    youtubeId: 'naIkpQ_cIt0',  // VERIFIED: Job Interview: I Want to Learn (ESL)
    title: '영어 면접: 배우고 싶습니다',
    category: 'business',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // --- 비즈니스 - 프라다 (직장 생활) ---
  {
    id: 'business-prada',
    youtubeId: 'Pzq6O31u8fY',  // VERIFIED: Speaking English with Friends | Rachel's English
    title: '프렌즈로 비즈니스 영어 배우기',
    category: 'business',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // ============================================================
  // === ENTERTAINMENT (10 videos) ===============================
  // ============================================================

  // --- 토크쇼 베스트 시리즈 ---
  {
    id: 'talkshow-1',
    youtubeId: 'R8vNn0WFUnY',  // VERIFIED: Box of Lies with Emma Stone | The Tonight Show
    title: '지미 팰런: 엠마 스톤과 거짓말 상자',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'talk-show-best',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'talkshow-2',
    youtubeId: 'ZNHvU6TK93w',  // VERIFIED: Word Sneak with Chris Pratt | The Tonight Show
    title: '지미 팰런: 크리스 프랫과 단어 몰래 넣기',
    category: 'entertainment',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'talk-show-best',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'talkshow-3',
    youtubeId: 'NaY91YjVbEM',  // VERIFIED: Musical Genre Challenge with Ariana Grande | Tonight Show
    title: '지미 팰런: 아리아나 그란데 뮤지컬 챌린지',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'talk-show-best',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'talkshow-4',
    youtubeId: 'DO9U_XxN-Kc',  // VERIFIED: Kevin Hart Is Terrified of Robert Irwin's Animals | Tonight Show
    title: '지미 팰런: 케빈 하트 동물 공포',
    category: 'entertainment',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'talk-show-best',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'talkshow-5',
    youtubeId: 'L3ymBk6Vb04',  // VERIFIED: Avengers: Infinity War Cast Sings "The Marvel Bunch" | Tonight Show
    title: '지미 팰런: 어벤져스 캐스트 노래',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'talk-show-best',
    episodeNumber: 5,
    subtitles: [],
  },

  // --- Graham Norton 시리즈 ---
  {
    id: 'norton-1',
    youtubeId: 'ZwS14TiO7Pk',  // VERIFIED: Will & Jaden Smith, DJ Jazzy Jeff, Alfonso Ribeiro Rap! | BBC
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
    youtubeId: 'yuXGpUR7fXA',  // VERIFIED: Ryan Gosling Can't Cope With Greg Davies' Story | Graham Norton
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
    youtubeId: 'RRBoPveyETc',  // VERIFIED: Celebrities Read Mean Tweets #1 | Jimmy Kimmel Live
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
    youtubeId: 'wyDU93xVAJs',  // VERIFIED: CONAN Season 4 Supercut | CONAN on TBS | Team Coco
    title: '코난: 시즌4 하이라이트',
    category: 'entertainment',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // --- Box of Lies ---
  {
    id: 'boxoflies-cardi',
    youtubeId: 'g693z6yy1rw',  // VERIFIED: Box of Lies with Cardi B | The Tonight Show
    title: '지미 팰런: 카디 비와 거짓말 상자',
    category: 'entertainment',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    subtitles: [],
  },

  // ============================================================
  // === MUSIC (4 videos) ========================================
  // ============================================================

  {
    id: 'music-shapeofyou',
    youtubeId: 'JGwWNGJdvx8',  // VERIFIED: Ed Sheeran - Shape of You (Official Music Video)
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
    id: 'music-uptown',
    youtubeId: 'OPf0YbXqDm0',  // VERIFIED: Mark Ronson - Uptown Funk ft. Bruno Mars
    title: 'Uptown Funk - Bruno Mars',
    category: 'music',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pop-hits',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'music-hello',
    youtubeId: 'YQHsXMglC9A',  // VERIFIED: Adele - Hello (Official Music Video)
    title: 'Adele - Hello',
    category: 'music',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pop-hits',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'music-radioactive',
    youtubeId: 'ktvTqknDobU',  // VERIFIED: Imagine Dragons - Radioactive
    title: 'Imagine Dragons - Radioactive',
    category: 'music',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pop-hits',
    episodeNumber: 4,
    subtitles: [],
  },

  // ============================================================
  // === ANIMATION (4 videos) ====================================
  // ============================================================

  {
    id: 'anim-nemo',
    youtubeId: '3sAWDQjCOeU',  // VERIFIED: The Dentist Scene from Finding Nemo | Pixar Side by Side | Pixar
    title: '니모를 찾아서: 치과 장면',
    category: 'animation',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pixar-moments',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'anim-insideout',
    youtubeId: 'M7KelAaqsCg',  // VERIFIED: Inside Out 2 - All Clips From The Movie (2024) | Animation Society
    title: '인사이드 아웃 2: 명장면 모음',
    category: 'animation',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pixar-moments',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'anim-toystory',
    youtubeId: 'w7UGkviTIpY',  // VERIFIED: Toy Story 3 | Pixar Home Video | Pixar
    title: '토이스토리 3: 명장면',
    category: 'animation',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pixar-moments',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'anim-up',
    youtubeId: 'F2bk_9T482g',  // VERIFIED: Pixar's Up scene - Ellie and Carl's relationship through time
    title: 'UP: 칼과 엘리의 사랑 이야기',
    category: 'animation',
    difficulty: 1,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pixar-moments',
    episodeNumber: 4,
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
