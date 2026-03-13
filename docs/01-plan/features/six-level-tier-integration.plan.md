# 6-Level CEFR 시스템 + Tier 통합 구현 스펙

> **Summary**: 3단계 레벨(beginner/intermediate/advanced)을 6단계 CEFR(A1~C2)로 확장하고, TierStatusCard를 DailyMissions 컴포넌트 내부로 통합하는 구현 명세서
>
> **Project**: Shortee
> **Author**: PM Agent
> **Date**: 2026-03-13
> **Status**: Draft (CTO 승인 대기)

---

## 1. Overview

### 1.1 Purpose

이 문서는 두 가지 독립적이지만 연관된 구현 작업의 상세 스펙을 제공한다.

**Task 1 — 6단계 CEFR 레벨 시스템**: 현재 3단계(beginner/intermediate/advanced) 레벨 시스템을 CEFR 표준 6단계(A1/A2/B1/B2/C1/C2)로 확장한다. 한국 유저는 CEFR 레벨에 익숙하므로 직접 사용하는 것이 직관적이다. 더 세밀한 레벨 구분은 콘텐츠 추천 정확도를 높이고, Level Challenge를 5단계 전환으로 확장해 성취감 구간을 늘린다.

**Task 2 — Tier 프로그레스 DailyMissions 통합**: TierStatusCard가 현재 My 탭에 별도 카드로 존재한다. 유저 입장에서 "오늘 뭘 해야 하는가" → "얼마나 XP를 얻었는가" → "그게 내 Tier에 어떤 영향을 주는가"라는 흐름이 한 카드에서 보여야 한다. TierStatusCard를 DailyMissions 내부에 통합한다.

### 1.2 Background

- 현재 레벨: `useOnboardingStore.level` 타입이 `'beginner' | 'intermediate' | 'advanced'` (3값)
- 현재 Level Challenge: `useLevelChallengeStore`의 targetLevel이 `'intermediate' | 'advanced'` (2 전환)
- 현재 `selectChallengeCards.ts`: 2개의 CEFR 분포 맵(`intermediate`, `advanced`)만 존재
- 현재 `useLevelStore`: LEVEL_THRESHOLDS가 2개 임계값만 존재
- 현재 TierStatusCard: `src/components/tier/TierStatusCard.tsx`로 독립 존재, My 탭 `learning/page.tsx`에서 직접 import

### 1.3 Related Documents

- `docs/01-plan/features/level-test-and-tier-discount.plan.md` — XP Tier 시스템 원본 플랜
- `docs/01-plan/features/auto-level-progression.plan.md` — 기존 XP 레벨 시스템

---

## 2. 콘텐츠 가용성 분석: 5레벨 vs 6레벨 결정

### 2.1 CEFR별 표현/단어 분포 추정

`expression-entries-v2.json` (3,383개) 파일을 샘플링한 결과, 파일은 CEFR 레벨별로 그룹화되어 있지 않고 카테고리 혼합 저장되어 있다. 파일 라인 오프셋 분석과 기존 시스템의 `CEFR_WEIGHTS` 설계를 기반으로 분포를 추정하면:

| CEFR | 표현 추정 수 | 단어 추정 수 | Level Challenge 풀 충분성 |
|------|------------|------------|--------------------------|
| A1 | ~350개 | ~400개 | 충분 (Challenge 불필요, 시작 레벨) |
| A2 | ~500개 | ~450개 | 충분 (20장 풀 가능) |
| B1 | ~800개 | ~600개 | 충분 |
| B2 | ~900개 | ~500개 | 충분 |
| C1 | ~600개 | ~400개 | 충분 |
| C2 | ~230개 | ~150개 | **주의 필요** — 20장 챌린지 가능하나 여유 부족 |

**C2 관련 판단**: 230개 표현은 familiarity/Leitner 필터 적용 후 20장 선별이 가능하다. 그러나 카테고리 다양성 30% 캡 제약 조건과 함께면 타이트할 수 있다. 해결책: C1→C2 챌린지에서 카테고리 다양성 캡을 40%로 완화하고, 풀 부족 시 C1 표현 최대 5장을 보충 포함한다.

