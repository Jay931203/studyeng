# Level Challenge & XP Tier Discount 플랜 문서

> **Summary**: 기존 ExpressionSwipeGame을 재활용한 Level Challenge 시스템, 4단계 할인 Tier 구조 (10/20/30/40%), 스와이프 XP 분리 기반 지속 가능한 XP 생태계 설계
>
> **Project**: Shortee
> **Author**: PM Agent
> **Date**: 2026-03-13
> **Status**: Draft (CTO 승인 대기)

---

## 1. Overview

### 1.1 Purpose

이 플랜은 두 가지 독립적인 문제를 해결하되, XP 생태계라는 공통 기반 위에 설계한다.

**문제 1 — Level Challenge**: 현재 Absorption Score 임계값 도달 시 자동 레벨업은 "영상 많이 보면 자동 레벨업"에 불과하다. 유저가 능동적으로 "나 이제 다음 단계 갈 준비 됐어"라고 선언하고 확인받는 경험이 없다. Level Challenge는 그 확인 절차다. 시험이 아니라 도전 — 실패해도 바로 재도전 가능하고, 통과하면 진짜 성취감을 준다.

**문제 2 — XP Tier Discount**: 현재 useDiscountStore는 일일 미션 달성률 기반으로 매달 리셋된다. 6개월 헤비유저와 1개월 헤비유저가 동일한 혜택을 받는 구조다. 오래 쓸수록 구독 비용이 실질적으로 줄어드는 경험은 영어 학습 앱 시장에서 전례가 없다.

**문제 3 — XP 지속가능성 (CRITICAL)**: 영상 ~1,800개, 표현 3,383개, 단어 2,494개로 콘텐츠는 유한하다. 영상 시청 XP, 표현 저장 XP는 결국 고갈된다. 게임은 반복 가능하지만 게임 XP만 있으면 단조롭다. 콘텐츠가 모두 소비된 후에도 매일 앱을 열어 XP를 쌓을 이유가 있어야 한다.

### 1.2 Background

- 현재 레벨: useLevelStore의 rawScore 기반, beginner(0-149) / intermediate(150-399) / advanced(400+)
- 현재 XP 소스: 영상 시청(+3/완주, 영상당 최대 10회), 표현 스와이프(CEFR × category × swipeProgress — 이번 플랜에서 재검토), 게임(일일 30 XP 캡)
- 현재 할인: useDiscountStore 기반, 일일 미션 달성률 → 0/10/15/20% 할인 (매달 리셋)
- useUserStore: level, xp, streakDays, totalXpEarned 트래킹 중
- ExpressionSwipeGame: 카드 보고 "알아요/몰라요" 스와이프, Leitner Box, FloatingXP 애니메이션 포함 — Level Challenge가 이것을 그대로 재활용

### 1.3 Related Documents

- `docs/01-plan/features/auto-level-progression.plan.md` — 기존 XP 레벨 시스템
- `docs/01-plan/features/game-system-expansion.plan.md` — Expression Swipe / Listen & Fill 게임
- `docs/01-plan/features/commercial-launch-readiness.plan.md` — 상용 배포 전수 조사

---

## 2. Scope

### 2.1 In Scope

- Level Challenge: 기존 ExpressionSwipeGame 기반 재활용, CEFR 분포 차별화
- Level Challenge: 쿨다운 없는 즉시 재도전 정책
- Level Challenge: 패스 조건, 결과 화면, LevelUpCelebration 연동
- XP Tier: 4단계 할인 구조 (10/20/30/40% — 10%씩 균등 증가)
- XP Tier: 각 단계 약 2주 간격, Champion 2달 유지 충성 유저 보상
- XP Tier: 비활성 강등(Decay) 메커니즘 유지
- XP Tier: Stripe 쿠폰 방식 연동
- XP 지속가능성: 콘텐츠 고갈 후에도 작동하는 XP 생태계 설계
- 기존 useDiscountStore와의 관계 정리

### 2.2 Out of Scope

- 적응형 AI 레벨 테스트 (동적 난이도 조절) — 다음 이터레이션
- 레벨 강등(downgrade) 시스템 — 현재는 고려하지 않음
- 소셜 랭킹 / 리더보드
- 음성 인식 기반 테스트

---

## 3. Level Challenge 상세 설계

### 3.1 핵심 철학: 압박 없는 자발적 도전

"레벨 테스트"가 아닌 "Level Challenge"다. 유저가 자신감 있을 때 자발적으로 도전하고, 실패해도 "아 한 번 더"가 자연스러운 경험이어야 한다.

**쿨다운 없음**: 실패해도 즉시 재도전 가능. 문항은 매번 새로 뽑는다. 쿨다운은 시험 문화의 잔재다. Level Challenge는 유저가 보고 싶은 콘텐츠 난이도를 자신이 선택하는 수단이므로, 실패 페널티가 없어야 한다.

### 3.2 게임 포맷: ExpressionSwipeGame 재활용

**새 UI 없음.** 기존 ExpressionSwipeGame의 카드 형태를 그대로 쓴다. 카드 보고 뜻 맞추고 "알아요/몰라요" 스와이프 — 유저에게 익숙한 인터페이스.

차이점은 **카드 풀**만 달라진다:
- 일반 ExpressionSwipeGame: 유저 현재 레벨 기반 CEFR 풀
- Level Challenge: 도전 목표 레벨에 맞는 CEFR 분포 풀

```
Level Challenge (beginner → intermediate):
  카드 수: 20장
  CEFR 분포: A2 50% + B1 50%
  힌트: 문맥 문장 항상 표시

Level Challenge (intermediate → advanced):
  카드 수: 20장
  CEFR 분포: B2 60% + C1 40%
  힌트: 문맥 문장 없음 (표현 단독 제시, 더 어렵게)
```

