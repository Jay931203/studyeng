# Shorts 1,000개 확보 플랜

> **Summary**: YouTube Shorts 콘텐츠를 36개 → 1,000개로 확장하기 위한 소싱 전략, 채널 리스트, 단계별 실행 계획
>
> **Project**: Shortee
> **Author**: CTO
> **Date**: 2026-03-15
> **Status**: Draft

---

## 1. 현황 분석

### 1.1 현재 콘텐츠 구조

| 타입 | 수량 | 비율 |
|------|------|------|
| Series 클립 (seriesId 있음) | 2,287 | 98.5% |
| Shorts (format: 'shorts') | 36 | 1.5% |
| **합계** | **2,322** | 100% |

### 1.2 현재 Shorts 분포

**난이도별:**
| Difficulty | 수량 | 비율 |
|-----------|------|------|
| 1 (A1) | 1 | 2.8% |
| 2 (A2) | 14 | 38.9% |
| 3 (B1) | 13 | 36.1% |
| 4 (B2) | 5 | 13.9% |
| 5 (C1) | 3 | 8.3% |
| 6 (C2) | 0 | 0% |

**카테고리별:**
| Category | 수량 |
|----------|------|
| entertainment | 23 |
| daily | 13 |
| drama | 0 |
| movie | 0 |
| music | 0 |
| animation | 0 |

### 1.3 문제점
- entertainment/daily에만 편중, 4개 카테고리 공백
- A1/C2 거의 없음
- 36개로는 Shorts 피드 경험 불가능 (최소 200개 필요)

---

## 2. 목표 분포

### 2.1 레벨별 목표 (1,000개)

| Difficulty | CEFR | 목표 | 특성 |
|-----------|------|------|------|
| 1 | A1 | 200 | 단순 어휘, 인사, 일상, 느린 속도 |
| 2 | A2 | 200 | 일상 대화, 간단한 이야기, 명확한 발음 |
| 3 | B1 | 200 | 중급 대화, 의견 표현, 설명 |
| 4 | B2 | 150 | 복합 주제, TED 클립, 드라마 장면 |
| 5 | C1 | 150 | 학술, 토론, 빠른 발화 |
| 6 | C2 | 100 | 원어민 속도 유머, 속어, 말장난 |

### 2.2 카테고리별 목표 (전 레벨 합산)

| Category | 비율 | 수량 | 근거 |
|----------|------|------|------|
| daily | 25% | 250 | 영어 레슨, 일상 회화, 브이로그 — 학습 직접성 높음 |
| entertainment | 20% | 200 | 토크쇼, 코미디, 인터뷰 — 흥미 유발 |
| drama | 15% | 150 | 드라마/시트콤 명장면 — 맥락 있는 대화 |
| movie | 15% | 150 | 영화 명대사, 감정 표현 — 몰입 학습 |
| animation | 15% | 150 | 명확한 발음, 전연령대 접근 — 초급 친화적 |
| music | 10% | 100 | 가사, 뮤직비디오 클립 — 리듬 학습 |

### 2.3 레벨 x 카테고리 매트릭스

| | daily | entertain | drama | movie | animation | music | 합계 |
|---|---|---|---|---|---|---|---|
| A1 | 60 | 30 | 20 | 20 | 50 | 20 | 200 |
| A2 | 50 | 40 | 30 | 30 | 30 | 20 | 200 |
| B1 | 50 | 40 | 35 | 35 | 25 | 15 | 200 |
| B2 | 35 | 35 | 30 | 30 | 10 | 10 | 150 |
| C1 | 30 | 35 | 25 | 25 | 15 | 20 | 150 |
| C2 | 25 | 20 | 10 | 10 | 20 | 15 | 100 |
| **합계** | **250** | **200** | **150** | **150** | **150** | **100** | **1,000** |

---

## 3. 채널 소싱 전략

### 3.1 A1 (Difficulty 1) — 200개

초보자용. 느린 속도, 간단한 어휘, 시각적 보조.

