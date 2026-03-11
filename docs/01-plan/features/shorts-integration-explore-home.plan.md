# Shorts Integration - Explore Home Page Planning Document

> **Summary**: YouTube Shorts 콘텐츠를 Explore 홈 페이지에 통합하는 방식을 결정하는 전략 계획 문서. 37개 Shorts 영상을 656개 Series 클립과 어떻게 공존시킬지, 유저 경험과 비즈니스 목표를 동시에 달성하는 배치 전략을 정의한다.
>
> **Project**: Shortee
> **Version**: 0.1
> **Author**: PM Agent
> **Date**: 2026-03-10
> **Status**: Draft - CTO 검토 요청

---

## 1. Overview

### 1.1 Purpose

현재 Explore 페이지는 Series 클립 중심으로 설계되어 있다. 최근 37개의 YouTube Shorts 영상이 추가되었으나 이 콘텐츠를 위한 명확한 UX 배치 전략이 없다. 이 플랜은 다음을 결정한다:

- Shorts를 Explore 홈에 어떻게, 어디에, 어떤 규모로 노출할 것인가
- Shorts가 Series와 경쟁해야 하는가, 보완해야 하는가
- 37개라는 얇은 카탈로그로도 섹션을 만들 만한가
- 이 결정이 리텐션과 전환률에 어떤 영향을 주는가

### 1.2 Background

**현재 콘텐츠 구조:**

| 타입 | 수량 | 특징 |
|------|------|------|
| Series 클립 | ~656개 (161 시리즈) | 에피소드 순서 있음, 스토리 연속성 |
| YouTube Shorts | 37개 | 독립형, 시리즈 없음, 수직 포맷 |

**현재 Explore 홈 섹션 (코드 기준):**

1. Hero Spotlight - 알고리즘 추천 단일 영상 (대형 카드)
2. 이어보는 시리즈 - 시청 기록 기반 가로 스크롤 카드
3. 추천 - 2x2 그리드 4개 영상 카드
4. 시리즈 - 카테고리 필터 + 전체 시리즈 그리드

**문제 진단:**

- Shorts 37개가 현재 Series 카탈로그에 섞여 있거나, 아예 미노출 상태
- `VideoData.seriesId` 없이 standalone으로 존재하는 Shorts는 Series 섹션에 나타나지 않음
- Shorts만의 소비 패턴(즉흥적, 맥락 독립)을 Series UX 구조가 수용하지 못함

### 1.3 Related Documents

- Design Doc: `docs/plans/2026-03-06-studyeng-app-design.md`
- Brand UX Strategy: `docs/plans/brand-ux-strategy.md`
- Monetization Plan: `docs/01-plan/features/monetization-and-engagement.plan.md`
- Content System: `docs/CONTENT-SYSTEM.md`
- Explore Page Code: `src/app/(tabs)/explore/page.tsx`

---

## 2. Strategic Analysis

### 2.1 핵심 질문: Shorts vs Series - 다른 학습 모멘트인가?

**결론: 예, 명확히 다른 모멘트다.**

| 차원 | Series 클립 | YouTube Shorts |
|------|-------------|----------------|
| 소비 의도 | "Friends 다음 에피소드 보자" (목적형) | "뭔가 재밌는 거 없나" (탐색형) |
| 세션 길이 | 5-15분 (3-8개 연속 시청) | 1-3분 (1-2개 후 이탈 or 진입) |
| 재방문 동기 | 시리즈 완성 욕구, 스토리 연속성 | 새로운 자극, 다양성 욕구 |
| 리텐션 기여 | 장기 리텐션 (D7, D30) | 단기 리텐션 (D1, D3) - 새 유저 훅 |
| 학습 깊이 | 캐릭터/맥락 반복 노출로 자연 습득 | 단일 표현/상황 임팩트 |
| 발견 방식 | 시리즈 목록 탐색 | 피드 스와이프 우연 발견 |

