# Auto-Level Progression System Planning Document

> **Summary**: 유저가 실제로 흡수한 표현의 CEFR 분포를 기반으로 영어 수준을 자동으로 감지·조정하는 시스템. 시험이 아닌 "표현 컬렉션"이라는 게임 메타포로 레벨을 자연스럽게 끌어올린다.
>
> **Project**: Shortee
> **Version**: 0.2
> **Author**: PM Agent
> **Date**: 2026-03-13
> **Status**: Draft v2 - CTO 피드백 반영 재설계

---

## 1. Overview

### 1.1 Purpose

현재 Shortee는 온보딩 시 자가 진단으로 beginner / intermediate / advanced를 설정하고 이후 수동으로만 변경 가능하다. 이 방식은 두 가지 핵심 문제를 낳는다.

1. **자가 진단의 부정확성**: 영어 학습자는 자신의 수준을 과대·과소평가하는 경향이 강하다. 잘못된 초기 레벨은 콘텐츠 미스매치 → 이탈로 직결된다.
2. **성장 가시성 부재**: 레벨이 변하지 않으면 유저는 성장을 느끼지 못한다. Duolingo의 streak, Cake의 "영상 완주" 뱃지처럼 진척감을 주는 장치가 없으면 D30 리텐션이 무너진다.

Auto-Level Progression은 유저가 앱을 자연스럽게 사용하는 동안 수집되는 신호로 레벨을 지속적으로 보정하여, 항상 적절한 난이도의 콘텐츠와 표현을 제공하는 지능형 매칭 시스템이다.

### 1.2 Background

**경쟁 앱 현황 분석**

| 앱 | 레벨 시스템 | 약점 |
|----|------------|------|
| Duolingo | 배치고사 + 실력 향상 테스트 | 게임화가 강하나 시험 느낌 강함, 영상 콘텐츠 없음 |
| Cake | 영상 완주 기반 진척도 | 레벨 세분화 없음, 자동 조정 없음 |
| Pimsleur | 유닛 순차 진행 | 완전 선형, 개인화 없음 |
| Elsa Speak | 발음 점수 기반 | 음성인식 의존 (Shortee 제외 항목) |
| HelloTalk | 없음 | 소셜 중심 |

**Shortee의 기회**: 영상 시청 + 표현 친숙도 데이터를 결합한 자동 레벨 보정은 현재 어떤 경쟁자도 제공하지 않는다. "보다 보니 레벨이 올랐다"는 경험이 핵심 차별점이다.

### 1.3 Related Documents

- Plan: `docs/01-plan/features/monetization-and-engagement.plan.md`
- Plan: `docs/01-plan/features/shorts-integration-explore-home.plan.md`
- Memory: `C:\Users\hyunj\.claude\agent-memory\bkit-product-manager\MEMORY.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] 레벨 점수(Level Score) 계산 엔진 (클라이언트 사이드, localStorage 기반)
- [ ] 시그널 수집 레이어 (영상 완주율, 표현 친숙도 속도, 재시청 패턴)
- [ ] 레벨업/레벨다운 트리거 조건 정의
- [ ] 레벨 변경 UX (축하 화면, 알림, 거절 옵션)
- [ ] 유저 오버라이드 (항상 수동 변경 가능)
- [ ] Supabase 동기화 (레벨 히스토리 저장)
- [ ] 프리미엄 연계 고려 (기본 뼈대 설계)

### 2.2 Out of Scope

- 음성 인식 기반 발음 평가 (제외 원칙)
- AI 챗봇 진단 (제외 원칙)
- 별도 레벨 테스트/배치고사 화면
- 소셜 랭킹/리더보드 (다음 이터레이션)
- 세부 CEFR 6단계 유저 노출 (내부 계산에만 사용, A1-C2는 표현 메타데이터용)
- 학부모/교사 대시보드

---

## 3. 핵심 설계: 레벨 진단 시그널

### 3.0 설계 원칙 (CTO 피드백 v2 반영)

**무엇이 실제 영어 레벨 신호인가?**

- 세션 빈도, 스와이프 속도, 게임 점수, 탐색 패턴 — 이런 것들은 "앱 사용량"이지 "영어 수준"이 아니다.
- 앱은 이미 유저 레벨에 맞는 콘텐츠를 추천하므로 "어떤 영상을 봤는가"는 레벨 신호가 아니다.
- **유일하게 신뢰할 수 있는 신호**: 유저가 실제로 자기 것으로 만든 표현 (familiar 처리된 표현)의 CEFR 분포.

**핵심 직관**: B2 표현을 30개 이상 흡수한 유저는 B2 수준이다. A1 표현만 가득한 유저는 아직 beginner다. 이건 측정 가능하고 조작이 어렵다.

**게임 메타포**: 표현 카드를 모으는 것 자체가 경험치(XP) 적립이다. 유저에게는 "레벨 진단 시스템"이 아니라 "컬렉션 채우기 게임"으로 느껴져야 한다.

### 3.1 시그널 1 (Primary): 표현 흡수 CEFR 분포

유저의 `familiarExpressions` (familiar 처리된 표현 전체 목록)에서 각 CEFR 레벨별 카운트를 집계한다.

```
흡수 표현 분포 예시:
  A1: 45개
  A2: 38개
  B1: 22개
  B2: 8개   ← 이 분포가 레벨을 결정
  C1: 1개
  C2: 0개