**CEFR 분포 근거**:
- beginner→intermediate: A2/B1이 경계 레벨이므로 균등 배분. A1은 너무 쉬워 제외.
- intermediate→advanced: B2가 핵심 검증 대상. C1은 상한 확인용. C2는 현실적 도달 가능성 낮아 제외.

### 3.3 문항 선별 알고리즘

```
1. 목표 CEFR 범위에서 랜덤 풀 생성
   - expression-entries-v2.json에서 CEFR 필터 적용

2. 유저의 familiarity 데이터로 편향 제거
   - familiar(count >= 3) 표현: 50% 확률 제외 (이미 아는 것만 나오면 의미 없음)
   - Leitner Box 3(마스터) 표현: 50% 확률 제외

3. 카테고리 다양성 보장
   - 동일 카테고리 비율 30% 초과 불가

4. 최종 20장 선별 후 순서 셔플
```

### 3.4 패스/페일 메커니즘

**패스 기준**: 20장 중 16장 이상 "알아요" (80%)

80%로 설정한 이유: ExpressionSwipeGame은 "아는 것 체크"가 핵심이므로 완벽한 정답률을 요구하지 않는다. 20장 중 16장이면 해당 레벨 콘텐츠를 편안하게 소화할 수 있다는 신호다. 90%는 너무 가혹하다.

**시간 제한**: 없음.

**재도전 정책**: 쿨다운 없음. 실패 즉시 재도전 가능. 문항은 매번 새로 선별.

**패스 후 처리**:
- useUserStore의 level-up 처리 (기존 checkLevelUp → acceptLevelUp 플로우)
- LevelUpCelebration 풀스크린 축하 화면 트리거
- 도전 기록: 시도 횟수, 달성 여부, 날짜 저장 (useLevelChallengeStore)

### 3.5 Optional vs Mandatory

**완전 선택형.** 강제하지 않는다. 이유:
1. 강제 테스트는 "공부하는 느낌"의 전형이다. 앱 철학과 충돌.
2. 기존 Absorption Score로 intermediate/advanced인 유저에게 소급 테스트 요구는 불쾌하다.
3. 레벨은 콘텐츠 추천 엔진이므로, 유저가 원하는 난이도를 선택할 수 있어야 한다.

**Absorption Score와의 관계**:
- Absorption Score는 콘텐츠 추천 엔진으로 그대로 유지
- rawScore가 임계값에 도달하면 "도전 버튼 활성화" (Score 조건 충족 + 도전 통과 두 가지 경로 모두 제공)
- 자동 레벨업(pendingLevelUp 팝업)은 현행대로 유지 — Level Challenge는 추가 경로

**구현 방식**:
- My 탭에 "Level Challenge" 버튼 상시 노출 (현재 레벨 기준 다음 레벨 도전)
- rawScore 임계값 도달 시 팝업: "레벨업 준비가 됐어요! Level Challenge에 도전해볼까요?"
- "나중에 할게요" 선택 시 기존 자동 레벨업 팝업으로 폴백

### 3.6 UX 플로우

```
[진입 경로 1] My 탭 → "Level Challenge" 카드 (항상 노출)
[진입 경로 2] rawScore 임계값 도달 시 자동 팝업

[도전 시작 화면]
  현재 레벨 / 목표 레벨 표시
  "20장, 80% 이상 알아요 → 레벨업" 안내
  "도전 시작" 버튼

[게임 화면 — ExpressionSwipeGame 형태 그대로]
  진행 표시바 (7/20 형식)
  카드: 표현 + 한글 뜻 + 문맥 문장 (beginner→intermediate 버전)
  "알아요" / "몰라요" 버튼
  FloatingXP 애니메이션 (게임 XP는 정상 지급)

[결과 화면 - 패스]
  "16/20 알아요" 표시
  LevelUpCelebration 트리거
  "다음 레벨 콘텐츠 보러 가기" CTA

[결과 화면 - 페일]
  "12/20 알아요 (80% 필요)" 표시
  몰랐던 표현 목록 (최대 5개 표시)
  "바로 다시 도전" 버튼 (쿨다운 없음)
  "표현 더 익히기" → ExpressionSwipeGame 연결
```

---

## 4. XP Tier Discount 상세 설계

### 4.1 시스템 철학

기존 useDiscountStore는 매달 리셋된다. 오래 쓴 유저가 유리하지 않다.

새 XP Tier 시스템의 핵심 원칙:
- 많이 쓸수록 더 큰 혜택
- 꾸준히 쓸수록 혜택 유지
- 2달간 Champion을 유지한 유저는 충성 유저로 인정

### 4.2 4단계 Tier 정의

| Tier | 이름 | 누적 XP 조건 | 할인율 | 도달 예상 기간 |
|------|------|------------|------|-------------|
| 0 | Explorer | 0 ~ 299 XP | 0% | 신규 유저 |
| 1 | Learner | 300 ~ 699 XP | 10% | 약 2주 |
| 2 | Regular | 700 ~ 1,399 XP | 20% | 약 4주 (누적) |
| 3 | Dedicated | 1,400 ~ 2,799 XP | 30% | 약 6주 (누적) |
| 4 | Champion | 2,800 XP+ | 40% | 약 8주 (누적) |

**할인율 10%씩 균등 증가 설계 근거**:

