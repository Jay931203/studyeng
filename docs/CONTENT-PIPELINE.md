# StudyEng 콘텐츠 파이프라인 런북

> 이 문서는 StudyEng 앱에 새로운 영상 콘텐츠를 추가하는 전체 과정을 상세히 기술한다.
> 미래의 작업자(사람 또는 AI 에이전트)가 이 문서만으로 콘텐츠를 추가할 수 있어야 한다.

---

## 1. 개요

### 파이프라인이 하는 일

YouTube 영상에서 학습용 클립(45~70초)을 잘라내고, 영어 자막을 추출하여 자연스러운 문장 단위로 그룹핑한 뒤, 한국어 번역을 붙여서 JSON 파일로 저장한다. 이 JSON이 앱의 자막 데이터 소스가 된다.

### 아키텍처 다이어그램

```
YouTube 영상 발견
       |
       v
seed-videos.ts 에 영상 메타데이터 등록
       |
       v
prebake-all.js 실행
       |
       +---> yt-dlp: YouTube에서 SRT 자막 다운로드 (영어 자동생성 자막)
       |            |
       |            v
       |     SRT 파싱: HTML 태그/음악 기호 제거, 타임스탬프 추출
       |            |
       |            v
       |     문장 그룹핑: clipStart~clipEnd 범위 필터링
       |                  4~10초 단위로 자연스러운 문장 블록 생성
       |                  문장 부호(. ! ?) 기준 분리
       |            |
       |            v
       |     Groq API 번역: llama-3.3-70b-versatile 모델
       |                     25개씩 배치 번역 (영어 -> 한국어)
       |                     Rate limit 시 60초 대기 후 재시도
       |            |
       |            v
       +---> public/transcripts/{youtubeId}.json 저장
                    |
                    v
              Vercel 배포 (git push 시 자동)
                    |
                    v
              앱에서 fetch('/transcripts/{youtubeId}.json') 으로 로드
```

### 데이터 흐름

```
[YouTube] --(yt-dlp)--> [SRT 파일] --(parseSrt)--> [타임스탬프 배열]
    --(groupIntoSentences)--> [문장 블록] --(translateWithGroq)--> [최종 JSON]
```

### 최종 JSON 형식

```json
[
  {
    "start": 0.56,      // 자막 시작 시간 (초)
    "end": 2.88,         // 자막 종료 시간 (초)
    "en": "Hello, everybody.",   // 영어 원문
    "ko": "안녕하세요, 여러분!"   // 한국어 번역
  },
  ...
]
```

---

## 2. 사전 준비

### 필수 도구

| 도구 | 용도 | 설치 방법 |
|------|------|-----------|
| Node.js (18+) | 스크립트 실행 | https://nodejs.org/ |
| yt-dlp | YouTube 자막 다운로드 | `pip install yt-dlp` |
| Python 3 | yt-dlp 실행 | https://python.org/ |

### API 키

| 키 | 용도 | 설정 방법 |
|----|------|-----------|
| GROQ_API_KEY | 한국어 번역 (Groq 무료 티어) | 환경변수로 설정 |

Groq API 키 발급: https://console.groq.com/ 에서 무료 계정 생성 후 API Keys 메뉴에서 발급

### 설치 확인 방법

```bash
# Node.js 확인
node --version
# v18 이상이어야 함

# yt-dlp 확인
yt-dlp --version
# 버전 번호가 출력되면 정상

# Python 확인
python --version

# Groq API 키 확인 (Windows PowerShell)
echo $env:GROQ_API_KEY

# Groq API 키 확인 (bash / Git Bash)
echo $GROQ_API_KEY
```

---

## 3. 단계별 가이드: 새 영상 추가

### Step 1: YouTube 영상 찾기

#### 좋은 클립의 조건