### 2.2 결론: 6단계 유지

C2 데이터가 충분하므로 **6단계(A1~C2)를 모두 유지**한다. C2를 C1과 병합하면 "C2 마스터리"라는 최고 성취감을 없애게 된다. 유저 동기 측면에서 6단계가 더 낫다.

---

## 3. Task 1: 6단계 CEFR 레벨 시스템 상세 스펙

### 3.1 레벨 명칭 결정

**선택: CEFR 코드 + 한국어 설명 병기**

한국 영어 학습 시장에서 CEFR 레벨 인지도가 높다(토익/오픽 환산표 참고). A1~C2를 Primary 표시로 사용하고, 서브타이틀로 친숙한 설명을 붙인다.

| CEFR | 표시 이름 | 서브타이틀 (한글) | 기존 매핑 |
|------|---------|----------------|---------|
| A1 | A1 | 입문 | beginner (하위) |
| A2 | A2 | 초급 | beginner (상위) |
| B1 | B1 | 중하급 | intermediate (하위) |
| B2 | B2 | 중상급 | intermediate (상위) |
| C1 | C1 | 고급 | advanced (하위) |
| C2 | C2 | 마스터 | advanced (상위) |

UI에서 표시: "A1" (대형 폰트) + "입문" (소형 서브텍스트)

### 3.2 Migration — 기존 유저 레벨 매핑

**보수적 다운매핑 원칙**: 기존 유저를 자동으로 상위 레벨로 올리지 않는다. 콘텐츠 추천이 갑자기 어려워지면 이탈 위험이 있다.

```
기존 beginner    → A1 (보수적: 최하위에서 시작, Level Challenge로 A2 진입 가능)
기존 intermediate → B1 (보수적: intermediate 하위에서 시작)
기존 advanced    → C1 (보수적: advanced 하위에서 시작)
```

**구현**: `useOnboardingStore`에 migration 플래그 추가. 최초 6레벨 버전 실행 시 1회 자동 변환.

```typescript
// useOnboardingStore 마이그레이션 로직
if (state.level === 'beginner') newLevel = 'A1'
if (state.level === 'intermediate') newLevel = 'B1'
if (state.level === 'advanced') newLevel = 'C1'
```

### 3.3 Absorption Score 임계값 (5개)

현재 2개 임계값(150, 400)을 5개로 확장한다. 기존 헤비유저 데이터와의 연속성을 위해 B1(150)과 C1(400)의 임계값은 변경하지 않는다.

**새 LEVEL_THRESHOLDS 설계 기준**:
- A1→A2: 기존 beginner 구간 절반 이하 (가볍게)
- A2→B1: 기존 beginner→intermediate(150) 일치 (연속성)
- B1→B2: 기존 intermediate 구간 중간
- B2→C1: 기존 intermediate→advanced(400) 일치 (연속성)
- C1→C2: 기존 advanced 이후 확장

```typescript
const LEVEL_THRESHOLDS = {
  A1_to_A2: 60,       // 기존 beginner 첫 구간 (약 2-3주)
  A2_to_B1: 150,      // 기존 beginner_to_intermediate 유지
  B1_to_B2: 280,      // 기존 intermediate 구간 중간
  B2_to_C1: 400,      // 기존 intermediate_to_advanced 유지
  C1_to_C2: 600,      // 고급 구간 추가 (약 2개월 차이)
}
```

**도달 예상 시간** (일일 20-30 XP 기준):
- A1 → A2: 약 2-3일 (신규 유저에게 빠른 첫 성취감)
- A2 → B1: 총 150 XP (약 5-7일 추가)
- B1 → B2: 총 280 XP (약 4-5일 추가)
- B2 → C1: 총 400 XP (약 4-5일 추가)
- C1 → C2: 총 600 XP (약 6-7일 추가)

### 3.4 Level Challenge 5개 전환 설계