단계별 10% 균등 증가는 유저에게 직관적이다. "한 단계 올라갈 때마다 10% 더 할인" 메시지가 명확하다. Champion(40%)은 기존 플랜의 50%보다 낮지만, 이 구조에서 XP 소스를 영상 시청/게임 세션 완료 기반으로 재설계하면 XP 임계값 도달이 더 어려워지므로 Champion 자체의 희소성이 보상을 정당화한다.

**XP 임계값 근거 (스와이프 XP 제외 후 재산출)**:

새 XP 소스 구조 (섹션 5 참조):
- 영상 시청 XP: 하루 1-3편 완주 × 3 XP = 3-9 XP
- 게임 세션 완료 XP: 게임 1판 완료 기준 10-15 XP (일일 캡 별도)
- 스트릭 보너스: 구간에 따라 5-40 XP/일
- 합산: 현실적 일일 XP 약 15-35 XP (스와이프 XP 제거 후)

따라서:
- Explorer → Learner (300 XP): 약 10-15일 (2주)
- Learner → Regular (700 XP): 약 2주 추가
- Regular → Dedicated (1,400 XP): 약 2주 추가
- Dedicated → Champion (2,800 XP): 약 2주 추가

**Champion까지 약 8주 (2달). 각 단계 약 2주. 스와이프 XP 제거 후에도 임계값 도달 기간 유지됨.**

**Champion 2달 유지 충성 유저 인정**:
- Champion Tier를 2개월 연속 유지한 유저는 "Champion Legacy" 상태 부여
- Champion Legacy 유저는 비활성으로 인한 강등이 1회 유예 (2개월 비활성까지 Champion 유지)
- 이후 비활성 시 일반 Decay 규칙 적용

**Champion(40%) 할인의 사업 논리**:
Champion 도달자는 2달+ 헤비유저. CAC 완전 회수된 유저에게 40% 할인은 LTV 증대 전략이다. 이탈 기회비용이 극도로 높아진다. 50% 대신 40%로 조정한 이유: 스와이프 XP 제거로 XP 생태계가 더 건전해지고, 할인 상한을 낮춰도 4단계 구조의 명확성이 충분한 동기를 제공한다.

### 4.3 연속 활성 조건 (Decay 메커니즘)

**"활성"의 정의**: 해당 달에 최소 **150 XP** 이상 획득

150 XP 근거: 일일 20 XP × 7-8일. 주 2회 이상 사용이 기준. 캐주얼 유저도 달성 가능하지만 완전 방치는 제외된다.

**Decay 규칙**:

| 비활성 기간 | 할인율 변화 |
|-----------|-----------|
| 1개월 비활성 | 1 Tier 강등 |
| 2개월 연속 비활성 | 추가 1 Tier 강등 |
| 3개월 이상 연속 비활성 | Explorer(0%)로 리셋 |
| Champion Legacy 유저 | 2개월 비활성까지 Champion 유지 (1회 유예) |

**중요**: Decay는 누적 XP를 건드리지 않는다. XP는 영구 보존. 비활성 시 "할인 등급"만 하락. 다시 활성화되면 현재 누적 XP에 해당하는 Tier로 즉시 복귀.

**복귀 예시**:
Champion(50%)이었다가 2개월 비활성 → Dedicated(40%)로 하락 → 다음 달 150 XP 달성 → 즉시 Champion(50%) 복귀 (누적 XP 2,800+ 유지 중이므로)

### 4.4 Stripe 연동 방식

**방식: 쿠폰 코드 방식**

- Price ID를 Tier별로 따로 만드는 방식은 구독 이전이 복잡함
- Stripe Coupon은 서버에서 동적으로 특정 구독자에게 적용 가능
- 한 번 쿠폰 적용 후 매월 자동 청구 (duration: repeating)

**구현 흐름**:
```
1. 매월 1일 서버 크론잡
   각 유저 활성 여부 확인 (이전 달 XP 획득량)
   Tier 등급 결정 (누적 XP + decay + Champion Legacy 적용)
   현재 적용 중인 Stripe 쿠폰 확인

2. Tier 변경 발생 시
   기존 쿠폰 제거
   새 Tier 쿠폰 생성 및 적용
   subscription.update({ coupon: newCouponId })

3. 유저 인앱 알림
   승격: "Regular 달성! 다음 결제부터 30% 할인"
   강등: "이번 달 활동이 부족했어요. 이번 달 열심히 하면 바로 복귀돼요"
```

**Tier별 쿠폰 ID**:
- `SHORTEE_TIER1_10PCT` (Learner)
- `SHORTEE_TIER2_20PCT` (Regular)
- `SHORTEE_TIER3_30PCT` (Dedicated)
- `SHORTEE_TIER4_40PCT` (Champion)

**서버 사이드 XP 트래킹**:
현재 totalXpEarned는 localStorage + Supabase 동기화 중. 월별 XP 획득량 계산을 위해 Supabase `profiles` 테이블에 `monthly_xp_snapshot JSONB` 필드 추가 필요.

### 4.5 Anti-Gaming 장치

기존 캡 구조로 대부분 해결:
- 게임 XP: 일일 30 XP 캡
- 영상 XP: 영상당 최대 10회 (이후 XP 없음)
- 총 일일 XP 상한: 현실적으로 40-50 XP

추가 보완책:
1. **같은 달 2단계 이상 Tier 승격 불가**: XP 몰아쌓기로 즉시 Champion 불가
2. **복습 XP 감쇄**: 동일 표현을 같은 날 반복 스와이프 시 XP 0 (이미 familiar 처리됨)
3. **서버 사이드 XP 검증**: Supabase 기록이 기준. 로컬 조작 방어.

---

## 5. XP 지속가능성 설계 (CRITICAL)

### 5.1 문제 분석

