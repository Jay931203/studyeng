# StudyEng UX 개선 분석 및 제안서

**작성일**: 2026-03-08
**작성자**: Product Strategy Agent
**대상**: CEO 피드백 기반 6개 이슈 분석

---

## 1. YouTube "동영상 더보기" 엔드스크린 문제

### Current State
- **관련 파일**: `C:\Users\hyunj\studyeng\src\hooks\useYouTubePlayer.ts` (라인 104~117)
- **관련 파일**: `C:\Users\hyunj\studyeng\src\components\VideoPlayer.tsx` (라인 77~84)
- 현재 YouTube IFrame API playerVars 설정:
  ```
  autoplay: 1, controls: 0, disablekb: 1, fs: 0,
  modestbranding: 1, playsinline: 1, rel: 0,
  cc_load_policy: 0, iv_load_policy: 3, start: clipStart
  ```
- VideoPlayer.tsx에 `pointer-events-none`으로 YouTube UI를 차단하는 투명 오버레이가 이미 있음 (라인 84)
- 영상이 끝까지 재생되면 클립 경계 로직(`clipEnd` 도달 시)이 `onClipComplete`를 호출하고 `seekTo(effStart)`로 되돌림

### Problem
- YouTube IFrame API에서 영상이 ENDED 상태(state=0)에 도달하면, YouTube가 자체적으로 "동영상 더보기" 엔드스크린을 iframe 내부에 렌더링함
- `rel=0`은 관련 영상을 같은 채널로 제한할 뿐, 엔드스크린 자체를 완전히 제거하지는 않음
- 투명 오버레이(`z-[1]`)가 클릭은 차단하지만, 엔드스크린 자체가 시각적으로 보이는 문제는 해결하지 못함
- 현재 클립 경계 로직이 `clipEnd` 도달 시 되감지만, `clipEnd`가 0이거나 실제 영상 끝과 거의 같으면 엔드스크린이 잠깐 보일 수 있음

### Recommendation

**A. 즉시 적용 가능한 해결책 (P0)**

1. **`end` playerVar 추가**: YouTube IFrame API의 `end` 파라미터를 사용하여 영상이 실제 끝에 도달하지 않도록 함
   ```typescript
   // useYouTubePlayer.ts playerVars에 추가
   end: clipEnd > 0 ? Math.floor(clipEnd) : undefined
   ```

2. **onStateChange에서 ENDED 상태 가로채기**: 영상이 끝나면 즉시 되감기
   ```typescript
   onStateChange: (event) => {
     if (event.data === 0) { // YT.PlayerState.ENDED
       // 엔드스크린이 뜨기 전에 즉시 되감기
       event.target.seekTo(effectiveClipStartRef.current, true);
       event.target.playVideo();
     }
     setIsPlaying(event.data === 1)
   }
   ```

3. **폴링 간격에서 "거의 끝" 감지 강화**: 현재 100ms 폴링인데, 영상 끝 2초 전에 미리 다음 동작을 트리거
   ```typescript
   // 영상 끝 1.5초 전에 미리 처리
   if (effEnd > effStart && time >= effEnd - 1.5 && !clipBoundaryCooldownRef.current) {
     // 기존 로직 실행
   }
   ```

4. **CSS로 엔드스크린 영역 완전 차단**: 투명 오버레이의 z-index를 높이고, iframe 위에 검은 배경 오버레이를 ENDED 상태에서 표시

**B. YouTube API 한계**
- `modestbranding`은 2024년부터 더 이상 효과가 없음 (YouTube가 deprecated 처리)
- 엔드스크린을 100% API만으로 제거하는 것은 불가능. YouTube TOS상 iframe 위에 오버레이를 두는 것도 회색지대
- **장기적으로는 자체 호스팅 영상으로 전환해야 완전히 해결 가능**

### Priority: **P0** (사용자 경험을 직접적으로 해치는 문제)

---

## 2. 비로그인 사용자 진행 소실 + Welcome 반복 문제

### Current State
- **관련 파일**: `C:\Users\hyunj\studyeng\src\stores\useOnboardingStore.ts`
- **관련 파일**: `C:\Users\hyunj\studyeng\src\app\onboarding\page.tsx`
- **관련 파일**: `C:\Users\hyunj\studyeng\src\app\(tabs)\layout.tsx` (라인 24~30)
- **관련 파일**: `C:\Users\hyunj\studyeng\src\app\login\page.tsx`
- **관련 파일**: `C:\Users\hyunj\studyeng\src\hooks\useAuth.ts`