```

각 CEFR 레벨에 가중치를 부여하여 **Absorption Score (0-100)**를 계산한다.

```
CEFR 가중치:
  A1 = 1점 / A2 = 2점 / B1 = 3점 / B2 = 5점 / C1 = 8점 / C2 = 13점
  (피보나치 형태: 상위 레벨 표현일수록 레벨 진단에 훨씬 큰 기여)
```

**Swipe 회차별 XP 차등 (CTO 피드백 v3)**

같은 표현이라도 1/2/3회차 swipe에 따라 XP 기여도가 다르다.

```
XP 지급 규칙:
  1회차 swipe: CEFR가중치 × 0.3  (첫 인식 — 소량 XP)
  2회차 swipe: CEFR가중치 × 0.3  (반복 노출 — 소량 XP)
  3회차 swipe: CEFR가중치 × 0.4  (완전 습득 — "Familiar!" 이펙트 + 풀 XP)

  총합: 3회 모두 swipe하면 CEFR가중치 × 1.0 (100% 반영)
```

예시: B2 idiom 표현 (CEFR 5점 × 카테고리 1.5배 = 7.5점)
- 1회 swipe: +2.25 XP (화면에 "+2 XP" 표시)
- 2회 swipe: +2.25 XP (화면에 "+2 XP" 표시)
- 3회 swipe: +3.0 XP + "Familiar!" (화면에 "+3 XP" + 특별 이펙트)

```
Raw Score = Σ(표현수 × CEFR 가중치 × 카테고리 가중치 × swipe진행률)
  - swipe 1회: 진행률 0.3
  - swipe 2회: 진행률 0.6
  - swipe 3회: 진행률 1.0
Normalized Score = min(Raw Score / 500, 100)  // 500점을 만점 기준으로 정규화
```

### 3.2 시그널 2 (Secondary): 표현 카테고리 다양성

같은 개수라도 idiom + phrasal verb + collocation을 골고루 소화한 유저가 slang/interjection만 쌓인 유저보다 실력이 높다. 카테고리 다양성 보너스를 적용한다.

```
카테고리 가중치:
  idiom: ×1.5배 보너스
  phrasal_verb: ×1.4배
  collocation: ×1.3배
  sentence_frame: ×1.2배
  discourse_marker: ×1.2배
  slang: ×1.0배 (보너스 없음)
  interjection: ×1.0배
  filler: ×0.8배 (레벨 기여도 낮음)