- **길이**: 45~70초 분량의 클립 (영상 전체가 아닌 특정 구간)
- **명확한 대사**: 배경 음악/효과음이 과하지 않고 대화가 잘 들리는 구간
- **자막 가용성**: YouTube 자동생성 자막이 있는 영상 (모든 영상에 있는 것이 아님)
- **학습 가치**: 일상 대화, 관용 표현, 감정 표현 등이 포함된 구간
- **재미**: "공부 느낌"이 아닌 재미있고 기억에 남는 장면

#### 자막 가용성 확인 방법

```bash
# 영상에 자동생성 영어 자막이 있는지 확인
yt-dlp --list-subs "https://www.youtube.com/watch?v=VIDEO_ID" 2>&1 | grep -i "en"
```

"en" 자막이 목록에 없으면 해당 영상은 사용 불가. YouTube의 모든 영상에 자동생성 자막이 있는 것은 아니다. (현재 약 20/59 비율로 자막 없는 영상 존재)

#### YouTube ID 추출 방법

```
URL 형식                                    -> YouTube ID
https://www.youtube.com/watch?v=gO8N3L_aERg -> gO8N3L_aERg
https://youtu.be/gO8N3L_aERg                -> gO8N3L_aERg
https://www.youtube.com/embed/gO8N3L_aERg   -> gO8N3L_aERg
```

`v=` 뒤의 11자리 문자열, 또는 `youtu.be/` 뒤의 문자열이 YouTube ID이다.

#### 클립 시작/종료 시간 결정

1. YouTube에서 영상을 재생하며 학습에 적합한 구간을 찾는다
2. 해당 구간의 시작/종료 시간을 초 단위로 기록한다
3. 목표 길이: 45~70초 (너무 짧으면 학습량 부족, 너무 길면 집중력 저하)
4. 가급적 대사의 시작/끝에 맞춰 자르되, 1~2초 여유를 둔다

### Step 2: seed-videos.ts에 등록

#### 파일 위치

```
C:\Users\hyunj\studyeng\src\data\seed-videos.ts
```

#### 데이터 구조

```typescript
export interface VideoData {
  id: string           // 고유 식별자 (kebab-case)
  youtubeId: string    // YouTube 영상 ID (11자리)
  title: string        // 한국어 제목
  category: CategoryId // 카테고리 (아래 참고)
  difficulty: number   // 난이도 1~5
  clipStart: number    // 클립 시작 시간 (초)
  clipEnd: number      // 클립 종료 시간 (초)
  seriesId?: string    // 시리즈에 속하면 시리즈 ID
  episodeNumber?: number // 시리즈 내 에피소드 번호
  subtitles: []        // 빈 배열로 고정 (런타임에 JSON에서 로드)
}
```

#### 카테고리 정의

| CategoryId | 레이블 | 설명 | 예시 |
|------------|--------|------|------|
| `'drama'` | 드라마 | TV 시리즈/시트콤 | Friends, The Office, Brooklyn Nine-Nine, Modern Family |
| `'movie'` | 영화 | 영화 장면 | Forrest Gump, Devil Wears Prada, Harry Potter, Mean Girls |
| `'daily'` | 일상 | 일상 대화/브이로그 | (현재 비어있음 - 향후 추가 예정) |
| `'entertainment'` | 예능 | 토크쇼/버라이어티 | Graham Norton Show, Mean Tweets, Conan |
| `'music'` | 음악 | 뮤직비디오/음악 관련 | Ed Sheeran, Adele |
| `'animation'` | 애니 | 애니메이션 | Inside Out, Toy Story |

#### 난이도 기준

| 난이도 | 설명 | 기준 | 예시 |
|--------|------|------|------|
| 1 | 초급 | 매우 천천히, 간단한 단어 | (현재 없음) |
| 2 | 초중급 | 일상적 대화, 쉬운 표현 | Brooklyn 99 노래 장면, Forrest Gump, Shape of You |
| 3 | 중급 | 자연스러운 속도, 관용 표현 포함 | The Office, Friends, Graham Norton |
| 4 | 중상급 | 빠른 속도, 전문 어휘 | Devil Wears Prada 면접 장면, Graham Norton 영국식 발음 |
| 5 | 고급 | 슬랭, 빠른 대화, 특수 억양 | (현재 없음) |

