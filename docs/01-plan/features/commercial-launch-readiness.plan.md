# Commercial Launch Readiness Planning Document

> **Summary**: 상용 배포 전 전수 조사 — 코드베이스를 직접 읽고 도출한 MUST/SHOULD/NICE TO HAVE 항목 목록
>
> **Project**: Shortee
> **Version**: MVP
> **Author**: PM Agent
> **Date**: 2026-03-13
> **Status**: Draft (CTO 승인 대기)

---

## 1. 개요

### 1.1 조사 방법

추측 없이 다음 파일들을 직접 읽어서 작성함:
- `src/components/` — UI 완성도
- `src/components/games/` — 게임 시스템
- `src/stores/` — 상태 관리 (Premium, Level, Familiarity 등)
- `src/app/api/billing/` — 결제 시스템
- `src/app/privacy/`, `src/app/terms/` — 법적 문서
- `src/app/layout.tsx` — SEO/메타데이터
- `public/manifest.json` — PWA 설정
- `src/lib/billing.ts`, `src/lib/billingServer.ts` — 결제 로직
- `src/data/seed-videos.ts` — 콘텐츠 카테고리

### 1.2 배경

Shortee는 Next.js 15 기반 영어 학습 앱으로 Vercel에 배포됨. 1,804개 YouTube Shorts 클립, Whisper 자막, 표현 매칭(7,431 매치) 등 핵심 콘텐츠 파이프라인은 완성. 결제 시스템(Stripe)은 코드가 있으나 `NEXT_PUBLIC_BILLING_ENABLED=false` 상태로 비활성화.

---

## 2. 전수 조사 결과

### 2.1 MUST — 이것 없으면 배포 못 함

#### [MUST-01] 결제 시스템 미활성화
**현황:** `NEXT_PUBLIC_BILLING_ENABLED=false` (기본값). Stripe webhook 코드는 완성되어 있음.
`PremiumModal`은 "출시 준비 중" 버튼을 보여줌.
**문제:** Freemium 모델인데 수익화 없이 배포하면 사업 불가.
**해야 할 것:**
- Stripe 프로덕션 키 설정 및 환경변수 활성화
- Webhook 엔드포인트 등록 및 테스트
- 실결제 → 구독 상태 동기화 end-to-end 검증
- 무료 한도 (일 5회 시청, 저장 표현 20개) 실제 작동 확인

#### [MUST-02] 법적 문서 이메일 주소가 임시값
**현황:** `privacy@studyeng.app`, `support@studyeng.app` 하드코딩.
**문제:** Shortee로 브랜드 리네임 완료됐는데 이메일 도메인이 studyeng.app.
**해야 할 것:** 실제 수신 가능한 이메일로 교체. 개인정보처리방침 연락처 포함.

#### [MUST-03] YouTube API ToS 준수 확인 미비
**현황:** YouTube IFrame API embed 사용 중. Shorts URL을 직접 embed하는 방식.
**문제:** YouTube ToS에서 Shorts embed 방식, 상업적 이용, 광고 삽입 등 제한 가능.
**해야 할 것:**
- YouTube API ToS 상업적 이용 조항 법률 검토
- 저작권 있는 드라마/영화 Shorts 클립 사용 정당성 확인 (DMCA 리스크)
- 특히 Friends, Harry Potter, The Office 등 주요 IP 클립 리스크 평가

#### [MUST-04] 에러 모니터링 완전 부재
**현황:** `src/app/error.tsx`는 UI만 있음. Sentry, Datadog, 그 어떤 에러 트래킹도 코드베이스에 없음.
**문제:** 배포 후 사용자 오류를 인지할 방법이 없음.
**해야 할 것:** Sentry 최소 설정 (Next.js 공식 통합)

#### [MUST-05] 유저 행동 분석 도구 없음
**현황:** analytics/gtag/posthog/mixpanel 관련 코드가 전체 소스에서 단 하나도 없음.
**문제:** 어떤 영상이 인기있는지, 이탈 지점, 전환율 — 아무것도 모름.
**해야 할 것:** 최소한 Google Analytics 4 또는 PostHog 무료 티어 설정. 핵심 이벤트: 영상 시청 완료, 표현 저장, 게임 플레이, 프리미엄 전환.

#### [MUST-06] OG 이미지 없음
**현황:** `layout.tsx`에 `openGraph` 메타데이터가 있지만 `images` 필드가 없음. 카카오/트위터 공유 시 이미지가 없음.
**해야 할 것:** `/public/og-image.png` (1200×630) 제작 및 메타데이터에 추가.

---

### 2.2 SHOULD — 없어도 배포 가능하지만 곧 필요

#### [SHOULD-01] 게임 시스템이 2종뿐 — 차별화 미흡
**현황:** `GameLauncher.tsx`에 `scene-quiz`(빈칸 퀴즈)와 `listening`(다음 대사 맞추기) 2종뿐.
**문제:** Duolingo는 12종 이상, Cake도 4-5종. "게임처럼" 느껴지기 어려움.
**해야 할 것:** 배포 후 1-2개월 내 2-3종 추가 필요.
- 발음 듣고 한국어 고르기 (선택지형)
- 단어 순서 맞추기 (word scramble)
- 표현 빠른 재인식 (flash card 터치형)