```

카테고리 다양성 보너스는 Absorption Score에 최대 20%p를 추가한다.

**예시**: 80개 표현을 가졌는데 모두 filler/interjection이면 Score 낮음. 같은 80개가 idiom + phrasal_verb 중심이면 Score 높음.

### 3.3 시그널 3 (Tiebreaker): 영상 완주율 — 노출(Exposure) 지표

완주율은 "이해했다"가 아니라 "노출됐다"를 나타낸다. 따라서 레벨 결정에 직접 사용하지 않고, 레벨업 트리거의 보조 조건으로만 사용한다.

- 역할: 흡수 표현이 충분히 쌓였을 때 "데이터가 충분히 쌓였는가" 확인용
- 완주율 >60% (최근 20개 영상 평균)이어야 레벨업 트리거 발동 가능 (신뢰도 보장)
- 완주율이 낮다고 레벨다운시키지 않음 (시청 패턴은 선호이지 실력이 아님)

### 3.4 제외된 시그널 (CTO 피드백)

아래 항목들은 원래 설계에 포함됐지만, 영어 실력과 실질적 상관관계가 없어 **전면 제외**한다.

| 제외된 시그널 | 제외 이유 |
|-------------|---------|
| 세션 빈도 / DAU/WAU | 앱 사용 열심도이지 영어 레벨이 아님 |
| 스와이프 속도 | 사용자마다 다름, 레벨과 무관 |
| 난이도 선택 편향 | 앱이 이미 레벨에 맞는 콘텐츠 추천 → 유저가 "선택"하는 게 아님 |
| 게임 점수 / 정답률 | 게임은 재밌기만 하면 됨. 스트레스 요인으로 만들지 않음 |
| 세션 시간 / 탐색 패턴 | 앱 사용 행동이지 영어 수준 아님 |

---

## 4. 레벨 점수 모델 (Absorption Score 기반)

### 4.1 Absorption Score 구조

내부적으로 0-100점의 연속 점수를 유지한다. 유저에게는 숫자가 노출되지 않는다. 유저가 보는 것은 "내가 모은 표현들"이다.

```
Absorption Score (0-100)
├── 0-39:  beginner 구간
├── 40-69: intermediate 구간
└── 70-100: advanced 구간
```

초기값 설정:
- 온보딩에서 beginner 선택 → 초기 Score = 20 (beginner 구간 초반)
- intermediate 선택 → 초기 Score = 50
- advanced 선택 → 초기 Score = 75

### 4.2 점수 계산: 표현 누적 기반 (세션 독립)

WMA(가중 이동 평균)는 세션 행동 데이터에 기반한 모델이다. 이번 설계는 세션 시그널을 사용하지 않으므로, **Score = 현재 흡수 표현 전체에서 직접 계산**한다. 누적값이므로 항상 monotonic하게 증가하거나 유지된다 (흡수한 표현은 줄어들지 않는다).

```
갱신 트리거: familiar 표현이 추가될 때마다 (실시간)

Score 계산:
  Step 1. familiarExpressions 전체 목록 읽기
  Step 2. 각 표현의 CEFR × 카테고리 가중치 합산 = Raw Score
  Step 3. Normalized Score = min(Raw Score / threshold, 100)

threshold 값 (A/B 테스트로 추후 조정):
  - beginner → intermediate: Raw Score ≥ 150
  - intermediate → advanced: Raw Score ≥ 400