**현재 흐름:**
1. 첫 방문 -> `hasOnboarded === false` -> `/onboarding`으로 리다이렉트
2. 온보딩 완료 -> `hasOnboarded: true`를 localStorage(`studyeng-onboarding`)에 저장
3. 모든 사용자 데이터가 localStorage에만 저장됨 (Zustand persist)
4. 로그인 페이지는 존재하지만 **선택사항** ("둘러보기" 버튼으로 건너뛰기 가능)
5. 로그인과 온보딩이 완전히 분리되어 있음. 로그인해도 서버에 데이터 동기화 없음

**저장되는 localStorage 키:**
- `studyeng-onboarding` (온보딩 상태, 관심사, 레벨, 목표)
- `studyeng-user` (레벨, XP, 스트릭)
- `studyeng-daily-missions` (일일 미션)
- `studyeng-badges` (배지)
- `studyeng-player` (자막 모드, 재생 속도)
- `studyeng-premium` (프리미엄 상태)
- 기타 여러 스토어

### Problem
1. **브라우저 데이터 삭제/다른 기기**: localStorage만 사용하므로 모든 진행 데이터 소실
2. **온보딩 반복**: localStorage가 초기화되면 매번 5단계 온보딩을 다시 거침
3. **서버 동기화 없음**: Supabase Auth가 연동되어 있지만, 로그인한 유저의 데이터를 서버에 저장하는 로직이 전혀 없음
4. **비로그인 상태에서의 가치 제한**: 어차피 데이터가 날아갈 건데 열심히 쓸 이유가 없음

### Recommendation

**CEO 제안 (로그인 강제)에 대한 분석:**

강제 로그인은 **올바른 방향이지만, 타이밍이 중요함**.

**경쟁사 분석:**
- **Duolingo**: 앱 시작 시 즉시 강제 가입. 하지만 이미 브랜드 인지도가 높음
- **Cake (케이크)**: 처음에 영상 몇 개를 비로그인으로 보여주고, 특정 기능 접근 시 로그인 유도
- **Netflix/YouTube**: 콘텐츠 맛보기 후 가입 유도
- **결론**: "영상 2~3개 맛보기 -> 로그인 요구" 패턴이 전환율이 가장 높음

**구체적 구현 제안 (P0):**

**Phase 1: "Soft Gate" 패턴 (즉시 구현)**
1. 온보딩을 **2단계로 축소**: "시작하기" -> "레벨 선택" -> 바로 피드
   - 관심사, 일일 목표 선택은 제거하거나 나중에 프로필에서 설정
   - 온보딩은 10초 이내로 끝나야 함
2. 비로그인으로 **영상 3개까지** 시청 가능 (현재 `usePremiumStore`의 `FREE_DAILY_VIEW_LIMIT`과 유사한 로직 활용)
3. 3개 시청 후 **로그인 필수 모달** 표시 (닫기 불가)
4. 로그인하면 localStorage 데이터를 서버로 마이그레이션

**Phase 2: 서버 동기화 (후속)**
1. Supabase에 `user_progress` 테이블 추가
2. 로그인 유저는 Zustand 상태 변경 시 서버에도 동기화
3. 앱 시작 시 서버에서 데이터를 불러와 localStorage와 병합

**파일 변경 범위:**
- `useOnboardingStore.ts`: 단계 축소, 최소 정보만 수집
- `layout.tsx`: 비로그인 사용자 시청 제한 로직 추가
- 새 컴포넌트: `LoginGateModal.tsx` (로그인 강제 모달)
- `useAuth.ts`: 로그인 후 데이터 마이그레이션 로직

### Priority: **P0** (사용자 리텐션의 근본 문제)

---

## 3. 리스닝 게임이 무의미한 문제

### Current State
- **관련 파일**: `C:\Users\hyunj\studyeng\src\components\games\ListeningGame.tsx`
- **관련 파일**: `C:\Users\hyunj\studyeng\src\components\games\GameLauncher.tsx` (라인 163~180)