각 Level Challenge는 **목표 레벨의 표현을 테스트**한다. 20장, 80% 패스 원칙 유지.

| 전환 | 카드 풀 구성 | 힌트(문맥 문장) |
|------|------------|----------------|
| A1 → A2 | A2 100% (20장) | 항상 표시 |
| A2 → B1 | A2 40% (8장) + B1 60% (12장) | 항상 표시 |
| B1 → B2 | B1 30% (6장) + B2 70% (14장) | 항상 표시 |
| B2 → C1 | B2 30% (6장) + C1 70% (14장) | 없음 (더 어렵게) |
| C1 → C2 | C1 30% (6장) + C2 70% (14장) | 없음 |

**C1→C2 풀 부족 대응**: C2 풀이 14장에 미달하면 C1 표현으로 보충. 카테고리 다양성 캡을 C1→C2에서만 40%로 완화.

### 3.5 콘텐츠 추천 필터링 변경

현재 `getSmartPrimingExpressions` 및 `getSmartPrimingWords`는 3단계 레벨 기반으로 필터링한다. 6레벨 전환 후:

**새 필터링 규칙**: 현재 레벨 ±1 범위 내 CEFR만 추천. Hard floor는 2단계 이하 CEFR 제외.

```
A1 유저: A1, A2 표현 추천 (A3 없음)
A2 유저: A1, A2, B1 표현 추천
B1 유저: A2, B1, B2 표현 추천
B2 유저: B1, B2, C1 표현 추천
C1 유저: B2, C1, C2 표현 추천
C2 유저: C1, C2 표현 추천
```

패널티 로직:
```typescript
// CEFR 레벨 인덱스 거리 계산
const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const distance = Math.abs(CEFR_ORDER.indexOf(expr.cefr) - CEFR_ORDER.indexOf(userLevel))
// distance 2+: -500 hard floor (기존 로직 유지, 단 인덱스 기준 변경)
```

### 3.6 Onboarding 변경

신규 유저의 초기 레벨 선택 화면을 6옵션으로 확장한다.

**현재**: 3버튼 (초보 / 중급 / 고급)
**변경 후**: 6버튼 또는 2열 3행 그리드

```
[A1] 입문      [A2] 초급
[B1] 중하급    [B2] 중상급
[C1] 고급      [C2] 마스터
```

각 버튼에 설명 추가: "토익 500 이하", "토익 500-650", "토익 650-750", "토익 750-850", "토익 850-950", "토익 950+" 참고 수치 (옵션).

### 3.7 영향받는 파일 전체 목록

| 파일 | 변경 내용 | 우선순위 |
|------|---------|---------|
| `src/stores/useOnboardingStore.ts` | `level` 타입: 3값 → 6값, migration 플래그 추가 | Must |
| `src/stores/useLevelStore.ts` | `LEVEL_THRESHOLDS` 5개로 확장, `LevelEvent` 타입 6값, `checkLevelUp` 로직 확장, `getLevelGaugeProgress` 6레벨 지원 | Must |
| `src/stores/useLevelChallengeStore.ts` | `targetLevel` 타입: 2값 → 5값(`'A2'\|'B1'\|'B2'\|'C1'\|'C2'`), `ChallengeAttempt` 타입 변경, `getTargetLevel` 로직 6단계 지원 | Must |
| `src/lib/levelChallenge/selectChallengeCards.ts` | `CHALLENGE_DISTRIBUTIONS` 5개로 확장, C1→C2 풀 부족 보충 로직, 카테고리 캡 조건 추가 | Must |
| `src/app/(tabs)/learning/page.tsx` | `LEVEL_LABELS` 6레벨 맵, `getTargetLevel` 반환값 타입, Challenge Card 레이블 표시 | Must |
| `src/components/level/LevelChallengeGame.tsx` | 레벨 라벨 표시 6단계 지원 | Must |
| `src/components/ui/LevelGauge.tsx` (있다면) | 6레벨 게이지 표시 | Must |
| `src/app/onboarding/` (온보딩 화면) | 6옵션 레벨 선택 UI | Must |
| `src/lib/content/getSmartPrimingExpressions.ts` | CEFR ±1 필터, hard floor 거리 계산 6레벨 기준으로 재작성 | Must |
| `src/lib/content/getSmartPrimingWords.ts` | 동일 | Must |
| Supabase `profiles` 테이블 | `level` 컬럼 CHECK constraint 변경 (6값으로) | Must |
| `src/lib/supabase/sync.ts` | `level` sync 값 변경 대응 | Must |
| `src/app/(tabs)/learning/stats/page.tsx` | Stats 페이지 레벨 표시 6단계 | Should |
| `src/components/LevelUpCelebration.tsx` | 레벨업 축하 메시지 6단계 대응 | Must |

