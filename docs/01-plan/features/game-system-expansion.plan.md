# Game System Expansion Planning Document

> **Summary**: 2종 게임 상세 설계 — Expression Swipe + Listen & Fill, CTO 피드백 반영
>
> **Project**: Shortee
> **Author**: PM Agent
> **Date**: 2026-03-13
> **Status**: Draft (CTO 승인 대기)

---

## 1. Overview

### 1.1 현재 게임 분석

코드를 직접 확인한 결과 현재 게임은 정확히 **2종**이다.

#### Game 1: 빈칸 퀴즈 (SceneQuizGame)
- **메커니즘**: 자막 문장에서 단어를 빈칸으로 만들고 4지선다로 고름
- **데이터**: 자막 영어 문장 1개 (`subtitle.en`)
- **판정**: 정답 선택 시 즉시 초록/빨강 피드백, 0.5초 후 결과 화면
- **XP**: 정답 +10 XP (고정, `gainXp(10)`)
- **문제점**:
  - 오답지가 `COMMON_DISTRACTORS` 고정 배열 (always, never, really...) — 맥락 무관
  - 단어 1개만 테스트, 표현(expression) 데이터를 전혀 활용하지 않음
  - 반복 출제 방지 없음, 오답 보관 없음

#### Game 2: 다음 대사 맞추기 (ListeningGame)
- **메커니즘**: 현재 자막 보고 다음에 올 대사 4지선다 선택
- **데이터**: 연속된 자막 2개 (current + next)
- **XP**: 정답 +10 XP (고정)
- **문제점**:
  - 오답지 부족 시 `FALLBACK_SENTENCES` 고정 문장으로 채움
  - 오디오 재생 없음 — 듣기 능력 훈련 불가
  - 표현(expression) 데이터 미활용

### 1.2 보유 데이터 자산

| 데이터 | 규모 | 게임 활용 현황 |
|--------|------|--------------|
| expression-entries-v2.json | 3,383 표현 (CEFR, category, register, meaning_ko) | 미활용 |
| expression-index-v2.json | 7,431 매치 (videoId → [{exprId, sentenceIdx, en, ko}]) | 미활용 |
| public/transcripts/{videoId}.json | 1,804 영상 × 자막 [{start, end, en, ko}] | 부분 활용 |
| useFamiliarityStore | exprId별 {count, lastMarkedAt} | 일부 활용 |
| useLevelStore | rawScore + CEFR 가중치 시스템 이미 구현 | XP 연동 가능 |

### 1.3 이번 이터레이션 목표

기존 2종 유지 + 신규 2종 추가. 신규 2종은 보유 데이터를 풀 활용한다.
- **Game A: Expression Swipe** — 표현 카드 판단 게임 + Leitner Box 반복 학습
- **Game B: Listen & Fill** — 실제 오디오 재생 + 표현 빈칸 채우기

---

## 2. Scope

### 2.1 In Scope (이번 이터레이션)

- [ ] Game A: Expression Swipe 신규 구현
- [ ] Game B: Listen & Fill 신규 구현
- [ ] useGameProgressStore 신규 생성 (streak, 오답 노트, Leitner Box)
- [ ] GameLauncher UI 확장 (4종 게임 선택 화면)
- [ ] XP 연동: 두 게임 모두 `useLevelStore.rawScore` 직접 가산 방식

### 2.2 Out of Scope

- 기존 SceneQuizGame / ListeningGame 수정 (별도 이터레이션)
- 음성 인식, 쉐도잉, AI 챗봇
- 멀티플레이어, 리더보드
- Translation Tap, Speed Sort, Scene Order (다음 이터레이션)

---

## 3. Game A: Expression Swipe 상세 설계

### 3.1 핵심 메커니즘

**판단 방식**: 스와이프가 아닌 **2버튼 탭** 방식 선택.
- 이유: 모바일 웹에서 스와이프는 스크롤과 충돌 위험. 터치 영역이 명확한 버튼이 더 빠르고 안정적.
- "알아요" / "몰라요" 두 버튼, 빠른 탭 → 즉각 다음 카드

