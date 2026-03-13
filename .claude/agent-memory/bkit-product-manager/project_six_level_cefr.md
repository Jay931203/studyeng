---
name: project_six_level_cefr
description: 6단계 CEFR 레벨 시스템 + Tier 통합 플랜 핵심 결정 사항 (2026-03-13)
type: project
---

6단계 CEFR 레벨 확장 및 Tier 통합 플랜이 작성되었다 (2026-03-13).

**Why:** 3단계 레벨(beginner/intermediate/advanced)이 너무 거칠어 콘텐츠 추천 정확도가 낮고, Level Challenge 전환도 2개뿐이라 성취감 구간이 부족하다. TierStatusCard가 DailyMissions와 별도로 존재해 XP→Tier 연결감이 없다.

**How to apply:** 향후 레벨 관련 작업 시 이 플랜을 참조한다.

## 핵심 결정

### 레벨 시스템
- 6단계 유지 (C2 표현 ~230개로 풀 충분)
- 타입: `'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'`
- 레벨 이름: CEFR 코드 + 한글 서브타이틀 (A1 입문, A2 초급, B1 중하급, B2 중상급, C1 고급, C2 마스터)
- Migration: beginner→A1, intermediate→B1, advanced→C1 (보수적)

### Absorption Score 임계값 (5개)
- A1→A2: 60, A2→B1: 150, B1→B2: 280, B2→C1: 400, C1→C2: 600
- B1(150), C1(400) 기존값 유지 (연속성)

### Level Challenge 5 전환
- A1→A2: A2 100%, 힌트 있음
- A2→B1: A2 40% + B1 60%, 힌트 있음
- B1→B2: B1 30% + B2 70%, 힌트 있음
- B2→C1: B2 30% + C1 70%, 힌트 없음
- C1→C2: C1 30% + C2 70%, 힌트 없음, 카테고리 캡 40%로 완화

### Tier 통합
- TierStatusCard를 My 탭 독립 렌더링에서 제거
- DailyMissions 하단에 compact 모드로 통합
- TierStatusCard에 mode='standalone' | 'compact' props 추가

## 플랜 파일
`docs/01-plan/features/six-level-tier-integration.plan.md`