```

**왜 WMA가 아닌가?**

WMA는 세션 빈도, 완주율 등 세션 행동 데이터를 기반으로 한다. 그러나 세션 행동은 영어 레벨과 상관관계가 없다는 것이 CTO 피드백의 핵심이다. Absorption Score는 "지금 이 사람이 실제로 자기 것으로 만든 표현 총량"에만 의존하므로, 매 familiar 이벤트마다 직접 재계산하는 것이 더 정직하고 단순하다.

### 4.3 레벨업 트리거 조건

**레벨업 조건 (2가지 모두 충족)**
1. Absorption Score가 구간 경계를 초과
2. 최근 20개 영상 중 완주율 >80% (충분한 노출이 있었는지 확인. 100% 완주는 현실적으로 없으므로 80%가 적정 기준)

조건 2는 "영상을 실제로 보면서 표현을 익힌 것인지" 확인하는 안전망이다. 영상을 거의 안 보고 표현 카드만 저장·스와이프해서 레벨업하는 것을 방지한다.

**레벨다운: 없음**

흡수한 표현은 줄어들지 않는다. Absorption Score는 단조 증가(monotonically increasing)다. 레벨다운은 이 모델에서 의미가 없다. 유저가 어려움을 느끼면 피드 카드를 통해 "더 편한 콘텐츠도 있어요" 형태로 제안하되 레벨 숫자는 건드리지 않는다.

### 4.4 볼륨 임계값 (Volume Thresholds)

레벨 구간 경계를 표현 개수로도 직관적으로 확인 가능하다.

| 레벨 구간 | Raw Score 임계값 | 대략적 표현 구성 예시 |
|----------|-----------------|---------------------|
| beginner → intermediate | ≥ 150 | A1 50개 + A2 30개 + B1 10개 정도 |
| intermediate → advanced | ≥ 400 | B1 30개 + B2 20개 + C1 5개 이상 포함 |

단순히 많이 모으면 되는 게 아니다. B1/B2 표현의 가중치가 훨씬 높기 때문에 "어려운 표현을 조금 알면 쉬운 표현을 많이 알 때보다 점수가 높다"는 원칙이 자연스럽게 작동한다.

### 4.5 "경험치(XP)" 메타포 — 게임으로 느끼게 하는 방법

유저에게 Absorption Score 숫자를 보여주지 않는 대신, **XP와 게이지로 체감**하게 만든다.

**Swipe 시 XP 피드백 (CTO 피드백 v3)**
- 매 swipe마다 카드 위에 "+N XP" 플로팅 텍스트 애니메이션 (위로 떠오르며 fade-out)
- 1회/2회: 작은 XP 텍스트
- 3회 (familiar): "+N XP" + "Familiar!" 특별 이펙트 (파티클 or 글로우)
- B1 이상 표현 흡수 시 "Rare" 등급 느낌의 특별 반응 (카드 테두리 글로우 등)

**My 탭 레벨 게이지 (CTO 피드백 v3)**
- Stats 카드의 Level 표시 아래에 다음 레벨까지의 진행률 게이지 바 표시
- 게이지 = (현재 Raw Score - 현재 레벨 하한) / (다음 레벨 임계값 - 현재 레벨 하한)
- 예: beginner(Raw 80) → intermediate 임계값 150 → 게이지 80/150 = 53%
- Advanced 도달 후에는 게이지 대신 "컬렉션 총 N개" 표시
- 게이지는 테마 accent 컬러, 부드러운 spring 애니메이션으로 채워짐

**레벨업은 "자연스럽게 XP가 쌓여서 됐다"는 서사 강화**
- 컬렉션이 쌓이는 과정 자체가 보상
- CEFR별 컬렉션 현황은 Stats 상세 페이지에서 시각화

### 4.6 엣지 케이스 처리

| 케이스 | 처리 방법 |
|--------|-----------|
| 표현 데이터 없는 신규 유저 | familiar 표현 0개 → Score = 온보딩 선택값. 첫 10개 표현 누적까지는 레벨업 트리거 없음 |
| Advanced 유저가 A1 표현을 뒤늦게 처음 흡수 | 당연히 Score에 반영. A1 표현 가중치가 낮으므로 영향 미미 |
| 영상을 거의 안 보는 유저 (완주율 조건 미달) | 레벨업 보류. 표현 XP는 계속 누적. 완주율 조건 충족 후 다음 familiar 이벤트에서 레벨업 |
| 레벨 상한 도달 (advanced 100점) | 레벨 유지. "C1/C2 표현을 소화하고 있어요" 뱃지 부여. 컬렉션은 계속 쌓임 |
| 여러 기기 사용 | familiarExpressions는 Supabase 동기화. 충돌 시 합집합 (더 많은 쪽 우선) |
| 온보딩 레벨 명백히 틀린 경우 | Absorption Score가 즉시 임계값 초과하면 바로 레벨업 제안 가능. 별도 완화 로직 불필요 |

---

## 5. UX 플로우: 레벨 변경 경험

### 5.1 핵심 원칙

"레벨이 올랐습니다. 테스트 통과를 축하합니다!" — 이런 UX는 금지한다.

대신: "당신이 자연스럽게 흡수하고 있는 것들이 쌓였습니다."

### 5.2 레벨업 UX 플로우 (CTO 피드백 v3: 영상 보다가 즉시 축하)

레벨업은 다음 세션이 아니라, **트리거되는 그 순간 바로** 축하한다. 영상 보면서 표현을 swipe하다가 임계값을 넘으면 즉시 레벨업 화면이 뜬다.

```
영상 시청 중 → 표현 카드 swipe → familiar 이벤트 발생
    ↓
Absorption Score 재계산 → 임계값 초과 감지
    ↓
영상 자동 일시정지
    ↓
[전체 화면 오버레이 애니메이션]
  - 배경: 현재 테마 컬러 그라디언트 풀스크린
  - 텍스트: "Something's changing..." (1초 딜레이)
  - 이어서: "{이전 레벨} → {새 레벨}" (부드러운 전환)
  - 서브텍스트: "You've been absorbing more than you think."
  - (한글 버전: "어느새 흡수하고 있었네요.")
    ↓
[작은 맥락 제공]
  - "{X}개 표현을 자연스럽게 익혔어요"
  - 게이지가 가득 차는 애니메이션
    ↓