**시사점**: Shorts는 "입문 관문" 역할이 적합하다. 새 유저는 시리즈 선택이라는 커밋이 부담스럽다. Shorts 1-2개로 앱의 재미를 먼저 체험하고, 마음에 들면 시리즈로 진입하는 퍼널이 자연스럽다.

### 2.2 핵심 질문: 37개로 별도 섹션이 정당화되는가?

**결론: 조건부 가능, 단 노출 방식에 따라 달라진다.**

| 노출 방식 | 37개의 충분성 | 리스크 |
|-----------|--------------|--------|
| 전용 섹션 (그리드 전체) | 부족함 - "이게 전부야?" 느낌 | 카탈로그 빈약 노출 |
| 인라인 큐레이션 (3-4개 카드) | 충분함 - "선별된 것" 느낌 | 없음 |
| 피드 내 혼합 (알고리즘) | 충분함 - 가시적 배치 불필요 | 존재감 희석 |
| 진입점 역할 (탭/CTA) | 충분함 - 별도 피드 페이지로 분리 | 구현 복잡도 |

**핵심 인사이트**: 37개를 "전부 나열"하면 빈약하다. 37개 중 "지금 볼 것" 3-4개를 큐레이션해서 보여주면 충분하다. Netflix가 10만 편의 영화를 갖고 있어도 홈에는 10개만 추천하는 것과 같은 원리.

### 2.3 핵심 질문: 스낵 vs 밀 - 어떻게 포지셔닝할 것인가?

**최적 프레임: "예고편" 포지셔닝**

- Shorts = 시리즈의 예고편이자 앱 자체의 예고편
- 사용자가 Shorts를 보고 "이런 영어 재밌는데, 더 있나?"라고 탐색하면 시리즈로 연결
- Shorts 자체가 목적지가 아니라 시리즈 진입 퍼널의 시작점

이 포지셔닝이 "스낵 vs 밀" 이분법보다 제품에 더 자연스럽다. 왜냐하면 Shortee의 모든 콘텐츠는 짧은 클립이기 때문에 길이 기준 차별화는 의미가 없다. 차별화 기준은 "맥락 있음(Series) vs 맥락 없음(Shorts)"이다.

### 2.4 핵심 질문: 리텐션 영향

| 시나리오 | D1 | D7 | D30 |
|----------|----|----|-----|
| Series 유저 (입문부터 시리즈) | 중간 | 높음 | 높음 |
| Shorts 유저 (Shorts만 소비) | 높음 | 낮음 | 매우 낮음 |
| Hybrid 유저 (Shorts 입문 → Series 전환) | 높음 | 높음 | 높음 |

**목표는 Hybrid 유저 퍼널을 만드는 것이다.** Shorts 노출 후 Series 클릭 유도 CTA를 자연스럽게 배치한다.

### 2.5 핵심 질문: prominence - 경쟁 vs 보완

**결론: Shorts는 Series와 경쟁하지 않아야 한다.**

- Hero Spotlight: Series 클립 유지 (알고리즘 추천, 개인화)
- Shorts: Series 섹션 위 또는 추천 섹션 아래에 "다른 맛보기" 섹션으로 배치
- Shorts 섹션이 Series 섹션보다 상위에 위치하면 잘못된 신호 (Shorts = 핵심이 아님)
- 단, 새 유저 온보딩에서는 Shorts를 앞에 배치하는 것이 유입 전환에 유리

---

## 3. Scope

### 3.1 In Scope

- [ ] Explore 홈에 Shorts 섹션 배치 위치와 형태 정의
- [ ] Shorts에서 Series로 전환하는 진입점(CTA) 설계
- [ ] 신규 유저 vs 복귀 유저별 Shorts 노출 전략 차별화
- [ ] Shorts 카탈로그 증가에 따른 확장 시나리오 정의
- [ ] 카테고리 필터에서 Shorts 포함 여부 결정
- [ ] `VideoData` 구조에서 Shorts 식별 방법 정의

### 3.2 Out of Scope

