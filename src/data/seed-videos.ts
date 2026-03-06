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

export type CategoryId = 'drama' | 'movie' | 'daily' | 'travel' | 'business' | 'entertainment'

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
]

export const series: Series[] = [
  {
    id: 'friends-s1',
    title: 'Friends 시즌1 명장면',
    category: 'drama',
    description: '프렌즈 시즌1의 재밌는 장면으로 일상 영어를 배워요',
    thumbnailEmoji: '🛋️',
    episodeCount: 4,
  },
  {
    id: 'devil-wears-prada',
    title: '악마는 프라다를 입는다',
    category: 'movie',
    description: '패션 업계 영어와 비즈니스 표현을 배워요',
    thumbnailEmoji: '👠',
    episodeCount: 3,
  },
  {
    id: 'coffee-english',
    title: '카페 영어 마스터',
    category: 'daily',
    description: '카페에서 자주 쓰는 영어 표현 총정리',
    thumbnailEmoji: '☕',
    episodeCount: 3,
  },
  {
    id: 'airport-survival',
    title: '공항 서바이벌 영어',
    category: 'travel',
    description: '공항에서 살아남기 위한 필수 표현',
    thumbnailEmoji: '🛫',
    episodeCount: 3,
  },
  {
    id: 'office-talk',
    title: '직장인 영어 회화',
    category: 'business',
    description: '회의, 이메일, 스몰톡까지',
    thumbnailEmoji: '🏢',
    episodeCount: 3,
  },
  {
    id: 'talk-show-best',
    title: '토크쇼 베스트 모먼트',
    category: 'entertainment',
    description: '미국 토크쇼에서 배우는 자연스러운 영어',
    thumbnailEmoji: '🎙️',
    episodeCount: 2,
  },
]

export const seedVideos: VideoData[] = [
  // === Friends 시즌1 시리즈 ===
  {
    id: 'friends-1',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Friends EP1: 첫 만남',
    category: 'drama',
    difficulty: 2,
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
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Friends EP2: 커피숍 일상',
    category: 'drama',
    difficulty: 2,
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
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Friends EP3: 로스의 고백',
    category: 'drama',
    difficulty: 3,
    seriesId: 'friends-s1',
    episodeNumber: 3,
    subtitles: [
      { start: 0, end: 3, en: "Can I ask you something?", ko: "나 물어봐도 될까?" },
      { start: 3, end: 6, en: "Sure, what is it?", ko: "물론, 뭔데?" },
      { start: 6, end: 9, en: "I've been thinking about us lately.", ko: "요즘 우리에 대해 생각했어." },
      { start: 9, end: 12, en: "What do you mean by 'us'?", ko: "'우리'라니 무슨 뜻이야?" },
      { start: 12, end: 15, en: "I think you know exactly what I mean.", ko: "내가 무슨 말 하는지 정확히 알잖아." },
    ],
  },
  {
    id: 'friends-4',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Friends EP4: 감동의 순간',
    category: 'drama',
    difficulty: 2,
    seriesId: 'friends-s1',
    episodeNumber: 4,
    subtitles: [
      { start: 0, end: 3, en: "I'll be there for you.", ko: "난 항상 네 곁에 있을게." },
      { start: 3, end: 6, en: "That's the most beautiful thing anyone's ever said to me.", ko: "누가 나한테 해준 말 중에 제일 예뻐." },
      { start: 6, end: 9, en: "We're more than friends, you know that right?", ko: "우리 친구 이상이잖아, 알지?" },
      { start: 9, end: 12, en: "I wouldn't have it any other way.", ko: "나도 다른 건 바라지 않아." },
      { start: 12, end: 15, en: "Group hug!", ko: "다 같이 안아!" },
    ],
  },

  // === 악마는 프라다를 입는다 시리즈 ===
  {
    id: 'prada-1',
    youtubeId: 'dQw4w9WgXcQ',
    title: '프라다 EP1: 면접',
    category: 'movie',
    difficulty: 3,
    seriesId: 'devil-wears-prada',
    episodeNumber: 1,
    subtitles: [
      { start: 0, end: 3, en: "I'm smart, I'm hardworking, and I learn fast.", ko: "저는 똑똒하고, 열심히 하고, 빨리 배워요." },
      { start: 3, end: 6, en: "That's what they all say.", ko: "다들 그렇게 말하지." },
      { start: 6, end: 9, en: "But do you have what it takes to work here?", ko: "근데 여기서 일할 자격이 있어?" },
      { start: 9, end: 12, en: "I believe I do, yes.", ko: "네, 있다고 생각해요." },
      { start: 12, end: 15, en: "We'll see about that.", ko: "두고 보자." },
    ],
  },
  {
    id: 'prada-2',
    youtubeId: 'dQw4w9WgXcQ',
    title: '프라다 EP2: 직장 생활',
    category: 'movie',
    difficulty: 4,
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
    youtubeId: 'dQw4w9WgXcQ',
    title: '프라다 EP3: 성장',
    category: 'movie',
    difficulty: 3,
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

  // === 카페 영어 시리즈 ===
  {
    id: 'cafe-1',
    youtubeId: 'dQw4w9WgXcQ',
    title: '카페 EP1: 기본 주문',
    category: 'daily',
    difficulty: 1,
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
    youtubeId: 'dQw4w9WgXcQ',
    title: '카페 EP2: 커스터마이징',
    category: 'daily',
    difficulty: 2,
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
    youtubeId: 'dQw4w9WgXcQ',
    title: '카페 EP3: 문제 해결',
    category: 'daily',
    difficulty: 2,
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

  // === 공항 서바이벌 시리즈 ===
  {
    id: 'airport-1',
    youtubeId: 'dQw4w9WgXcQ',
    title: '공항 EP1: 체크인',
    category: 'travel',
    difficulty: 2,
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
    youtubeId: 'dQw4w9WgXcQ',
    title: '공항 EP2: 보안검색',
    category: 'travel',
    difficulty: 2,
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
    youtubeId: 'dQw4w9WgXcQ',
    title: '공항 EP3: 길 찾기',
    category: 'travel',
    difficulty: 1,
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

  // === 직장인 영어 시리즈 ===
  {
    id: 'office-1',
    youtubeId: 'dQw4w9WgXcQ',
    title: '직장 EP1: 회의 스몰톡',
    category: 'business',
    difficulty: 3,
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
    youtubeId: 'dQw4w9WgXcQ',
    title: '직장 EP2: 이메일 표현',
    category: 'business',
    difficulty: 3,
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
    youtubeId: 'dQw4w9WgXcQ',
    title: '직장 EP3: 프레젠테이션',
    category: 'business',
    difficulty: 4,
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

  // === 토크쇼 시리즈 ===
  {
    id: 'talkshow-1',
    youtubeId: 'dQw4w9WgXcQ',
    title: '토크쇼 EP1: 재밌는 인터뷰',
    category: 'entertainment',
    difficulty: 3,
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
    youtubeId: 'dQw4w9WgXcQ',
    title: '토크쇼 EP2: 즉흥 게임',
    category: 'entertainment',
    difficulty: 2,
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