**카드 구성**:
```
┌─────────────────────────────┐
│  (CEFR 뱃지)  B1  idiom     │
│                             │
│   give it a shot            │  ← 영어 표현 (큰 글자)
│                             │
│   한번 해보다               │  ← 한국어 뜻 (중간 글자)
│                             │
│   "You should give it a     │  ← 실제 영상 문맥 문장 (작은 글자)
│    shot if you're curious"  │    (expression-index에서 가져옴)
│                             │
│  [몰라요]        [알아요]   │
└─────────────────────────────┘
```

문맥 문장이 없는 표현(expression-index 미매칭)은 뜻만 표시.

### 3.2 세션 구조

- 한 라운드: **10장** 고정
- 소요 시간: 카드당 약 2-3초 × 10장 = 20-30초
- 라운드 종료 후: 결과 화면 (streak, 점수, 오답 목록)
- "틀린 표현 복습" 버튼 → 틀린 것만 다시 10장 이내로 재출제

### 3.3 카드 선별 알고리즘

```
우선순위 1 (최우선): Leitner Box 1에 있는 표현 (최근 틀린 것)
우선순위 2: Leitner Box 2에 있는 표현 (오래 전에 틀린 것)
우선순위 3: 아직 한 번도 안 나온 표현 (신규)
우선순위 4: familiar(count >= 3)인 표현 (낮은 확률, 약 10%)

CEFR 필터: 유저 레벨에 따라
  beginner    → A1, A2 위주 (B1 10% 혼합)
  intermediate → B1, B2 위주 (A2/C1 10% 혼합)
  advanced    → B2, C1, C2 위주
```

### 3.4 Leitner Box 시스템

총 3단계 Box. `useGameProgressStore`에 저장.

```
Box 1: 모름 / 처음 등장
Box 2: 1회 맞춤
Box 3 (마스터): 2회 연속 맞춤 → 더 이상 기본 출제 안 됨 (10% 확률만)

틀리면: 항상 Box 1로 리셋
맞으면: 현재 Box + 1 (Box 3 상한)
```

Box 상태와 familiarity count는 별개로 관리. Box는 "게임 내 숙련도", familiarity는 "영상 시청 중 마킹 횟수".

### 3.5 스코어링

| 지표 | 설명 |
|------|------|
| 현재 streak | 연속 정답 수. 틀리면 0 리셋. 화면 상단에 항상 표시. |
| Best streak | 역대 최고 연속 정답. 세션 종료 후 비교 업데이트. |
| 세션 점수 | 정답수 / 총문제수 (예: 7/10) |
| XP | "알아요" 정답 판정 후 XP. 오답 시 XP 없음. |

**XP 공식**: `computeXpForSwipe(exprId, newBoxLevel)` — 기존 `useLevelStore`의 `computeXpForSwipe` 함수 재활용.

**streak 보너스**: 5연속 정답 → +2 XP 추가, 10연속 → +5 XP 추가.

### 3.6 오답 노트

- 틀린 표현은 `wrongAnswers: string[]` (exprId 배열)로 저장
- 세션 종료 결과 화면에서 오답 목록 표시 (표현 + 뜻)
- "다시 풀기" 버튼으로 해당 오답들만 재출제
- 영구 보관은 `useGameProgressStore`의 `leitnerBox[1]` 목록으로 대체 (별도 "오답 노트" 화면 없음 — 이터레이션 단순화)

### 3.7 UI 상태 흐름

```
[세션 시작]
  → 10장 선별 → 카드 표시
  → 탭 ("알아요" / "몰라요")
    → 즉각 색상 피드백 (초록 / 빨강)
    → 0.3초 후 다음 카드로 전환 애니메이션
  → 10장 완료 → 결과 화면
    → streak / 세션 점수 / XP 획득량 표시
    → 틀린 표현 목록 (3개 이하면 전체, 그 이상은 스크롤)
    → "복습하기" / "그만하기" 버튼
```

---

## 4. Game B: Listen & Fill 상세 설계

### 4.1 핵심 메커니즘

**기존 SceneQuizGame과의 결정적 차이**:
- 기존: 텍스트만, 단어 1개, 고정 오답지
- 신규: **실제 오디오 재생** + **표현 단위(구 전체) 빈칸** + **같은 카테고리 표현으로 오답지**

