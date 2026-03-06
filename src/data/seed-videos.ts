export interface VideoData {
  id: string
  youtubeId: string
  title: string
  category: string
  difficulty: number
  subtitles: {
    start: number
    end: number
    en: string
    ko: string
  }[]
}

export const seedVideos: VideoData[] = [
  {
    id: '1',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Daily Conversation: Ordering Coffee',
    category: 'daily',
    difficulty: 1,
    subtitles: [
      { start: 0, end: 3, en: "Hi, can I get a coffee please?", ko: "안녕하세요, 커피 한 잔 주실 수 있나요?" },
      { start: 3, end: 6, en: "Sure! What size would you like?", ko: "물론이죠! 어떤 사이즈로 드릴까요?" },
      { start: 6, end: 9, en: "A large iced americano, please.", ko: "아이스 아메리카노 라지로 주세요." },
      { start: 9, end: 12, en: "Would you like any sugar or cream?", ko: "설탕이나 크림 넣어드릴까요?" },
      { start: 12, end: 15, en: "No thanks, just black is fine.", ko: "아니요 괜찮아요, 블랙으로 주세요." },
    ],
  },
  {
    id: '2',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Travel English: At the Airport',
    category: 'travel',
    difficulty: 2,
    subtitles: [
      { start: 0, end: 3, en: "Excuse me, where is Gate 23?", ko: "실례합니다, 23번 게이트가 어디인가요?" },
      { start: 3, end: 6, en: "Go straight and turn left at the end.", ko: "직진하시다가 끝에서 왼쪽으로 도세요." },
      { start: 6, end: 9, en: "How long does it take to get there?", ko: "거기까지 얼마나 걸리나요?" },
      { start: 9, end: 12, en: "About five minutes walking.", ko: "걸어서 약 5분 정도요." },
      { start: 12, end: 15, en: "Thank you so much!", ko: "정말 감사합니다!" },
    ],
  },
  {
    id: '3',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Business English: Meeting Small Talk',
    category: 'business',
    difficulty: 3,
    subtitles: [
      { start: 0, end: 3, en: "Good morning! How was your weekend?", ko: "좋은 아침이에요! 주말 잘 보내셨어요?" },
      { start: 3, end: 6, en: "It was great, thanks for asking.", ko: "좋았어요, 물어봐 주셔서 감사합니다." },
      { start: 6, end: 9, en: "Shall we get started with the agenda?", ko: "안건을 시작할까요?" },
      { start: 9, end: 12, en: "Sure, let me share my screen.", ko: "네, 화면 공유할게요." },
      { start: 12, end: 15, en: "Can everyone see this clearly?", ko: "모두 잘 보이시나요?" },
    ],
  },
]