[CTA: 2개 옵션]
  - Primary: "Keep it" (새 레벨 수락)
  - Secondary: "Stay at {이전 레벨}" (거절, 눈에 잘 안 띄게)
    ↓
수락 시: 피드가 새 레벨 콘텐츠로 전환됨 (즉시), 영상 재생 재개
거절 시: 레벨 유지, Score 리셋하지 않고 관찰 계속
```

### 5.3 레벨 조정 제안 UX (레벨다운 시나리오)

레벨다운은 절대 자동으로 하지 않는다. 제안 형태로만.

```
피드 내 자연스러운 카드 삽입:
"요즘 조금 어렵게 느껴지나요?
더 편안한 속도로 즐길 수 있는 콘텐츠도 있어요."

[더 쉬운 콘텐츠 보기] [괜찮아요]
```

"더 쉬운 콘텐츠 보기" 탭 → 레벨 일시 혼합 (레벨 숫자 변경 없이 하위 레벨 콘텐츠 믹스)
14일 후에도 동일 시그널이면 재제안.

### 5.4 My Learning 탭 내 레벨 표시

Stats 페이지에서:
- 현재 레벨 뱃지 (beginner / intermediate / advanced) — 탭하면 수동 변경 가능 (기존 유지)
- "성장 지표" 섹션 추가:
  - 이번 달 익힌 표현 수
  - 완주한 영상 수
  - 시청 시간
  - (내부 Score 숫자는 노출 안 함)
- 레벨업 히스토리 타임라인 (언제 레벨이 바뀌었는지)

### 5.5 레벨과 표현 시스템 연동

레벨이 변경되면 expression priming 범위도 자동 조정:
- beginner → intermediate: A1-B1 → A2-B2로 전환 (점진적 블렌딩, 즉시 전환 아님)
- 블렌딩 기간: 7일. 이 기간 동안 이전 레벨 표현 30% + 새 레벨 표현 70% 혼합

---

## 6. 데이터 모델

### 6.1 클라이언트 저장 (localStorage, 키 prefix: studyeng-)

세션 시그널 로그가 불필요해졌다. Absorption Score는 `familiarExpressions` (이미 기존 시스템에 존재)에서 직접 계산하므로 별도 시그널 버퍼가 필요 없다. 데이터 모델이 대폭 단순화된다.

```typescript
// studyeng-level-score (기존 대비 대폭 단순화)
interface LevelScore {
  absorptionScore: number;     // 0-100, familiarExpressions에서 실시간 계산
  level: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;         // ISO 8601, 마지막 familiar 이벤트 시각
  pendingLevelUp: boolean;     // 다음 앱 시작 시 레벨업 화면 표시 여부
  pendingNewLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  lastLevelUpAt: string | null; // 마지막 레벨업 시각 (히스토리용)
}

// studyeng-video-completion-log (레벨업 트리거 조건 2 — 최근 20개만 보관)
interface VideoCompletionLog {
  entries: VideoCompletionEntry[];  // 최대 20개 FIFO
}
interface VideoCompletionEntry {
  videoId: string;
  completionRate: number;  // 0-1
  watchedAt: string;
}

// studyeng-level-history (변경 없음)
interface LevelHistory {
  events: LevelEvent[];
}
interface LevelEvent {
  timestamp: string;
  from: string;
  to: string;
  trigger: 'auto' | 'manual';
  absorptionScoreAtChange: number;  // scoreAtChange → absorptionScoreAtChange로 rename
  expressionCountAtChange: number;  // 흡수 표현 수 (진단 근거)
}
```

**제거된 데이터 구조:**
- `sessionSignals` (세션별 시그널 로그) — 세션 행동 시그널 전면 제외로 불필요
- `sessionCount`, `consecutiveUpperSessions`, `consecutiveLowerSessions` — 레벨다운 모델 제거로 불필요

### 6.2 Supabase 스키마 (기존 테이블 확장)

```sql
-- user_profiles 테이블에 컬럼 추가
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  absorption_score DECIMAL(5,2) DEFAULT 20.0,
  absorption_score_updated_at TIMESTAMPTZ;