**콘텐츠는 유한하다**:
- 영상 ~1,800개 × 최대 10회 XP = 54,000 XP 상한 (영상 시청)
- 헤비유저는 3-6개월 내에 대부분의 콘텐츠를 소비
- 콘텐츠 고갈 후에도 매일 앱을 열어 XP를 쌓을 이유가 있어야 한다

**CTO 피드백에서 드러난 기존 설계의 구조적 문제**:

1. **스와이프 XP가 행동을 왜곡한다**: XP 때문에 억지로 스와이프하게 됨. 이미 아는 표현을 "알아요"로 스와이프하면서 XP만 챙기는 "아는 척 파밍"이 가능하다. 앱 철학("공부 느낌 나면 실패")과 정면 충돌.
2. **Box 3 마스터 카드 재출현 = 지루함**: 이미 완벽히 아는 단어를 다시 보는 것은 학습도 재미도 없다. Leitner 기반 복습 XP가 오히려 UX를 해친다.
3. **스와이프 개별 행동 단위의 XP는 그래뉼래리티가 너무 작다**: 게임 "1판 완료"는 완결된 경험이지만, 카드 1장 스와이프는 완결 경험이 아니다.

### 5.2 핵심 결론: 스와이프 XP 완전 제거

**스와이프 학습과 XP를 분리한다.** 스와이프는 학습 행동이고, XP는 완결된 활동에 붙는다.

| 행동 | XP 여부 | 이유 |
|------|---------|------|
| 카드 1장 스와이프 | 없음 | 억지 행동 유발, 파밍 가능 |
| 게임 세션 1판 완료 (20장 완주) | 있음 | 완결된 학습 경험 |
| 영상 완주 | 있음 | 시청 자체가 학습 |
| 스트릭 보너스 | 있음 | 출석 자체에 가치 |
| 마일스톤 달성 | 있음 | 1회성, 성취감 제공 |
| 주간 미션 완료 | 있음 | 매주 새로운 목표 |

**스와이프 XP를 빼도 XP 생태계가 작동하는가? 산수 검증:**

가정: 주 3회 사용 (캐주얼 유저, 앱 활성 유지 기준선)

| XP 소스 | 주당 획득 XP |
|---------|------------|
| 영상 완주 (주 3편 × 3 XP) | 9 XP |
| 게임 세션 완료 (주 3판 × 12 XP) | 36 XP |
| 스트릭 보너스 (7일 스트릭 없다고 가정, +3 XP/일) | 9 XP |
| 주간 미션 (1개 완료 기준) | 15 XP |
| 합계 | **69 XP/주** |

월 150 XP 기준: 69 XP × 4.3주 = **297 XP** → 월 150 XP 달성 충분히 가능.

주 2회 최소 사용 케이스:

| XP 소스 | 주당 획득 XP |
|---------|------------|
| 영상 완주 (주 2편 × 3 XP) | 6 XP |
| 게임 세션 완료 (주 2판 × 12 XP) | 24 XP |
| 스트릭 없음 | 0 XP |
| 주간 미션 (0-1개) | 8 XP |
| 합계 | **38 XP/주** |

월 38 × 4.3주 = **163 XP** → 주 2회 사용으로도 월 150 XP 달성 가능.

**결론: 스와이프 XP 없이도 월 150 XP 기준 달성 가능하다. 스와이프는 XP와 완전히 분리한다.**

### 5.3 새로운 XP 생태계: 4가지 축

#### 축 1 — 콘텐츠 소비 XP (영상 시청)

영상을 보는 것 자체가 학습이다. 가장 자연스러운 XP 소스.

- 영상 완주 (+3 XP, 영상당 최대 10회)
- 60일 경과 후 재시청 시 XP 재활성화 (50% 한도, 최대 5회) — 기억은 희미해진다

**파밍 방지**: 영상당 10회 캡 (기존). 60일 리셋은 무한 반복이 아닌 "자연스러운 복습 간격" 기반.

#### 축 2 — 게임 세션 완료 XP

게임 1판 (20장 완주)에 XP. 스와이프 개별 동작이 아닌 완결된 세션에 보상.

**세션 완료 XP 구조**:

| 게임 종류 | 세션 완료 XP |
|---------|------------|
| ExpressionSwipeGame (20장 완주) | +12 XP |
| ListenFillGame (10문제 완주) | +15 XP |
| Level Challenge (20장 완주, 패스 여부 무관) | +12 XP |

**일일 캡**: 하루 세션 완료 XP 최대 40 XP (약 3판). 과도한 게임 파밍 방지.

**근거**: 스와이프 1장에 XP를 주면 20장 카드를 "빨리 끝내려는" 행동이 유발된다. 세션 완료에 XP를 주면 20장을 끝까지 보는 행동이 자연스럽게 유도된다.

#### 축 3 — 스트릭 보너스 XP (출석 기반)

앱을 꾸준히 열었다는 사실 자체에 보상. 콘텐츠와 무관.

**스트릭 구조**:

| 연속 일수 | 일일 보너스 XP |
|---------|-------------|
| 1-2일 | +2 XP |
| 3-6일 | +5 XP |
| 7-13일 | +10 XP |
| 14-29일 | +15 XP |
| 30일+ | +20 XP |

**"앱 열고 바로 닫기" 방지**: 스트릭 보너스는 영상 1편 완주 또는 게임 1판 완료 시에만 지급. 단순 앱 실행만으로는 카운트되지 않음.

**스트릭 보호 (Streak Shield)**:
- 7일 이상 스트릭 유저는 1회 "스트릭 보호" 보유 (주 1회 자동 충전)
- 하루 빠져도 스트릭 유지 (당일 자정까지 Shield 자동 소모)

