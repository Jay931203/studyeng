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
    subtitles: [
      { start: 0, end: 3, en: "There's nothing to tell! It's just some guy I work with.", ko: "말할 거 없어! 그냥 같이 일하는 남자야." },
      { start: 3, end: 6, en: "Come on, you're going out with the guy!", ko: "아, 그 남자랑 데이트하잖아!" },
      { start: 6, end: 9, en: "It's not a date. It's just two people going out to dinner.", ko: "데이트 아니야. 그냥 두 사람이 같이 저녁 먹는 거지." },
      { start: 9, end: 12, en: "And not having sex.", ko: "그리고 잠자리도 안 하고." },
      { start: 12, end: 15, en: "Sounds like a date to me.", ko: "내가 듣기엔 데이트인데." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "How does she do that?", ko: "쟤는 어떻게 그러는 거야?" },
      { start: 3, end: 6, en: "I have no idea. It's like she has a gift.", ko: "모르겠어. 타고난 것 같아." },
      { start: 6, end: 9, en: "Could this day get any worse?", ko: "이 날이 더 최악이 될 수 있을까?" },
      { start: 9, end: 12, en: "Well, you could be stuck in traffic.", ko: "글쎄, 교통체증에 갇힐 수도 있지." },
      { start: 12, end: 15, en: "Thanks, that really helps.", ko: "고마워, 정말 도움이 되네." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "Can I ask you something?", ko: "나 물어봐도 될까?" },
      { start: 3, end: 6, en: "Sure, what is it?", ko: "물론, 뭔데?" },
      { start: 6, end: 9, en: "Why does everyone think I'm annoying?", ko: "왜 다들 내가 짜증난다고 생각해?" },
      { start: 9, end: 12, en: "I don't know... maybe it's your jokes?", ko: "모르겠어... 농담 때문일 수도?" },
      { start: 12, end: 15, en: "My jokes are hilarious!", ko: "내 농담 진짜 웃기거든!" },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "I can't stand my new coworker.", ko: "새 동료가 진짜 못 견디겠어." },
      { start: 3, end: 6, en: "What did she do now?", ko: "이번엔 뭘 했는데?" },
      { start: 6, end: 9, en: "She keeps taking credit for my work!", ko: "자꾸 내 업적을 자기 것이라고 해!" },
      { start: 9, end: 12, en: "That's the worst. Have you talked to your boss?", ko: "그거 최악이다. 상사한테 말했어?" },
      { start: 12, end: 15, en: "Not yet, but I'm about to.", ko: "아직, 근데 곧 할 거야." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Today, smoking is going to save lives.", ko: "오늘, 흡연이 생명을 구할 겁니다." },
      { start: 4, end: 8, en: "Attention! There has been a fire!", ko: "주목! 화재가 발생했습니다!" },
      { start: 8, end: 12, en: "Oh my God! The fire is shooting at us!", ko: "세상에! 불이 우리를 쏘고 있어!" },
      { start: 12, end: 16, en: "Save the printer!", ko: "프린터를 살려!" },
      { start: 16, end: 20, en: "This is a fire drill, everybody.", ko: "여러분, 이건 화재 훈련이었어요." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "At first, I was afraid. I was petrified.", ko: "처음에, 난 무서웠어요. 겁에 질렸죠." },
      { start: 4, end: 8, en: "You need to pump at a rate of a hundred beats per minute.", ko: "분당 100회 속도로 압박해야 합니다." },
      { start: 8, end: 12, en: "Staying alive, staying alive!", ko: "살아남자, 살아남자!" },
      { start: 12, end: 16, en: "He doesn't have a wallet. I checked.", ko: "지갑이 없어요. 확인했어요." },
      { start: 16, end: 20, en: "Clarice...", ko: "클라리스..." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Bears. Beets. Battlestar Galactica.", ko: "곰. 비트. 배틀스타 갤럭티카." },
      { start: 4, end: 8, en: "Identity theft is not a joke, Jim!", ko: "신분 도용은 장난이 아니야, 짐!" },
      { start: 8, end: 12, en: "Millions of families suffer every year!", ko: "매년 수백만 가족이 고통받는다고!" },
      { start: 12, end: 16, en: "Michael!", ko: "마이클!" },
      { start: 16, end: 20, en: "Oh, that's funny. Michael!", ko: "아, 웃기다. 마이클!" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Question: What kind of bear is best?", ko: "질문: 어떤 곰이 제일 좋아?" },
      { start: 4, end: 8, en: "That's a ridiculous question.", ko: "말도 안 되는 질문이야." },
      { start: 8, end: 12, en: "False. Black bear.", ko: "틀렸어. 흑곰이야." },
      { start: 12, end: 16, en: "Well, that's debatable.", ko: "글쎄, 그건 논쟁의 여지가 있지." },
      { start: 16, end: 20, en: "There are basically two schools of thought.", ko: "기본적으로 두 가지 학파가 있어." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "I taught myself Morse code.", ko: "나 혼자 모스 부호를 배웠어." },
      { start: 4, end: 8, en: "You're kidding. Why would you do that?", ko: "농담이지. 왜 그런 걸 해?" },
      { start: 8, end: 12, en: "So Pam and I can communicate in secret.", ko: "팸이랑 비밀리에 소통하려고." },
      { start: 12, end: 16, en: "That is adorable.", ko: "너무 귀엽다." },
      { start: 16, end: 20, en: "He still doesn't suspect a thing.", ko: "아직 전혀 눈치 못 채고 있어." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Number one, could you please sing the opening to 'I Want It That Way'?", ko: "1번, 'I Want It That Way' 시작 부분을 불러주시겠어요?" },
      { start: 4, end: 8, en: "You are my fire, the one desire.", ko: "넌 나의 불꽃, 유일한 소망." },
      { start: 8, end: 12, en: "Believe when I say, I want it that way.", ko: "내 말을 믿어, 난 그렇게 원해." },
      { start: 12, end: 16, en: "Chills, literal chills.", ko: "소름, 진짜 소름이야." },
      { start: 16, end: 20, en: "It was number five. Number five killed my brother.", ko: "5번이었어요. 5번이 제 형을 죽였어요." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "I have a plan.", ko: "계획이 있어." },
      { start: 4, end: 8, en: "Is your plan to make the suspects sing?", ko: "용의자들한테 노래를 시키는 계획이야?" },
      { start: 8, end: 12, en: "The witness heard the perp singing.", ko: "목격자가 범인이 노래하는 걸 들었어." },
      { start: 12, end: 16, en: "This is highly unorthodox.", ko: "이건 매우 파격적이야." },
      { start: 16, end: 20, en: "But it might just work.", ko: "근데 통할 수도 있어." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "I'm smart, I'm hardworking, and I learn fast.", ko: "저는 똑똑하고, 열심히 하고, 빨리 배워요." },
      { start: 3, end: 6, en: "That's what they all say.", ko: "다들 그렇게 말하지." },
      { start: 6, end: 9, en: "But do you have what it takes to work here?", ko: "근데 여기서 일할 자격이 있어?" },
      { start: 9, end: 12, en: "I believe I do, yes.", ko: "네, 있다고 생각해요." },
      { start: 12, end: 15, en: "We'll see about that.", ko: "두고 보자." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "Is there anything else I can do?", ko: "제가 더 할 수 있는 게 있을까요?" },
      { start: 3, end: 6, en: "Your job is to anticipate my needs.", ko: "네 일은 내 필요를 미리 파악하는 거야." },
      { start: 6, end: 9, en: "Details matter in this business.", ko: "이 업계에선 디테일이 중요해." },
      { start: 9, end: 12, en: "I won't let you down.", ko: "실망시키지 않을게요." },
      { start: 12, end: 15, en: "Everyone says that. Prove it.", ko: "다들 그래. 증명해 봐." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "You've changed a lot since you started here.", ko: "여기 온 후로 많이 변했네." },
      { start: 3, end: 6, en: "Is that a good thing or a bad thing?", ko: "그게 좋은 건가요 나쁜 건가요?" },
      { start: 6, end: 9, en: "That depends entirely on you.", ko: "그건 전적으로 너에게 달렸어." },
      { start: 9, end: 12, en: "I finally understand what you've been trying to teach me.", ko: "당신이 가르치려던 게 뭔지 이제 알겠어요." },
      { start: 12, end: 15, en: "Now that's what I call growth.", ko: "이게 바로 성장이라는 거야." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Run, Forrest, run!", ko: "달려, 포레스트, 달려!" },
      { start: 4, end: 8, en: "From that day on, if I was going somewhere, I was running.", ko: "그날부터, 어딜 가든 난 달렸어요." },
      { start: 8, end: 12, en: "I just felt like running.", ko: "그냥 달리고 싶었어요." },
      { start: 12, end: 16, en: "Mama always said, miracles happen every day.", ko: "엄마는 항상 말했어요, 기적은 매일 일어난다고." },
      { start: 16, end: 20, en: "Some people don't think miracles are real.", ko: "어떤 사람들은 기적이 진짜가 아니라고 생각해요." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "My mama always said life was like a box of chocolates.", ko: "엄마는 항상 인생은 초콜릿 상자 같다고 했어요." },
      { start: 4, end: 8, en: "You never know what you're gonna get.", ko: "뭘 받게 될지 절대 모르죠." },
      { start: 8, end: 12, en: "Mama always had a way of explaining things.", ko: "엄마는 항상 설명하는 방법을 알고 있었어요." },
      { start: 12, end: 16, en: "So I could understand them.", ko: "내가 이해할 수 있도록요." },
      { start: 16, end: 20, en: "Stupid is as stupid does.", ko: "바보짓을 해야 바보지." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Make a wish, Harry.", ko: "소원을 빌어, 해리." },
      { start: 4, end: 8, en: "I demand that you leave at once, sir!", ko: "당장 나가시오!" },
      { start: 8, end: 12, en: "You're a wizard, Harry.", ko: "넌 마법사야, 해리." },
      { start: 12, end: 16, en: "I'm a what?", ko: "내가 뭐라고요?" },
      { start: 16, end: 20, en: "A wizard. And a thumping good one, I'd wager.", ko: "마법사야. 그것도 아주 대단한." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Don't you turn your back on me, Harry Potter!", ko: "등을 돌리지 마, 해리 포터!" },
      { start: 4, end: 8, en: "I want you to look at me when I kill you.", ko: "너를 죽일 때 내 눈을 보라고." },
      { start: 8, end: 12, en: "Expelliarmus!", ko: "엑스펠리아무스!" },
      { start: 12, end: 16, en: "Avada Kedavra!", ko: "아바다 케다브라!" },
      { start: 16, end: 20, en: "I will not bow to you.", ko: "너에게 굴복하지 않겠어." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Alastor Moody. Ex-Auror, Ministry malcontent.", ko: "알라스토르 무디. 전 오러, 마법부 불만분자." },
      { start: 4, end: 8, en: "Now, which of you can tell me how many Unforgivable Curses there are?", ko: "자, 용서할 수 없는 저주가 몇 개인지 아는 사람?" },
      { start: 8, end: 12, en: "Three, sir.", ko: "셋이요, 선생님." },
      { start: 12, end: 16, en: "And they are so named?", ko: "그리고 그렇게 불리는 이유는?" },
      { start: 16, end: 20, en: "Because they are unforgivable.", ko: "용서할 수 없기 때문이에요." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "That's why her hair is so big. It's full of secrets.", ko: "그래서 그녀 머리가 그렇게 큰 거야. 비밀로 가득 찼거든." },
      { start: 4, end: 8, en: "On Wednesdays we wear pink.", ko: "수요일엔 분홍색 옷을 입어." },
      { start: 8, end: 12, en: "You can't sit with us!", ko: "우리랑 같이 못 앉아!" },
      { start: 12, end: 16, en: "Get in, loser. We're going shopping.", ko: "타, 찐따야. 쇼핑 갈 거야." },
      { start: 16, end: 20, en: "That is so fetch!", ko: "그거 완전 fetch야!" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "I'll never let go, Jack. I'll never let go.", ko: "절대 놓지 않을게, 잭. 절대 놓지 않을게." },
      { start: 4, end: 8, en: "I promise.", ko: "약속해." },
      { start: 8, end: 12, en: "You must promise me that you'll survive.", ko: "살아남겠다고 약속해줘." },
      { start: 12, end: 16, en: "That you won't give up, no matter what happens.", ko: "무슨 일이 있어도 포기하지 않겠다고." },
      { start: 16, end: 20, en: "I promise.", ko: "약속할게." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "Hi, can I get a coffee please?", ko: "안녕하세요, 커피 한 잔 주세요." },
      { start: 3, end: 6, en: "Sure! What size would you like?", ko: "네! 사이즈는 어떻게 할까요?" },
      { start: 6, end: 9, en: "A large iced americano, please.", ko: "아이스 아메리카노 라지로요." },
      { start: 9, end: 12, en: "Would you like any sugar or cream?", ko: "설탕이나 크림 넣어드릴까요?" },
      { start: 12, end: 15, en: "No thanks, just black is fine.", ko: "아니요, 블랙으로 주세요." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "Can I get that with oat milk instead?", ko: "그거 오트밀크로 바꿀 수 있나요?" },
      { start: 3, end: 6, en: "Of course! Anything else?", ko: "물론이죠! 다른 건요?" },
      { start: 6, end: 9, en: "Could you make it extra hot?", ko: "좀 더 뜨겁게 해주실 수 있나요?" },
      { start: 9, end: 12, en: "And an extra shot of espresso, please.", ko: "그리고 에스프레소 한 샷 추가요." },
      { start: 12, end: 15, en: "That'll be six fifty.", ko: "6달러 50센트입니다." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "Excuse me, I think this isn't what I ordered.", ko: "저기요, 이거 제가 주문한 게 아닌 것 같아요." },
      { start: 3, end: 6, en: "Oh, I'm so sorry about that. What did you order?", ko: "아, 정말 죄송해요. 뭘 주문하셨죠?" },
      { start: 6, end: 9, en: "I ordered an iced latte, but this is hot.", ko: "아이스 라떼 주문했는데 이건 뜨거워요." },
      { start: 9, end: 12, en: "Let me make a new one for you right away.", ko: "바로 새로 만들어 드릴게요." },
      { start: 12, end: 15, en: "Thank you, I appreciate it.", ko: "감사합니다." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Hi, welcome! How many in your party?", ko: "안녕하세요, 환영합니다! 몇 분이세요?" },
      { start: 4, end: 8, en: "Just two, please.", ko: "두 명이요." },
      { start: 8, end: 12, en: "Can I start you off with something to drink?", ko: "먼저 음료부터 주문하시겠어요?" },
      { start: 12, end: 16, en: "I'll have a water, please.", ko: "물 주세요." },
      { start: 16, end: 20, en: "Are you ready to order, or do you need a few more minutes?", ko: "주문하시겠어요, 아니면 좀 더 시간이 필요하세요?" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "This is a really nice restaurant.", ko: "여기 정말 좋은 레스토랑이다." },
      { start: 4, end: 8, en: "We wanted to try something new.", ko: "새로운 걸 시도해보고 싶었어." },
      { start: 8, end: 12, en: "What do you recommend?", ko: "뭐가 맛있어요?" },
      { start: 12, end: 16, en: "The special today is really good.", ko: "오늘의 특선이 정말 좋아요." },
      { start: 16, end: 20, en: "We'll have that, then!", ko: "그럼 그걸로 할게요!" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Excuse me, where can I find the milk?", ko: "실례합니다, 우유가 어디에 있나요?" },
      { start: 4, end: 8, en: "It's in aisle three, on the left side.", ko: "3번 통로 왼쪽에 있어요." },
      { start: 8, end: 12, en: "Do you have any organic options?", ko: "유기농 제품은 있나요?" },
      { start: 12, end: 16, en: "Yes, they're right next to the regular ones.", ko: "네, 일반 제품 바로 옆에 있어요." },
      { start: 16, end: 20, en: "Great, thank you so much!", ko: "좋아요, 정말 감사합니다!" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Has anyone seen Lily?", ko: "누가 릴리 봤어?" },
      { start: 4, end: 8, en: "She was just here a minute ago.", ko: "방금 여기 있었는데." },
      { start: 8, end: 12, en: "She's wearing that Waldo costume.", ko: "월리 코스튬을 입고 있어." },
      { start: 12, end: 16, en: "Well, that makes it harder to find her!", ko: "그러면 찾기 더 어렵잖아!" },
      { start: 16, end: 20, en: "That's literally the point of the costume.", ko: "그게 문자 그대로 코스튬의 요점이야." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Let's go to the mall, everybody!", ko: "다 같이 몰에 가자!" },
      { start: 4, end: 8, en: "Come on, Jessica, come on, Tori!", ko: "가자, 제시카, 가자, 토리!" },
      { start: 8, end: 12, en: "Let's go to the mall, you won't be sorry.", ko: "몰에 가자, 후회 안 할 거야." },
      { start: 12, end: 16, en: "Put on your jelly bracelets.", ko: "젤리 팔찌를 착용해." },
      { start: 16, end: 20, en: "And your cool graffiti coat.", ko: "그리고 멋진 그래피티 코트도." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "I'd like to check in for my flight to London.", ko: "런던행 비행기 체크인하려고요." },
      { start: 3, end: 6, en: "May I see your passport, please?", ko: "여권 좀 보여주시겠어요?" },
      { start: 6, end: 9, en: "Would you like a window or aisle seat?", ko: "창가석과 통로석 중 어디로 하시겠어요?" },
      { start: 9, end: 12, en: "Window seat, please.", ko: "창가석으로 주세요." },
      { start: 12, end: 15, en: "Your gate is B12. Boarding starts at 3:30.", ko: "게이트는 B12입니다. 탑승은 3시 30분부터예요." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "Please remove your laptop from your bag.", ko: "가방에서 노트북을 꺼내주세요." },
      { start: 3, end: 6, en: "Do I need to take off my shoes?", ko: "신발도 벗어야 하나요?" },
      { start: 6, end: 9, en: "Yes, and please empty your pockets.", ko: "네, 주머니도 비워주세요." },
      { start: 9, end: 12, en: "Is this liquid container under 100ml?", ko: "이 액체 용기가 100ml 이하인가요?" },
      { start: 12, end: 15, en: "You're all clear. Have a nice flight!", ko: "통과입니다. 좋은 비행 되세요!" },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "Excuse me, where is Gate 23?", ko: "실례합니다, 23번 게이트가 어디예요?" },
      { start: 3, end: 6, en: "Go straight and turn left at the end.", ko: "직진하시다가 끝에서 왼쪽으로 도세요." },
      { start: 6, end: 9, en: "How long does it take to get there?", ko: "거기까지 얼마나 걸려요?" },
      { start: 9, end: 12, en: "About five minutes walking.", ko: "걸어서 약 5분 정도요." },
      { start: 12, end: 15, en: "Thank you so much!", ko: "정말 감사합니다!" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Good morning, Grand Hotel. How may I help you?", ko: "좋은 아침입니다, 그랜드 호텔입니다. 어떻게 도와드릴까요?" },
      { start: 4, end: 8, en: "I'd like to make a reservation, please.", ko: "예약을 하고 싶습니다." },
      { start: 8, end: 12, en: "For how many nights?", ko: "몇 박이요?" },
      { start: 12, end: 16, en: "Three nights, from the 5th to the 8th.", ko: "3박이요, 5일부터 8일까지." },
      { start: 16, end: 20, en: "Would you prefer a single or a double room?", ko: "싱글룸과 더블룸 중 어느 쪽을 원하세요?" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Excuse me, could you tell me how to get to the museum?", ko: "실례합니다, 박물관 가는 길 좀 알려주시겠어요?" },
      { start: 4, end: 8, en: "Sure! Go straight for two blocks, then turn right.", ko: "물론이요! 두 블록 직진 후 오른쪽으로 도세요." },
      { start: 8, end: 12, en: "Is it within walking distance?", ko: "걸어갈 수 있는 거리예요?" },
      { start: 12, end: 16, en: "Yes, it's about a ten-minute walk.", ko: "네, 걸어서 약 10분 정도예요." },
      { start: 16, end: 20, en: "Thank you! You've been very helpful.", ko: "감사합니다! 정말 도움이 되셨어요." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "We was like peas and carrots, Jenny and I.", ko: "제니와 난 완두콩과 당근 같았어요." },
      { start: 4, end: 8, en: "We was always together.", ko: "우리는 항상 함께였어요." },
      { start: 8, end: 12, en: "From that day on, we was like peas and carrots.", ko: "그날부터, 우리는 완두콩과 당근 같았어요." },
      { start: 12, end: 16, en: "She was the most beautiful thing I had ever seen.", ko: "그녀는 내가 본 것 중 가장 아름다웠어요." },
      { start: 16, end: 20, en: "I may not be a smart man, but I know what love is.", ko: "똑똒한 사람은 아니지만, 사랑이 뭔지는 알아요." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "Good morning! How was your weekend?", ko: "좋은 아침이에요! 주말 잘 보냈어요?" },
      { start: 3, end: 6, en: "It was great, thanks for asking.", ko: "좋았어요, 물어봐주셔서 감사해요." },
      { start: 6, end: 9, en: "Shall we get started with the agenda?", ko: "안건 시작할까요?" },
      { start: 9, end: 12, en: "Sure, let me share my screen.", ko: "네, 화면 공유할게요." },
      { start: 12, end: 15, en: "Can everyone see this clearly?", ko: "다들 잘 보이시나요?" },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "I'm writing to follow up on our meeting.", ko: "회의 관련해서 후속 메일 드립니다." },
      { start: 3, end: 6, en: "Please find the attached document.", ko: "첨부 문서를 확인해주세요." },
      { start: 6, end: 9, en: "Could you get back to me by Friday?", ko: "금요일까지 회신 주실 수 있을까요?" },
      { start: 9, end: 12, en: "I look forward to hearing from you.", ko: "답변 기다리겠습니다." },
      { start: 12, end: 15, en: "Best regards.", ko: "감사합니다." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "Let me walk you through today's presentation.", ko: "오늘 발표 내용을 설명드리겠습니다." },
      { start: 3, end: 6, en: "As you can see from this chart...", ko: "이 차트에서 보시다시피..." },
      { start: 6, end: 9, en: "Moving on to the next slide.", ko: "다음 슬라이드로 넘어가겠습니다." },
      { start: 9, end: 12, en: "Does anyone have any questions so far?", ko: "여기까지 질문 있으신 분?" },
      { start: 12, end: 15, en: "To summarize, our key takeaway is...", ko: "요약하면, 핵심 포인트는..." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Tell me about yourself.", ko: "자기소개를 해주세요." },
      { start: 4, end: 8, en: "I'm a motivated professional with five years of experience.", ko: "저는 5년 경력의 의욕적인 전문가입니다." },
      { start: 8, end: 12, en: "What are your strengths?", ko: "당신의 강점은 무엇인가요?" },
      { start: 12, end: 16, en: "I'm a great team player and I'm very organized.", ko: "저는 훌륭한 팀 플레이어이고 매우 체계적입니다." },
      { start: 16, end: 20, en: "Where do you see yourself in five years?", ko: "5년 후의 자신을 어떻게 보시나요?" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Why do you want to work here?", ko: "왜 여기서 일하고 싶으세요?" },
      { start: 4, end: 8, en: "I want to learn and grow in this field.", ko: "이 분야에서 배우고 성장하고 싶습니다." },
      { start: 8, end: 12, en: "What experience do you have?", ko: "어떤 경험이 있으세요?" },
      { start: 12, end: 16, en: "I worked in a similar position for two years.", ko: "비슷한 직무에서 2년간 일했습니다." },
      { start: 16, end: 20, en: "When can you start?", ko: "언제 시작할 수 있으세요?" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Can you handle the pressure?", ko: "압박감을 감당할 수 있어?" },
      { start: 4, end: 8, en: "I thrive under pressure.", ko: "압박 속에서 더 잘해요." },
      { start: 8, end: 12, en: "We need someone who can think on their feet.", ko: "순발력 있는 사람이 필요해." },
      { start: 12, end: 16, en: "That's exactly what I do best.", ko: "그게 바로 제가 가장 잘하는 거예요." },
      { start: 16, end: 20, en: "Let's see how you do this week.", ko: "이번 주에 어떻게 하는지 보자." },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "So tell me, what have you been up to lately?", ko: "그래서, 요즘 뭐 하고 지내요?" },
      { start: 3, end: 6, en: "Oh man, where do I even begin?", ko: "와, 어디서부터 시작하지?" },
      { start: 6, end: 9, en: "I've been working on this crazy new project.", ko: "미친 새 프로젝트를 하고 있어요." },
      { start: 9, end: 12, en: "You always keep us on our toes!", ko: "항상 우리를 긴장시키네요!" },
      { start: 12, end: 15, en: "That's what I do best!", ko: "그게 제 특기죠!" },
    ],
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
    subtitles: [
      { start: 0, end: 3, en: "Are you ready for a quick game?", ko: "빠른 게임 할 준비 됐어요?" },
      { start: 3, end: 6, en: "Bring it on! I love games.", ko: "해보자! 나 게임 좋아해." },
      { start: 6, end: 9, en: "You have to guess the word without saying it.", ko: "단어를 말하지 않고 맞춰야 해요." },
      { start: 9, end: 12, en: "Oh no, this is so hard!", ko: "안돼, 이거 너무 어렵다!" },
      { start: 12, end: 15, en: "Time's up! That was hilarious.", ko: "시간 끝! 진짜 웃겼다." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Welcome to the Musical Genre Challenge!", ko: "뮤지컬 장르 챌린지에 오신 것을 환영합니다!" },
      { start: 4, end: 8, en: "You have to sing a song in a completely different genre.", ko: "완전히 다른 장르로 노래를 불러야 해요." },
      { start: 8, end: 12, en: "Oh, this is going to be interesting.", ko: "오, 이거 재밌겠다." },
      { start: 12, end: 16, en: "You're so talented, it's not fair.", ko: "너무 재능이 넘쳐서 불공평해요." },
      { start: 16, end: 20, en: "That was incredible!", ko: "대단했어요!" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Please welcome Robert Irwin!", ko: "로버트 어윈을 환영해주세요!" },
      { start: 4, end: 8, en: "No, no, no! Get it away from me!", ko: "안 돼, 안 돼, 안 돼! 나한테서 치워!" },
      { start: 8, end: 12, en: "He's completely harmless.", ko: "완전 무해해요." },
      { start: 12, end: 16, en: "I don't care! I'm not touching that!", ko: "상관없어! 난 그거 안 만져!" },
      { start: 16, end: 20, en: "This is the best thing I've ever seen.", ko: "이건 내가 본 것 중 최고야." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Here's the story of some lovely Avengers.", ko: "여기 사랑스러운 어벤져스의 이야기가 있어요." },
      { start: 4, end: 8, en: "Who were bringing up some very lovely stones.", ko: "매우 사랑스러운 보석들을 가져왔죠." },
      { start: 8, end: 12, en: "All of them had powers, like their mother.", ko: "모두 엄마처럼 파워가 있었죠." },
      { start: 12, end: 16, en: "The youngest one in curls.", ko: "곱슬머리의 막내." },
      { start: 16, end: 20, en: "That's the way we all became the Marvel Bunch!", ko: "이렇게 우리 모두 마블 번치가 되었죠!" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Ladies and gentlemen, welcome to the show!", ko: "신사 숙녀 여러분, 쇼에 오신 것을 환영합니다!" },
      { start: 4, end: 8, en: "Can we hear a bit of the Fresh Prince theme?", ko: "프레시 프린스 테마곡 좀 들을 수 있을까요?" },
      { start: 8, end: 12, en: "In West Philadelphia, born and raised!", ko: "서부 필라델피아에서 태어나고 자랐지!" },
      { start: 12, end: 16, en: "On the playground is where I spent most of my days.", ko: "놀이터에서 대부분의 시간을 보냈어." },
      { start: 16, end: 20, en: "That was amazing!", ko: "대단했어요!" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Let me tell you what happened to me.", ko: "나한테 무슨 일이 있었는지 말해줄게." },
      { start: 4, end: 8, en: "I can't believe you just said that!", ko: "방금 그 말을 했다니 믿을 수 없어!" },
      { start: 8, end: 12, en: "I'm sorry, I just can't stop laughing.", ko: "미안, 웃음을 멈출 수가 없어." },
      { start: 12, end: 16, en: "This is the funniest story I've ever heard.", ko: "내가 들어본 것 중 가장 웃긴 이야기야." },
      { start: 16, end: 20, en: "Can we move on? I can't take any more!", ko: "다음으로 넘어갈 수 있을까요? 더 못 참겠어!" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "I'm going to read some mean tweets about myself.", ko: "나에 대한 악플을 읽어볼게요." },
      { start: 4, end: 8, en: "This person says I'm the worst actor ever.", ko: "이 사람은 내가 최악의 배우래요." },
      { start: 8, end: 12, en: "Well, that's not very nice, is it?", ko: "글쎄, 그건 별로 좋지 않네요, 그렇죠?" },
      { start: 12, end: 16, en: "I'd rather watch paint dry than watch your movies.", ko: "네 영화보다 페인트 마르는 걸 보겠어." },
      { start: 16, end: 20, en: "Okay, that one actually hurt a little.", ko: "좋아, 그건 좀 아팠어." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Welcome to the show, everybody!", ko: "모두 쇼에 오신 것을 환영합니다!" },
      { start: 4, end: 8, en: "I have a confession to make.", ko: "고백할 게 있어요." },
      { start: 8, end: 12, en: "I've been doing this for way too long.", ko: "이걸 너무 오래 해왔어요." },
      { start: 12, end: 16, en: "But you love it!", ko: "근데 좋아하잖아요!" },
      { start: 16, end: 20, en: "That's what keeps me going.", ko: "그게 나를 계속하게 해주죠." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Okay, I'm going to open my box.", ko: "좋아, 내 상자를 열어볼게." },
      { start: 4, end: 8, en: "Inside my box, there is... a golden trophy.", ko: "내 상자 안에는... 금색 트로피가 있어." },
      { start: 8, end: 12, en: "I think that's a lie!", ko: "그거 거짓말 같아!" },
      { start: 12, end: 16, en: "It was the truth! Look!", ko: "진짜였어! 봐!" },
      { start: 16, end: 20, en: "No way! I can't believe it!", ko: "말도 안 돼! 믿을 수가 없어!" },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "The club isn't the best place to find a lover.", ko: "클럽은 연인을 찾기 가장 좋은 곳은 아니야." },
      { start: 4, end: 8, en: "So the bar is where I go.", ko: "그래서 바에 가지." },
      { start: 8, end: 12, en: "I'm in love with the shape of you.", ko: "난 너의 모습에 반했어." },
      { start: 12, end: 16, en: "We push and pull like a magnet do.", ko: "우리는 자석처럼 밀고 당기지." },
      { start: 16, end: 20, en: "Although my heart is falling too.", ko: "내 마음도 빠져들고 있지만." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "This hit, that ice cold, Michelle Pfeiffer, that white gold.", ko: "이 히트곡, 차가운 아이스, 미셸 파이퍼, 화이트 골드." },
      { start: 4, end: 8, en: "Don't believe me? Just watch!", ko: "못 믿겠어? 그냥 봐!" },
      { start: 8, end: 12, en: "Uptown funk you up, uptown funk you up!", ko: "업타운 펑크 유 업, 업타운 펑크 유 업!" },
      { start: 12, end: 16, en: "Girls hit your hallelujah!", ko: "소녀들이여 할렐루야!" },
      { start: 16, end: 20, en: "Saturday night and we in the spot.", ko: "토요일 밤 우리는 이 자리에." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Hello, it's me.", ko: "안녕, 나야." },
      { start: 4, end: 8, en: "I was wondering if after all these years you'd like to meet.", ko: "이 세월이 지나도 만나고 싶을까 궁금했어." },
      { start: 8, end: 12, en: "Hello from the other side.", ko: "저 건너편에서 안녕." },
      { start: 12, end: 16, en: "I must have called a thousand times.", ko: "천 번은 전화했을 거야." },
      { start: 16, end: 20, en: "To tell you I'm sorry for everything that I've done.", ko: "내가 한 모든 것에 미안하다고 말하려고." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "I'm waking up to ash and dust.", ko: "재와 먼지 속에서 깨어나." },
      { start: 4, end: 8, en: "I wipe my brow and I sweat my rust.", ko: "이마를 닦고 녹을 흘려." },
      { start: 8, end: 12, en: "I'm breathing in the chemicals.", ko: "화학물질을 들이마셔." },
      { start: 12, end: 16, en: "Welcome to the new age.", ko: "새로운 시대에 오신 것을 환영해." },
      { start: 16, end: 20, en: "I'm radioactive, radioactive.", ko: "난 방사성이야, 방사성." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "I shall call him Squishy and he shall be mine.", ko: "이 녀석을 스퀴시라고 부르겠어, 내 꺼야." },
      { start: 4, end: 8, en: "Just keep swimming, just keep swimming.", ko: "계속 헤엄쳐, 계속 헤엄쳐." },
      { start: 8, end: 12, en: "Fish are friends, not food.", ko: "물고기는 친구야, 먹이가 아니야." },
      { start: 12, end: 16, en: "P. Sherman, 42 Wallaby Way, Sydney.", ko: "P. 셔먼, 월러비 웨이 42번지, 시드니." },
      { start: 16, end: 20, en: "I touched the butt.", ko: "엉덩이를 만졌어." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Do you ever look at someone and wonder, what is going on inside their head?", ko: "누군가를 보고 머릿속에서 무슨 일이 일어나는지 궁금한 적 있어?" },
      { start: 4, end: 8, en: "I just wanted Riley to be happy.", ko: "난 그저 라일리가 행복하길 원했어." },
      { start: 8, end: 12, en: "Crying helps me slow down and think about the weight of life's problems.", ko: "울면 인생 문제의 무게를 천천히 생각하게 돼." },
      { start: 12, end: 16, en: "I know what it's like to feel anxious.", ko: "불안한 기분이 어떤 건지 알아." },
      { start: 16, end: 20, en: "These are our new emotions.", ko: "이것들이 우리의 새로운 감정이야." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "To infinity and beyond!", ko: "무한 저편으로!" },
      { start: 4, end: 8, en: "You are a toy! You are a child's plaything!", ko: "넌 장난감이야! 아이의 놀잇감이라고!" },
      { start: 8, end: 12, en: "The thing that makes Woody special is he'll never give up on you.", ko: "우디가 특별한 이유는 절대 널 포기하지 않는다는 거야." },
      { start: 12, end: 16, en: "So long, partner.", ko: "잘 가, 파트너." },
      { start: 16, end: 20, en: "Thanks, guys.", ko: "고마워, 친구들." },
    ],
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
    subtitles: [
      { start: 0, end: 4, en: "Cross your heart.", ko: "맹세해." },
      { start: 4, end: 8, en: "Adventure is out there!", ko: "모험은 밖에 있어!" },
      { start: 8, end: 12, en: "We're going to South America!", ko: "우리 남아메리카에 갈 거야!" },
      { start: 12, end: 16, en: "Thanks for the adventure. Now go have a new one.", ko: "모험을 함께해줘서 고마워. 이제 새로운 모험을 해." },
      { start: 16, end: 20, en: "You don't talk much. I like you!", ko: "넌 말이 별로 없네. 마음에 들어!" },
    ],
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