| 채널/소스 | 카테고리 | 예상 수확량 | 난이도 적합성 |
|-----------|----------|------------|-------------|
| **BBC Learning English** | daily | 30-40 | 학습용 제작, 명확한 발음 |
| **English with Lucy** | daily | 20-30 | 초급 중심 문법/어휘 |
| **Rachel's English** | daily | 15-20 | 발음 중심 |
| **English Addict with Mr Duncan** | daily | 10-15 | 일상 영어 |
| **Simple English Videos** | daily | 10-15 | 느린 속도 설명 |
| **Peppa Pig Official** | animation | 20-30 | 아동용, 매우 명확한 영어 |
| **Disney Junior** | animation | 15-20 | 간단한 대화 |
| **Cocomelon / Super Simple Songs** | music | 15-20 | 반복 가사, 기초 어휘 |
| **Sesame Street** | animation | 15-20 | 교육용 애니, 느린 속도 |
| **Movie Clips Shorts** (간단 장면) | movie | 15-20 | 1-2문장 명대사 |
| **Friends (간단 장면)** | drama | 10-15 | 슬로우 모먼트 |
| **Ellen Show Shorts** | entertainment | 15-20 | 게스트 반응, 간단 상황 |

**소싱 키워드**: "English for beginners shorts", "easy English shorts", "basic English conversation shorts"

### 3.2 A2 (Difficulty 2) — 200개

일상 대화 수준. 자연스러운 속도지만 표준 어휘.

| 채널/소스 | 카테고리 | 예상 수확량 | 난이도 적합성 |
|-----------|----------|------------|-------------|
| **English with Lucy** | daily | 20-25 | 일상 표현, 문법 팁 |
| **Speak English With Vanessa** | daily | 15-20 | 실생활 회화 |
| **mmmEnglish** | daily | 15-20 | 호주 영어, 실용 표현 |
| **Bob the Canadian** | daily | 10-15 | 캐나다 일상 브이로그 |
| **Pixar / DreamWorks Shorts** | animation | 20-25 | 중간 속도, 감정 표현 |
| **Disney Shorts** | animation | 10-15 | 명확한 대화 |
| **The Tonight Show Shorts** | entertainment | 20-25 | 간단한 게임/인터뷰 |
| **Jimmy Kimmel Shorts** | entertainment | 15-20 | 관객 인터뷰 |
| **Movie Recap Shorts** | movie | 20-25 | 영화 장면 + 설명 |
| **Friends / Modern Family** | drama | 15-20 | 일상 시트콤 대화 |
| **Pop Song Lyrics Shorts** | music | 15-20 | 간단한 가사 해석 |

**소싱 키워드**: "English conversation shorts", "everyday English YouTube shorts", "sitcom best moments shorts"

### 3.3 B1 (Difficulty 3) — 200개

중급. 의견 표현, 설명, 다양한 주제.

| 채널/소스 | 카테고리 | 예상 수확량 | 난이도 적합성 |
|-----------|----------|------------|-------------|
| **TED Shorts / TED-Ed Shorts** | daily | 25-30 | 다양한 주제, 명확한 전달 |
| **Vox Shorts** | daily | 15-20 | 사회/과학 설명 |
| **Kurzgesagt Shorts** | daily | 10-15 | 과학 설명 |
| **Graham Norton Show Shorts** | entertainment | 20-25 | 인터뷰, 재미있는 에피소드 |
| **Conan O'Brien Shorts** | entertainment | 15-20 | 코미디 인터뷰 |
| **SNL Shorts** | entertainment | 10-15 | 스케치 하이라이트 |
| **The Office / Parks and Rec** | drama | 20-25 | 시트콤 명장면 |
| **Brooklyn Nine-Nine Shorts** | drama | 10-15 | 코미디 경찰 드라마 |
| **Marvel / DC Shorts** | movie | 15-20 | 액션 장면, 대화 |
| **Harry Potter Shorts** | movie | 15-20 | 판타지 대화 |
| **Shrek / Toy Story Shorts** | animation | 15-20 | 유머 + 대화 |
| **Pop/Rock Lyric Breakdown** | music | 10-15 | 가사 분석 |