**현재 동작:**
1. "영상에서 들었던 문장은?" 이라는 질문
2. 4개 선택지 중 하나 고르기 (정답 1개 + 랜덤 오답 3개)
3. 오답은 같은 영상의 다른 자막 or `FALLBACK_SENTENCES` 배열에서 가져옴
4. 오디오 재생 없음. 순수하게 텍스트만 보고 "기억에 의존"
5. XP 10점 획득

### Problem
- **핵심 문제: "리스닝" 게임인데 아무것도 "듣는" 부분이 없음**
- 영상을 볼 때 자막을 읽었으므로, 기억력 테스트에 불과
- 4지선다 중 아무거나 골라도 25% 확률로 맞음
- 맞혀도 "그래서 뭘 배운 거지?" 라는 느낌
- CEO가 정확히 지적: "그냥 들었던 문장 고르기가 뭔 의미가 있어"

### Recommendation

**CEO 제안 분석: "다음에 올 문장 맞추기 + 정답 시 풀 오디오 재생"**

이 아이디어는 좋지만, 몇 가지 기술적 제약이 있음:
- YouTube IFrame API로는 게임 화면에서 특정 구간만 재생하기가 까다로움 (플레이어가 화면에 보여야 함)
- Web Speech API (TTS)로 대체할 수 있지만, 자연스러운 원어민 발음이 아님

**대안 A: "다음 문장 맞추기" 게임으로 리디자인 (권장)**

컨셉: 문맥 이해력 테스트
1. 영상에서 나온 문장 하나를 보여줌 (예: "I can't believe you did that.")
2. "이 다음에 나온 문장은?" 이라고 물음
3. 4지선다 (실제 다음 문장 1개 + 오답 3개)
4. 정답 시, 해당 문장의 한국어 번역 + "문맥" 설명 표시
5. 실제 자막 데이터에 시간순 정보가 있으므로(`start`, `end`), 다음 문장을 자동으로 결정 가능

```typescript
// 핵심 로직: allSubtitles에서 현재 subtitle의 다음 문장을 찾기
const currentIndex = allSubtitles.findIndex(s => s.en === subtitle.en);
const nextSubtitle = allSubtitles[currentIndex + 1]; // 이것이 정답
```

**대안 B: 아예 다른 게임으로 교체 - "속도 퀴즈"**

컨셉: 시간제한 단어 인식
1. 영상에서 나온 문장이 **한 단어씩** 빠르게 사라짐
2. 빈칸이 된 단어를 터치로 맞추기
3. 2초 안에 못 맞추면 자동 넘어감
4. 연속 정답 시 콤보 보너스

**대안 C: 제거 후 다른 게임 슬롯으로 교체**

만약 "리스닝"이라는 카테고리를 유지하기 어렵다면, 차라리:
- "이모션 퀴즈": 문장의 감정/톤을 맞추기 (Happy/Sad/Angry/Sarcastic)
- "상황 퀴즈": 이 문장을 쓸 수 있는 상황 고르기 (터치 기반, 30초 이내)

**결론: 대안 A를 권장 (구현 난이도 낮음, 기존 데이터 구조 활용 가능)**

### Priority: **P1** (게임 품질 문제이지만, 제거보다는 개선이 나음)

---

## 4. 빈칸 채우기(Fill Blank) 게임 제거

### Current State
- **관련 파일**: `C:\Users\hyunj\studyeng\src\components\games\FillBlankGame.tsx`
- **관련 파일**: `C:\Users\hyunj\studyeng\src\lib\games\fill-blank.ts`
- **관련 파일**: `C:\Users\hyunj\studyeng\src\components\games\GameLauncher.tsx` (라인 185~191, 224~226)

**현재 동작:**
1. 문장에서 단어 하나를 `___`로 가림
2. 4지선다로 빠진 단어 맞추기
3. 한국어 힌트 제공
4. XP 10점

**기존 SceneQuizGame과의 차이:**
- FillBlankGame: 단어 하나만 빈칸, 한국어 힌트 제공
- SceneQuizGame: 2~3개 단어를 빈칸 처리, 문장 전체 구조 보여줌
- **사실상 거의 같은 게임이 2개 있는 상태**