#### 시리즈 등록 (새 시리즈인 경우)

같은 소스(드라마, 영화 등)에서 여러 클립을 추가할 경우, `series` 배열에도 등록해야 한다.

```typescript
// series 배열에 추가
{
  id: 'new-series-id',         // kebab-case 고유 ID
  title: 'Series Title',       // 시리즈 제목
  category: 'drama',           // CategoryId
  description: '시리즈 설명',    // 한국어 설명
  thumbnailEmoji: '',           // 빈 문자열 (이모지 미사용)
  episodeCount: 2,              // 에피소드 수
}
```

#### 복사-붙여넣기 예시: 독립 영상

```typescript
{
  id: 'titanic-iceberg',
  youtubeId: 'XXXXXXXXXXX',
  title: '빙산 충돌 장면',
  category: 'movie',
  difficulty: 3,
  clipStart: 10,
  clipEnd: 65,
  subtitles: [],
},
```

#### 복사-붙여넣기 예시: 시리즈 영상

```typescript
// 1. series 배열에 추가 (첫 에피소드 등록 시에만)
{
  id: 'titanic',
  title: 'Titanic',
  category: 'movie',
  description: '타이타닉 명장면 모음',
  thumbnailEmoji: '',
  episodeCount: 2,
},

// 2. seedVideos 배열에 추가
{
  id: 'titanic-iceberg',
  youtubeId: 'XXXXXXXXXXX',
  title: '빙산 충돌 장면',
  category: 'movie',
  difficulty: 3,
  clipStart: 10,
  clipEnd: 65,
  seriesId: 'titanic',
  episodeNumber: 1,
  subtitles: [],
},
{
  id: 'titanic-ending',
  youtubeId: 'YYYYYYYYYYY',
  title: '잭의 마지막 장면',
  category: 'movie',
  difficulty: 2,
  clipStart: 0,
  clipEnd: 60,
  seriesId: 'titanic',
  episodeNumber: 2,
  subtitles: [],
},
```

#### 네이밍 컨벤션

- `id`: kebab-case, 소스명 축약 + 장면 설명 (예: `office-fire`, `friends-1`, `prada-2`)
- `seriesId`: kebab-case, 소스명 (예: `the-office`, `friends-s1`, `forrest-gump`)
- `title`: 한국어, 간결하게 장면을 설명 (예: `드와이트의 화재 훈련`)

### Step 3: 자막 파이프라인 실행

#### 기본 실행 (신규 영상만 처리)

```bash
# Windows PowerShell
$env:GROQ_API_KEY="<your-groq-api-key>"
node scripts/prebake-all.js

# Git Bash / Linux / Mac
GROQ_API_KEY="<your-groq-api-key>" node scripts/prebake-all.js
```

#### 플래그 설명

| 플래그 | 동작 |
|--------|------|
| (없음) | 이미 JSON이 존재하는 영상은 건너뜀. 새 영상만 처리 |
| `--force` | 기존 JSON을 무시하고 모든 영상을 다시 처리 (SRT 다운로드 + 그룹핑 + 번역) |
| `--translate-only` | 기존 JSON은 유지하되, `ko` 필드가 비어있는 항목만 번역 추가 |

#### 예상 출력

```
Found 25 unique videos

SKIP gO8N3L_aERg (6 entries)           # 이미 처리된 영상
SKIP HlBYdiXdUa8 (19 entries)         # 이미 처리된 영상
FETCH XXXXXXXXXXX [clip: 10-65s]...    # 새 영상 처리 시작
  OK XXXXXXXXXXX: 8 groups (from 42 SRT entries)
  TRANSLATE XXXXXXXXXXX...
  SAVED C:\Users\hyunj\studyeng\public\transcripts\XXXXXXXXXXX.json

Done! Success: 1, Skipped: 24, Failed: 0, Translated: 1
```