**화면 구성**:
```
┌─────────────────────────────┐
│  (재생 버튼)  [▶ 다시 듣기] │  ← 최대 3회 재생 허용
│                             │
│  You should ______          │  ← 표현 부분이 빈칸
│  if you're curious.         │
│                             │
│  ① give it a shot           │
│  ② take it easy             │  ← 같은 카테고리(idiom) 다른 표현들
│  ③ keep it together         │
│  ④ call it a day            │
└─────────────────────────────┘
```

오디오 재생 전 4지선다 보임 (미리 읽으면서 들을 수 있게).

### 4.2 데이터 플로우

```
1. expression-index-v2에서 표현 선택 (유저 레벨 CEFR 필터 적용)
   → {exprId, videoId, sentenceIdx, en, ko}

2. videoId로 public/transcripts/{videoId}.json 로드
   → transcripts[sentenceIdx] → {start, end, en, ko}

3. YouTube IFrame API
   player.seekTo(start)
   player.playVideo()
   → end 시간 감지 시 player.pauseVideo()
   (setInterval 100ms 폴링 또는 onStateChange)

4. 문장(en)에서 표현(canonical) 위치 찾기
   → 해당 범위를 [____] 처리

5. 오답지 생성
   → expression-entries에서 동일 category 표현 3개 선택
   → 유저가 아는(familiar) 표현 우선 포함 (인식 가능한 오답이어야 배울 수 있음)
   → 정답 포함 4개 shuffle

6. 정답 판정 → XP 지급 → 표현 familiarity +1 (정답 시)
```

### 4.3 오디오 재생 제어

YouTube IFrame API 활용. 게임 전용 hidden player를 별도 생성하거나 기존 VideoPlayer 인스턴스를 주입받는 방식 중 구현 시점에 결정.

- 재생 버튼 누르면 `player.seekTo(start); player.playVideo()`
- end 감지: `setInterval` 100ms로 `player.getCurrentTime() >= end` 확인 → `player.pauseVideo()`
- 최대 3회 재생. 3회 소진 시 재생 버튼 비활성화 (이미 선택한 경우 무관).
- **오디오 없이도 플레이 가능**: YouTube API 실패 시 텍스트 모드 fallback (문장만 표시, 재생 버튼 숨김).

### 4.4 빈칸 처리 로직

```typescript
// 표현 canonical이 문장에서 차지하는 범위를 찾아 빈칸 처리
function applyBlank(sentence: string, expression: string): { before: string; after: string } {
  const idx = sentence.toLowerCase().indexOf(expression.toLowerCase())
  if (idx === -1) return { before: sentence, after: '' } // fallback: 못 찾으면 전체 표시
  return {
    before: sentence.slice(0, idx),
    after: sentence.slice(idx + expression.length),
  }
}
```

표현이 2단어 이상인 경우(예: "give it a shot") 전체를 하나의 빈칸으로 처리.

### 4.5 난이도 조절

| 레벨 | 출제 범위 | 빈칸 힌트 |
|------|----------|---------|
| beginner | A1-B1 표현 | 빈칸 길이 표시 (예: `_____ __ _ ____`) |
| intermediate | B1-B2 표현 | 빈칸 표시만 (`______`) |
| advanced | B2-C2 표현 | 빈칸 없이 문장 위치만 밑줄 |

### 4.6 세션 구조

- 한 라운드: **8문제** 고정 (오디오 재생 시간 고려해 10보다 적게)
- 소요 시간: 문제당 약 10-15초 × 8 = 80-120초 (2분 이내)
- 라운드 종료 후: 결과 화면 (정답률, XP, 표현 목록)

### 4.7 XP 연동

| 조건 | XP |
|------|----|
| 1회 청취 후 정답 | CEFR 가중치 × 카테고리 배수 × 1.5 |
| 2-3회 청취 후 정답 | CEFR 가중치 × 카테고리 배수 × 0.8 |
| 오답 | 0 XP |
| 정답 시 familiarity | +1 카운트 (markFamiliar 호출) |

CEFR 가중치와 카테고리 배수는 기존 `useLevelStore`의 `CEFR_WEIGHTS`, `CATEGORY_MULTIPLIERS` 그대로 사용.

### 4.8 UI 상태 흐름

