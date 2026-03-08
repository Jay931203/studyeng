# Shortee Brand UI Handoff

**Date:** 2026-03-08  
**Owner:** Brand Lead  
**Audience:** UI/UX, frontend, growth creatives

---

## 1. Purpose

이 문서는 화면 시안 문서가 아니다.  
Shortee를 구현할 때 **절대 흔들리면 안 되는 브랜드 기준**을 넘기는 문서다.

UI/UX 팀은 이 문서를 보고 레이아웃과 인터랙션을 자유롭게 설계할 수 있다.  
다만 아래의 브랜드 문장, 단어, 색 축은 바꾸지 않는 것을 기본으로 한다.

---

## 2. Ownership Split

### Brand owns

- 외부 브랜드명
- 핵심 메시지
- 용어 체계
- 톤앤매너
- 기본 색 축
- 광고/공유 문구 방향

### UI/UX owns

- 화면 구조
- 카드 조합 방식
- 버튼 배치
- 인터랙션 방식
- 모션과 전환
- 세부 정보 밀도

원칙은 간단하다.

**브랜드는 말과 인상을 고정하고, UI/UX는 그 인상을 화면으로 번역한다.**

---

## 3. Brand Non-Negotiables

### Brand name

- 외부 노출명은 항상 `Shortee`

### Core line

- 메인 문장: `영어는 장면으로 남는다`

### Product definition

- `영어 공부 앱`보다 `영어 장면 앱`
- `숏폼 학습 앱`보다 `영어가 남는 장면 앱`

### Tone

- 짧다
- 성숙하다
- 선생님처럼 말하지 않는다
- 공부 압박을 주지 않는다

### Visual direction

- dark-first
- default accent는 `deep teal / jade`
- blue는 대체 색상으로만 사용
- generic purple startup look으로 돌아가지 않는다

---

## 4. Preferred Vocabulary

### Use

- 오늘
- 장면
- 이어보기
- 저장 표현
- 복습
- 루틴
- 지금 볼 것

### Reduce

- 학습 대시보드
- 커리큘럼
- 미션
- 스트릭
- 쇼츠 학습
- 워크플로우
- Sign in
- Welcome

---

## 5. Screen Intent

### Login

- 역할: 서비스 첫 인상
- 전달해야 할 것: "공부 앱"보다 "장면 앱"
- 좋은 문장:
  - `영어는 장면으로 남는다`
  - `오늘 장면, 저장 표현, 이어보기 흐름`

### Explore / Home

- 역할: 오늘 들어왔을 때 바로 볼 이유 제공
- 전달해야 할 것: 오늘 추천과 장면 루프
- 좋은 문장:
  - `오늘 추천`
  - `오늘 이어볼 장면`

### Shorts

- 역할: 가장 강한 브랜드 경험
- 전달해야 할 것: 짧고 몰입되는 장면 소비
- 좋은 문장:
  - `장면`
  - `지금 바로 보기`

### Learning / Review

- 역할: 남긴 것이 쌓이는 감각
- 전달해야 할 것: 기록보다 복습 감각
- 좋은 문장:
  - `복습`
  - `다시 볼 표현`
  - `오늘 상태`

### Profile / Settings

- 역할: 계정과 테마, 루틴 상태 확인
- 전달해야 할 것: 설정도 브랜드 톤 안에 있다는 감각
- 좋은 문장:
  - `Shortee`
  - `설정`
  - `제이드`

---

## 6. Implementation Anchors

브랜드 기준이 실제 코드에서 닿는 핵심 지점:

- metadata / manifest
  - `src/app/layout.tsx`
  - `public/manifest.json`
- brand theme token
  - `src/stores/useThemeStore.ts`
  - `src/app/globals.css`
- navigation nouns
  - `src/components/BottomNav.tsx`
- entry copy
  - `src/app/login/page.tsx`
  - `src/app/onboarding/page.tsx`
- home / review copy
  - `src/app/(tabs)/explore/page.tsx`
  - `src/app/(tabs)/learning/page.tsx`
- settings theme naming
  - `src/app/(tabs)/profile/page.tsx`
- share text
  - `src/components/ShareButton.tsx`
  - `src/components/UnifiedControls.tsx`

UI/UX 담당자는 구조를 바꿔도 되지만, 위 파일에 들어간 브랜드 명칭과 용어 축은 기준점으로 보고 움직이면 된다.

---

## 7. Review Checklist

화면이나 카피를 바꾸기 전 아래만 확인하면 된다.

1. 이 화면이 `영어 공부 앱`처럼 느껴지지 않는가
2. `장면`이라는 단어가 적절한 위치에 살아 있는가
3. `학습`, `미션`, `스트릭`, `워크플로우` 같은 용어가 다시 들어오지 않았는가
4. 다크 + 제이드 축이 기본 인상으로 유지되는가
5. 광고 문장으로 잘라도 Shortee처럼 들리는가

3개 이하만 만족하면 다시 잡는다.
