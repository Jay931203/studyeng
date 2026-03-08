/**
 * Drama/TV Show Expansion - Video Research
 * Target: ~200 new drama clips from 25 TV show series
 *
 * YouTube IDs collected via web research (March 2026).
 * Some IDs are from official channels, fan compilations, or clip channels.
 * All clips should be verified before Whisper transcription.
 *
 * NOTE: YouTube IDs may become unavailable due to copyright takedowns.
 * Each video should be checked for availability before processing.
 */

import type { Series, VideoData } from '../../src/data/seed-videos';

// =============================================================================
// SERIES DEFINITIONS (25 new series)
// =============================================================================

export const newDramaSeries: Series[] = [
  // --- Comedy ---
  {
    id: 'good-place',
    title: 'The Good Place',
    category: 'drama',
    description: '사후세계에서 펼쳐지는 윤리학 코미디',
    thumbnailEmoji: '',
    episodeCount: 8,
  },
  {
    id: 'schitts-creek',
    title: "Schitt's Creek",
    category: 'drama',
    description: '졸부 가족의 시골 적응 코미디',
    thumbnailEmoji: '',
    episodeCount: 8,
  },
  {
    id: 'ted-lasso',
    title: 'Ted Lasso',
    category: 'drama',
    description: '미국인 축구 코치의 영국 적응기',
    thumbnailEmoji: '',
    episodeCount: 8,
  },
  {
    id: 'community',
    title: 'Community',
    category: 'drama',
    description: '커뮤니티 칼리지 스터디 그룹의 모험',
    thumbnailEmoji: '',
    episodeCount: 8,
  },
  {
    id: '30-rock',
    title: '30 Rock',
    category: 'drama',
    description: 'TV 코미디 쇼 제작 비하인드',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'arrested-dev',
    title: 'Arrested Development',
    category: 'drama',
    description: '몰락한 부자 가족의 기묘한 일상',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'curb',
    title: 'Curb Your Enthusiasm',
    category: 'drama',
    description: '래리 데이비드의 일상 트러블',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'frasier',
    title: 'Frasier',
    category: 'drama',
    description: '시애틀 라디오 정신과 의사의 일상',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'always-sunny',
    title: "It's Always Sunny in Philadelphia",
    category: 'drama',
    description: '필라델피아 바 운영하는 무개념 친구들',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'fresh-prince',
    title: 'The Fresh Prince of Bel-Air',
    category: 'drama',
    description: '윌 스미스의 벨에어 적응기',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'will-grace',
    title: 'Will & Grace',
    category: 'drama',
    description: '뉴욕 베스트프렌즈의 코미디',
    thumbnailEmoji: '',
    episodeCount: 3,
  },
  {
    id: 'gilmore-girls',
    title: 'Gilmore Girls',
    category: 'drama',
    description: '빠른 대화의 엄마와 딸 이야기',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'sex-city',
    title: 'Sex and the City',
    category: 'drama',
    description: '뉴욕 네 여자의 사랑과 우정',
    thumbnailEmoji: '',
    episodeCount: 3,
  },
  {
    id: 'simpsons',
    title: 'The Simpsons',
    category: 'drama',
    description: '미국 대표 애니메이션 시트콤',
    thumbnailEmoji: '',
    episodeCount: 5,
  },

  // --- British Comedy/Drama ---
  {
    id: 'fleabag',
    title: 'Fleabag',
    category: 'drama',
    description: '4차원 벽을 깨는 영국 코미디',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'sherlock',
    title: 'Sherlock',
    category: 'drama',
    description: '현대판 셜록 홈즈의 추리',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'the-crown',
    title: 'The Crown',
    category: 'drama',
    description: '영국 왕실의 역사 드라마',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'downton-abbey',
    title: 'Downton Abbey',
    category: 'drama',
    description: '영국 귀족 저택의 삶과 사랑',
    thumbnailEmoji: '',
    episodeCount: 5,
  },

  // --- Drama/Thriller ---
  {
    id: 'stranger-things',
    title: 'Stranger Things',
    category: 'drama',
    description: '80년대 미국 소도시의 초자연 미스터리',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'better-call-saul',
    title: 'Better Call Saul',
    category: 'drama',
    description: '사기꾼 변호사의 탄생 이야기',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'succession',
    title: 'Succession',
    category: 'drama',
    description: '미디어 재벌 가족의 권력 다툼',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'game-of-thrones',
    title: 'Game of Thrones',
    category: 'drama',
    description: '왕좌를 둘러싼 판타지 전쟁',
    thumbnailEmoji: '',
    episodeCount: 5,
  },

  // --- Medical Drama ---
  {
    id: 'greys-anatomy',
    title: "Grey's Anatomy",
    category: 'drama',
    description: '시애틀 병원의 의료 드라마',
    thumbnailEmoji: '',
    episodeCount: 5,
  },
  {
    id: 'house-md',
    title: 'House M.D.',
    category: 'drama',
    description: '천재 의사의 독설과 진단',
    thumbnailEmoji: '',
    episodeCount: 5,
  },

  // --- Legal/Good Wife ---
  {
    id: 'good-wife',
    title: 'The Good Wife',
    category: 'drama',
    description: '정치 스캔들 뒤 변호사로 복귀하는 여성',
    thumbnailEmoji: '',
    episodeCount: 3,
  },
];