**상한**: 스트릭 XP는 월 총 XP의 30%를 초과하면 초과분 무효화.

#### 축 4 — 마일스톤 XP (1회성 성취 보상)

특정 성취 최초 달성 시 보너스. 유한하지만 성취감을 주고 초기 모멘텀을 만든다.

**마일스톤 목록**:

| 마일스톤 | XP | 트리거 조건 |
|---------|-----|-----------|
| 첫 영상 완주 | +20 XP | 첫 번째 영상 완주 |
| 영상 10편 완주 | +30 XP | 누적 10편 |
| 영상 50편 완주 | +50 XP | 누적 50편 |
| 영상 100편 완주 | +80 XP | 누적 100편 |
| 첫 게임 완료 | +15 XP | 첫 번째 세션 완주 |
| 게임 20판 완료 | +30 XP | 누적 20판 |
| 7일 스트릭 | +25 XP | 최초 달성 시 1회 |
| 30일 스트릭 | +60 XP | 최초 달성 시 1회 |
| Level Challenge 첫 통과 | +40 XP | 레벨업 최초 성공 |
| Learner Tier 달성 | +20 XP | Tier 1 최초 도달 |
| Regular Tier 달성 | +30 XP | Tier 2 최초 도달 |
| Dedicated Tier 달성 | +40 XP | Tier 3 최초 도달 |

마일스톤은 유한하다. 하지만 초기 3개월 동안 꾸준히 보상을 주어 습관 형성에 기여한다.

### 5.4 주간 미션 XP (반복 가능한 목표)

매주 리셋. 단조로움을 막는 변동성 요소. 챌린지가 아닌 "미션" — 달성 가능한 일상 활동.

**미션 유형 (매주 랜덤 3개 선정)**:

| 미션 | 조건 | XP |
|------|------|-----|
| 영상 완주 목표 | 이번 주 3편 이상 완주 | +20 XP |
| 게임 연속 | 3일 연속 게임 세션 완료 | +25 XP |
| 장르 탐험 | 지금까지 안 본 카테고리 영상 2편 시청 | +20 XP |
| 레벨 도전 | 현재 레벨보다 높은 CEFR 영상 1편 완주 | +15 XP |
| 복습 집중 | Level Challenge 1회 완주 | +15 XP |

**주간 미션 XP 상한**: 주당 60 XP.

**미션 설계 원칙**: 모든 미션이 "영상 보기" 또는 "게임 완주" 행동에 연결된다. 스와이프 단독으로 달성 가능한 미션은 없다.

### 5.5 Layer 3 (마스터리 XP) 구체적 메커니즘

기존 설계에서 "어떻게 하겠다는 건지 불명확"하다는 CTO 피드백을 반영하여 구체화.

**전제**: 스와이프 XP를 제거했으므로, Leitner Box 기반 복습 XP도 제거한다. 대신 마스터리는 "완료 이벤트"로만 XP를 준다.

**마스터리 XP 발생 시점**:
1. 표현이 Leitner Box 3에 처음 도달하는 순간 → +5 XP 일시 보너스 (표현당 1회)
   - 트리거: `useGameProgressStore`에서 `box3Entries` 배열에 새 항목이 추가될 때
   - 구현: `addToBox3(expressionId)` 호출 시 XP 지급 훅 연결
2. Box 3 도달 30일 후 자동 "마스터리 확인 카드"가 다음 게임 세션에 포함됨
   - "알아요" 답변 시 → +3 XP (장기 기억 유지 보상)
   - "몰라요" 답변 시 → XP 없음, Box 2로 복귀 (복습 루프 재진입)
   - 확인은 Box 3 도달 후 30일, 90일 최대 2회만 실행

**구현 방식**:
```
// useGameProgressStore 확장
interface MasteryRecord {
  expressionId: string
  box3ReachedAt: number       // timestamp
  confirmations: number        // 0, 1, 2
  lastConfirmedAt?: number
}
mastery: MasteryRecord[]

// 확인 카드 선별 (selectCards 호출 시)
getPendingMasteryCards(): string[]
  → box3ReachedAt로부터 30일+ 경과, confirmations < 2인 항목
  → 게임 세션 20장 중 최대 3장만 포함 (압도감 방지)
```

**마스터리 XP 총량 한계값**: 3,383 표현 × 5 XP = 최대 16,915 XP (이 소스도 유한함). 하지만 헤비유저도 Box 3에 수천 표현을 쌓으려면 수개월이 걸리므로 현실적 지속성이 있다.

### 5.6 XP 소스 포트폴리오 및 지속가능성 시뮬레이션

**콘텐츠 소진 전 (0-3개월)**:
- 주력: 영상 시청 XP + 게임 세션 XP + 마일스톤 XP + 스트릭
- 일일 XP: 15-40 XP 기대

**콘텐츠 대부분 소진 후 (3-6개월+)**:
- 주력: 스트릭 보너스 + 주간 미션 + 마스터리 확인 XP + 재소비 영상 XP
- 일일 XP: 8-20 XP (감소하지만 지속 가능)
- 게임 세션 XP는 표현 고갈 후에도 작동 (이미 아는 표현도 게임으로 즐길 수 있음)

**Tier 유지 가능성 (스와이프 XP 없는 구조)**:

| Tier | 월 필요 XP | 최소 행동 조건 |
|------|-----------|--------------|
| Learner 유지 | 150 XP | 주 2회 앱 사용 (게임 1판 + 영상 1편) |
| Regular 유지 | 150 XP | 동일 — Tier 유지 기준은 모든 단계 동일 |
| Dedicated 유지 | 150 XP | 동일 |
| Champion 유지 | 150 XP | 동일 |