### Problem
- CEO 피드백: "타이핑이 귀찮다" - 실제로는 타이핑이 아니라 4지선다이지만, 그만큼 게임 자체가 인상에 안 남는다는 의미
- SceneQuizGame("빈칸 퀴즈")이 이미 더 나은 버전으로 존재
- 게임 2개가 본질적으로 동일 -> 사용자 입장에서 "또 같은 거?"

### Recommendation

**제거 동의함. 구체적 작업:**

1. `FillBlankGame.tsx` 삭제
2. `fill-blank.ts` 삭제
3. `GameLauncher.tsx`에서:
   - `GAME_TYPES` 배열에서 `'fill-blank'` 제거
   - import 제거
   - 하단 버튼 그리드에서 "빈칸 채우기" 버튼 제거
   - 조건부 렌더링에서 `activeGame === 'fill-blank'` 제거
4. UI 레이아웃 재배치: 2x2 그리드 -> 게임이 2개(빈칸 퀴즈 + 리스닝 또는 대체 게임)만 남으므로 1x2 또는 다른 레이아웃

### Priority: **P1** (중복 게임 정리, 다른 게임 개선과 함께 진행)

---

## 5. 문장 만들기(Sentence Puzzle) 게임 제거

### Current State
- **관련 파일**: `C:\Users\hyunj\studyeng\src\components\games\SentencePuzzleGame.tsx`
- **관련 파일**: `C:\Users\hyunj\studyeng\src\lib\games\sentence-puzzle.ts`
- **관련 파일**: `C:\Users\hyunj\studyeng\src\components\games\GameLauncher.tsx` (라인 193~200, 225~227)

**현재 동작:**
1. 문장을 단어 단위로 분해 후 섞어서 표시
2. 사용자가 올바른 순서로 단어를 하나씩 탭
3. 모든 단어 선택 후 "확인" 버튼
4. XP 15점 (다른 게임보다 높음)

### Problem
- **조작이 번거로움**: 단어를 하나씩 탭해서 순서 맞추기는 시간이 오래 걸림
- **"30초 이내" 원칙 위반**: 긴 문장은 7~10개 단어를 순서대로 맞춰야 해서 30초를 훌쩍 넘김
- **실수 시 리셋 과정이 번거로움**: 잘못 터치하면 하나씩 다시 빼야 함
- **"게임" 보다 "시험" 느낌**: CEO가 지적한 핵심. 재미 요소가 전혀 없음
- **모바일에서 손가락이 큰 사용자**: 작은 단어 버튼을 정확히 탭하기 어려움

### Recommendation

**제거 동의함. 구체적 작업:**

1. `SentencePuzzleGame.tsx` 삭제
2. `sentence-puzzle.ts` 삭제
3. `GameLauncher.tsx`에서:
   - `GAME_TYPES`에서 `'sentence-puzzle'` 제거
   - import 제거
   - 하단 버튼에서 "문장 만들기" 제거
   - 조건부 렌더링 제거

**게임 제거 후 남는 것:**
- SceneQuizGame (빈칸 퀴즈) - 유지
- ListeningGame (개선 또는 대체) - 이슈 #3 참조

**결국 게임이 2개만 남으므로, GameLauncher UI를 재설계해야 함:**
- 2개 게임을 가로로 나란히 배치 (현재 상단 row와 동일)
- 또는 카드 슬라이더 형태로 "오늘의 추천 게임" 느낌

**추가 제안: 새로운 게임 아이디어 (후속 개발)**
- **"빠른 번역" 게임**: 한국어 문장 보고 영어 보기 2개 중 맞는 것 고르기 (2지선다로 빠르게)
- **"단어 매칭"**: 영단어 4개 + 한국어 뜻 4개를 선으로 연결 (터치 드래그)
- **"리액션 게임"**: 문장이 빠르게 지나가고, 특정 단어가 나올 때 탭하기

### Priority: **P1** (이슈 #3, #4와 묶어서 게임 시스템 일괄 개편)

---

## 6. 미션 / 구독 할인 / XP 경쟁 / 배지 보상 시스템

### Current State

**미션 시스템:**
- **관련 파일**: `C:\Users\hyunj\studyeng\src\stores\useDailyMissionStore.ts`
- **관련 파일**: `C:\Users\hyunj\studyeng\src\components\DailyMissions.tsx`
- 3개 일일 미션: 영상 시청(N개), 게임 1판, 표현 1개 저장
- 각 미션 완료 시 XP 보상 (5~10 XP)
- 올클리어 보너스: +20 XP
- 매일 자정 리셋