```
[세션 시작]
  → 문제 로드 (표현 선택 → transcript 로드 → 오답지 생성)
  → 화면: 빈칸 문장 + 4지선다 + 재생 버튼
  → 재생 버튼 탭 → 오디오 클립 재생 (end에서 자동 정지)
  → 선택지 탭
    → 즉각 정답/오답 피드백 (초록/빨강)
    → 0.8초 후 표현 설명 팝업 (canonical + meaning_ko + CEFR)
    → 1.5초 후 다음 문제
  → 8문제 완료 → 결과 화면
    → 정답률, XP, 이번에 배운 표현 목록
```

---

## 5. 공통 설계

### 5.1 게임 진입점

현재: 영상 시청 중 자막 패널의 게임 아이콘 탭 → GameLauncher 모달.

변경 없음. GameLauncher에 신규 2종 추가.

```
[GameLauncher]
  기존 게임 (2종)              신규 게임 (2종)
  ┌──────────────┐  ┌──────────────┐
  │ 빈칸 퀴즈    │  │ Expression   │
  │ ~10초        │  │ Swipe        │
  └──────────────┘  │ ~30초        │
  ┌──────────────┐  └──────────────┘
  │ 다음 대사    │  ┌──────────────┐
  │ ~10초        │  │ Listen &     │
  └──────────────┘  │ Fill         │
                    │ ~2분         │
                    └──────────────┘
```

추후 탭 구조 재설계 시 "게임" 전용 탭으로 이동 가능. 현 이터레이션에서는 현재 진입점 유지.

### 5.2 useGameProgressStore 설계

신규 Zustand store. `persist` 미들웨어 적용 (localStorage key: `studyeng-game-progress`).

```typescript
interface LeitnerEntry {
  box: 1 | 2 | 3         // 1=모름, 2=한번맞춤, 3=마스터
  lastSeenAt: number
  lastResultCorrect: boolean
}

interface GameProgressState {
  // Expression Swipe 전용
  leitner: { [exprId: string]: LeitnerEntry }
  bestStreak: number
  totalSessions: {
    expressionSwipe: number
    listenAndFill: number
  }

  // Actions
  updateLeitner: (exprId: string, correct: boolean) => void
  getLeitnerBox: (exprId: string) => 1 | 2 | 3
  updateBestStreak: (streak: number) => void
  incrementSessionCount: (game: 'expressionSwipe' | 'listenAndFill') => void
}
```

Listen & Fill의 오답/정답은 `useFamiliarityStore.markFamiliar`로 처리 (별도 저장 없음).

### 5.3 기존 게임과의 관계

| 게임 | 처리 |
|------|------|
| SceneQuizGame | 유지 (수정 없음) |
| ListeningGame | 유지 (수정 없음) |
| Expression Swipe | 신규 추가 |
| Listen & Fill | 신규 추가 |

기존 게임 개선은 신규 2종 안정화 후 별도 이터레이션.

---

## 6. 요구사항

### 6.1 Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| FR-01 | Expression Swipe: 10장 카드 라운드 구현 | Must |
| FR-02 | Expression Swipe: "알아요"/"몰라요" 2버튼 판정 | Must |
| FR-03 | Expression Swipe: Leitner Box 3단계 (1=모름, 2=맞춤, 3=마스터) | Must |
| FR-04 | Expression Swipe: 연속 정답 streak 카운터 화면 표시 | Must |
| FR-05 | Expression Swipe: Best streak 영구 저장 | Must |
| FR-06 | Expression Swipe: 결과 화면 (점수 + 오답 표현 목록) | Must |
| FR-07 | Expression Swipe: CEFR 레벨 기반 카드 필터링 | Must |
| FR-08 | Expression Swipe: XP 지급 (computeXpForSwipe 재활용) | Must |
| FR-09 | Listen & Fill: YouTube 클립 오디오 재생 (seekTo + pause) | Must |
| FR-10 | Listen & Fill: 표현 단위 빈칸 처리 | Must |
| FR-11 | Listen & Fill: 같은 카테고리 오답지 3개 생성 | Must |
| FR-12 | Listen & Fill: 최대 3회 재생 제한 | Must |
| FR-13 | Listen & Fill: 정답 후 표현 설명 팝업 | Must |
| FR-14 | Listen & Fill: YouTube API 실패 시 텍스트 전용 fallback | Must |
| FR-15 | Listen & Fill: 정답 시 familiarity +1 (markFamiliar 호출) | Must |
| FR-16 | GameLauncher: 신규 2종 게임 카드 추가 | Must |
| FR-17 | useGameProgressStore: Leitner + bestStreak 영구 저장 | Must |
| FR-18 | Expression Swipe: 문맥 문장 표시 (expression-index 매칭 시) | Should |
| FR-19 | Listen & Fill: 빈칸 힌트 (beginner = 빈칸 글자수 표시) | Should |
| FR-20 | Expression Swipe: streak 5연속/10연속 보너스 XP | Could |