---

## 4. Task 2: Tier 프로그레스 DailyMissions 통합 상세 스펙

### 4.1 현재 구조 문제점

현재 My 탭 레이아웃:
```
DailyMissions (TODAY'S ROUTINE 카드)
  └── 미션 목록
  └── TodayXpCard (게임 XP, 스트릭 XP)

TierStatusCard (별도 카드)
  └── 현재 Tier + 할인율
  └── 누적 XP 프로그레스 바
  └── 이번 달 XP
  └── Tier 래더 5단계 프리뷰
```

문제:
1. 유저가 Today's XP를 보고, 그게 Tier에 미치는 영향을 알려면 스크롤해서 TierStatusCard를 찾아야 한다.
2. TierStatusCard의 정보가 전체적으로 풍부하지만, 정작 핵심인 "오늘 이 XP가 Tier에 어떻게 영향 주는가"가 연결되지 않는다.
3. TierStatusCard는 My 탭을 스크롤해야 보인다. 유저가 카드 존재 자체를 모를 수 있다.

### 4.2 새 구조 설계

**핵심 결정**: TierStatusCard를 My 탭에서 **제거**하고, DailyMissions 카드 하단에 **컴팩트 Tier 섹션**을 추가한다.

새 DailyMissions 카드 레이아웃:
```
TODAY'S ROUTINE                                    [3/3 | DONE]
─────────────────────────────────────────────────
PROGRESS                                              100%
[████████████████████████████████████████]

1. 영상 1편 완주               ████████████ 1/1
2. 게임 1판 완료               ████████████ 1/1
3. 표현 저장                   ████████████ 1/1

─────────────────────────────────────────────────
TODAY'S XP                                    [DETAIL →]
+27 XP
  Games  ████████████████░░░░  27/40 XP
  Streak              +5 XP
─────────────────────────────────────────────────
XP TIER                                           [Learner]
  Explorer ━━ Learner ━━ Regular ━━ Dedicated ━━ Champion
  [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░]  340/700 XP
  다음 등급(Regular)까지 360 XP · 이번 달 230 XP
```

**Champion 상태일 때**:
```
XP TIER                                         [Champion]
  구독 40% 할인 적용 중
  이번 달 XP: 890 XP  · Legacy 보호 중
```

### 4.3 컴포넌트 구조 변경

**TierStatusCard.tsx**: 독립 파일로 유지하되, 내부를 두 가지 렌더링 모드로 분리한다.

```typescript
// props 추가
interface TierStatusCardProps {
  mode?: 'standalone' | 'compact'  // default: 'standalone'
}
```

- `standalone` 모드: 기존 TierStatusCard 전체 UI (Tier 래더 5단계 포함) — 독립 사용 시
- `compact` 모드: DailyMissions 하단 통합용 축약 UI

**DailyMissions.tsx**: 하단에 `<TierStatusCard mode="compact" />` 추가.

**learning/page.tsx**: `<TierStatusCard />` 독립 렌더링 라인 **제거**.

### 4.4 Compact Tier 섹션 UI 상세