**배지 시스템:**
- **관련 파일**: `C:\Users\hyunj\studyeng\src\stores\useBadgeStore.ts`
- **관련 파일**: `C:\Users\hyunj\studyeng\src\components\BadgeGrid.tsx`
- 10개 배지: 첫 영상, 영상 10개, 3일/7일/30일 스트릭, 첫 게임, 표현 5/20개, 레벨 5/10
- 프로필 페이지에서 3x3+1 그리드로 표시
- 달성 시 토스트 알림

**XP/레벨 시스템:**
- **관련 파일**: `C:\Users\hyunj\studyeng\src\stores\useUserStore.ts`
- 레벨업에 필요한 XP: 현재 레벨 x 100
- 레벨업 시 모달 표시

**구독 시스템:**
- **관련 파일**: `C:\Users\hyunj\studyeng\src\stores\usePremiumStore.ts`
- **관련 파일**: `C:\Users\hyunj\studyeng\src\components\PremiumModal.tsx`
- 무료: 하루 5개 영상, 표현 20개 저장 제한
- 프리미엄: 월 9,900원 / 연 79,900원 (33% 할인)
- 현재 결제 연동 없음 (버튼 누르면 바로 프리미엄 됨)

### Problem

**배지:**
- "첫 걸음", "영상 마니아" 같은 배지는 **아무런 실질적 보상이 없음**
- 프로필에서만 보임. 다른 사용자에게 보여줄 수도 없음 (소셜 기능 없음)
- CEO 정확한 지적: "배지가 있으면 뭐가 좋은데?"

**미션:**
- 미션 보상이 XP 뿐인데, XP 자체가 무의미함 (레벨이 올라가면 뭐가 좋은데?)
- "영상 시청"이 미션이면, 사용자가 재미로 보는 게 아니라 "숙제" 느낌
- 올클리어 보너스 +20 XP는 동기부여에 너무 약함

**XP/레벨:**
- 레벨업의 보상이 "레벨업 모달"뿐. 기능 해제도 없고, 할인도 없음
- 전형적인 "빈 게이미피케이션": 숫자만 올라감

### Recommendation

**CEO 아이디어 분석: "더 공부할수록 더 싸지는 구독"**

이것은 **매우 강력한 차별점**이 될 수 있음. 경쟁사 분석:

- **Duolingo**: Super Duolingo 월 $12.99. 할인은 연간 결제만. 활동 기반 할인 없음.
- **Cake (케이크)**: Cake Plus 월 7,900원. 할인은 프로모션 기반. 활동 기반 할인 없음.
- **어떤 영어 학습 앱도 "학습하면 구독료가 내려간다"는 모델을 안 쓰고 있음**
- -> **최초 시도라면 강력한 마케팅 포인트**

**구체적 구현 제안:**

### A. "미션 할인" 시스템 (핵심 제안, P0)

**컨셉: 매일 미션을 완료하면 다음 달 구독료에서 할인**

| 월간 미션 달성률 | 할인율 | 실제 구독료 (기준: 9,900원) |
|---|---|---|
| 0~30% | 0% | 9,900원 |
| 30~50% | 10% | 8,910원 |
| 50~70% | 20% | 7,920원 |
| 70~90% | 30% | 6,930원 |
| 90~100% | 50% | 4,950원 |

**핵심 메시지: "매일 쓰면 반값"**

UI 구현:
- DailyMissions 컴포넌트 하단에 **"이번 달 할인 진행률"** 프로그레스바 추가
- 할인율이 올라갈 때 축하 애니메이션
- PremiumModal에서 현재 달성 할인율을 실시간으로 보여줌
- "이번 달 12일 더 완료하면 30% 할인!" 같은 넛지

**사업적 관점:**
- 매일 미션을 다 하는 유저 = 가장 충성도 높은 유저 = 구독 취소율 최저
- 50% 할인해줘도, 매일 쓰는 유저는 이탈하지 않으므로 LTV가 더 높음
- 무료 유저에게 "미션만 하면 구독이 싸진다"는 전환 유인
- **할인은 프리미엄 구독자에게만 적용** (무료 유저는 미션 달성률만 축적, 구독 시 적용)