**소싱 키워드**: "TED shorts", "movie clips shorts English", "comedy shorts English"

### 3.4 B2 (Difficulty 4) — 150개

고급 중급. 복잡한 주제, 빠른 속도, 추상적 어휘.

| 채널/소스 | 카테고리 | 예상 수확량 | 난이도 적합성 |
|-----------|----------|------------|-------------|
| **TED Talks Shorts** | daily | 20-25 | 전문적 주제, 논증 |
| **Crash Course Shorts** | daily | 10-15 | 학술적 설명 |
| **Hot Ones Shorts** | entertainment | 15-20 | 복잡한 인터뷰 |
| **Stand-up Comedy Shorts** | entertainment | 15-20 | 속도/유머 이해 필요 |
| **Breaking Bad / Sherlock** | drama | 15-20 | 전문 어휘, 긴장 대화 |
| **The Crown / Succession** | drama | 10-15 | 격식 영어, 정치 |
| **Inception / Interstellar** | movie | 15-20 | 과학/철학 대화 |
| **Christopher Nolan Clips** | movie | 10-15 | 복잡한 서사 |
| **Simpsons / Family Guy** | animation | 10-15 | 문화 레퍼런스 |
| **Rock/Alternative Lyrics** | music | 10-15 | 복잡한 가사 |

**소싱 키워드**: "TED talk highlights shorts", "movie monologue shorts", "stand-up comedy shorts English"

### 3.5 C1 (Difficulty 5) — 150개

고급. 학술 토론, 빠른 발화, 전문 어휘.

| 채널/소스 | 카테고리 | 예상 수확량 | 난이도 적합성 |
|-----------|----------|------------|-------------|
| **John Oliver Shorts** | entertainment | 20-25 | 정치 풍자, 빠른 전달 |
| **Trevor Noah Shorts** | entertainment | 15-20 | 사회 논평 |
| **Stephen Colbert Shorts** | entertainment | 10-15 | 정치 코미디 |
| **Debate / Panel Shorts** | daily | 15-20 | 학술 토론 |
| **Vox / Vice Shorts** | daily | 15-20 | 심층 사회 이슈 |
| **Game of Thrones / Fleabag** | drama | 15-20 | 빠른 영국 영어 |
| **Aaron Sorkin Films** | movie | 10-15 | 빠른 대화, 법률/정치 |
| **Tarantino Films** | movie | 10-15 | 속어, 복잡한 대화 |
| **Rick and Morty / Archer** | animation | 10-15 | 과학 유머, 빠른 속도 |
| **Rap / Hip-Hop Lyric Analysis** | music | 15-20 | 속어, 워드플레이 |

**소싱 키워드**: "political comedy shorts", "debate shorts English", "British comedy shorts"

### 3.6 C2 (Difficulty 6) — 100개

최고급. 원어민 유머, 속어, 문화적 뉘앙스.

| 채널/소스 | 카테고리 | 예상 수확량 | 난이도 적합성 |
|-----------|----------|------------|-------------|
| **British Panel Show Shorts** (Would I Lie to You, 8 Out of 10 Cats, QI) | entertainment | 15-20 | 영국 유머, 빠른 위트 |
| **Jimmy Carr / Ricky Gervais** | entertainment | 10-15 | 극단적 유머, 문화 레퍼런스 |
| **Monty Python Shorts** | entertainment | 5-10 | 고전 영국 코미디 |
| **Philosophy / Academic Shorts** | daily | 15-20 | 추상 개념, 학술 영어 |
| **Slavoj Zizek / Jordan Peterson Clips** | daily | 10-15 | 복잡한 논증 |
| **Shakespeare Adaptations** | drama | 5-10 | 고전 영어 현대화 |
| **Wes Anderson / Coen Brothers** | movie | 10-15 | 독특한 어휘, 문체 |
| **BoJack Horseman / South Park** | animation | 10-15 | 사회 풍자, 속어 |
| **Eminem / Kendrick Lamar Analysis** | music | 10-15 | 복잡한 워드플레이 |