- Shorts 전용 별도 탭 추가 (탭 구조 변경은 별도 플랜 필요)
- Shorts 콘텐츠 큐레이션/추가 파이프라인 (Content Strategy 플랜으로 분리)
- Shorts 전용 게임 시스템 설계 (Game System 플랜으로 분리)
- 알고리즘 추천 엔진 개선 (Recommendation 플랜으로 분리)
- 37개 → 200개+ 콘텐츠 확장 (단기 구현 범위 아님)

---

## 4. Requirements

### 4.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Explore 홈에 Shorts 섹션 추가 (가로 스크롤 카드, 3-4개 큐레이션) | Must | Pending |
| FR-02 | `VideoData.format` 필드로 Shorts 식별 (`'shorts'` 값) | Must | Pending |
| FR-03 | Shorts 카드에서 시청 후 관련 시리즈 추천 표시 | Should | Pending |
| FR-04 | 카테고리 필터가 Shorts를 포함한 경우 `daily` 또는 별도 필터로 분류 | Should | Pending |
| FR-05 | Shorts 섹션 헤더에 "더 보기" 링크 → Shorts 전용 피드 뷰 | Could | Pending |
| FR-06 | 신규 유저 첫 접속 시 Shorts를 Hero Spotlight 위치에 우선 노출 | Could | Pending |
| FR-07 | Shorts 시청 완료 후 "비슷한 시리즈" 인라인 추천 카드 | Could | Pending |

### 4.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Discoverability | Explore 홈 방문 유저 중 Shorts 섹션 스크롤 도달률 60% 이상 | 스크롤 depth 추적 |
| Click-through | Shorts 섹션 CTR 15% 이상 (노출 대비 클릭) | 클릭 이벤트 |
| Funnel | Shorts 시청 유저 중 Series 진입률 20% 이상 | 세션 내 경로 분석 |
| Catalog feel | 섹션이 "빈약하다"는 느낌 없이 큐레이션된 느낌 유지 | 사용자 피드백/리뷰 |

---

## 5. Recommended Solution: "Gateway Strip" 패턴

### 5.1 배치 전략

```
Explore 홈 (스크롤 순서)
├── Header (Logo + Profile)
├── [1] Hero Spotlight  ← Series 클립 (현재 유지)
├── [2] Search Bar
├── [3] 이어보는 시리즈  ← 시청 기록 있는 유저만 표시 (현재 유지)
├── [4] ★ Shorts 섹션 ★  ← 신규 추가 (가로 스크롤, 3-4개 카드)
│       헤더: "오늘의 Short" 또는 "빠른 한 편"
│       카드: 세로형 썸네일 + 제목 + 재생시간
│       CTA: 더 보기 → Shorts 피드 진입
├── [5] 추천  ← (현재 유지, 순서 유지)
└── [6] 시리즈  ← (현재 유지)
```

**배치 근거:**
- [4] 위치 (이어보기 바로 아래, 추천 위): Series 섹션에 도달하기 전 가벼운 진입점 역할
- 이어보기가 없는 신규 유저: 자연스럽게 [1] Hero → [4] Shorts → [5] 추천 → [6] 시리즈 흐름
- 복귀 유저: [3] 이어보기 → [4] Shorts (오늘 새 콘텐츠 발견) 흐름

### 5.2 섹션 헤더 언어

현재 톤 원칙("오그라들지 않는 디자인") 준수:

| 옵션 | 평가 |
|------|------|
| "오늘의 Short" | 적합 - 심플하고 부담 없음 |
| "빠른 한 편" | 적합 - 시간 압박 없이 가벼운 느낌 |
| "지금 바로" | 적합 - 즉각성 강조 |
| "Shorts" (영문 그대로) | 중립 - 브랜드 인지도 낮으면 무의미 |
| "바로 보는 영어" | 부적합 - "영어 공부" 뉘앙스 |
| "숏츠 학습 콘텐츠" | 부적합 - 완전 틀림, 학습 압박 |

**추천**: "빠른 한 편" (가장 부담 없는 표현)

### 5.3 카드 UI 규격

Shorts 카드는 Series 카드와 시각적으로 구분되어야 한다:

| 속성 | Series 카드 (현재) | Shorts 카드 (제안) |
|------|-------------------|-------------------|
| 방향 | 가로형 썸네일 (2:1 비율) | 세로형 썸네일 (9:16 또는 2:3 비율) |
| 너비 | 260px (가로 스크롤) | 160px (더 좁음, 세로 비율) |
| 정보 표시 | 시리즈명 + 진행률 | 제목 + 재생시간 배지 |
| 에피소드 표시 | 있음 | 없음 (standalone) |

**세로형 카드가 중요한 이유**: Shorts는 본질적으로 세로 포맷 콘텐츠다. 카드 형태가 세로형이면 "이건 다른 종류의 콘텐츠"라는 신호를 시각적으로 전달한다. 가로형 카드를 쓰면 Series와 구분이 없어진다.

### 5.4 Shorts에서 Series로의 전환 퍼널

Shorts 시청 종료 후 (영상 플레이어 내 또는 다음 스와이프 시):
```
Shorts 시청 완료
  |
  └── 하단 인라인 추천 (1줄)
      "비슷한 시리즈: Friends → 보기"
      (카테고리/태그 매칭으로 자동 연결)
```

이 기능은 FR-07로 Could 우선순위. Phase 1에서 없어도 되지만, Shorts → Series 전환률을 추적하면서 추가 여부 결정.

---

## 6. Success Criteria

### 6.1 Definition of Done

- [ ] Explore 홈에 Shorts 섹션이 정의된 위치에 표시됨
- [ ] Shorts 카드가 세로형 썸네일로 Series 카드와 시각적으로 구분됨
- [ ] 섹션 헤더와 카피가 톤 가이드(오그라들지 않음) 준수
- [ ] Shorts 영상 클릭 시 기존 ShortsFeed 플레이어로 정상 진입
- [ ] 카탈로그가 37개 이하로 줄어도 섹션이 비어 보이지 않음 (최소 3개 고정 큐레이션)

### 6.2 Quality Criteria

- [ ] 섹션 추가로 전체 Explore 페이지 로딩 속도 저하 없음 (현재 대비 100ms 이내)
- [ ] Shorts 섹션이 Series 섹션보다 하위에 위치 (Series = 핵심 상품)
- [ ] 섹션 헤더에 학습 관련 단어 없음 ("영어", "학습", "공부" 제외)
- [ ] 모바일 기준 3개 카드가 화면 너비의 80% 내에 표시되어 "더 있다" 힌트 제공

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 37개 카탈로그가 너무 적어 섹션이 반복적으로 보임 | Medium | High | 최대 4개만 노출, 알고리즘으로 매 세션 다른 조합 선택 |
| Shorts와 Series의 품질 격차가 사용자 혼란 야기 | Medium | Medium | Shorts 섹션 레이블을 명확히 해 기대치 설정 |
| Shorts 섹션이 Series 섹션 클릭률을 잠식 | High | Low | A/B 테스트로 섹션 유무 비교 후 배치 확정 |
| `VideoData.format` 필드 미구현으로 Shorts 식별 불가 | High | Low | 현재 `seriesId` 없는 영상을 Shorts로 간주하는 임시 로직으로 선행 가능 |
| YouTube Shorts URL 임베드 제약 (일반 영상 vs Shorts) | Medium | Medium | Shorts도 표준 YouTube Player로 임베드, 별도 처리 불필요 |

---

## 8. Architecture Considerations

### 8.1 Project Level

Dynamic (기존 유지)

### 8.2 Key Implementation Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Shorts 식별 방법 | `format: 'shorts'` 필드 / `seriesId` 없음 판단 | `format: 'shorts'` 필드 추가 | 명시적이고 미래 확장 가능. 현재 `VideoData` 타입에 이미 `format?: 'shorts' | 'clip'` 존재 |
| 큐레이션 방식 | 완전 알고리즘 / 수동 고정 / 혼합 | 혼합 (상위 2개 고정 + 나머지 알고리즘) | 37개 카탈로그에서 알고리즘만으로는 노이즈 발생 위험 |
| 섹션 가시성 | 항상 표시 / 조건부 (Shorts 있을 때만) | 조건부 | Shorts 카탈로그가 0이 되는 경우 대비 |