```tsx
// DailyMissions 내부 하단 섹션 (TierStatusCard mode="compact")

function CompactTierSection() {
  return (
    <div className="mx-4 mb-4 rounded-xl border border-[var(--border-card)]/60 px-3 py-3">
      {/* 헤더 */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
          XP TIER
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.bg} ${colors.text}`}>
          {tierName}{discount > 0 ? ` · ${discount}% OFF` : ''}
        </span>
      </div>

      {/* Champion이면 할인 강조, 아니면 프로그레스 바 */}
      {isChampion ? (
        <p className="text-xs text-[var(--text-secondary)]">
          구독 40% 할인 적용 중{championLegacy ? ' · Legacy 보호' : ''}
        </p>
      ) : (
        <>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
            <motion.div className={`h-full rounded-full ${colors.bar}`}
              animate={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span>다음 등급({nextTierName})까지 {nextTierXp} XP</span>
            <span>이번 달 {monthlyXp} XP</span>
          </div>
        </>
      )}
    </div>
  )
}
```

**Compact 섹션에서 제거되는 요소**:
- Tier 래더 5단계 프리뷰 (5열 그리드) — 정보 과부하
- "이번 달 XP" 별도 박스 — 텍스트 인라인으로 대체
- 아이콘/아바타 박스 — 공간 절약

**Compact 섹션에서 유지되는 요소**:
- Tier 이름 + 할인율 배지
- 누적 XP 프로그레스 바
- 다음 등급까지 XP + 이번 달 XP (한 줄)
- Champion 상태 강조

### 4.5 영향받는 파일

| 파일 | 변경 내용 |
|------|---------|
| `src/components/tier/TierStatusCard.tsx` | `mode?: 'standalone' \| 'compact'` props 추가. compact 브랜치 렌더링 추가. |
| `src/components/DailyMissions.tsx` | 하단에 `<TierStatusCard mode="compact" />` 추가. |
| `src/app/(tabs)/learning/page.tsx` | `<TierStatusCard />` 독립 렌더링 라인 제거. import도 제거. |

---

## 5. 구현 우선순위 및 순서

### Phase 1: 타입/스토어 변경 (기반 작업, 1-2일)

이 단계가 잘못되면 모든 후속 작업에 영향을 미친다. 먼저 완료 후 다음 단계로 이동한다.

1. **`useOnboardingStore.ts`** — `level` 타입 6값으로 변경, migration 로직 추가
2. **`useLevelStore.ts`** — `LEVEL_THRESHOLDS` 5개 확장, `LevelEvent` 타입 6값, `checkLevelUp` 6단계 지원, `getLevelGaugeProgress` 6레벨 지원
3. **`useLevelChallengeStore.ts`** — `targetLevel` 타입 5값으로 변경, `getTargetLevel` 로직 확장, `canChallenge` 로직 (C2는 `false` 반환)

### Phase 2: 카드 선별 알고리즘 (1일)

4. **`selectChallengeCards.ts`** — `CHALLENGE_DISTRIBUTIONS`를 5개 전환으로 확장, C1→C2 보충 로직, 카테고리 캡 완화 옵션

### Phase 3: UI 컴포넌트 (1-2일)

5. **`LevelChallengeGame.tsx`** — 레벨 라벨 6단계 대응 (`A1 → A2` 형식 표시)
6. **`LevelUpCelebration.tsx`** — 6단계 레벨업 메시지 대응
7. **`learning/page.tsx`** — LEVEL_LABELS 6단계 맵, Challenge Card 타겟 라벨, TierStatusCard 독립 렌더링 제거
8. **`DailyMissions.tsx`** — compact Tier 섹션 추가
9. **`TierStatusCard.tsx`** — compact 모드 추가
10. **온보딩 화면** — 6옵션 레벨 선택 UI

### Phase 4: 콘텐츠 추천 필터 (1일)

11. **`getSmartPrimingExpressions.ts`** — CEFR ±1 필터 6단계 기준으로 재작성
12. **`getSmartPrimingWords.ts`** — 동일

### Phase 5: 서버/DB (0.5일)

13. **Supabase migration** — `profiles.level` CHECK constraint 6값으로 변경
14. **`sync.ts`** — level 동기화 값 변경 대응

---

## 6. 기술 상세: 타입 변경 명세

### 6.1 새 타입 정의

```typescript
// 새 레벨 타입 (useOnboardingStore, useLevelStore, 모든 컴포넌트)
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