### 6.2 Non-Functional Requirements

| 항목 | 기준 |
|------|------|
| 카드 전환 애니메이션 | 0.3초 이내 (framer-motion) |
| 오디오 로드 시작까지 | 클립 재생 버튼 탭 후 1초 이내 |
| 10장 카드 데이터 로드 | 컴포넌트 마운트 후 200ms 이내 (JSON 클라이언트 로드) |
| 이모지 금지 | UI 전체 — 텍스트 전용 |
| 테마 호환 | light/dark/purple 테마 CSS variable 사용 |

---

## 7. 성공 기준

| 지표 | 기준 |
|------|------|
| Expression Swipe 구현 | 10장 라운드 완주 가능, streak 저장 확인 |
| Listen & Fill 구현 | 오디오 재생 + 빈칸 정답 판정 정상 동작 |
| Leitner Box | 틀린 표현이 Box 1로 이동, 2회 맞추면 Box 3 확인 |
| XP 지급 | 정답 후 rawScore 증가 확인 (useLevelStore) |
| familiarity | Listen & Fill 정답 시 exprId의 count +1 확인 |
| fallback | YouTube API 없는 환경에서 텍스트 모드 동작 |

---

## 8. Risks

| 리스크 | 영향 | 가능성 | 대응 |
|--------|------|--------|------|
| YouTube IFrame API seekTo 정밀도 문제 (100ms 오차) | 중간 | 중간 | start+0.1초, end-0.1초로 여유 부여 |
| expression-index 미매칭 표현 (일부 카드에 문맥 문장 없음) | 낮음 | 높음 | 문맥 없을 때 뜻만 표시 (FR-18 Should) |
| 같은 카테고리 표현 부족 (카테고리당 표현 수 편차) | 중간 | 중간 | 부족 시 다른 카테고리에서 보충 |
| Leitner store 용량 (3,383 표현 × entry) | 낮음 | 낮음 | entry 구조 최소화 (box, lastSeenAt, lastResultCorrect) |
| GameLauncher 4종 → 화면 복잡도 상승 | 낮음 | 낮음 | 2열 그리드로 수용 가능 |

---

## 9. 아키텍처 고려사항

- **신규 파일**: `src/components/games/ExpressionSwipeGame.tsx`, `src/components/games/ListenFillGame.tsx`
- **신규 store**: `src/stores/useGameProgressStore.ts`
- **수정 파일**: `src/components/games/GameLauncher.tsx` (GameType union 타입 확장 + 카드 2개 추가)
- **재활용**: `computeXpForSwipe` (useLevelStore), `markFamiliar` (useFamiliarityStore), `useLevelStore.rawScore` 직접 가산
- **JSON 로드**: expression-entries-v2, expression-index-v2 — 기존 자막과 동일한 클라이언트 사이드 import 방식
- **YouTube 제어**: 게임 전용 hidden IFrame 생성 방식 권장 (기존 VideoPlayer 인스턴스 공유 시 상태 충돌 위험)

---

## 10. Next Steps

1. [ ] CTO 승인
2. [ ] useGameProgressStore 설계 확정 후 Design 문서 작성
3. [ ] Expression Swipe 먼저 구현 (YouTube 의존성 없어서 빠름)
4. [ ] Listen & Fill 구현 (YouTube hidden player 프로토타입 포함)
5. [ ] GameLauncher UI 업데이트

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-13 | 초안 — 코드 분석 기반 현황 파악 + 7종 게임 제안 | PM Agent |
| 0.2 | 2026-03-13 | Game A/B 상세 설계 — CTO 피드백 반영 (streak, 오답 보관, Leitner Box, 오디오 재생) | PM Agent |