**소싱 키워드**: "British panel show shorts", "philosophy shorts", "wordplay comedy shorts"

---

## 4. Shorts 데이터 구조

### 4.1 seed-videos.ts 엔트리 형식

```typescript
{
  id: 'shorts-{youtubeId}',
  youtubeId: '{11자리 YouTube ID}',
  title: '{영상 제목}',
  category: '{drama|movie|daily|entertainment|music|animation}',
  difficulty: {1-6},
  clipStart: 0,
  clipEnd: 0,
  format: 'shorts',
  subtitles: [],
}
```

### 4.2 Series 클립과의 차이점

| 속성 | Series 클립 | Shorts |
|------|-----------|--------|
| id | `{seriesId}-ep{N}` | `shorts-{youtubeId}` |
| clipStart/clipEnd | 실제 시작/종료 시간 | `0, 0` |
| seriesId | 있음 | 없음 |
| episodeNumber | 있음 | 없음 |
| format | 없음 | `'shorts'` |

---

## 5. 품질 기준 (Quality Criteria)

### 5.1 필수 조건

1. **YouTube Shorts 형식**: 세로 영상, 60초 이하
2. **영어 음성**: 영어가 주 언어 (자막 아닌 실제 발화)
3. **음질**: 배경 소음으로 대사 안 들리는 것 제외
4. **자막 가능성**: Whisper로 전사 가능한 명확한 발화
5. **저작권**: YouTube embed 허용 영상 (unlisted/private 제외)
6. **콘텐츠 적절성**: 성인용 극단 콘텐츠 제외 (욕설은 자연스러운 수준까지 허용)

### 5.2 우선순위 기준

1. **학습 가치**: 유용한 표현/어휘가 포함되어 있는가
2. **재미**: 다시 보고 싶은 콘텐츠인가
3. **독립성**: 맥락 없이 단독으로 이해 가능한가
4. **다양성**: 억양, 상황, 화자가 다양한가

### 5.3 난이도 판정 기준

| Difficulty | 발화 속도 | 어휘 수준 | 문장 구조 | 문화 배경지식 |
|-----------|----------|----------|----------|-------------|
| 1 (A1) | 매우 느림 | 500단어 이내 | 단순문 | 불필요 |
| 2 (A2) | 느림~보통 | 1,000단어 | 단순 복문 | 최소 |
| 3 (B1) | 보통 | 2,000단어 | 복문 | 약간 |
| 4 (B2) | 보통~빠름 | 4,000단어 | 복잡한 복문 | 필요 |
| 5 (C1) | 빠름 | 8,000단어+ | 고급 구문 | 상당히 필요 |
| 6 (C2) | 매우 빠름 | 제한 없음 | 관용/속어 | 깊은 문화 이해 |

---

## 6. 단계별 실행 계획

### Phase 1: Batch 1 — 200개 (1주차)

**목표**: 핵심 채널에서 고확률 Shorts 확보, Shorts 피드 최소 실행 가능 단위 달성

| Difficulty | 수량 | 주요 소스 |
|-----------|------|----------|
| 1 (A1) | 50 | BBC Learning English, Peppa Pig, Disney Junior |
| 2 (A2) | 50 | English with Lucy, Tonight Show, Pixar |
| 3 (B1) | 40 | TED Shorts, The Office, Graham Norton |
| 4 (B2) | 25 | Hot Ones, Stand-up, Sherlock |
| 5 (C1) | 20 | John Oliver, Trevor Noah, Fleabag |
| 6 (C2) | 15 | British Panel Shows, Philosophy |

**카테고리 배분**: daily 60, entertainment 50, drama 30, movie 25, animation 25, music 10

**작업 흐름**:
1. WebSearch로 채널별 Shorts 플레이리스트 URL 확보
2. YouTube Data API로 각 채널의 Shorts 목록 수집 (영상 ID, 제목, 길이)
3. 길이 60초 이하 필터링
4. 제목/썸네일로 1차 난이도 분류
5. seed-videos.ts에 엔트리 추가
6. 콘텐츠 파이프라인 실행 (Whisper 전사 → Claude 번역)