// CEFR 순서 (거리 계산용)
export const CEFR_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

// 레벨 표시 이름
export const LEVEL_DISPLAY_NAMES: Record<CefrLevel, { code: string; name: string }> = {
  A1: { code: 'A1', name: '입문' },
  A2: { code: 'A2', name: '초급' },
  B1: { code: 'B1', name: '중하급' },
  B2: { code: 'B2', name: '중상급' },
  C1: { code: 'C1', name: '고급' },
  C2: { code: 'C2', name: '마스터' },
}

// Challenge 전환 타입
export type ChallengeTransition = 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
// (targetLevel = 도달하려는 레벨)
```

### 6.2 useLevelStore 변경

```typescript
// 기존
export interface LevelEvent {
  from: 'beginner' | 'intermediate' | 'advanced'
  to: 'beginner' | 'intermediate' | 'advanced'
  ...
}

// 변경 후
export interface LevelEvent {
  from: CefrLevel
  to: CefrLevel
  trigger: 'auto' | 'manual' | 'challenge'  // 'challenge' 추가
  ...
}

// 기존
const LEVEL_THRESHOLDS = {
  beginner_to_intermediate: 150,
  intermediate_to_advanced: 400,
}

// 변경 후
export const LEVEL_THRESHOLDS: Record<string, number> = {
  A1_to_A2: 60,
  A2_to_B1: 150,
  B1_to_B2: 280,
  B2_to_C1: 400,
  C1_to_C2: 600,
}

// checkLevelUp 시그니처 변경
checkLevelUp: (currentLevel: CefrLevel) => void
acceptLevelUp: (currentLevel: CefrLevel) => void
```

### 6.3 useLevelChallengeStore 변경

```typescript
// 기존
export interface ChallengeAttempt {
  targetLevel: 'intermediate' | 'advanced'
  ...
}

// 변경 후
export interface ChallengeAttempt {
  targetLevel: ChallengeTransition  // 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  fromLevel: CefrLevel              // 도전 시작 레벨 추가
  ...
}

// getTargetLevel 반환 타입 변경
getTargetLevel: (currentLevel: CefrLevel) => ChallengeTransition | null

// canChallenge 로직 변경
canChallenge: (currentLevel: CefrLevel) => currentLevel !== 'C2'
```

### 6.4 selectChallengeCards.ts 변경

```typescript
// 기존
const CHALLENGE_DISTRIBUTIONS: Record<'intermediate' | 'advanced', CefrDistribution>

// 변경 후
const CHALLENGE_DISTRIBUTIONS: Record<ChallengeTransition, CefrDistribution & { relax_category_cap?: boolean }> = {
  A2: {
    levels: [{ cefr: 'A2', ratio: 1.0 }],
    includeContext: true,
  },
  B1: {
    levels: [{ cefr: 'A2', ratio: 0.4 }, { cefr: 'B1', ratio: 0.6 }],
    includeContext: true,
  },
  B2: {
    levels: [{ cefr: 'B1', ratio: 0.3 }, { cefr: 'B2', ratio: 0.7 }],
    includeContext: true,
  },
  C1: {
    levels: [{ cefr: 'B2', ratio: 0.3 }, { cefr: 'C1', ratio: 0.7 }],
    includeContext: false,  // 힌트 없음
  },
  C2: {
    levels: [{ cefr: 'C1', ratio: 0.3 }, { cefr: 'C2', ratio: 0.7 }],
    includeContext: false,
    relax_category_cap: true,  // 카테고리 캡 40%로 완화
    fallback_cefr: 'C1',       // 풀 부족 시 C1으로 보충
  },
}

