---
name: level_test_tier_discount
description: Level Challenge(레벨 테스트) 및 XP Tier Discount 시스템 플랜 컨텍스트 (v0.3 CTO 2차 피드백 반영, 2026-03-13)
type: project
---

Level Test + XP Tier Discount 플랜이 CTO 2차 피드백을 반영하여 v0.3으로 개정되었다 (2026-03-13).

**Why:** CTO 핵심 지적: (1) 스와이프 XP가 억지 행동 유발 및 파밍 가능, (2) Box 3 복습 카드 재출현이 지루함 유발, (3) Layer 3 마스터리 메커니즘 불명확, (4) 할인율을 10%씩 균등 증가로 변경.

**How to apply:** 이후 이 feature의 Design/Do/Check 단계에서 아래 핵심 결정을 참조할 것.

## 핵심 결정 사항 (v0.3)

### Level Challenge (변경 없음)
- 이름: "Level Challenge" (테스트라는 단어 사용 금지)
- 완전 선택형(Optional): 강제 테스트 없음
- **게임 포맷: ExpressionSwipeGame 그대로 재활용** (카드 보고 "알아요/몰라요" 스와이프)
- 카드 수: 20장, 패스 기준: 80% (16/20 "알아요"), 쿨다운 없음
- CEFR 분포: beginner→intermediate (A2 50%+B1 50%), intermediate→advanced (B2 60%+C1 40%)

### XP Tier (v0.3 — 할인율 10%씩 균등 증가)

| Tier | 이름 | 누적 XP | 할인 | 도달 기간 |
|------|------|--------|------|---------|
| 0 | Explorer | 0-299 | 0% | 신규 |
| 1 | Learner | 300-699 | 10% | 약 2주 |
| 2 | Regular | 700-1399 | 20% | 약 4주 |
| 3 | Dedicated | 1400-2799 | 30% | 약 6주 |
| 4 | Champion | 2800+ | 40% | 약 8주 |

- 활성 기준: 월 **150 XP** 이상
- Decay: 비활성 1개월마다 1 Tier 강등, 3개월 → Explorer 리셋
- **Champion Legacy**: 2개월 연속 Champion 유지 → 강등 1회 유예
- Stripe 쿠폰 코드: SHORTEE_TIER1_10PCT ~ SHORTEE_TIER4_40PCT

### XP 지속가능성 (v0.3 — 스와이프 XP 완전 제거)

**핵심 변경**: 스와이프 카드 1장 단위 XP를 완전히 없앴다. XP는 "완결된 활동"에만 붙는다.

새 XP 소스 4가지 축:
1. **콘텐츠 소비 XP**: 영상 완주 +3 XP (영상당 최대 10회, 60일 후 재활성화)
2. **게임 세션 완료 XP**: ExpressionSwipeGame 20장 완주 +12 XP, ListenFill 10문제 완주 +15 XP, 일일 캡 40 XP, 2분 이하 완주 무효
3. **스트릭 보너스 XP**: +2~+20 XP/일 (영상 완주 또는 게임 완주 시에만 지급, 월 30% 상한)
4. **마일스톤 XP**: 영상 완주 횟수, 게임 완주 횟수, 스트릭 일수, Tier 최초 도달 등 1회성 보너스

추가:
- **주간 미션**: 매주 3개 (모두 영상/게임 완주에 연결), 주당 60 XP 상한 (Should)
- **마스터리 XP**: Box 3 최초 도달 +5 XP (Should), 30일 후 확인 카드 세션당 최대 3장 +3 XP (Could)

**산수 검증 (스와이프 XP 없이 월 150 XP 달성 가능?)**
- 주 3회 사용: 영상(9) + 게임(36) + 스트릭(9) + 미션(15) = 69 XP/주 → 월 297 XP (가능)
- 주 2회 최소 사용: 영상(6) + 게임(24) + 미션(8) = 38 XP/주 → 월 163 XP (가능)
- 결론: 스와이프 XP 없이도 월 150 XP 달성 충분히 가능.

## 신규 파일 목록

- `src/stores/useLevelChallengeStore.ts`
- `src/stores/useTierStore.ts`
- `src/stores/useMilestoneStore.ts`
- `src/stores/useWeeklyMissionStore.ts` (Should)
- `src/components/level/LevelChallengeGame.tsx` (ExpressionSwipeGame 재활용)
- `src/components/level/TierStatusCard.tsx`
- `src/lib/levelChallenge/selectChallengeCards.ts`
- `src/lib/xp/streakBonus.ts`
- `src/lib/xp/sessionXp.ts`
- `src/lib/xp/milestoneXp.ts`
- `src/app/api/billing/update-tier-coupon/route.ts`
- `src/app/api/cron/monthly-tier-update/route.ts`

## 플랜 문서 경로

`docs/01-plan/features/level-test-and-tier-discount.plan.md`