#### [SHOULD-02] 푸시 알림 / 복귀 유도 없음
**현황:** `manifest.json`에 PWA 설정 있으나 Service Worker, push 관련 코드 없음. streak 시스템이 있지만 다음날 알림 없음.
**문제:** streak이 끊겨도 유저가 모름. 리텐션 핵심.
**해야 할 것:**
- Web Push API 또는 이메일 리마인더 (1일 미접속 시)
- 적어도 onboarding 완료 시 "내일 알림 받기" UX

#### [SHOULD-03] 콘텐츠 1,804개 — 분포 불균형 가능
**현황:** 카테고리: `drama, movie, daily, entertainment, music, animation` 6종. 시리즈 중 drama 비중이 높음 (Big Bang Theory 9화, Friends 11화, Office 11화, Modern Family 13화 등).
**문제:** 레벨별 / 카테고리별 균형이 확인 안 됨. Beginner용 콘텐츠가 부족할 수 있음.
**해야 할 것:**
- 레벨별 클립 분포 리포트 출력 (difficulty 1-2 vs 3-5 vs 6+ 비율)
- daily/education 카테고리 확충 (현재 Friends, TBBT에 치우침)

#### [SHOULD-04] 소셜 공유 기능 기초만 있음
**현황:** `ShareButton.tsx`는 있고 Web Share API + clipboard fallback 구현됨. 그러나 공유 시 OG 이미지 없고, 공유 후 신규 유저 랜딩 경험 없음.
**해야 할 것:**
- 공유 URL 랜딩 시 해당 영상 자동 재생 + 앱 소개 배너 (이미 ShortsFeedPage가 v= 파라미터 처리함)
- OG 이미지 적용 시 공유 효과 극대화 (MUST-06과 연계)

#### [SHOULD-05] 계정 삭제 기능 없음
**현황:** Profile 페이지에 로그아웃만 있고, 계정 탈퇴 UI가 없음. 이용약관 제4조에 "탈퇴 요청 가능"이라 명시.
**법적 문제:** GDPR/개인정보보호법상 삭제권 보장 필요.
**해야 할 것:** "계정 삭제" 버튼 → 이메일 확인 → Supabase 계정 삭제 API 연동.

#### [SHOULD-06] 자막 없는 영상 처리 미흡
**현황:** `useTranscript.ts`에서 transcript 파일 fetch 실패 시 빈 배열 반환. 자막 없이 재생되는 것으로 보임.
**문제:** 1,804개 중 transcript JSON이 없는 영상이 얼마인지 불명. 자막 없으면 앱의 핵심 기능 모두 없어짐.
**해야 할 것:**
- public/transcripts/ 파일 수 vs seed-videos 클립 수 대조
- 자막 없는 영상에 "자막 준비 중" 표시 또는 임시 숨김 처리

#### [SHOULD-07] 온보딩이 로그인 필수 — 마찰 높음
**현황:** `onboarding/page.tsx`에서 `user`가 없으면 `/login`으로 redirect. 비로그인 상태에서 앱 탐색 불가.
**문제:** "Play first, learn naturally" 철학과 배치. 첫 방문자가 로그인 강제당하면 이탈.
**해야 할 것:**
- 비로그인 Guest 모드 지원 (로컬 스토리지 기반)
- "저장/구독" 시점에만 로그인 유도
- 현재 `LoginGateModal.tsx`가 있지만 온보딩 flow에서 활용되지 않음

#### [SHOULD-08] 무료 한도가 너무 낮을 수 있음 (5회/일)
**현황:** `usePremiumStore.ts`에 `FREE_DAILY_VIEW_LIMIT = 5`.
**문제:** Cake 앱 대비 너무 빠른 paywall. 앱 습관이 형성되기 전에 막히면 이탈.
**검토 필요:** 15-20회/일 또는 "첫 7일 무제한" 체험 기간 도입 여부 의사결정 필요.

---

### 2.3 NICE TO HAVE — 있으면 좋지만 급하지 않음

#### [NICE-01] 다크모드 외 Light 테마 대비 개선
**현황:** 라이트 테마 존재하나, 이전 메모리에 "대비/가독성" 문제 언급됨.
**해야 할 것:** 라이트 테마에서 자막 패널, 게임 카드, 프리미엄 모달 contrast ratio 점검 (WCAG AA).

#### [NICE-02] 랜딩 페이지 없음
**현황:** `/` 경로가 곧바로 `/explore`로 redirect. 앱 소개 없음.
**해야 할 것:** 비로그인 첫 방문자용 랜딩 페이지 (브랜드 소개, 주요 화면, CTA).

#### [NICE-03] A/B 테스트 인프라 없음
**현황:** Feature flag, A/B 테스트 관련 코드 없음.
**해야 할 것:** 최소한 환경변수 기반 feature flag부터 (이미 `NEXT_PUBLIC_BILLING_ENABLED` 패턴 있음).