### Phase 2: Batch 2 — 300개 (2-3주차)

**목표**: 카테고리 다양성 확보, drama/movie/animation/music 공백 메우기

| Difficulty | 수량 | 주요 소스 |
|-----------|------|----------|
| 1 (A1) | 60 | 학습 채널 확장, Cocomelon, Sesame Street |
| 2 (A2) | 60 | 시트콤 클립, mmmEnglish, Movie Recaps |
| 3 (B1) | 60 | Vox, SNL, Marvel/Harry Potter |
| 4 (B2) | 50 | Crash Course, Breaking Bad, Nolan Films |
| 5 (C1) | 40 | Colbert, Debate clips, Tarantino |
| 6 (C2) | 30 | Panel Shows 확장, BoJack, Rap Analysis |

**카테고리 배분**: daily 75, entertainment 60, drama 50, movie 45, animation 40, music 30

**Phase 1 학습 반영**:
- Whisper 전사 성공률 낮은 채널 제외
- 유저 반응 좋은 카테고리 비중 확대
- 부족한 레벨 추가 소싱

### Phase 3: Batch 3 — 500개 (4-6주차)

**목표**: 1,000개 달성, 롱테일 채널 탐색, 최종 분포 맞추기

| Difficulty | 수량 | 전략 |
|-----------|------|------|
| 1 (A1) | 90 | 학습 채널 완전 수확 + 키즈 콘텐츠 |
| 2 (A2) | 90 | 브이로그 + 일상 채널 확장 |
| 3 (B1) | 100 | 뉴스/다큐 Shorts + 코미디 확장 |
| 4 (B2) | 75 | TED/학술 확장 + 드라마 추가 |
| 5 (C1) | 90 | 정치/시사 확장 + 영국 콘텐츠 |
| 6 (C2) | 55 | 니치 채널 탐색 + 문화 콘텐츠 |

**카테고리 배분**: daily 115, entertainment 90, drama 70, movie 80, animation 85, music 60

---

## 7. 콘텐츠 파이프라인 통합

### 7.1 Shorts 처리 파이프라인

기존 파이프라인과 동일하되, Shorts 특성 반영:

```
1. YouTube Data API → Shorts 목록 수집
2. 길이/형식 필터링 (≤60초, Shorts 형식)
3. seed-videos.ts에 엔트리 추가 (format: 'shorts')
4. Groq Whisper API → 영어 전사
5. Claude → 한글 번역
6. Expression/Word 매칭
7. CEFR 난이도 검증 (expression 기반 자동 산출)
```

### 7.2 기존 파이프라인과의 차이

| 단계 | Series 클립 | Shorts |
|------|-----------|--------|
| 클립 범위 | clipStart~clipEnd 설정 | 전체 영상 (0, 0) |
| 길이 검증 | 45-70초 범위 검증 | ≤60초 확인만 |
| 시리즈 연결 | seriesId + episodeNumber | 없음 (독립형) |
| 난이도 설정 | 시리즈 기반 일괄 | 개별 판정 필요 |
| 자막 세그멘테이션 | 필요 | 보통 불필요 (이미 짧음) |

---

## 8. 10분+ 소스 영상 정리

### 8.1 문제 정의

현재 seed-videos.ts에는 YouTube 원본 영상이 10분 이상인 것에서 45-70초 클립을 추출한 엔트리가 다수 존재한다. 이들 자체는 클립이므로 문제 없지만, 소스 영상 길이 정보는 저장되어 있지 않다.

### 8.2 식별 방법

10분+ 소스 영상을 식별하려면:

1. **YouTube Data API 조회**: 모든 2,322개 youtubeId에 대해 `videos.list(part=contentDetails)` 호출
2. **duration 필터링**: `PT10M` 이상인 영상 식별
3. **영상별 클립 수 집계**: 하나의 소스 영상에서 여러 클립이 추출된 경우 확인

### 8.3 제거 대상 판정 기준