-- level_history 신규 테이블
CREATE TABLE level_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_level TEXT NOT NULL,
  to_level TEXT NOT NULL,
  absorption_score_at_change DECIMAL(5,2),
  expression_count_at_change INTEGER,
  trigger_type TEXT CHECK (trigger_type IN ('auto', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_level_history_user_id ON level_history(user_id);
CREATE INDEX idx_level_history_created_at ON level_history(created_at DESC);

-- RLS
ALTER TABLE level_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own history" ON level_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON level_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 7. Requirements

### 7.1 Functional Requirements

| ID | 요구사항 | 우선순위 | Phase |
|----|---------|----------|-------|
| FR-01 | familiar 표현 추가 시마다 CEFR × 카테고리 가중치로 Absorption Score를 재계산한다 | Must | 1 |
| FR-02 | Absorption Score가 레벨 임계값을 초과하고 완주율 조건 충족 시 pendingLevelUp 플래그를 세운다 | Must | 1 |
| FR-03 | 앱 시작 시 pendingLevelUp 확인 후 레벨업 UX를 표시한다 | Must | 1 |
| FR-04 | 유저가 레벨업을 거절할 수 있다 | Must | 1 |
| FR-05 | 레벨 변경 시 expression priming 범위를 7일 블렌딩으로 조정한다 | Must | 1 |
| FR-06 | Level History를 localStorage에 저장하고 Stats에서 표시한다 | Should | 1 |
| FR-07 | Supabase에 Absorption Score와 Level History를 동기화한다 | Should | 1 |
| FR-08 | 영상 완주율을 VideoCompletionLog에 기록한다 (최근 20개 FIFO, 레벨업 트리거 조건용) | Must | 1 |
| FR-09 | 레벨다운은 없음. 유저가 어려움을 느끼는 신호 감지 시 피드 카드로 제안만 한다 | Must | 1 |
| FR-10 | familiar 표현 흡수 시 XP 적립 애니메이션 (+1 피드백) | Should | 1 |
| FR-11 | B1 이상 CEFR 표현 흡수 시 "Rare" 등급 시각 피드백 | Could | 2 |
| FR-12 | Stats 페이지에 CEFR별 흡수 표현 수 시각화 (바 차트) | Should | 1 |
| FR-13 | My Learning 탭 레벨업 히스토리 타임라인 | Could | 2 |
| FR-14 | 신규 유저 첫 10개 표현 누적 전까지 레벨업 트리거 비활성화 | Must | 1 |

### 7.2 Non-Functional Requirements

| 카테고리 | 기준 | 측정 방법 |
|---------|------|-----------|
| 성능 | Level Score 계산은 세션 종료 시 50ms 이내 완료 | Chrome DevTools |
| 저장 용량 | localStorage 사용량 5KB 이내 (세션 시그널 최대 30개) | Storage 탭 확인 |
| UX 반응성 | 레벨업 화면 애니메이션 60fps 유지 | Framer Motion + Chrome |
| 프라이버시 | Level Score 원시 데이터는 유저 본인만 접근 가능 | Supabase RLS 정책 |
| 오프라인 | 오프라인 시 시그널 로컬 누적, 온라인 복귀 시 동기화 | 수동 테스트 |

---

## 8. MoSCoW 우선순위 정리

### Must (Phase 1 — 첫 번째 구현 이터레이션)

- Absorption Score 계산 엔진 (CEFR × 카테고리 가중치, familiar 이벤트마다 재계산)
- 레벨업 트리거 조건 판별 (Score 임계값 + 완주율 조건)
- pendingLevelUp 플래그 세우기
- 레벨업 축하 UX (전체 화면, 수락/거절)
- 피드 내 "더 편한 콘텐츠" 카드 제안 (레벨다운 대신)
- Expression priming 블렌딩 (레벨 전환 시 7일)
- 신규 유저 10개 표현 보호 기간
- VideoCompletionLog 기록 (최근 20개 FIFO)

### Should (Phase 1 포함 또는 Phase 2 초반)

- Supabase 동기화 (Absorption Score, Level History)
- Stats CEFR별 흡수 표현 시각화 (바 차트)
- familiar 표현 XP 적립 애니메이션

### Could (Phase 2)

- B1+ 표현 "Rare" 등급 시각 피드백
- 레벨업 히스토리 타임라인 UI
- A/B 테스트 인프라 (임계값 파라미터 조정)

### Won't (현재 범위 제외)

- 세션 행동 기반 레벨 시그널 (세션 빈도, 스와이프 속도, 게임 점수 등)
- 레벨다운 자동 실행
- 음성 인식 발음 평가 기반 레벨링 (앱 철학 위반)
- 별도 레벨 배치고사 화면 (앱 철학 위반)
- 소셜 랭킹/리더보드 (별도 기능)
- 학부모/교사 관리 대시보드

---

## 9. Success Criteria

### 9.1 Definition of Done

- [ ] `computeAbsorptionScore(familiarExpressions)` 함수가 CEFR × 카테고리 가중치를 정확히 계산한다
- [ ] familiar 표현 추가 시마다 Score가 재계산되어 localStorage에 기록된다
- [ ] Score 임계값 + 완주율 조건 충족 시 pendingLevelUp 플래그가 세워진다
- [ ] 레벨업 UX가 다음 앱 시작 시 정확히 표시된다
- [ ] 레벨업 거절 시 레벨이 변경되지 않는다
- [ ] 레벨 변경 시 expression priming 범위가 자동 조정된다
- [ ] Supabase level_history 테이블에 이벤트가 기록된다 (absorption_score_at_change, expression_count_at_change 포함)
- [ ] 신규 유저 첫 10개 표현 전까지 레벨업이 트리거되지 않는다

### 9.2 비즈니스 성공 지표

| 지표 | 목표 | 측정 기간 |
|------|------|-----------|
| D30 리텐션 | 기존 대비 15% 향상 | 출시 후 30일 |
| 레벨업 수락률 | >70% (거절 <30%) | 첫 100 레벨업 이벤트 |
| 레벨업 후 세션 유지 | 레벨업 다음 3일 내 재접속률 >80% | — |
| 표현 familiar 처리 속도 | 레벨 보정 후 평균 처리 일수 감소 | — |

### 9.3 품질 기준

- [ ] 테스트 커버리지: Level Score 엔진 유닛 테스트 90% 이상
- [ ] 엣지 케이스 5개 모두 테스트 케이스 작성
- [ ] Supabase RLS 정책 검증 완료

---

## 10. Risks and Mitigation

| 리스크 | 영향 | 가능성 | 완화 방안 |
|--------|------|--------|-----------|
| 잘못된 레벨업 (콘텐츠가 갑자기 너무 어려워짐) | High | Medium | 3세션 연속 조건 + 14일 버퍼. 언제든 수동 변경 가능 유지 |
| 유저가 레벨업 시스템을 인식하지 못함 (무관심) | Medium | Low | 레벨업 UX가 충분히 드라마틱해야 함 (Framer Motion 풀스크린) |
| Score 파라미터(0.7/0.3) 부적절 | Medium | Medium | Phase 1은 하드코딩, Phase 2에서 A/B 테스트로 보정 |
| 데이터 부족 (신규 유저) | High | High | 초기 10세션은 레벨업 트리거 없음 (관찰 전용 기간) |
| 어뷰징 (레벨 조작 목적 반복 패턴) | Low | Low | 서버사이드 Score는 클라이언트 값과 diff 체크. 이상치 감지 |
| localStorage 데이터 소실 | Medium | Low | Supabase 동기화 + 소실 시 서버 값으로 복원 |

---

## 11. Architecture Considerations

### 11.1 Project Level

Dynamic (기존 Next.js 15 + Supabase 스택 그대로)

### 11.2 핵심 아키텍처 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| Score 계산 위치 | 클라이언트 (localStorage) | 오프라인 지원, 서버 비용 절감. 동기화는 fire-and-forget |
| Score 계산 방식 | familiarExpressions 전체 재계산 (이벤트 기반) | 세션 시그널 불필요. 언제든 재계산 가능. 디버깅 쉬움 |
| Score 저장 | localStorage + Supabase | 기존 패턴 유지 (studyeng- prefix) |
| 레벨업 UX 타이밍 | 앱 시작 시 (cold start) | 세션 중 인터럽트 방지, 자연스러운 진입점 |
| 표현 블렌딩 | getExpressionsByLevel() 파라미터 확장 | 기존 함수 재사용, 최소 변경 |
| 상태 관리 | Zustand + localStorage sync | 기존 패턴 유지 |
| 레벨다운 | 없음 | Absorption Score는 단조 증가. 어려움 신호 = 피드 카드 제안 |

### 11.3 관련 기존 파일

- `src/lib/expressionLookup.ts` — getExpressionsByLevel() 함수 확장 필요. `computeAbsorptionScore()` 추가 위치 후보
- `src/store/` — Zustand store에 levelScore 슬라이스 추가 (absorptionScore, pendingLevelUp)
- `src/components/stats/` — Stats 페이지 CEFR별 흡수 표현 바 차트 추가
- `src/components/VideoPlayer/` — VideoCompletionLog 기록 훅 추가
- `src/data/expression-index-v2.json` — 변경 없음 (읽기 전용)
- `src/data/expression-dictionary-v2.json` — CEFR 및 category 메타데이터 소스 (읽기 전용)

---

## 12. 경쟁사 비교: Shortee의 차별점

| 요소 | Duolingo | Cake | Shortee (목표) |
|------|---------|------|----------------|
| 레벨 감지 방식 | 배치고사 + 퀴즈 | 없음 | 자연 관찰 (invisible) |
| 영상 연동 | 없음 | 완주율만 | 완주율 + 표현 친숙도 통합 |
| 레벨업 UX | 스타 이펙트 + "Level X 완료" | 없음 | 드라마틱 풀스크린 + 개인화 메시지 |
| 레벨다운 | 자동 (Skill decay) | 없음 | 제안 형태만 (유저 존중) |
| 학습 압박감 | 높음 (streak, 생명 시스템) | 낮음 | 최저 (invisible, play-first) |
| 데이터 투명성 | 제한적 | 없음 | Stats에서 성장 지표 공개 |

**Shortee 고유의 포지셔닝**: "공부하는 느낌 없이, 보다 보니 레벨이 올랐다"

---

## 13. 수익화 연계 고려

### 13.1 Freemium 연계 (Phase 2 이후 설계)

- 레벨 히스토리 상세 뷰 → 프리미엄 기능으로 고려 (기본: 최근 3개월만)
- 레벨업 후 "더 다양한 콘텐츠" 추천 → 프리미엄 콘텐츠 자연스러운 노출 지점
- 레벨업 이벤트 → 광고 없는 프리미엄 업셀 타이밍 (레벨업 축하 화면 이후)

### 13.2 Phase 1 원칙

Phase 1에서는 레벨 시스템 자체에 페이월 없음. 모든 유저가 자동 레벨 진단 혜택을 받음.

---

## 14. Phased Rollout

### Phase 1 (현재 이터레이션)

**목표**: Absorption Score 기반 레벨업 메커니즘 기본 동작 완성

1. `computeAbsorptionScore()` 함수 구현 — familiarExpressions에서 CEFR × 카테고리 가중치 합산
2. 레벨업 트리거 로직 — Score 임계값 + VideoCompletionLog 완주율 조건
3. `pendingLevelUp` 플래그 세우기 (localStorage)
4. 레벨업 UX (전체 화면, 수락/거절)
5. Expression priming 블렌딩 (레벨 전환 7일)
6. VideoCompletionLog 기록 (기존 VideoPlayer에 훅 추가)
7. localStorage 지속성 + Supabase 동기화 (fire-and-forget)
8. Stats CEFR별 흡수 표현 바 차트

**예상 공수**: 2-3일 (에이전트 구현 기준, 세션 시그널 모델 제거로 이전 설계 대비 공수 감소)

### Phase 2 (다음 이터레이션, 안정화 후)

1. XP 애니메이션 고도화 (B1+ Rare 등급 시각 피드백)
2. 레벨업 히스토리 타임라인 UI
3. A/B 테스트 인프라 (임계값 파라미터 조정)
4. 프리미엄 연계 기획

### Phase 3 (콘텐츠 1000개 확장 후)

1. CEFR 세부 6단계 내부 트래킹 강화
2. 콘텐츠 풀이 충분해지면 레벨별 큐레이션 고도화
3. 소셜 기능 (별도 기획)

---

## 15. Next Steps

1. [ ] CTO 검토 및 승인
2. [ ] Design 문서 작성 (`auto-level-progression.design.md`)
3. [ ] Level Score 엔진 유닛 테스트 케이스 정의
4. [ ] 에이전트에게 구현 디스패치

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-13 | Initial draft | PM Agent |
| 0.2 | 2026-03-13 | 시그널 재설계: 표현 흡수 기반으로 단순화 | PM Agent |
| 0.3 | 2026-03-13 | CTO v3 피드백: swipe별 XP 차등, 게이지 바, 즉시 레벨업, 완주율 80% | CTO + PM Agent |
| 0.2 | 2026-03-13 | CTO 피드백 반영: 세션 행동 시그널 전면 제거, Absorption Score (표현 흡수 CEFR 분포) 기반으로 시그널 시스템 전면 재설계. Section 3, 4, 6, 7, 8, 9, 11, 14 업데이트 | PM Agent |