#### 처리 과정 상세

1. `seed-videos.ts`에서 모든 영상의 `youtubeId`, `clipStart`, `clipEnd`를 추출
2. 중복 youtubeId 제거
3. 각 영상에 대해:
   a. `public/transcripts/{id}.json` 존재 여부 확인 (존재하면 SKIP)
   b. `yt-dlp`로 영어 자동생성 자막(SRT) 다운로드 -> `tmp/{id}.en.srt`
   c. SRT 파싱: HTML 태그, `[Music]`, `(inaudible)`, 음표 기호 제거
   d. `clipStart`~`clipEnd` 범위의 자막만 필터링 (1초 버퍼)
   e. 4~10초 단위로 자연스러운 문장 블록 생성 (`.` `!` `?` 기준 분리)
   f. 2초 미만의 극소 블록은 앞 블록에 병합
   g. Groq API로 25개씩 배치 번역 (영어 -> 한국어)
   h. JSON 저장
4. `tmp/` 디렉토리 정리

### Step 4: 품질 검증

#### JSON 파일 확인

```bash
# 생성된 JSON 확인
cat public/transcripts/XXXXXXXXXXX.json | python -m json.tool

# 또는 Node.js로 간단히 확인
node -e "const d = JSON.parse(require('fs').readFileSync('public/transcripts/XXXXXXXXXXX.json','utf8')); console.log('항목 수:', d.length); d.forEach((e,i) => console.log(i, e.start + '-' + e.end + 's', e.en.substring(0,40), '|', e.ko.substring(0,30)))"
```

#### 확인 항목 체크리스트

- [ ] JSON이 유효한 배열인가?
- [ ] 항목 수가 적절한가? (보통 5~25개)
- [ ] 모든 항목에 `en`과 `ko`가 비어있지 않은가?
- [ ] `start`/`end` 시간이 `clipStart`~`clipEnd` 범위 안에 있는가?
- [ ] `en` 텍스트에 `[Music]`, `(inaudible)` 등의 잔여물이 없는가?
- [ ] `ko` 번역이 자연스러운 한국어인가? (한자/일본어 문자가 섞이지 않았는가?)
- [ ] `ko`에 영어 원문이 그대로 들어간 항목이 없는가? (번역 실패 = "leak")

#### 흔한 문제와 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| `ko`가 빈 문자열 | Groq API 번역 실패 | `--translate-only` 플래그로 재실행 |
| `ko`에 한자(漢字) 포함 | LLM이 간혹 한자를 사용 | JSON을 수동 편집하여 한글로 교체, 또는 `--force`로 재생성 |
| `ko`에 영어 원문이 그대로 | 번역 파싱 실패 | JSON에서 해당 항목의 `ko`를 수동 번역 |
| 항목이 너무 적음 (1~2개) | 클립 범위에 대사가 거의 없음 | `clipStart`/`clipEnd` 조정 |
| 항목이 너무 많음 (30개+) | 짧은 토막 대사가 많은 영상 | 정상적일 수 있음, 내용 확인 필요 |
| `en`에 이상한 문자 포함 | SRT 파싱 이슈 | JSON 수동 편집 |
| 타이밍이 영상과 안 맞음 | YouTube 자동자막 타이밍 오차 | `start`/`end` 값을 수동 미세 조정 |

#### 수동 편집 방법

JSON 파일을 직접 열어 수정할 수 있다. 위치: `public/transcripts/{youtubeId}.json`

```json
// 수정 전
{ "start": 10.5, "end": 15.2, "en": "Some text", "ko": "이상한번역" }

// 수정 후
{ "start": 10.5, "end": 15.2, "en": "Some text", "ko": "자연스러운 번역" }
```