// =============================================================================
// VIDEO ENTRIES (~200 videos)
// =============================================================================
// YouTube IDs collected from web research. IDs marked with TODO need verification.
// clipStart/clipEnd are initial estimates - adjust after Whisper transcription.
// =============================================================================

export const newDramaVideos: VideoData[] = [

  // ==========================================================================
  // THE GOOD PLACE (8 episodes)
  // ==========================================================================
  {
    id: 'good-place-ep01',
    youtubeId: 'vkfeyCLm3qY',    // Season 3 premiere scene
    title: '마이클이 진실을 밝히다',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-place',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'good-place-ep02',
    youtubeId: 'l1IchzbtNj0',    // Chidi's wave returns to the ocean
    title: '치디의 파도 비유',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-place',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'good-place-ep03',
    youtubeId: 'ELugz37Sd4s',    // Good Place clip - NBC
    title: '엘리너의 윤리학 수업',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-place',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'good-place-ep04',
    youtubeId: 'a8MaE844IRM',    // Good Place clip
    title: '제이슨의 엉뚱한 해결책',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-place',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'good-place-ep05',
    youtubeId: 'dVqfdMaok-o',    // Good Place clip
    title: '타하니의 이름 드롭 모음',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-place',
    episodeNumber: 5,
    subtitles: [],
  },
  {
    id: 'good-place-ep06',
    youtubeId: 'lDId4tJ5o04',    // Good Place clip
    title: '마이클의 존재 위기',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-place',
    episodeNumber: 6,
    subtitles: [],
  },
  {
    id: 'good-place-ep07',
    youtubeId: 'RfBxGOxtCqw',    // Good Place trolley problem style
    title: '트롤리 문제 논쟁',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-place',
    episodeNumber: 7,
    subtitles: [],
  },
  {
    id: 'good-place-ep08',
    youtubeId: 'Gjr02_C-p70',    // Good Place Janet clip
    title: '자넷의 이상한 능력',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-place',
    episodeNumber: 8,
    subtitles: [],
  },

  // ==========================================================================
  // SCHITT'S CREEK (8 episodes)
  // ==========================================================================
  {
    id: 'schitts-ep01',
    youtubeId: 'jHPOzQzk9Qo',    // Fold in the cheese
    title: '치즈를 접어 넣으라고',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'schitts-creek',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'schitts-ep02',
    youtubeId: 'mGCCP9OuJVc',    // A Little Bit Alexis
    title: '어 리틀 빗 알렉시스',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'schitts-creek',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'schitts-ep03',
    youtubeId: 'UZnCuXVnGKM',    // David wine analogy
    title: '데이비드의 와인 비유',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'schitts-creek',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'schitts-ep04',
    youtubeId: 'gTzBQ0r7Ouo',    // Moira winery commercial
    title: '모이라의 와이너리 광고',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'schitts-creek',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'schitts-ep05',
    youtubeId: 'aaIDnkHnvSg',    // David and Patrick
    title: '데이비드와 패트릭의 첫 만남',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'schitts-creek',
    episodeNumber: 5,
    subtitles: [],
  },
  {
    id: 'schitts-ep06',
    youtubeId: 'sC4YB1gwI-s',    // Moira's vocabulary
    title: '모이라의 이상한 단어 선택',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'schitts-creek',
    episodeNumber: 6,
    subtitles: [],
  },
  {
    id: 'schitts-ep07',
    youtubeId: 'nWJQ2NjKlk0',    // Alexis and Ted
    title: '알렉시스와 테드의 재회',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'schitts-creek',
    episodeNumber: 7,
    subtitles: [],
  },
  {
    id: 'schitts-ep08',
    youtubeId: 'LIsXiOAMa7c',    // Johnny and Stevie
    title: '자니의 모텔 경영 수업',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'schitts-creek',
    episodeNumber: 8,
    subtitles: [],
  },

  // ==========================================================================
  // TED LASSO (8 episodes)
  // ==========================================================================
  {
    id: 'ted-lasso-ep01',
    youtubeId: '3S16b-x5mRA',    // Darts scene
    title: '테드의 다트 대결',
    category: 'drama',
    difficulty: 3,
    clipStart: 211,
    clipEnd: 271,
    seriesId: 'ted-lasso',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'ted-lasso-ep02',
    youtubeId: 'oZ5aBmGbLHc',    // Ted Lasso believe sign
    title: '테드의 BELIEVE 사인',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'ted-lasso',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'ted-lasso-ep03',
    youtubeId: 'pal2MqbOmHI',    // Ted Lasso biscuits scene
    title: '비스킷으로 마음 얻기',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'ted-lasso',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'ted-lasso-ep04',
    youtubeId: 'j2x2nRqRPMs',    // Diamond Dogs scene
    title: '다이아몬드 독스 모임',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'ted-lasso',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'ted-lasso-ep05',
    youtubeId: 'QgKIHlJWIYo',    // Roy Kent moment
    title: '로이 켄트의 복귀',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'ted-lasso',
    episodeNumber: 5,
    subtitles: [],
  },
  {
    id: 'ted-lasso-ep06',
    youtubeId: 'TbVZ3Xjao_s',    // Ted Lasso motivational speech
    title: '테드의 동기부여 연설',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'ted-lasso',
    episodeNumber: 6,
    subtitles: [],
  },
  {
    id: 'ted-lasso-ep07',
    youtubeId: 'JC4rfm5Ohlg',    // Ted Lasso Rebecca
    title: '레베카의 고백',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'ted-lasso',
    episodeNumber: 7,
    subtitles: [],
  },
  {
    id: 'ted-lasso-ep08',
    youtubeId: 'vPXtfXl1Epw',    // Ted Lasso Jamie Tartt
    title: '제이미 타트의 성장',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'ted-lasso',
    episodeNumber: 8,
    subtitles: [],
  },

  // ==========================================================================
  // COMMUNITY (8 episodes)
  // ==========================================================================
  {
    id: 'community-ep01',
    youtubeId: 'IFRx8oXgxpI',    // Community Jeff Winger speech
    title: '제프의 스터디 그룹 결성',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'community',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'community-ep02',
    youtubeId: 'vGuBGQ_GjEA',    // Troy and Abed in the Morning
    title: '트로이와 아베드의 아침 인사',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'community',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'community-ep03',
    youtubeId: 'qZzMcRYX44M',    // Modern Warfare paintball
    title: '페인트볼 전쟁의 시작',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'community',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'community-ep04',
    youtubeId: 'qvzE64A28NI',    // Dean Pelton costume
    title: '딘의 기묘한 복장',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'community',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'community-ep05',
    youtubeId: 'j2gxCvFkQVg',    // Community Remedial Chaos Theory style
    title: '7가지 타임라인',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'community',
    episodeNumber: 5,
    subtitles: [],
  },
  {
    id: 'community-ep06',
    youtubeId: 'xRGGbyFcwPM',    // Streets Ahead
    title: '피어스의 거침없는 발언',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'community',
    episodeNumber: 6,
    subtitles: [],
  },
  {
    id: 'community-ep07',
    youtubeId: 'K1L_UMjq5XU',    // Community Annie scene
    title: '애니의 크리스마스 노래',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'community',
    episodeNumber: 7,
    subtitles: [],
  },
  {
    id: 'community-ep08',
    youtubeId: 'PwOmJkNAV4k',    // Community clip
    title: '트로이의 감동 작별',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'community',
    episodeNumber: 8,
    subtitles: [],
  },

  // ==========================================================================
  // 30 ROCK (5 episodes)
  // ==========================================================================
  {
    id: '30rock-ep01',
    youtubeId: 'G-vp0AprzrA',    // Tracy on Conan in character
    title: '트레이시 조던의 토크쇼 출연',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: '30-rock',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: '30rock-ep02',
    youtubeId: 'i9IA4XFPEnk',    // Bitch Hunter clip
    title: '잭의 TV 쇼 제안',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: '30-rock',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: '30rock-ep03',
    youtubeId: 'Kb_AHBGF5i8',    // 30 Rock best moment
    title: '리즈 레몬의 딜브레이커',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: '30-rock',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: '30rock-ep04',
    youtubeId: 'AyMs2xox_hE',    // Greenzo scene
    title: '그린조의 환경 운동',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: '30-rock',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: '30rock-ep05',
    youtubeId: 'qg2KGHzLMVs',    // 30 Rock Jack Liz dynamic
    title: '잭과 리즈의 저녁 식사',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: '30-rock',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // ARRESTED DEVELOPMENT (5 episodes)
  // ==========================================================================
  {
    id: 'arrested-ep01',
    youtubeId: 'tO1k2Y3o-iM',    // Gob's magic with Final Countdown
    title: '곱의 마술쇼와 파이널 카운트다운',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'arrested-dev',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'arrested-ep02',
    youtubeId: 'kKXkfLhn6pA',    // Buster's cursing spree
    title: '버스터의 폭주',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'arrested-dev',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'arrested-ep03',
    youtubeId: 'I1O5m-R-sdQ',    // Gene Parmesan reveals
    title: '진 파르메산의 변장 들통',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'arrested-dev',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'arrested-ep04',
    youtubeId: 'X1WSH0VzoaM',    // There's always money in banana stand
    title: '바나나 스탠드에 항상 돈이 있어',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'arrested-dev',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'arrested-ep05',
    youtubeId: 'Sr2PlqMp3RI',    // Tobias as Mrs. Featherbottom
    title: '토비아스의 더블라이프',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'arrested-dev',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // FLEABAG (5 episodes)
  // ==========================================================================
  {
    id: 'fleabag-ep01',
    youtubeId: 'I5Ey6FbNBiA',    // Fleabag Season 2 opening dinner
    title: '어색한 가족 저녁 식사',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fleabag',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'fleabag-ep02',
    youtubeId: 'TF6Y7VD0P6c',    // Fleabag hot priest scene
    title: '핫 프리스트와의 첫 만남',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fleabag',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'fleabag-ep03',
    youtubeId: 'J6psm-tG6bY',    // Fleabag confessional
    title: '고해성사 장면',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fleabag',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'fleabag-ep04',
    youtubeId: 'MzcrGOkBi7o',    // Fleabag fourth wall break
    title: '4번째 벽을 깨는 순간',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fleabag',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'fleabag-ep05',
    youtubeId: 'zfNKS1HzfF0',    // Fleabag it'll pass
    title: '지나갈 거야',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fleabag',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // SHERLOCK BBC (5 episodes)
  // ==========================================================================
  {
    id: 'sherlock-ep01',
    youtubeId: 'whCJ4NLUSB8',    // Sherlock deduction talents
    title: '셜록의 관찰 추리력',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'sherlock',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'sherlock-ep02',
    youtubeId: 'VaT7IYQgyqo',    // Benedict Cumberbatch Sherlock clip
    title: '셜록과 왓슨의 첫 만남',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'sherlock',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'sherlock-ep03',
    youtubeId: 'sZrgxHvNNUc',    // Sherlock I am Sherlocked
    title: '나는 셜록이다',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'sherlock',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'sherlock-ep04',
    youtubeId: 'bpMWBa4fS_U',    // Sherlock mind palace
    title: '마인드 팰리스',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'sherlock',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'sherlock-ep05',
    youtubeId: 'Hxz5B4ZuPOk',    // Sherlock Moriarty
    title: '모리아티와의 대결',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'sherlock',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // THE CROWN (5 episodes)
  // ==========================================================================
  {
    id: 'crown-ep01',
    youtubeId: 'JWtnJjn6ng0',    // The Crown official trailer/clip
    title: '여왕의 대관식',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-crown',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'crown-ep02',
    youtubeId: 'wJEBo8xfn0s',    // Crown Churchill scene
    title: '처칠과의 첫 만남',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-crown',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'crown-ep03',
    youtubeId: 'CIX5sPbRISg',    // Crown Diana scene
    title: '다이애나의 등장',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-crown',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'crown-ep04',
    youtubeId: 'T8SFx3FezOg',    // Crown Philip and Elizabeth
    title: '필립 공과 엘리자베스의 갈등',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-crown',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'crown-ep05',
    youtubeId: 'Iu3GqJhMDwk',    // Crown Margaret scene
    title: '마가렛 공주의 선택',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-crown',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // STRANGER THINGS (5 episodes)
  // ==========================================================================
  {
    id: 'stranger-ep01',
    youtubeId: 'KldYH188V_U',    // WatchMojo Top 10 Stranger Things moments
    title: '일레븐의 첫 등장',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'stranger-things',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'stranger-ep02',
    youtubeId: 'Ds0R1eApo9w',    // Hardhome-style intensity scene
    title: '데모고르곤과의 대결',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'stranger-things',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'stranger-ep03',
    youtubeId: 'p07pCAswvRE',    // Stranger Things clip
    title: '스티브의 영웅적 순간',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'stranger-things',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'stranger-ep04',
    youtubeId: 'mJfBgdSZxXM',    // Stranger Things S4 clip
    title: '맥스의 러닝 업 댓 힐',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'stranger-things',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'stranger-ep05',
    youtubeId: 'LN8GjxSnNOU',    // Stranger Things Dustin and Steve
    title: '더스틴과 스티브의 우정',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'stranger-things',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // BETTER CALL SAUL (5 episodes)
  // ==========================================================================
  {
    id: 'bcs-ep01',
    youtubeId: 'ePiTlxLGkJo',    // Best musical moments
    title: '지미의 법정 변론',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'better-call-saul',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'bcs-ep02',
    youtubeId: 'qbiUXC6d8v8',    // Mike takes a beating from Tuco
    title: '마이크와 투코의 대결',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'better-call-saul',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'bcs-ep03',
    youtubeId: 'oB5dctpeI0o',    // Best of Lalo compilation
    title: '랄로의 등장',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'better-call-saul',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'bcs-ep04',
    youtubeId: 'f_kgZFdt5B0',    // Mike's most badass moments
    title: '마이크의 명장면',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'better-call-saul',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'bcs-ep05',
    youtubeId: 'eBS7QW9d100',    // Script to Screen Bad Choice Road
    title: '킴의 선택',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'better-call-saul',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // SUCCESSION (5 episodes)
  // ==========================================================================
  {
    id: 'succession-ep01',
    youtubeId: 'LZTaXjt2Ggk',    // You are not serious people
    title: '당신들은 진지한 사람들이 아니야',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'succession',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'succession-ep02',
    youtubeId: 'Cjv68fFbpME',    // Succession L to the OG
    title: '켄달의 L to the OG 랩',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'succession',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'succession-ep03',
    youtubeId: 'szyb9cUXgSY',    // Boar on the floor
    title: '보어 온 더 플로어',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'succession',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'succession-ep04',
    youtubeId: 'qjVKM7zQ9TU',    // Tom and Greg dynamic
    title: '톰과 그렉의 관계',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'succession',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'succession-ep05',
    youtubeId: 'r50aOTm8mpE',    // Logan's rage
    title: '로건의 분노',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'succession',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // CURB YOUR ENTHUSIASM (5 episodes)
  // ==========================================================================
  {
    id: 'curb-ep01',
    youtubeId: 'O3iCGMa3tMo',    // Larry David restaurant scene
    title: '래리의 레스토랑 소동',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'curb',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'curb-ep02',
    youtubeId: 'vvfejhI42mI',    // Larry David pretty good
    title: '프리티 프리티 프리티 굿',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'curb',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'curb-ep03',
    youtubeId: 'e1KEC_3vygc',    // Palestinian Chicken
    title: '래리의 사회적 실수',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'curb',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'curb-ep04',
    youtubeId: 'bXGv3C4yUDY',    // Larry vs dentist/doctor
    title: '래리와 의사의 논쟁',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'curb',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'curb-ep05',
    youtubeId: 'RC7hZY3sVxE',    // Car pool lane
    title: '카풀 레인 소동',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'curb',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // FRASIER (5 episodes)
  // ==========================================================================
  {
    id: 'frasier-ep01',
    youtubeId: '4PP5wZBGMA4',    // Fencing duel An Affair to Forget
    title: '나일스의 펜싱 대결',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'frasier',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'frasier-ep02',
    youtubeId: 'wk4d7JWn4oA',    // Niles ironing scene
    title: '나일스의 다림질 사건',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'frasier',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'frasier-ep03',
    youtubeId: 'xULYg5x4mqs',    // Frasier and Niles wine tasting
    title: '프레이저와 나일스의 와인 테이스팅',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'frasier',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'frasier-ep04',
    youtubeId: 'P3YOIgjvMfs',    // Frasier Ski Lodge
    title: '스키 롯지의 혼란',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'frasier',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'frasier-ep05',
    youtubeId: 'b_sSNkl0E44',    // Frasier radio show
    title: '프레이저의 라디오 상담',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'frasier',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // IT'S ALWAYS SUNNY IN PHILADELPHIA (5 episodes)
  // ==========================================================================
  {
    id: 'sunny-ep01',
    youtubeId: '_nTpsv9PNqo',    // Pepe Silvia
    title: '찰리의 페페 실비아 음모론',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'always-sunny',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'sunny-ep02',
    youtubeId: 'S_JUlXh7sP8',    // Nightman Cometh
    title: '나이트맨 뮤지컬',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'always-sunny',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'sunny-ep03',
    youtubeId: 'xkJd5osdB6E',    // Fight Milk commercial
    title: '파이트 밀크 광고',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'always-sunny',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'sunny-ep04',
    youtubeId: 'MYtjpIwamos',    // CharDee MacDennis
    title: '찰디 맥데니스 보드게임',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'always-sunny',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'sunny-ep05',
    youtubeId: 'Uc9_mxvP1OQ',    // Dennis system
    title: '데니스의 시스템',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'always-sunny',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // THE GOOD WIFE (3 episodes)
  // ==========================================================================
  {
    id: 'good-wife-ep01',
    youtubeId: 'E6yUDy5SWFY',    // The Good Wife courtroom
    title: '알리시아의 법정 변론',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-wife',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'good-wife-ep02',
    youtubeId: 'KhyRI2qLfKo',    // Good Wife Kalinda scene
    title: '칼린다의 수사 능력',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-wife',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'good-wife-ep03',
    youtubeId: 'dFVH5MYPrGY',    // Good Wife dramatic moment
    title: '피터의 기자회견',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-wife',
    episodeNumber: 3,
    subtitles: [],
  },

  // ==========================================================================
  // GREY'S ANATOMY (5 episodes)
  // ==========================================================================
  {
    id: 'greys-ep01',
    youtubeId: 'F_oGZOGYh3U',    // Grey's Anatomy clip
    title: '메러디스의 첫 수술',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'greys-anatomy',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'greys-ep02',
    youtubeId: 'CgCbBZ_JMpY',    // Grey's Anatomy emotional scene
    title: '크리스티나의 명대사',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'greys-anatomy',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'greys-ep03',
    youtubeId: 'uWUbfPQRKYA',    // Grey's Anatomy surgery
    title: '데릭의 긴급 수술',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'greys-anatomy',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'greys-ep04',
    youtubeId: 'HFY2aEwy7PA',    // Grey's Anatomy funny moment
    title: '메러디스의 모르핀 에피소드',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'greys-anatomy',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'greys-ep05',
    youtubeId: 'D4V5t7L7SfI',    // Grey's Anatomy it's a beautiful day
    title: '수술실의 한마디',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'greys-anatomy',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // HOUSE M.D. (5 episodes)
  // ==========================================================================
  {
    id: 'house-ep01',
    youtubeId: 'G3-5Wy3PdKA',    // House everybody lies
    title: '모든 사람은 거짓말을 한다',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'house-md',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'house-ep02',
    youtubeId: 'vmM07q2OvDc',    // House diagnostic scene
    title: '하우스의 감별진단',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'house-md',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'house-ep03',
    youtubeId: 'A3CbCLsS7JU',    // House sarcastic moments
    title: '하우스의 독설 모음',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'house-md',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'house-ep04',
    youtubeId: 'EdLjsCAIJUY',    // House Wilson friendship
    title: '하우스와 윌슨의 우정',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'house-md',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'house-ep05',
    youtubeId: 'KbBxzCEfA3U',    // House Three Stories
    title: '하우스의 세 가지 이야기',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'house-md',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // GILMORE GIRLS (5 episodes)
  // ==========================================================================
  {
    id: 'gilmore-ep01',
    youtubeId: 'BYjgMQ52Xio',    // Gilmore Girls fast talking
    title: '로렐라이의 빠른 말하기',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'gilmore-girls',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'gilmore-ep02',
    youtubeId: 'JCqRE0IjRV8',    // Gilmore Girls coffee scene
    title: '커피 없으면 못 사는 모녀',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'gilmore-girls',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'gilmore-ep03',
    youtubeId: 'YHFkP0j79TM',    // Gilmore Girls Friday dinner
    title: '금요일 저녁 식사의 긴장감',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'gilmore-girls',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'gilmore-ep04',
    youtubeId: 'ZV5Bw3B4_g0',    // Gilmore Girls Luke scene
    title: '루크와 로렐라이',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'gilmore-girls',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'gilmore-ep05',
    youtubeId: 'v48T8Sj3NZQ',    // Gilmore Girls Paris scene
    title: '패리스의 경쟁심',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'gilmore-girls',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // SEX AND THE CITY (3 episodes)
  // ==========================================================================
  {
    id: 'satc-ep01',
    youtubeId: 'MQS5DGQPKKU',    // SATC brunch scene
    title: '캐리의 브런치 토크',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'sex-city',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'satc-ep02',
    youtubeId: 'X3M8lsPjBgE',    // SATC fashion scene
    title: '캐리의 패션 철학',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'sex-city',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'satc-ep03',
    youtubeId: 'IXXxciRUMzE',    // SATC Samantha scene
    title: '사만다의 유쾌한 조언',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'sex-city',
    episodeNumber: 3,
    subtitles: [],
  },

  // ==========================================================================
  // THE FRESH PRINCE OF BEL-AIR (5 episodes)
  // ==========================================================================
  {
    id: 'fresh-prince-ep01',
    youtubeId: 'zqZFzzp0IR8',    // How come he don't want me, man
    title: '아빠는 왜 날 원하지 않는 거야',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fresh-prince',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'fresh-prince-ep02',
    youtubeId: 'hx5GafMoNBc',    // Fresh Prince Carlton dance
    title: '칼튼의 톰 존스 댄스',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fresh-prince',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'fresh-prince-ep03',
    youtubeId: 'qvJeATp31dw',    // Fresh Prince pool hustling
    title: '윌의 당구 사기',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fresh-prince',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'fresh-prince-ep04',
    youtubeId: 'iS5jqXWECbI',    // Fresh Prince Uncle Phil moment
    title: '필립 삼촌의 교훈',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fresh-prince',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'fresh-prince-ep05',
    youtubeId: 'ye5BuYf8q4o',    // Fresh Prince intro / comedy scene
    title: '벨에어에서 생긴 일',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fresh-prince',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // WILL & GRACE (3 episodes)
  // ==========================================================================
  {
    id: 'will-grace-ep01',
    youtubeId: 'WpxHZmKYaJk',    // Will and Grace clip
    title: '윌과 그레이스의 일상',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'will-grace',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'will-grace-ep02',
    youtubeId: 'VxkZRsBlfVk',    // Karen Walker moments
    title: '카렌의 독설 모음',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'will-grace',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'will-grace-ep03',
    youtubeId: 'h6tOfhrdLwg',    // Jack McFarland scene
    title: '잭의 연극 오디션',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'will-grace',
    episodeNumber: 3,
    subtitles: [],
  },

  // ==========================================================================
  // DOWNTON ABBEY (5 episodes)
  // ==========================================================================
  {
    id: 'downton-ep01',
    youtubeId: 'UBX8MWYel3s',    // Dowager Countess best lines
    title: '바이올렛의 독설 모음',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'downton-abbey',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'downton-ep02',
    youtubeId: 'Y3_KgtBxp7k',    // Downton Abbey dinner scene
    title: '다운튼 저녁 식사 예절',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'downton-abbey',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'downton-ep03',
    youtubeId: 'kfxInA47m7w',    // Downton Abbey Carson scene
    title: '카슨의 집사 정신',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'downton-abbey',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'downton-ep04',
    youtubeId: 'SoZoQNb04wQ',    // Downton Abbey Matthew and Mary
    title: '매튜와 메리의 프로포즈',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'downton-abbey',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'downton-ep05',
    youtubeId: 'Ty0VfBMBjYY',    // Downton Abbey Branson
    title: '브랜슨의 신분 갈등',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'downton-abbey',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // GAME OF THRONES (5 episodes)
  // ==========================================================================
  {
    id: 'got-ep01',
    youtubeId: 'PxlIraEV8n4',    // Chaos is a ladder
    title: '혼돈은 사다리다',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'game-of-thrones',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'got-ep02',
    youtubeId: 'PW6wfXPeJTw',    // Ned Stark scene
    title: '네드 스타크의 명예',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'game-of-thrones',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'got-ep03',
    youtubeId: 'KK2xoMDg95A',    // Battle of the Bastards
    title: '존 스노우의 전투',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'game-of-thrones',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'got-ep04',
    youtubeId: 'TbwroS0YP54',    // Tyrion's trial speech
    title: '티리온의 재판 연설',
    category: 'drama',
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'game-of-thrones',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'got-ep05',
    youtubeId: 'ubTIzr7mH1k',    // Daenerys dragon scene
    title: '대너리스와 드래곤',
    category: 'drama',
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'game-of-thrones',
    episodeNumber: 5,
    subtitles: [],
  },

  // ==========================================================================
  // THE SIMPSONS (5 episodes)
  // ==========================================================================
  {
    id: 'simpsons-ep01',
    youtubeId: 'aRsOBFhNjVM',    // Steamed Hams
    title: '찐 햄인가 햄버거인가',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'simpsons',
    episodeNumber: 1,
    subtitles: [],
  },
  {
    id: 'simpsons-ep02',
    youtubeId: 'cnaeIAEp2pU',    // Homer D'oh compilation
    title: '호머의 도 모음',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'simpsons',
    episodeNumber: 2,
    subtitles: [],
  },
  {
    id: 'simpsons-ep03',
    youtubeId: 'FArZFLLkjpA',    // Homer spider pig
    title: '호머의 스파이더 피그',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'simpsons',
    episodeNumber: 3,
    subtitles: [],
  },
  {
    id: 'simpsons-ep04',
    youtubeId: 'KqRPIReIcl8',    // Bart prank calls Moe
    title: '바트의 장난 전화',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'simpsons',
    episodeNumber: 4,
    subtitles: [],
  },
  {
    id: 'simpsons-ep05',
    youtubeId: '2MjJKfMn3JM',    // Sideshow Bob rakes
    title: '사이드쇼 밥의 갈퀴 공격',
    category: 'drama',
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'simpsons',
    episodeNumber: 5,
    subtitles: [],
  },
];

// =============================================================================
// SUMMARY
// =============================================================================
// Total new series: 25
// Total new videos: 131
//
// Breakdown by series:
//   The Good Place: 8
//   Schitt's Creek: 8
//   Ted Lasso: 8
//   Community: 8
//   30 Rock: 5
//   Arrested Development: 5
//   Fleabag: 5
//   Sherlock: 5
//   The Crown: 5
//   Stranger Things: 5
//   Better Call Saul: 5
//   Succession: 5
//   Curb Your Enthusiasm: 5
//   Frasier: 5
//   It's Always Sunny: 5
//   The Good Wife: 3
//   Grey's Anatomy: 5
//   House M.D.: 5
//   Gilmore Girls: 5
//   Sex and the City: 3
//   Fresh Prince: 5
//   Will & Grace: 3
//   Downton Abbey: 5
//   Game of Thrones: 5
//   The Simpsons: 5
//
// IMPORTANT NOTES:
// 1. All YouTube IDs need verification before use - some may be unavailable
//    due to copyright takedowns or regional restrictions.
// 2. clipStart/clipEnd values are initial estimates (0-60 for most).
//    After Whisper transcription, these should be adjusted to the actual
//    dialogue-rich portions (target 45-70 seconds).
// 3. Some IDs were found via web search referencing fan compilations or
//    unofficial uploads. Priority should be given to official channel clips.
// 4. Difficulty ratings are estimates based on show characteristics:
//    - 2: Simple vocabulary, slower pace (Fresh Prince, Simpsons)
//    - 3: Moderate vocabulary, natural pace (most sitcoms)
//    - 4: Complex vocabulary, fast pace, British accent (Fleabag, Sherlock, Crown)
//
// VERIFICATION WORKFLOW:
// 1. Run: node scripts/verify-youtube-ids.mjs (if available)
// 2. Replace unavailable IDs with working alternatives
// 3. Run Whisper transcription on verified IDs
// 4. Adjust clipStart/clipEnd based on transcript timing
// 5. Generate Korean translations via Claude
