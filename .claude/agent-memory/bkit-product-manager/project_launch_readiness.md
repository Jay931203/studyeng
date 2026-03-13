---
name: commercial-launch-readiness
description: Shortee 상용 배포 전 전수 조사 결과 — MUST/SHOULD/NICE 항목 및 핵심 리스크
type: project
---

2026-03-13 기준 코드베이스 직접 분석 결과.

**MUST (배포 차단):**
- 결제 미활성화 (NEXT_PUBLIC_BILLING_ENABLED=false, Stripe 코드는 완성)
- 법적 문서 이메일이 studyeng.app 도메인 (privacy@studyeng.app)
- YouTube ToS / IP 리스크 (Friends, Harry Potter 등 저작권 Shorts 상업적 사용)
- 에러 모니터링 없음 (Sentry 0개)
- 유저 분석 도구 없음 (analytics 코드 전혀 없음)
- OG 이미지 없음 (layout.tsx에 images 필드 누락)

**SHOULD (배포 후 1달):**
- 게임 2종뿐 (SceneQuiz + ListeningGame)
- 푸시 알림/이메일 리마인더 없음 (streak 끊겨도 유저 모름)
- 계정 삭제 기능 없음 (법적 삭제권 필요)
- 온보딩이 로그인 강제 (Guest 모드 없음, "Play first" 철학과 배치)
- 무료 한도 5회/일 — 재검토 필요

**핵심 리스크:** YouTube ToS 및 저작권 리스크가 가장 크고 외부 법무 필요.

**Plan 파일:** `docs/01-plan/features/commercial-launch-readiness.plan.md`

**Why:** 상용 배포 준비 전수 조사 요청으로 작성.
**How to apply:** 이후 에이전트 작업 우선순위 결정 시 이 목록 참조.