### Step 5: 배포

```bash
# 변경사항 확인
git status

# 스테이징
git add src/data/seed-videos.ts
git add public/transcripts/XXXXXXXXXXX.json   # 새로 생성된 JSON

# 커밋
git commit -m "content: 새 영상 추가 - [영상 제목]"

# 푸시 (Vercel 자동 배포 트리거)
git push origin main
```

Vercel이 `main` 브랜치의 push를 감지하면 자동으로 빌드 및 배포한다. 별도의 배포 명령은 필요 없다.

---

## 4. 트러블슈팅

### yt-dlp 실패 (자막 없음)

```
FAIL XXXXXXXXXXX: No subtitles
```

**원인**: 해당 YouTube 영상에 자동생성 영어 자막이 없다. YouTube의 모든 영상이 자동자막을 제공하는 것은 아니다.

**해결**:
1. 자막이 있는 다른 영상을 찾는다
2. 또는 자막을 수동으로 작성하여 JSON을 직접 생성한다
3. 자막 가용성 사전 확인: `yt-dlp --list-subs "URL" 2>&1 | grep -i "en"`

### yt-dlp 설치 또는 실행 오류

```bash
# 최신 버전으로 업데이트
pip install --upgrade yt-dlp

# PATH에 추가되었는지 확인
which yt-dlp   # Linux/Mac
where yt-dlp   # Windows
```

### Groq API Rate Limit

```
Rate limited, waiting 60s...
```

**원인**: Groq 무료 티어의 분당 요청 제한 초과

**해결**: 스크립트가 자동으로 60초 대기 후 재시도한다. 추가 조치 불필요. 대량 처리 시 시간이 더 오래 걸릴 수 있다.

Groq 무료 티어 제한 (2026년 기준):
- 분당 요청 수 제한
- 일일 토큰 사용량 제한
- 제한에 걸리면 스크립트가 알아서 대기

### Groq API 인증 오류

```
Error: GROQ_API_KEY environment variable is required
```

또는

```
Groq error (401): ...
```

**해결**: 환경변수 `GROQ_API_KEY`가 올바르게 설정되었는지 확인. 키가 만료되었으면 https://console.groq.com/ 에서 새로 발급.

### 번역 품질 문제 (ko leak 패턴)

간혹 `ko` 필드에 영어 원문이 그대로 들어가거나, 한자가 섞이는 경우가 있다.

**확인 방법**:
```bash
# 영어가 ko 필드에 남아있는지 확인 (대문자 영어 단어가 ko에 포함)
node -e "
const fs = require('fs');
const dir = 'public/transcripts';
fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(f => {
  const data = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  data.forEach((e, i) => {
    if (/[A-Z]{3,}/.test(e.ko) && !/[A-Z]/.test(e.en.substring(0,1))) {
      console.log(f, i, 'ko:', e.ko.substring(0, 50));
    }
  });
});
"
```

**해결**: 해당 항목의 `ko`를 JSON에서 수동 수정하거나, `--force`로 전체 재생성.

### SRT 파싱 후 빈 결과

```
FAIL XXXXXXXXXXX: Empty after parsing
```

**원인**: 자막이 다운로드되었으나 파싱 가능한 텍스트가 없다 (전부 `[Music]`이거나 빈 줄).

**해결**: 해당 영상은 대사가 거의 없는 음악/효과음 위주 영상일 가능성이 높다. 다른 구간이나 다른 영상을 선택.

---

## 5. 배치 작업

### 다수 영상 한 번에 추가

1. `seed-videos.ts`의 `seedVideos` 배열에 여러 영상을 한꺼번에 추가한다
2. 필요하면 `series` 배열에도 새 시리즈를 추가한다
3. 스크립트를 실행하면 기존 JSON이 없는 새 영상만 자동으로 처리한다

```bash
GROQ_API_KEY="..." node scripts/prebake-all.js
```