#### [NICE-04] 폰트 크기 설정 없음
**현황:** 자막 폰트 크기 고정. 시력이 약한 사용자 또는 고령 학습자 접근성 낮음.
**해야 할 것:** Settings에 자막 폰트 크기 옵션 Small/Medium/Large.

#### [NICE-05] 오프라인 대응 없음
**현황:** Service Worker 없음. 오프라인 시 그냥 빈 화면.
**참고:** YouTube embed 특성상 완전한 오프라인은 불가능하나, 기본 캐시 전략은 가능.

#### [NICE-06] 표현 사전 직접 탐색 없음
**현황:** 표현이 영상 재생 중 PrimingCard로만 노출됨. 3,383개 표현을 직접 검색/탐색하는 UI 없음.
**해야 할 것:** My 탭에 "저장 표현 전체보기" + 검색 기능 (기반 데이터는 이미 있음).

#### [NICE-07] 구독 해지 후 처리 UX 없음
**현황:** Stripe webhook에서 `subscription.deleted` 처리는 있으나, 앱 내 "구독이 해지됩니다" 사전 안내 없음.

#### [NICE-08] 국제화 (i18n) 없음
**현황:** 한국어 전용 UI. 영어 UI 지원 없음.
**참고:** 초기 타겟이 한국인이므로 급하지 않음. 글로벌 확장 시 필요.

---

## 3. 우선순위 요약

### MUST (배포 차단) — 6개

| ID | 항목 | 예상 작업량 |
|----|------|-------------|
| MUST-01 | 결제 시스템 활성화 및 검증 | 2-3일 |
| MUST-02 | 법적 문서 이메일 교체 | 0.5일 |
| MUST-03 | YouTube ToS / IP 법률 검토 | 외부 법무 |
| MUST-04 | 에러 모니터링 (Sentry) | 1일 |
| MUST-05 | 유저 분석 도구 (GA4 또는 PostHog) | 1일 |
| MUST-06 | OG 이미지 제작 및 메타데이터 | 0.5일 |

### SHOULD (배포 후 1달 내) — 8개

| ID | 항목 | 예상 작업량 |
|----|------|-------------|
| SHOULD-01 | 게임 2-3종 추가 | 1-2주 |
| SHOULD-02 | 푸시 알림 또는 이메일 리마인더 | 3-5일 |
| SHOULD-03 | 콘텐츠 분포 점검 및 확충 | 콘텐츠 작업 |
| SHOULD-04 | 공유 랜딩 경험 개선 | 1-2일 |
| SHOULD-05 | 계정 삭제 기능 | 1일 |
| SHOULD-06 | 자막 없는 영상 처리 | 0.5일 |
| SHOULD-07 | Guest 모드 (비로그인 탐색) | 2-3일 |
| SHOULD-08 | 무료 한도 정책 재검토 | 의사결정 |

### NICE TO HAVE (이후) — 8개

NICE-01 ~ NICE-08 (위 목록 참조)

---

## 4. 가장 긴급한 의사결정 사항

CTO가 배포 전 결정해야 할 것:

1. **YouTube ToS / IP 리스크**: Friends, Harry Potter 등 저작권 콘텐츠를 상업적 앱에서 쓸 수 있는지 법률 검토 없이는 배포 불가. 가장 큰 리스크.

2. **무료 한도 정책**: 5회/일로 배포할지, 더 관대하게 가져갈지. 첫 인상이 전환율 결정.

3. **결제 활성화 시점**: 배포 시점에 결제 켤지, 아니면 "무료 베타"로 먼저 트래픽 쌓을지.

---

## 5. 경쟁 앱 대비 현황

| 영역 | Shortee 현재 | Cake | Duolingo |
|------|-------------|------|----------|
| 게임 종류 | 2종 | 4-5종 | 12종 이상 |
| 오프라인 | 없음 | 부분 지원 | 지원 |
| 푸시 알림 | 없음 | 있음 | 있음 |
| 콘텐츠 | 1,804 클립 | 자체 제작 | 자체 제작 |
| 게임 퀄리티 | 기본 | 중간 | 높음 |
| 차별점 | YouTube Shorts + AI 표현 매칭 | - | - |

**핵심 차별점 (이미 구현됨):**
- YouTube Shorts 기반 실제 원어민 콘텐츠
- Whisper 자막 + AI 의미 검증 표현 매칭
- 3,383개 CEFR 기반 표현 사전
- 스마트 프라이밍 (레벨별 표현 노출)

게임 퀄리티와 리텐션 루프를 제외하면 콘텐츠 차별화는 이미 확보됨.

---

## 6. 성공 기준

배포 후 30일:
- DAU 1,000 이상
- 무료 → 유료 전환율 2% 이상
- 7일 리텐션 25% 이상 (업계 평균 영어 앱 기준)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-13 | 초안 — 코드베이스 직접 분석 기반 | PM Agent |
