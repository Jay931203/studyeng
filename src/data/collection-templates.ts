// Collection template definitions for the Shortee expression collection system.
// Each template defines a filter over the expression-tags taxonomy
// that produces a curated set of sentences for learners.

export interface CollectionFilter {
  situation?: string[]
  vibe?: string[]
  functions?: string[]
  emotions?: string[]
  cefr?: string[]
  register?: string[]
  expressionTypes?: string[]
  power?: string[]
  grammarIntent?: string[]
  flags?: string[]
  // Filter logic: ALL conditions must match (AND between dimensions).
  // Within each array, ANY value can match (OR within arrays).
}

export type CollectionGroup =
  | 'situation'
  | 'vibe'
  | 'function'
  | 'level'
  | 'grammar'
  | 'theme'

export interface CollectionTemplate {
  id: string
  name: string
  description: string
  group: CollectionGroup
  filter: CollectionFilter
  sortPriority: number
}

export const collectionGroupLabels: Record<CollectionGroup, string> = {
  situation: '상황별 영어',
  vibe: '분위기별 영어',
  function: '기능별 영어',
  level: '레벨별 영어',
  grammar: '문법별 영어',
  theme: '테마별 영어',
}

export const collectionTemplates: CollectionTemplate[] = [
  // ─── Situation Collections (상황별 영어) ─────────────────────────
  {
    id: 'cafe-english',
    name: '카페 영어',
    description: '카페에서 주문하고 대화할 때',
    group: 'situation',
    filter: { situation: ['S05'], register: ['R3', 'R4'] },
    sortPriority: 1,
  },
  {
    id: 'hospital-english',
    name: '병원 영어',
    description: '아플 때 쓰는 필수 표현',
    group: 'situation',
    filter: { situation: ['S27', 'S28'] },
    sortPriority: 2,
  },
  {
    id: 'interview-english',
    name: '면접 영어',
    description: '영어 면접 완벽 대비',
    group: 'situation',
    filter: { situation: ['S15'], power: ['P02'] },
    sortPriority: 3,
  },
  {
    id: 'airport-english',
    name: '공항 영어',
    description: '출국부터 입국까지',
    group: 'situation',
    filter: { situation: ['S22'] },
    sortPriority: 4,
  },
  {
    id: 'hotel-english',
    name: '호텔 영어',
    description: '체크인부터 컴플레인까지',
    group: 'situation',
    filter: { situation: ['S23'] },
    sortPriority: 5,
  },
  {
    id: 'office-english',
    name: '사무실 영어',
    description: '직장에서 매일 쓰는 표현',
    group: 'situation',
    filter: { situation: ['S14'], register: ['R2', 'R3'] },
    sortPriority: 6,
  },
  {
    id: 'school-english',
    name: '학교 영어',
    description: '수업, 과제, 캠퍼스 라이프',
    group: 'situation',
    filter: { situation: ['S19', 'S20'] },
    sortPriority: 7,
  },
  {
    id: 'restaurant-english',
    name: '식당 영어',
    description: '주문하고, 불만 말하고, 계산하기',
    group: 'situation',
    filter: { situation: ['S05'] },
    sortPriority: 8,
  },
  {
    id: 'shopping-english',
    name: '쇼핑 영어',
    description: '할인, 교환, 환불 완전 정복',
    group: 'situation',
    filter: { situation: ['S04'] },
    sortPriority: 9,
  },
  {
    id: 'phone-english',
    name: '전화 영어',
    description: '전화 받고 걸고 끊기',
    group: 'situation',
    filter: { situation: ['S24'] },
    sortPriority: 10,
  },

  // ─── Vibe Collections (분위기별 영어) ─────────────────────────
  {
    id: 'sarcastic-english',
    name: '비꼬는 영어',
    description: '네이티브가 돌려까는 법',
    group: 'vibe',
    filter: { vibe: ['V01', 'V15'], emotions: ['E10'] },
    sortPriority: 1,
  },
  {
    id: 'wholesome-english',
    name: '따뜻한 영어',
    description: '마음이 따뜻해지는 표현들',
    group: 'vibe',
    filter: { vibe: ['V02'] },
    sortPriority: 2,
  },
  {
    id: 'savage-english',
    name: '작살 한마디',
    description: '입 다물게 만드는 한방',
    group: 'vibe',
    filter: { vibe: ['V03'], power: ['P07'] },
    sortPriority: 3,
  },
  {
    id: 'cringe-english',
    name: '오글 영어',
    description: '들으면 오그라드는 표현',
    group: 'vibe',
    filter: { vibe: ['V04'] },
    sortPriority: 4,
  },
  {
    id: 'motivational-english',
    name: '동기부여 영어',
    description: '힘이 되는 한마디',
    group: 'vibe',
    filter: { vibe: ['V05'], power: ['P10'] },
    sortPriority: 5,
  },
  {
    id: 'dark-humor-english',
    name: '블랙코미디 영어',
    description: '웃기지만 좀 어두운',
    group: 'vibe',
    filter: { vibe: ['V06'] },
    sortPriority: 6,
  },
  {
    id: 'sweet-english',
    name: '달달한 영어',
    description: '연인끼리 쓰는 달콤 표현',
    group: 'vibe',
    filter: { vibe: ['V07'], emotions: ['E11'] },
    sortPriority: 7,
  },
  {
    id: 'badass-english',
    name: '간지 영어',
    description: '쿨한 한마디, 보스 에너지',
    group: 'vibe',
    filter: { vibe: ['V08'] },
    sortPriority: 8,
  },
  {
    id: 'emotional-english',
    name: '먹먹한 영어',
    description: '눈물 나는 명대사',
    group: 'vibe',
    filter: { vibe: ['V09'], power: ['P10'] },
    sortPriority: 9,
  },
  {
    id: 'funny-english',
    name: '웃긴 영어',
    description: '코미디 대사 모음',
    group: 'vibe',
    filter: { vibe: ['V10'] },
    sortPriority: 10,
  },

  // ─── Function Collections (기능별 영어) ─────────────────────────
  {
    id: 'apologizing',
    name: '사과하는 법',
    description: '진심 담아 사과하는 영어',
    group: 'function',
    filter: { functions: ['F28'] },
    sortPriority: 1,
  },
  {
    id: 'refusing',
    name: '거절하는 법',
    description: '부드럽게/단호하게 거절',
    group: 'function',
    filter: { functions: ['F43'], grammarIntent: ['G01'] },
    sortPriority: 2,
  },
  {
    id: 'complimenting',
    name: '칭찬하는 법',
    description: '센스있게 칭찬하기',
    group: 'function',
    filter: { functions: ['F30'], grammarIntent: ['G03'] },
    sortPriority: 3,
  },
  {
    id: 'consoling',
    name: '위로하는 법',
    description: '힘든 친구에게 하는 말',
    group: 'function',
    filter: { functions: ['F31'], grammarIntent: ['G05'] },
    sortPriority: 4,
  },
  {
    id: 'persuading',
    name: '설득하는 법',
    description: '상대를 내 편으로',
    group: 'function',
    filter: { functions: ['F45'], power: ['P08'] },
    sortPriority: 5,
  },
  {
    id: 'suggesting',
    name: '제안하는 법',
    description: '자연스럽게 제안하기',
    group: 'function',
    filter: { functions: ['F36'], grammarIntent: ['G09'] },
    sortPriority: 6,
  },
  {
    id: 'expressing-anger',
    name: '화내는 법',
    description: '참다 폭발할 때',
    group: 'function',
    filter: { functions: ['F17', 'F55'], grammarIntent: ['G06'] },
    sortPriority: 7,
  },
  {
    id: 'backchanneling',
    name: '맞장구치는 법',
    description: '대화를 이어가는 기술',
    group: 'function',
    filter: { functions: ['F53'], expressionTypes: ['X06'] },
    sortPriority: 8,
  },
  {
    id: 'confessing',
    name: '고백하는 법',
    description: '마음을 전하는 표현',
    group: 'function',
    filter: { functions: ['F64', 'F22'], grammarIntent: ['G22'] },
    sortPriority: 9,
  },
  {
    id: 'encouraging',
    name: '응원하는 법',
    description: '힘내! 할 수 있어!',
    group: 'function',
    filter: { functions: ['F31'], grammarIntent: ['G23'] },
    sortPriority: 10,
  },

  // ─── Level Collections (레벨별 영어) ─────────────────────────
  {
    id: 'beginner-daily',
    name: '왕초보 일상 영어',
    description: '가장 쉬운 매일 표현',
    group: 'level',
    filter: { cefr: ['A1', 'A2'], power: ['P03'] },
    sortPriority: 1,
  },
  {
    id: 'intermediate-idioms',
    name: '중급자 관용구',
    description: '중급에서 고급으로 가는 다리',
    group: 'level',
    filter: { cefr: ['B1', 'B2'], expressionTypes: ['X02', 'X01'] },
    sortPriority: 2,
  },
  {
    id: 'advanced-business',
    name: '고급 비즈니스 영어',
    description: '프로페셔널 표현 모음',
    group: 'level',
    filter: { cefr: ['C1'], register: ['R2'], power: ['P11'] },
    sortPriority: 3,
  },
  {
    id: 'native-like',
    name: '원어민처럼 말하기',
    description: '교과서에 없는 진짜 영어',
    group: 'level',
    filter: { power: ['P01'], register: ['R4', 'R5'] },
    sortPriority: 4,
  },
  {
    id: 'test-prep',
    name: '시험 대비 표현',
    description: 'TOEIC/TOEFL에 나오는 패턴',
    group: 'level',
    filter: { power: ['P12'], register: ['R2', 'R3'] },
    sortPriority: 5,
  },

  // ─── Grammar Collections (문법별 영어) ─────────────────────────
  {
    id: 'would-mastery',
    name: 'would 정복',
    description: 'would의 모든 쓰임',
    group: 'grammar',
    filter: { grammarIntent: ['G12'] },
    sortPriority: 1,
  },
  {
    id: 'conditionals',
    name: '가정법 모음',
    description: 'If I were you, What if...',
    group: 'grammar',
    filter: { grammarIntent: ['G12'] },
    sortPriority: 2,
  },
  {
    id: 'phrasal-verbs',
    name: '구동사 마스터',
    description: 'take off, run into, give up...',
    group: 'grammar',
    filter: { expressionTypes: ['X01'] },
    sortPriority: 3,
  },
  {
    id: 'regret-expressions',
    name: '후회 표현 모음',
    description: 'should have, could have, if only',
    group: 'grammar',
    filter: { grammarIntent: ['G11'] },
    sortPriority: 4,
  },
  {
    id: 'hedging-politeness',
    name: '겸손하게 말하기',
    description: '완곡 표현의 기술',
    group: 'grammar',
    filter: { expressionTypes: ['X07'], register: ['R3'] },
    sortPriority: 5,
  },

  // ─── Theme Collections (테마별 영어) ─────────────────────────
  {
    id: 'netflix-quotes',
    name: '넷플릭스 명대사',
    description: '드라마에서 건진 명대사',
    group: 'theme',
    filter: { power: ['P04'], vibe: ['V08', 'V09'] },
    sortPriority: 1,
  },
  {
    id: 'disney-quotes',
    name: '디즈니 명대사',
    description: '애니메이션 감동 대사',
    group: 'theme',
    filter: { situation: ['S45'], power: ['P04'] },
    sortPriority: 2,
  },
  {
    id: 'drama-fights',
    name: '드라마 싸움 장면',
    description: '말싸움에서 쓰는 영어',
    group: 'theme',
    filter: { situation: ['S39'], functions: ['F55', 'F58', 'F60'] },
    sortPriority: 3,
  },
  {
    id: 'courtroom-english',
    name: '법정 영어',
    description: '재판/법률 드라마 표현',
    group: 'theme',
    filter: { situation: ['S36'] },
    sortPriority: 4,
  },
  {
    id: 'flirting-english',
    name: '썸 타는 영어',
    description: '밀당의 기술',
    group: 'theme',
    filter: { power: ['P09'], emotions: ['E11'] },
    sortPriority: 5,
  },
  {
    id: 'boss-talk',
    name: '직장 상사에게 하는 말',
    description: '사내 정치 서바이벌',
    group: 'theme',
    filter: { situation: ['S17'], register: ['R2', 'R3'] },
    sortPriority: 6,
  },
  {
    id: 'profanity-dictionary',
    name: '비속어 사전',
    description: '드라마에서 듣는 욕 (주의!)',
    group: 'theme',
    filter: { flags: ['contains_profanity'] },
    sortPriority: 7,
  },
  {
    id: 'learn-from-songs',
    name: '노래로 배우는 영어',
    description: '가사 속 표현 모음',
    group: 'theme',
    filter: { flags: ['is_lyrics'] },
    sortPriority: 8,
  },
  {
    id: 'slang-collection',
    name: '슬랭 총정리',
    description: '교과서에 없는 유행어',
    group: 'theme',
    filter: { expressionTypes: ['X05'], power: ['P05'] },
    sortPriority: 9,
  },
  {
    id: 'emergency-english',
    name: '위기 상황 영어',
    description: '긴급할 때 쓰는 필수 표현',
    group: 'theme',
    filter: { situation: ['S28', 'S38'], emotions: ['E04', 'E15'] },
    sortPriority: 10,
  },
]