10분+ 소스 영상 자체를 제거하는 것이 아니라, 다음 경우에 해당하면 해당 클립 엔트리 제거를 검토:

- YouTube 원본이 삭제/비공개 전환된 경우
- Whisper 전사 품질이 낮은 경우
- 표현/단어 매칭 결과가 빈약한 경우
- 같은 시리즈 내 다른 클립과 대사가 중복되는 경우

### 8.4 실행 계획

```
1. scripts/check-video-duration.ts 스크립트 작성
2. YouTube Data API로 전체 youtubeId 조회 (50개씩 배치)
3. duration ≥ 600초 영상 목록 출력
4. 해당 영상의 클립 엔트리 매핑
5. 제거 대상 판정 후 seed-videos.ts에서 삭제
```

> **NOTE**: 이 작업은 Shorts 확보와 독립적으로 진행 가능. YouTube Data API 쿼터 공유에 주의.

---

## 9. 에이전트 실행 지침

### 9.1 Phase 1 에이전트 태스크 분배

**Agent 1: 채널 조사 (Research)**
- WebSearch로 각 레벨별 YouTube Shorts 채널 검색
- 채널별 Shorts 플레이리스트 URL 수집
- 채널별 예상 수확량 정리

**Agent 2: 영상 수집 (Collection)**
- YouTube Data API로 Shorts 목록 수집
- 제목, 길이, 채널명 추출
- 60초 이하 필터링
- 난이도 1차 분류 (채널 기반)

**Agent 3: 데이터 입력 (Data Entry)**
- seed-videos.ts에 엔트리 추가
- id 형식: `shorts-{youtubeId}`
- format: 'shorts' 필수
- clipStart: 0, clipEnd: 0

**Agent 4: 파이프라인 실행 (Processing)**
- Whisper 전사 실행
- Claude 번역 실행
- Expression/Word 매칭
- CEFR 난이도 검증 및 수정

### 9.2 품질 게이트

각 Phase 완료 후 CTO 리뷰:

1. **분포 검증**: 레벨별/카테고리별 목표 대비 달성률
2. **전사 품질**: Whisper 전사 성공률 ≥ 90%
3. **번역 품질**: 랜덤 샘플 20개 번역 검토
4. **난이도 정확성**: 랜덤 샘플 20개 CEFR 검증
5. **중복 검사**: 기존 Series 클립과 동일 영상 없는지

---

## 10. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Shorts 형식이지만 영어 아닌 영상 | 수확량 감소 | 채널 수를 넉넉히 확보, 2배 후보 목록 |
| 특정 레벨 영상 부족 (특히 C2) | 분포 불균형 | 니치 채널 추가 탐색, 난이도 경계 유연화 |
| YouTube API 쿼터 소진 | 수집 지연 | 일일 쿼터 분배 계획, 배치 간 간격 |
| Whisper 전사 실패 (음악/소음) | 완성품 감소 | 15-20% 버퍼 (1,150-1,200개 후보 수집) |
| 저작권 문제 (클립 채널) | 법적 리스크 | 공식 채널 우선, 팬 채널은 주의 |

---

## 11. 성공 지표

| 지표 | 목표 |
|------|------|
| 총 Shorts 수 | 1,000개 |
| Whisper 전사 성공률 | ≥ 90% |
| 레벨 분포 오차 | 각 레벨 목표 대비 ±10% |
| 카테고리 분포 오차 | 각 카테고리 목표 대비 ±15% |
| 전체 콘텐츠 중 Shorts 비율 | ~30% (1,000 / 3,322) |
| Phase 1 완료 기한 | 1주 |
| 전체 완료 기한 | 6주 |

---

## 12. 완료 후 상태

Shorts 1,000개 추가 완료 시:

| 타입 | 수량 | 비율 |
|------|------|------|
| Series 클립 | ~2,287 | ~69% |
| Shorts | ~1,036 (기존 36 + 신규 1,000) | ~31% |
| **합계** | **~3,323** | 100% |

이 비율로 Shorts 전용 피드와 Series 탭이 모두 풍성한 콘텐츠를 제공할 수 있다.