스크립트는 이미 JSON이 존재하는 영상은 자동으로 건너뛴다.

### 전체 자막 재번역

기존 JSON의 영어 자막은 유지하고 한국어 번역만 다시 하고 싶을 때:

```bash
# 1. 먼저 기존 JSON의 ko 필드를 비운다 (수동으로 또는 스크립트로)
# 2. --translate-only로 실행
GROQ_API_KEY="..." node scripts/prebake-all.js --translate-only
```

주의: `--translate-only`는 `ko` 필드가 하나라도 채워져 있으면 해당 파일을 건너뛴다. 전체 재번역을 하려면 먼저 `ko`를 빈 문자열로 만들어야 한다.

```bash
# 모든 JSON의 ko 필드를 비우는 스크립트
node -e "
const fs = require('fs');
const dir = 'public/transcripts';
fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(f => {
  const path = dir + '/' + f;
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  data.forEach(e => e.ko = '');
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  console.log('Cleared ko:', f);
});
"

# 그 후 재번역
GROQ_API_KEY="..." node scripts/prebake-all.js --translate-only
```

### 특정 영상의 자막만 재생성

```bash
# 해당 영상의 JSON 파일을 삭제한 후 스크립트 실행
rm public/transcripts/XXXXXXXXXXX.json
GROQ_API_KEY="..." node scripts/prebake-all.js
```

또는 `--force`를 사용하면 모든 영상을 재생성하지만, 특정 영상만 재생성하려면 위 방법이 효율적이다.

### 모든 영상 전체 재생성

```bash
GROQ_API_KEY="..." node scripts/prebake-all.js --force
```

주의: Groq API 호출이 많아지므로 rate limit에 걸릴 수 있다. 25개 영상 기준 약 10~20분 소요.

---

## 6. 콘텐츠 가이드라인

### 카테고리별 정의와 예시

#### drama (드라마)
- **정의**: TV 시리즈, 시트콤 클립
- **특징**: 반복적인 캐릭터로 친숙해지는 효과, 일상 대화 중심
- **현재 콘텐츠**: Friends, The Office, Brooklyn Nine-Nine, Modern Family
- **추천 소스**: 유명 시트콤, 미드 명장면 모음 (YouTube에 다수 존재)

#### movie (영화)
- **정의**: 영화 장면 클립
- **특징**: 명대사, 감정 표현, 다양한 상황별 영어
- **현재 콘텐츠**: Devil Wears Prada, Forrest Gump, Harry Potter, Mean Girls
- **추천 소스**: 영화 명장면 편집 영상, 공식 클립

#### daily (일상)
- **정의**: 일상 대화, 브이로그, 실생활 영어
- **특징**: 가장 실용적인 영어, 자연스러운 대화 속도
- **현재 콘텐츠**: 없음 (향후 확장 예정)
- **추천 소스**: 영어권 유튜버 브이로그, 거리 인터뷰, ESL 채널 실전 대화

#### entertainment (예능)
- **정의**: 토크쇼, 버라이어티, 인터뷰
- **특징**: 유머, 자연스러운 반응 표현, 다양한 억양
- **현재 콘텐츠**: Graham Norton Show, Mean Tweets (Jimmy Kimmel), Conan
- **추천 소스**: Late Night 쇼, 토크쇼 인터뷰 클립

#### music (음악)
- **정의**: 뮤직비디오, 음악 관련 콘텐츠
- **특징**: 가사를 통한 어휘/표현 학습, 리듬감 있는 반복
- **현재 콘텐츠**: Ed Sheeran - Shape of You, Adele - Hello
- **추천 소스**: 공식 MV (가사가 명확한 팝송 위주)
- **주의**: 자동자막이 음악에서는 부정확할 수 있음. 가사 검증 필수

#### animation (애니)
- **정의**: 애니메이션 영화/시리즈 클립
- **특징**: 명확한 발음, 이해하기 쉬운 대화, 초중급자에게 적합
- **현재 콘텐츠**: Inside Out 2, Toy Story 3
- **추천 소스**: Pixar/Disney 공식 클립, 트레일러