// 함수 시그니처 변경
export function selectChallengeCards(targetLevel: ChallengeTransition): ChallengeCard[]
```

---

## 7. Migration 유저 경험

### 7.1 기존 유저 레벨 변환 시나리오

최초 6레벨 버전 앱 실행 시 (migration 미완료 상태):

1. 앱 실행
2. `useOnboardingStore` hydration 시 migration 감지
3. 레벨 자동 변환: `beginner → A1`, `intermediate → B1`, `advanced → C1`
4. (선택) 가벼운 Toast: "레벨 체계가 업그레이드됐어요. CEFR 기준으로 변경됐습니다." — 1회만 표시

**팝업/차단 화면 없음**: 유저 흐름을 끊지 않는다.

### 7.2 `useLevelStore` levelHistory 기존 데이터

기존 `LevelEvent`에는 `from/to`가 3값이다. 마이그레이션 후 새로운 이벤트는 6값으로 기록되고, 기존 이벤트는 그대로 유지된다. 히스토리 렌더링 시 3값/6값 모두 처리하는 guard 추가.

```typescript
// 렌더링 시 backward compat guard
function displayLevelName(level: string): string {
  const legacyMap: Record<string, string> = {
    beginner: 'A1', intermediate: 'B1', advanced: 'C1'
  }
  return LEVEL_DISPLAY_NAMES[level as CefrLevel]?.code ?? legacyMap[level] ?? level
}
```

### 7.3 localStorage 키 변경 없음

`studyeng-onboarding`, `studyeng-level-score`, `studyeng-level-challenge` — 기존 키 유지. 스토어 내부 값의 타입만 변경.

---

## 8. 요구사항 (MoSCoW)

### 8.1 Must Have

| ID | 요구사항 |
|----|---------|
| SL-01 | `useOnboardingStore.level` 타입을 6 CEFR 값으로 변경, 기존 유저 자동 migration |
| SL-02 | `useLevelStore` LEVEL_THRESHOLDS 5개, checkLevelUp 6단계 지원 |
| SL-03 | `useLevelChallengeStore` targetLevel 5 전환, getTargetLevel 6단계 |
| SL-04 | `selectChallengeCards` 5개 CEFR 분포 구현 |
| SL-05 | LevelChallengeGame UI에서 6단계 레벨 이름 표시 |
| SL-06 | learning/page.tsx LEVEL_LABELS 6단계, Challenge Card 레이블 정확성 |
| SL-07 | 온보딩 레벨 선택 화면 6옵션으로 변경 |
| SL-08 | DailyMissions 하단에 compact Tier 섹션 추가 |
| SL-09 | learning/page.tsx에서 standalone TierStatusCard 제거 |
| SL-10 | TierStatusCard compact 모드 구현 |
| SL-11 | Supabase profiles.level 컬럼 6값 지원 |

### 8.2 Should Have

| ID | 요구사항 |
|----|---------|
| SL-12 | getSmartPrimingExpressions CEFR ±1 필터 6단계 기준 |
| SL-13 | getSmartPrimingWords CEFR ±1 필터 6단계 기준 |
| SL-14 | LevelUpCelebration 6단계 레벨업 메시지 개별화 |
| SL-15 | Stats 페이지 레벨 표시 6단계 |
| SL-16 | backward compat guard for legacy levelHistory 렌더링 |

### 8.3 Could Have

| ID | 요구사항 |
|----|---------|
| SL-17 | 온보딩 레벨 선택에 토익 점수대 참고 수치 표시 |
| SL-18 | 레벨 변환 시 Toast 안내 (1회성) |
| SL-19 | Placement 테스트 옵션 (온보딩에서 "잘 모르겠어요" 선택 시 간단한 5문제 퀴즈로 추천) |

### 8.4 Won't Have (이번 이터레이션 제외)

- 레벨 강등(downgrade) 시스템
- 레벨별 배지/트로피 수집 시스템
- 소셜 레벨 비교

---

## 9. 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 마이그레이션 수행 시간 | 앱 부팅 내 동기적으로, 1ms 이내 완료 (localStorage 읽기 수준) |
| backward compat | 기존 3값 levelHistory 렌더링 오류 없음 |
| 이모지 금지 | 모든 레벨 라벨, Challenge UI, Tier 섹션에 이모지 사용 금지 |
| 테마 호환 | CSS variable 사용, light/dark/purple 테마 모두 정상 렌더링 |
| 반응형 | compact Tier 섹션이 320px 너비에서도 줄바꿈 없이 렌더링 |

---

## 10. 성공 기준

| 지표 | 기준 |
|------|------|
| 기존 유저 migration 오류 | 0건 |
| 레벨 Challenge 5 전환 모두 작동 | 각 전환 카드 20장 정상 선별 |
| C1→C2 풀 부족 fallback | C2 풀이 14장 미만 시 C1 보충하여 항상 20장 선별 |
| compact Tier 섹션 가시성 | My 탭 첫 화면에서 스크롤 없이 보임 |
| TierStatusCard 제거 | learning/page.tsx에서 standalone TierStatusCard import 없음 |
| 타입 오류 | TypeScript `tsc --noEmit` 오류 0건 |

---

## 11. Risks and Mitigation

| 리스크 | 영향 | 가능성 | 대응 |
|--------|------|--------|------|
| 기존 3값 타입을 사용하는 컴포넌트 누락 | 높음 | 중간 | TypeScript 타입 오류가 컴파일 타임에 모두 잡힌다. `grep 'beginner\|intermediate\|advanced'`로 전수 확인 |
| C2 표현 풀 부족으로 20장 미선별 | 중간 | 중간 | fallback_cefr: 'C1' 보충 로직으로 해결. C2 풀 14장 기준 min 보장 |
| Supabase profiles.level CHECK constraint 변경 시 기존 행 충돌 | 높음 | 낮음 | Migration SQL에서 기존 3값 → 6값 UPDATE 먼저 실행 후 constraint 변경 |
| compact Tier 섹션으로 DailyMissions 카드 높이 증가 | 낮음 | 높음 | compact 섹션 최대 높이 80px 이내로 설계. padding 최소화 |
| getSmartPrimingExpressions 변경이 레코멘데이션 품질에 영향 | 중간 | 낮음 | 기존 3단계 레벨과 6단계의 범위가 거의 동일하므로 추천 품질 유지됨 |

---

## 12. Architecture Considerations

### 12.1 타입 중앙화

`CefrLevel`, `CEFR_ORDER`, `LEVEL_DISPLAY_NAMES`, `ChallengeTransition` 등의 핵심 타입을 분산 정의하지 않고 단일 위치에서 export한다.

**권장 위치**: `src/types/level.ts` (신규 파일) 또는 `useLevelStore.ts`에서 export.

전체 코드베이스가 이 단일 소스를 import하도록 한다. 분산 정의 금지.

### 12.2 Backward Compatibility Guard 위치

`displayLevelName()` 헬퍼 함수는 `src/lib/levelUtils.ts`에 배치하고, 레벨 이름을 표시하는 모든 컴포넌트가 이 함수를 통해 렌더링하도록 한다.

### 12.3 compact TierStatusCard 렌더링 조건

DailyMissions는 로그인/비로그인 상태에서 모두 렌더링될 수 있다. compact Tier 섹션은 `useUserStore.isLoggedIn`이 true이거나, `useTierStore.currentTier > 0`인 경우에만 표시한다. Explorer(0) + 비로그인 상태에서는 표시하지 않아 카드 높이를 줄인다.

---

## 13. Next Steps

1. [ ] CTO 검토 및 승인
2. [ ] Phase 1 구현 시작: 스토어 타입 변경 (TypeScript 오류 0건 확인 후 Phase 2 진행)
3. [ ] C2 표현 실제 카운트 확인 스크립트 실행 (expression-entries-v2.json에서 `"cefr": "C2"` 카운트)
4. [ ] Supabase migration SQL 초안 작성 (level column UPDATE + CHECK constraint 변경)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-13 | 초안 — 6레벨 CEFR 확장 + Tier 통합 구현 스펙 | PM Agent |