**Tier 유지 기준을 모든 단계 150 XP로 통일하는 이유**: 진입 조건(누적 XP)은 높게, 유지 조건은 동일하게. Champion에 들어간 유저가 적당히만 써도 유지할 수 있어야 이탈 동기가 생기지 않는다.

### 5.7 XP 소스별 파밍 방지 정리

| XP 소스 | 파밍 위험 | 방지책 |
|---------|---------|--------|
| 스와이프 | 이미 제거 | 스와이프는 XP 없음 |
| 영상 시청 | 무한 반복 | 영상당 최대 10회 캡 (기존) |
| 게임 세션 완료 | 빠른 스킵으로 완주 | 세션 최소 소요 시간 체크 (2분 이하 완주 무효) |
| 스트릭 보너스 | 매일 로그인만 반복 | 영상 완주 또는 게임 완주 조건 필수 + 월 30% 상한 |
| 마일스톤 | 불가 | 1회성 |
| 주간 미션 | 미션 조건만 충족하는 행동 | 미션이 이미 자연스러운 행동(영상 보기, 게임 하기)이라 파밍 개념 없음 |
| 마스터리 XP | Box 3 조기 몰아쌓기 | 표현당 1회, 게임 세션 자연 발생에 의존 |

---

## 6. 요구사항

### 6.1 Functional Requirements

#### Level Challenge

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| LC-01 | My 탭 "Level Challenge" 버튼 — rawScore 임계값 도달 시 활성화 | Must |
| LC-02 | ExpressionSwipeGame 기반 20장 카드 게임 (CEFR 분포만 변경) | Must |
| LC-03 | CEFR 분포: beginner→intermediate (A2 50%+B1 50%), intermediate→advanced (B2 60%+C1 40%) | Must |
| LC-04 | 80% 패스 조건 (20장 중 16장 "알아요") + 레벨업 처리 (LevelUpCelebration 연동) | Must |
| LC-05 | 쿨다운 없음 — 실패 즉시 재도전, 문항 매번 새로 뽑기 | Must |
| LC-06 | 결과 화면: 달성 여부, 몰랐던 표현 목록(최대 5개), "바로 다시 도전" 버튼 | Must |
| LC-07 | Level Challenge 카드에서도 게임 XP 정상 지급 (FloatingXP 포함) | Must |
| LC-08 | rawScore 임계값 도달 시 "Level Challenge" 팝업 권유 | Should |
| LC-09 | familiarity/Leitner 데이터로 이미 아는 표현 편향 제거 | Should |
| LC-10 | 도전 기록 저장 (시도 횟수, 달성 여부, 날짜) in useLevelChallengeStore | Could |

#### XP Tier Discount

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| XT-01 | 4단계 Tier 정의 + 누적 XP 기반 Tier 계산 함수 | Must |
| XT-02 | 월별 활성 여부 판단 (월 150 XP 조건) | Must |
| XT-03 | Decay 로직 (비활성 1개월마다 1 Tier 강등, 3개월+ → Explorer 리셋) | Must |
| XT-04 | Champion Legacy: 2개월 연속 Champion 유지 시 강등 1회 유예 | Must |
| XT-05 | My 탭 Tier 현황 표시 (현재 Tier, 할인율, 다음 Tier까지 XP) | Must |
| XT-06 | 서버 크론잡: 월초 Tier 재계산 + Stripe 쿠폰 업데이트 | Must |
| XT-07 | Supabase profiles 테이블에 monthly_xp_snapshot JSONB 필드 추가 | Must |
| XT-08 | 같은 달 2단계 이상 Tier 승격 불가 | Should |
| XT-09 | 월 150 XP 미달 사전 경고 알림 (당월 20일 기준) | Should |
| XT-10 | Tier 승격/강등 인앱 알림 | Should |
| XT-11 | 기존 useDiscountStore와 병존 (최대 할인 적용) | Must |

#### XP 지속가능성

| ID | 요구사항 | 우선순위 |
|----|----------|---------|
| XS-01 | 스와이프 XP 완전 제거: ExpressionSwipeGame 카드 1장 스와이프에 XP 없음 | Must |
| XS-02 | 게임 세션 완료 XP: ExpressionSwipeGame 20장 완주 시 +12 XP, ListenFillGame 10문제 완주 시 +15 XP | Must |
| XS-03 | 게임 세션 일일 캡: 세션 완료 XP 하루 최대 40 XP (약 3판) | Must |
| XS-04 | 세션 최소 소요 시간 검증: 2분 이하 완주 무효 (빠른 스킵 파밍 방지) | Must |
| XS-05 | 스트릭 보너스 XP: 연속 일수 구간별 일일 추가 XP (영상 완주 또는 게임 완주 시에만 지급) | Must |
| XS-06 | 스트릭 Shield: 7일+ 스트릭 유저 주 1회 결석 허용 | Should |
| XS-07 | 스트릭 보너스 XP 월 총 XP 30% 상한 적용 | Must |
| XS-08 | 마일스톤 XP: 영상 완주 횟수, 게임 완주 횟수, 스트릭 일수, Tier 최초 도달 등 1회성 보너스 | Must |
| XS-09 | 마스터리 XP: Box 3 최초 도달 시 +5 XP 일시 보너스 (표현당 1회) | Should |
| XS-10 | 마스터리 확인 카드: Box 3 도달 30일+ 후 게임 세션에 자동 포함 (세션당 최대 3장), 확인 시 +3 XP | Could |
| XS-11 | 주간 미션: 매주 3개 랜덤 선정, 모든 미션이 영상 시청 또는 게임 완주 행동에 연결, 주당 상한 60 XP | Should |
| XS-12 | 콘텐츠 재소비 XP: 60일 경과 영상 재시청 XP 재활성화 (50% 한도, 최대 5회) | Could |