### 난이도 기준 상세

| 난이도 | 말하기 속도 | 어휘 수준 | 문법 복잡도 | 배경 소음 | 대표 예시 |
|--------|-------------|-----------|-------------|-----------|-----------|
| 1 | 매우 느림 | 기초 1000단어 | 단문 위주 | 거의 없음 | (미등록) |
| 2 | 보통~느림 | 일상 단어 | 단순 복문 | 적음 | B99 노래 장면, Forrest Gump, 애니메이션 |
| 3 | 자연스러운 속도 | 관용 표현 포함 | 다양한 문형 | 보통 | The Office, Friends, 토크쇼 |
| 4 | 빠름 | 전문/비즈니스 어휘 | 복잡한 문장 | 있음 | Devil Wears Prada, 영국 토크쇼 |
| 5 | 매우 빠름 | 슬랭/방언 | 생략/축약 많음 | 많음 | (미등록) |

### 클립 길이 가이드

- **최적**: 50~65초
- **허용 범위**: 45~70초
- **최소**: 45초 미만이면 학습 분량이 너무 적음 (자막 3~4개)
- **최대**: 70초 초과하면 집중력 저하, 피드 스크롤 경험 저하

### 좋은 학습 클립의 특성

1. **재미있는 장면**: 유머, 반전, 감동 등 기억에 남는 요소
2. **명확한 대사**: 배경음보다 대화가 두드러짐
3. **실용적 표현**: 일상에서 쓸 수 있는 표현 포함
4. **적절한 대사량**: 너무 적으면(1~2문장) 학습 효과 없음, 너무 많으면(30+) 부담
5. **문화적 맥락**: 영어권 문화를 이해할 수 있는 소재
6. **자기완결성**: 해당 클립만으로도 상황을 이해할 수 있음

---

## 7. 현재 인벤토리

### 전체 현황 (2026-03-08 기준)

| 항목 | 수치 |
|------|------|
| 총 영상 수 | 25개 |
| 총 시리즈 수 | 13개 |
| 총 자막 JSON 파일 | 25개 |
| 자막 없는 영상 | 0개 (전부 정상) |

### 카테고리별 영상 수

| 카테고리 | 영상 수 | 비율 |
|----------|---------|------|
| drama (드라마) | 10 | 40% |
| movie (영화) | 7 | 28% |
| entertainment (예능) | 4 | 16% |
| music (음악) | 2 | 8% |
| animation (애니) | 2 | 8% |
| daily (일상) | 0 | 0% |

### 시리즈별 에피소드 수

| 시리즈 ID | 시리즈 제목 | 카테고리 | 에피소드 수 |
|-----------|-------------|----------|-------------|
| `friends-s1` | Friends S1 | drama | 2 |
| `the-office` | The Office | drama | 4 |
| `brooklyn-99` | Brooklyn Nine-Nine | drama | 2 |
| `modern-family` | Modern Family | drama | 2 |
| `devil-wears-prada` | 악마는 프라다를 입는다 | movie | 2 |
| `forrest-gump` | Forrest Gump | movie | 3 |
| `harry-potter` | Harry Potter | movie | 1 |
| `mean-girls` | Mean Girls | movie | 1 |
| `graham-norton` | Graham Norton Show | entertainment | 2 |
| `mean-tweets` | Mean Tweets | entertainment | 1 |
| `conan` | Conan | entertainment | 1 |
| `pop-hits` | Pop Hits | music | 2 |
| `pixar-moments` | Pixar Classics | animation | 2 |

### 영상별 자막 항목 수