### 8.3 Data Model 변경사항

`VideoData.format` 필드가 이미 타입 정의에 존재하지만 실제 데이터에 미사용 상태:

```typescript
// 현재 (seed-videos.ts 타입)
format?: 'shorts' | 'clip'

// 필요 액션: 37개 Shorts 영상에 format: 'shorts' 값 할당
// 이를 통해 catalog.ts에서 필터링 가능
```

```typescript
// catalog.ts에 추가 필요
export const catalogShorts = catalogVideos.filter(v => v.format === 'shorts')
```

---

## 9. MoSCoW Prioritization (Phase별)

### Phase 1 (Must - 즉시 구현)

1. **Shorts 데이터 마킹**: 37개 영상에 `format: 'shorts'` 값 설정
2. **catalog.ts에 `catalogShorts` 익스포트** 추가
3. **Explore 홈에 "빠른 한 편" 섹션 추가**: 세로형 카드 3-4개, 가로 스크롤
4. **섹션 위치**: 이어보기 아래, 추천 위

### Phase 2 (Should - 검증 후 추가)

5. **Shorts → Series 인라인 추천**: 시청 완료 후 관련 시리즈 CTA
6. **섹션 노출 최적화**: 신규 유저/복귀 유저 분기 처리

### Phase 3 (Could - 카탈로그 100개 이상 시)

7. **Shorts 전용 "더 보기" 피드**: 별도 페이지 또는 탭 내 서브뷰
8. **Shorts 카테고리 필터**: 현재 카테고리 시스템에 통합

### Won't (현재 범위 외)

- Shorts 전용 탭 추가
- Shorts 자체 게임 시스템
- Shorts 업로드/UGC 기능

---

## 10. Success Metrics (추적 지표)

| 지표 | 측정 방법 | 목표값 | 판단 기준 |
|------|-----------|--------|----------|
| Shorts 섹션 CTR | 섹션 클릭 / 섹션 노출 | 15%+ | 10% 이하면 위치 조정 검토 |
| Shorts → Series 전환률 | Shorts 시청 세션 내 Series 클릭 | 20%+ | 10% 이하면 전환 CTA 강화 |
| Series 섹션 CTR 변화 | Shorts 추가 전후 비교 | 유지 또는 상승 | 5% 이상 하락이면 위치 재검토 |
| Shorts 재방문 기여 | Shorts 첫 시청 유저의 D1 리텐션 | 50%+ | Series 첫 시청 유저 대비 비교 |
| 신규 유저 시청 첫 콘텐츠 타입 | 첫 클릭 콘텐츠 | Shorts 30%+ | Shorts가 입문 관문 역할 확인 |

---

## 11. Open Questions (CTO 검토 요청)

1. **현재 37개 Shorts 영상이 `format: 'shorts'`로 마킹되어 있는가?** 코드 상 타입은 존재하지만 실제 데이터 할당 여부 확인 필요.

2. **Shorts 영상이 현재 Explore 홈 추천 섹션에 혼합 노출되고 있는가?** `catalogVideos`에 포함되어 있으면 현재도 추천/시리즈 섹션에 섞여 표시될 수 있음.

3. **세로형 썸네일 카드 구현 비용**: 기존 `VideoCard` 컴포넌트를 재사용할 수 있는가, 별도 `ShortsCard` 컴포넌트가 필요한가?

4. **Shorts 카탈로그 증가 계획**: 단기 3개월 내 37개 → 몇 개까지 확장 예정인가? 이에 따라 "더 보기" 섹션 구현 우선순위가 달라진다.

---

## 12. Next Steps

1. [ ] CTO(팀 리드)에게 이 플랜 리뷰 요청
2. [ ] Open Questions 확인 후 플랜 업데이트
3. [ ] 승인 시 Design 문서 작성 (`shorts-integration-explore-home.design.md`)
4. [ ] Phase 1 구현 에이전트 디스패치

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-10 | Initial draft | PM Agent |