### 6.2 Non-Functional Requirements

| 항목 | 기준 |
|------|------|
| Level Challenge 로딩 | 문항 선별 1초 이내 (클라이언트 사이드 JSON 처리) |
| XP Tier 표시 | 앱 기동 시 localStorage에서 즉시 로드 (서버 조회 없음) |
| Stripe 크론잡 | 매월 1일 UTC 00:00-06:00 내 완료 |
| 이모지 금지 | Tier 이름, 결과 화면, 챌린지 UI 모두 텍스트 전용 |
| 테마 호환 | light/dark/purple 테마 CSS variable 사용 |

---

## 7. 성공 기준

| 지표 | 기준 |
|------|------|
| Level Challenge 완주율 | 도전 시작 후 20장 완주 비율 > 85% |
| Level Challenge 재도전율 | 실패 유저의 즉시 재도전율 > 50% |
| XP Tier 인지율 | My 탭 방문 유저의 Tier 정보 확인율 > 60% (GA4) |
| Tier 유지율 | Learner+ 활성 유저의 다음 달 활성 유지율 > 70% |
| 콘텐츠 소진 후 리텐션 | 영상 100편+ 시청 완료 유저의 30일 리텐션 > 50% |
| XP 다양성 | 2가지 이상 XP 소스 사용 유저 비율 > 70% |
| Champion 전환 수익 | Champion 유저의 연간 LTV > Explorer 유저의 3배 |

---

## 8. Risks

| 리스크 | 영향 | 가능성 | 대응 |
|--------|------|--------|------|
| Level Challenge가 "공부 느낌"으로 인지 | 높음 | 중간 | 완전 선택형 + "Challenge" 명칭 + 쿨다운 없음으로 압박 제거 |
| Champion 50% 할인이 마진 침식 | 중간 | 중간 | Champion 도달 = 2달+ 헤비유저 = CAC 회수 완료 → LTV 3-5배 |
| Stripe 크론잡 실패 시 쿠폰 미업데이트 | 중간 | 낮음 | 실패 알림 + 수동 재실행 API 엔드포인트 |
| 스트릭 보너스 XP 파밍 (로그인만 반복) | 중간 | 중간 | 영상 완주 또는 게임 완주 조건 필수 + 월 30% 상한 |
| 스와이프 XP 제거로 useLevelStore 스와이프 로직 파편화 | 중간 | 낮음 | 스와이프 XP 계산 로직 제거 후 Absorption Score만 유지 (별개 시스템) |
| 게임 세션 2분 최소 시간 검증이 UX 방해 | 낮음 | 낮음 | 조용히 서버 사이드 검증만, 유저에게 노출 안 함 |
| 기존 useDiscountStore와 이중 할인으로 마진 침식 | 중간 | 중간 | 최저 마진 라인 48,900원 서버 사이드 강제 |
| 문항 부족 (CEFR × 카테고리 교집합이 작음) | 낮음 | 높음 | 카테고리 보충 로직 + 최소 풀 크기 검증 |

---

## 9. 구현 우선순위

### 9.1 MVP (이번 이터레이션 필수)

**Phase 1: Level Challenge (1주)**
1. `useLevelChallengeStore` 신규 생성 (도전 기록, 시도 횟수, CEFR 분포 설정)
2. `selectChallengeCards()` 유틸 함수 — CEFR 분포 적용 버전의 selectCards
3. `LevelChallengeGame` 컴포넌트 — ExpressionSwipeGame을 props 기반으로 재활용 (mode: 'challenge')
4. My 탭 "Level Challenge" 버튼 + 80% 패스 판정 + 결과 화면
5. 기존 LevelUpCelebration 연동

**Phase 2: XP Tier 클라이언트 (3-4일)**
1. `useTierStore` 신규 생성 (현재 Tier, 활성 월 XP, Decay 계산, Champion Legacy)
2. My 탭 Tier 현황 카드 UI
3. 기존 useDiscountStore와 병존 (최대 할인 원칙)

**Phase 3: XP 지속가능성 MVP (3-4일)**
1. 스와이프 XP 제거 (XS-01) — useLevelStore의 스와이프 XP 로직 제거 또는 0으로 처리
2. 게임 세션 완료 XP (XS-02, XS-03, XS-04) — 20장/10문제 완주 이벤트에 XP 연결, 일일 캡 및 최소 소요 시간 검증
3. 스트릭 보너스 XP (XS-05, XS-07) — streakDays 연동, 영상/게임 완주 조건 필수, 월 30% 상한
4. 마일스톤 XP (XS-08) — useMilestoneStore 신규, 핵심 마일스톤 10-15개

**Phase 4: 서버 사이드 연동 (1주)**
1. Supabase `profiles` 테이블 `monthly_xp_snapshot JSONB` 필드 추가
2. Vercel Cron 월초 Tier 재계산 + Stripe 쿠폰 업데이트

### 9.2 Should (이번 이터레이션 포함 권장)

- 주간 미션 시스템 (XS-11) — 주요 리텐션 루프
- 마스터리 XP (XS-09) — 구현 단순, 보상 가시성 높음
- 스트릭 Shield (XS-06)
- Tier 승격/강등 인앱 알림

### 9.3 Could / Won't (다음 이터레이션)