### B. 배지 시스템 개편 (P2)

**선택지 1: 배지 제거**
- 현재 상태로는 존재 의미가 없음
- 프로필 페이지가 허전해지지만, 차라리 깔끔

**선택지 2: 배지를 "프로필 꾸미기" 요소로 전환**
- 배지를 프로필 사진 테두리/프레임으로 사용
- 소셜 기능 추가 전까지는 사실상 무의미
- **나중에 소셜 기능 추가 시 활성화**

**선택지 3 (권장): 배지를 할인 시스템에 통합**
- 특정 배지 달성 = 일회성 추가 할인 쿠폰
- 예: "30일 연속 학습" 배지 -> 다음 달 추가 10% 할인
- 예: "레벨 10 달성" -> 1개월 무료
- 이렇게 하면 배지가 **실질적 보상**으로 변환

### C. XP 시스템 개편 (P2)

**현재 XP가 의미 없는 이유: 레벨업의 보상이 없음**

**제안: XP를 "할인 크레딧"으로 활용**
- 매월 누적 XP에 따라 추가 할인 or 무료 프리미엄 체험 일수 증정
- 500 XP = 프리미엄 1일 무료 체험
- 이렇게 하면 XP가 "실제 가치"를 가지게 됨

**또는 더 단순하게:**
- XP/레벨 시스템을 과감히 제거하고, **미션 달성률 + 스트릭**만 남기기
- "공부하면 싸진다"에 모든 동기부여를 집중

### D. 미션 시스템 개선 (P1)

**현재 미션의 문제: 너무 단순하고 매일 똑같음**

개선 제안:
1. **미션 다양화**: 주간 미션, 특별 미션 추가
   - "이번 주 새로운 카테고리 영상 보기"
   - "친구에게 공유하기" (바이럴)
2. **미션 보상을 XP가 아닌 "할인 포인트"로 직접 연결**
3. **미션 난이도 조절**: 쉬운 미션(영상 1개 보기)과 도전 미션(게임 3판 연속 정답) 혼합

### 파일 변경 범위:
- `useDailyMissionStore.ts`: 미션 할인 달성률 추적 로직 추가
- `usePremiumStore.ts`: 할인율 계산 로직 추가
- `DailyMissions.tsx`: 할인 프로그레스바 UI 추가
- `PremiumModal.tsx`: 현재 할인율 표시
- `useBadgeStore.ts`: 배지 보상 연동 또는 제거
- 새 스토어: `useDiscountStore.ts` (월별 미션 달성률 + 할인 계산)

### Priority:
- **미션 -> 구독 할인 연동: P0** (수익 모델의 핵심 차별점)
- **배지 개편: P2** (할인 시스템 안정화 후)
- **XP 시스템 정리: P2** (우선 미션 할인에 집중)

---

## 종합 우선순위 및 실행 순서

| 순서 | 이슈 | Priority | 예상 난이도 | 비고 |
|---|---|---|---|---|
| 1 | YouTube 엔드스크린 차단 | P0 | 낮음 | playerVars + onStateChange 수정만으로 80% 해결 |
| 2 | 로그인 강제 + 온보딩 축소 | P0 | 중간 | 사용자 리텐션 근본 해결. 서버 동기화는 Phase 2 |
| 3 | 미션 -> 구독 할인 시스템 | P0 | 중간 | 수익 모델 차별점. 할인 계산 로직 + UI |
| 4 | FillBlank + SentencePuzzle 제거 | P1 | 낮음 | 파일 삭제 + GameLauncher 정리 |
| 5 | ListeningGame 리디자인 | P1 | 낮음 | "다음 문장 맞추기"로 변경, 기존 데이터 활용 |
| 6 | 배지/XP 시스템 정리 | P2 | 낮음 | 할인 시스템 안정화 후 결정 |

**총평:**
현재 StudyEng의 가장 큰 문제는 "왜 계속 써야 하는지"에 대한 답이 약하다는 것. "더 쓸수록 더 싸진다"는 구독 할인 모델은 이 문제를 정면으로 해결할 수 있는 강력한 무기. YouTube 엔드스크린과 로그인 문제는 기본적인 사용자 경험 결함이므로 가장 먼저 수정. 게임은 재미없는 것을 제거하고 남은 2개를 확실히 다듬는 방향으로.