| YouTube ID | 영상 제목 | 자막 항목 수 |
|------------|-----------|-------------|
| `RjpvuPAzJUw` | Friends - 최고 웃긴 장면 모음 | 14 |
| `E6LpBIwGyA4` | Friends - 다들 챈들러 싫어해 | 18 |
| `gO8N3L_aERg` | The Office - 드와이트의 화재 훈련 | 6 |
| `WaaANll8h18` | The Office - 짐이 드와이트 흉내내기 | 16 |
| `Xnk4seEHmgw` | The Office - 짐의 장난 모음 | 10 |
| `8zfNfilNOIE` | The Office - 모스 부호 장난 | 13 |
| `HlBYdiXdUa8` | B99 - I Want It That Way 라인업 | 19 |
| `ffyKY3Dj5ZE` | B99 - 범인들이 노래 부르게 만든 제이크 | 24 |
| `ajb-YbY3-rw` | Modern Family - 베트남 레스토랑 | 28 |
| `0mapwWviBEM` | Modern Family - 월리 코스튬의 릴리 | 24 |
| `2PjZAeiU7uM` | 악마는 프라다를 입는다 - 미란다 등장! | 8 |
| `b2f2Kqt_KcE` | 악마는 프라다를 입는다 - 앤디의 면접 | 16 |
| `x2-MCPa_3rU` | Forrest Gump - 달려라, 포레스트! | 8 |
| `SqOnkiQRCUU` | Forrest Gump - 인생은 초콜릿 상자 | 12 |
| `tvKzyYy6qvY` | Forrest Gump - 완두콩과 당근 | 18 |
| `wsl5fS7KGZc` | Harry Potter - 매드아이 무디의 수업 | 13 |
| `re5veV2F7eY` | Mean Girls - 퀸카로 살아남는 법 | 16 |
| `ZwS14TiO7Pk` | Graham Norton - 윌 스미스 팀 랩 | 19 |
| `yuXGpUR7fXA` | Graham Norton - 라이언 고슬링 웃음 참기 | 18 |
| `RRBoPveyETc` | Mean Tweets - 셀럽 악플 읽기 #1 | 19 |
| `wyDU93xVAJs` | Conan - 시즌4 하이라이트 | 6 |
| `JGwWNGJdvx8` | Ed Sheeran - Shape of You | 16 |
| `YQHsXMglC9A` | Adele - Hello | 4 |
| `M7KelAaqsCg` | Inside Out 2 - 인사이드 아웃 2 | 21 |
| `w7UGkviTIpY` | Toy Story 3 - 토이스토리 3 | 10 |

### 알려진 이슈

| 영상 | 이슈 | 심각도 |
|------|------|--------|
| `YQHsXMglC9A` (Adele - Hello) | 자막 항목 4개로 매우 적음. 음악 영상이라 대사 대신 가사 위주 | 낮음 |
| `gO8N3L_aERg` (The Office 화재) | 자막 항목 6개로 적음. 대사보다 시각적 장면이 많은 구간 | 낮음 |
| `wyDU93xVAJs` (Conan 하이라이트) | 자막 항목 6개로 적음 | 낮음 |
| `daily` 카테고리 | 등록된 영상 0개 | 중간 (카테고리 존재하나 콘텐츠 없음) |

---

## 8. 참고 파일 경로

| 파일 | 경로 | 설명 |
|------|------|------|
| 자막 생성 스크립트 | `scripts/prebake-all.js` | 전체 파이프라인 메인 스크립트 |
| 영상 데이터 | `src/data/seed-videos.ts` | 영상 메타데이터 + 타입 정의 |
| 자막 JSON 출력 | `public/transcripts/{youtubeId}.json` | 최종 자막 데이터 |
| 임시 SRT 파일 | `tmp/{youtubeId}.en.srt` | 처리 후 자동 삭제됨 |
| 앱 설계 문서 | `docs/plans/2026-03-06-studyeng-app-design.md` | 전체 앱 아키텍처 |
| 구현 계획 | `docs/plans/2026-03-06-studyeng-mvp-implementation.md` | MVP 구현 태스크 |