- 마스터리 확인 카드 (XS-10) — 30일 후 스케줄링, 구현 복잡도 높음
- 콘텐츠 재소비 XP (XS-12) — 60일 후 측정 데이터 필요
- 도전 기록 히스토리 화면
- useDiscountStore 완전 흡수 통합

### 9.4 의존성 정리

```
Level Challenge 의존:
  - expression-entries-v2.json (CEFR, category) ✅ 완료
  - expression-index-v2.json (문맥 문장) ✅ 완료
  - ExpressionSwipeGame.tsx ✅ 완료 (재활용)
  - useLevelStore (rawScore, checkLevelUp, acceptLevelUp) ✅ 완료
  - useFamiliarityStore (familiar 편향 제거) ✅ 완료
  - useGameProgressStore (Leitner 데이터) ✅ 완료
  - LevelUpCelebration ✅ 완료

XP Tier 의존:
  - useUserStore.totalXpEarned ✅ 완료
  - useDiscountStore ✅ 완료 (병존용)
  - Supabase profiles → monthly_xp_snapshot 필드 추가 필요
  - Stripe API ✅ 완료 (쿠폰 API만 추가)

XP 지속가능성 의존:
  - useGameProgressStore (Leitner Box 데이터) ✅ 완료
  - useUserStore.streakDays ✅ 완료
  - useFamiliarityStore (familiar entries) ✅ 완료
```

### 9.5 구현 복잡도 추정

| 항목 | 복잡도 | 이유 |
|------|--------|------|
| Level Challenge (ExpressionSwipeGame 재활용) | 낮음-중간 | 카드 풀만 변경, UI 재활용 |
| selectChallengeCards 알고리즘 | 낮음 | 기존 selectCards 변형 |
| useLevelChallengeStore | 낮음 | 단순 상태 저장 |
| useTierStore + Champion Legacy | 중간 | 계산 로직 + Legacy 조건 |
| 스트릭 보너스 XP | 낮음 | streakDays 연동, 일일 지급 |
| 복습 XP (Box 1/2 연동) | 중간 | selectCards 수정 + 당일 1회 추적 |
| 주간 챌린지 시스템 | 중간-높음 | 챌린지 선정 로직 + 주간 리셋 |
| 서버 크론잡 + Stripe 쿠폰 | 높음 | 서버 사이드, 실제 결제 변경 |

총 예상: Level Challenge MVP 1주, XP Tier 클라이언트 1주, XP 지속가능성 MVP 1주, 서버 연동 1주

---

## 10. Architecture Considerations

**신규 Store**:
- `src/stores/useLevelChallengeStore.ts` — 도전 기록, 시도 횟수, CEFR 분포 설정
- `src/stores/useTierStore.ts` — Tier 상태, Decay, Champion Legacy, 월 XP 트래킹
- `src/stores/useMilestoneStore.ts` — 마일스톤 달성 여부 추적, 1회성 XP 지급
- `src/stores/useWeeklyMissionStore.ts` — 주간 미션 상태, 주별 리셋 (Should 단계)

**신규/수정 컴포넌트**:
- `src/components/level/LevelChallengeGame.tsx` — ExpressionSwipeGame을 mode props로 재활용
- `src/components/level/TierStatusCard.tsx` — My 탭 Tier 현황 카드
- `src/components/games/ExpressionSwipeGame.tsx` — mode: 'challenge' props 추가 (기존 파일 수정)

**신규 유틸**:
- `src/lib/levelChallenge/selectChallengeCards.ts` — CEFR 분포 기반 문항 선별
- `src/lib/xp/streakBonus.ts` — 스트릭 보너스 계산 (완주 조건 검증 포함)
- `src/lib/xp/sessionXp.ts` — 게임 세션 완료 XP 계산 (최소 소요 시간 검증 포함)
- `src/lib/xp/milestoneXp.ts` — 마일스톤 달성 감지 및 XP 지급

**수정 파일**:
- `src/app/(tabs)/my/page.tsx` — Level Challenge 버튼, Tier 카드 추가
- `src/stores/useLevelStore.ts` — Level Challenge 패스 시 레벨업 트리거 연동

**신규 API**:
- `src/app/api/billing/update-tier-coupon/route.ts`
- `src/app/api/cron/monthly-tier-update/route.ts`

**Supabase 마이그레이션**:
- `profiles` 테이블에 `monthly_xp_snapshot JSONB` 필드 추가

---

## 11. Next Steps

1. [ ] CTO 검토 및 승인
2. [ ] expression 데이터 최소 문항 풀 크기 검증 (CEFR × 카테고리별 교집합 카운트)
3. [ ] XP Tier 임계값 시뮬레이션 (현재 유저 XP 분포 기반 Tier 분포 예측)
4. [ ] 스트릭 보너스 XP 구간값 A/B 테스트 계획 수립
5. [ ] Stripe 쿠폰 생성 방식 확정 (고정 쿠폰 코드 vs 동적 생성)
6. [ ] Design 문서 작성 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-13 | 초안 — Level Test + XP Tier Discount 통합 설계 | PM Agent |
| 0.2 | 2026-03-13 | CTO 피드백 반영 — 쿨다운 제거, 4지선다→스와이프 게임 재활용, 할인율 공격적 4단계, XP 지속가능성 5개 Layer 설계 추가 | PM Agent |
| 0.3 | 2026-03-13 | CTO 2차 피드백 반영 — 스와이프 XP 완전 제거, 게임 세션 완료 XP로 전환, 할인율 10%씩 균등 증가(10/20/30/40%), Layer 3 마스터리 메커니즘 구체화, 스와이프 없이도 월 150 XP 달성 가능성 산수 검증 | PM Agent |
