# VocaLoop — 매일 30 단어 (토익·토플)

하루 30개 × 90일, 반복 복습으로 암기하는 개인용 영단어 학습 웹앱입니다.
서버 없이 동작하며 학습 기록은 브라우저(localStorage)에 저장됩니다.

## 일일 학습 흐름

| 순서 | 내용 | 시작 시점 |
|---|---|---|
| 1 | 7일 전 단어 30개 복습 시험 | Day 8부터 |
| 2 | 어제 단어 30개 복습 시험 | Day 2부터 |
| 3 | 오늘 단어 30개 카드 학습 | 매일 |
| 4 | 오늘 단어 30개 암기 시험 | 매일 |

- 오늘의 30개는 **아직 안 배운 단어에서 무작위로** 뽑혀 그날에 고정 배정됩니다.
  (복습·주간시험 범위가 흔들리지 않도록 한 번 배정되면 바뀌지 않습니다)
- 시험은 절반 **영→뜻 4지선다**, 절반 **뜻→영 타이핑**으로 출제됩니다.
- 여러 뜻이 있는 단어는 4지선다 보기에 **뜻 1개만** 나옵니다 (주요 뜻 70% 확률).
  오답 보기에는 정답 단어와 뜻이 겹치는 단어가 나오지 않습니다.
- 학습 카드·목록·오답노트·채점 결과에서 🔊 버튼으로 발음을 들을 수 있습니다.
  (브라우저 내장 음성 사용 — 기기별로 목소리가 다를 수 있습니다)
- 7일 완료마다 지금까지 배운 단어 중 **랜덤 50문제 주간시험**이 열립니다.
- 틀린 단어는 **오답노트**에 자동 기록되고, 2회 이상 틀리면 "자주 틀림" 표시가 붙습니다.
  오답 재시험에서 맞히면 횟수가 줄고, 1회짜리는 노트에서 제거됩니다.

## GitHub Pages 배포 (무료)

1. https://github.com 가입 후 **New repository** → 이름 예: `vocaloop` → Public → Create
2. 저장소 화면에서 **uploading an existing file** 클릭 → 이 폴더의 **모든 파일과 js 폴더째** 드래그해 업로드 → Commit
   (폴더 구조가 그대로 유지되어야 합니다)
3. 저장소 **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save
4. 1~2분 뒤 `https://아이디.github.io/vocaloop/` 로 접속

### 폰 홈 화면에 추가 (앱처럼 사용)

- iPhone(Safari): 공유 버튼 → **홈 화면에 추가**
- Android(Chrome): 메뉴(⋮) → **홈 화면에 추가**

## 배포가 반영됐는지 확인하기 (버전 표시)

- 홈 화면 맨 아래와 [백업 · 설정]에 **현재 실행 중인 버전**이 표시됩니다.
- 새 파일을 올린 뒤 사이트의 버전이 그대로라면 아직 옛 파일이 실행 중인 것입니다:
  1. 저장소 **Actions** 탭에서 "pages build and deployment"가 초록색인지 확인 (보통 1~2분)
  2. GitHub Pages는 파일마다 10분 캐시가 있어 최대 10분쯤 걸릴 수 있습니다
  3. 그래도 옛 버전이면 브라우저 캐시입니다 → PC: Ctrl+F5 / 폰: 탭 완전히 닫고 재접속,
     홈 화면 앱은 완전 종료 후 재실행
- 코드를 수정할 때는 `js/version.js`의 버전과 `index.html`의 `?v=` 값을 같이 올리면
  브라우저가 자동으로 새 파일을 받아옵니다.

## 주의: 데이터 저장 방식

- 학습 기록은 **접속한 브라우저에만** 저장됩니다. 기기를 바꾸면 기록이 따라가지 않습니다.
- 다른 기기로 옮기려면: **백업 · 설정 → 백업 파일 내려받기** → 새 기기에서 **백업 파일 불러오기**
- 브라우저 데이터(사이트 데이터)를 지우면 기록도 사라지니 주기적으로 백업하세요.

## Claude로 콘텐츠 추가하기

앱의 **[콘텐츠 추가]** 화면에 있는 요청문을 복사해 Claude에게 보내면
규격에 맞는 JSON 팩을 만들어 줍니다. 받은 JSON을 붙여넣기만 하면 됩니다.

지원 팩 타입:

```jsonc
// 단어 팩 — 미학습 풀에 들어가 이후 학습에 무작위로 등장합니다
// meanings: 뜻 배열, 첫 번째가 주요 뜻 (시험 보기에 더 자주 출제)
// 중복 처리: 이미 있는 단어는 제외, 새로운 뜻이면 기존 단어에 병합
// pos 코드: n(명사) v(동사) adj(형용사) adv(부사) → 화면에는 한글로 표시
// phonetic(발음 기호), example(예문)은 선택 항목
{ "packType": "words", "title": "추가 단어 팩",
  "items": [ { "word": "address", "meanings": ["다루다", "연설하다", "주소"], "pos": "v",
               "phonetic": "/əˈdres/", "example": "..." } ] }

// 문법 팩 — 라이브러리에서 열람
{ "packType": "grammar", "title": "핵심 문법",
  "items": [ { "title": "가정법 과거", "explanation": "...", "examples": ["..."] } ] }

// 토익 문제 팩 — 라이브러리에서 바로 풀기
{ "packType": "toeic", "title": "Part 5 연습",
  "items": [ { "question": "...", "choices": ["A","B","C","D"], "answer": 0, "explanation": "..." } ] }
```

## 폴더 구조

```
vocaloop/
├── index.html                 # 화면 뼈대 + 스타일 (HTML/CSS 전용)
├── manifest.json              # 홈 화면 추가용 앱 정보
├── icon-192.png / icon-512.png
└── js/
    ├── main.js                # 초기화, 화면 라우팅, 홈
    ├── models/                # 데이터 클래스 (ContentItem 상속 구조)
    │   ├── content-item.js    #   └ 부모 클래스
    │   ├── word-entry.js      #   └ 단어
    │   ├── grammar-item.js    #   └ 문법 (확장)
    │   ├── toeic-question.js  #   └ 토익 문제 (확장)
    │   └── app-models.js      #   └ 앱 상태 / 오답노트 / 시험 결과
    ├── storage/
    │   ├── storage-interface.js       # 저장소 추상 인터페이스
    │   ├── local-storage-provider.js  # localStorage 구현체
    │   └── repository.js              # JSON↔클래스 변환, 단어 풀 관리
    ├── features/
    │   ├── speech.js          # 발음 듣기 (브라우저 내장 음성)
    │   ├── study.js           # 일일 4스텝 플로우, 주간시험
    │   ├── quiz.js            # 문제 생성 + 시험 화면 (공용)
    │   ├── wrongnote.js       # 오답노트, 오답 재시험
    │   ├── content-import.js  # Claude 콘텐츠 팩 가져오기, 라이브러리
    │   └── backup.js          # 백업/복원/초기화
    └── data/
        └── words.js           # 기본 단어 900개 (JSON 객체 배열)
```

## 데이터 규격 (나중에 DB로 옮길 때)

모든 데이터는 JSON 키:값 규격으로 통일되어 있어 그대로 테이블화할 수 있습니다.

| localStorage 키 | 내용 |
|---|---|
| `vocaloop.state` | `{ startDate, completedCount, weeklyDoneCount }` |
| `vocaloop.assignments` | `{ "1": [단어id...], "2": [...] }` — Day별 배정표 |
| `vocaloop.wrong` | `[{ itemId, wrongCount, lastWrongDate, sources }]` |
| `vocaloop.results` | `[{ id, quizType, day, date, score, total, wrongItemIds }]` |
| `vocaloop.customWords` | `[{ id, word, meanings[], pos, phonetic, example, ... }]` |
| `vocaloop.wordExtras` | `{ 단어id: { meanings: [병합된 추가 뜻] } }` |
| `vocaloop.library` | 문법/토익 항목 배열 |

단어 원본(`js/data/words.js`)도 같은 규격의 JSON 객체 배열입니다:
`{ "word": "...", "meanings": ["주요 뜻", "..."], "pos": "v", "phonetic": "..."(선택) }`
(구버전 `meaning` 문자열도 읽을 때 자동으로 배열로 변환됩니다)

## 나중에 확장하려면

- **클라우드 동기화**: `storage-interface.js`의 `StorageProvider`를 구현한
  새 클래스(예: Firebase)를 만들어 `main.js`에서 갈아끼우면 됩니다.
- **새 콘텐츠 타입**: `ContentItem`을 상속한 모델을 만들고
  `content-import.js`의 `VALIDATORS`에 검증기를 등록하면 됩니다.
