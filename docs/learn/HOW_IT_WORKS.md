# 밤일기, 코드로 뜯어보기 (코딩 초보자용)

이 문서는 "코딩을 전혀 몰라도, 내가 만든 이 앱이 실제로 어떻게 동작하는지" 이해하기 위한 학습 자료입니다.
전문 개발자 온보딩용 문서가 아니라, **처음 코드를 읽어보는 사람**을 위해 씁니다. 용어가 나오면 그때그때 풀어서 설명합니다.

> 포트폴리오용 소개는 [`README.md`](../../README.md)를, 설계 결정 배경은 [설계 문서](../superpowers/specs/2026-07-21-bedtime-diary-design.md)를 참고하세요. 이 문서는 오직 "코드가 어떻게 움직이는가"에만 집중합니다.

---

## 1. 큰 그림: 파일 6개가 하는 역할

집을 짓는다고 생각하면 이렇게 대응됩니다.

| 파일 | 비유 | 실제 역할 |
|---|---|---|
| `index.html` | 뼈대(골조) | 화면에 어떤 요소들이 있는지 (제목, 입력창, 버튼) |
| `style.css` | 인테리어 | 색깔, 크기, 둥근 모서리 같은 "생김새" |
| `app.js` | 사람(두뇌) | 클릭하면 반응하고, 저장하고, 화면을 바꾸는 "동작" |
| `manifest.json` | 문패 | "이 앱의 이름은 뭐고, 아이콘은 뭐고, 앱처럼 실행할지" 브라우저에게 알려주는 설명서 |
| `sw.js` | 창고지기 | 인터넷이 끊겨도 쓸 수 있게 파일을 미리 저장해두는 역할 |
| `icon.svg` | 문패에 붙는 그림 | 홈 화면에 보이는 아이콘 |

**핵심만 말하면**: `index.html`이 뼈대를 그리고, `style.css`가 색을 입히고, `app.js`가 실제로 살아 움직이게 만듭니다. 이 문서는 대부분 `app.js`에 집중합니다 — "동작"이 담긴 파일이 이해하기 제일 어렵기 때문입니다.

---

## 2. `index.html`: 화면에 뭐가 있는지

`index.html`을 열어보면 `<section>` 태그가 3개 있습니다.

```html
<section id="view-today">...</section>   <!-- 오늘 화면 -->
<section id="view-list" hidden>...</section>   <!-- 지난 기록 목록 -->
<section id="view-detail" hidden>...</section> <!-- 지난 기록 상세 -->
```

이 앱은 사실 "페이지 이동"이 없습니다. **화면 3개를 미리 다 만들어두고, `app.js`가 `hidden`(숨김) 속성을 켰다 껐다 하면서 하나만 보여주는 방식**입니다. 마치 슬라이드 3장을 인쇄해서 책상 위에 쌓아두고, 필요한 한 장만 위로 꺼내놓는 것과 비슷합니다.

`hidden`이라는 속성이 붙은 `<section>`은 브라우저가 자동으로 안 보이게 처리해줍니다. (참고: 처음 배포했을 때 이 부분에 CSS 버그가 있어서 3개 화면이 한꺼번에 보인 적이 있었는데, `style.css`에 `.view[hidden] { display: none; }` 규칙을 추가해서 고쳤습니다. → "코드는 한 번에 완벽하지 않고, 실제로 눌러보며 고쳐나가는 것"의 좋은 예시입니다.)

---

## 3. `app.js` 뜯어보기 — 위에서부터 순서대로

### 3-1. 날짜를 "이름표"로 바꾸기 — `getDateKey`

```js
function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
```

컴퓨터에게 "오늘"이란 `2026-07-22T14:16:03...` 같은 복잡한 값입니다. 하지만 우리는 그냥 `"2026-07-22"`처럼 **날짜별 이름표(키)** 로 쓰고 싶습니다. 이 함수는 그 변환만 담당합니다.

- `getMonth()`는 왜 1을 더할까요? — 자바스크립트는 1월을 `0`으로 세기 때문입니다(0월~11월). 사람이 읽는 "7월"과 맞추려고 `+1`을 합니다.
- `padStart(2, "0")`는 "두 자리로 만들고, 모자라면 앞에 0을 채워라"는 뜻입니다. `7월`을 그냥 쓰면 `"7"`이라 `2026-7-22`가 되어버리는데, 그러면 나중에 날짜끼리 문자로 비교(정렬)할 때 순서가 꼬입니다. `"07"`로 맞춰야 `2026-07-22`처럼 항상 같은 길이가 되어 정렬이 정확해집니다.

### 3-2. 브라우저 안의 작은 서랍 — `localStorage`, `loadAll`, `saveAll`

```js
function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
```

`localStorage`는 **브라우저 안에 있는 작은 서랍**입니다. 서버도 없고 로그인도 없는 이 앱은, 여기에만 일기를 저장합니다 (그래서 다른 기기에서는 안 보이고, 브라우저 데이터를 지우면 일기도 같이 사라집니다).

문제는 서랍(`localStorage`)에는 **글자(문자열)만** 넣을 수 있다는 것입니다. 그런데 우리가 저장하고 싶은 건 `{ "2026-07-21": { entry: "...", tomorrowGoal: "..." } }` 같은 객체(상자 안에 상자가 들어있는 구조)입니다.

- `JSON.stringify(data)` = 객체를 "포장"해서 글자로 바꿉니다 (서랍에 넣을 수 있게)
- `JSON.parse(...)` = 포장을 "개봉"해서 다시 객체로 되돌립니다 (꺼내서 쓸 수 있게)

`try { ... } catch { return {} }`는 "혹시 서랍 안 내용물이 깨져 있어서 개봉하다가 에러가 나면, 빈 상자(`{}`)로 취급하고 넘어가라"는 안전장치입니다.

### 3-3. 타이핑이 끝날 때까지 기다렸다가 저장하기 — `debounce`

```js
function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
```

이 앱은 "저장" 버튼이 없습니다. 타이핑할 때마다 자동으로 저장되죠. 그런데 글자 하나 칠 때마다 매번 저장한다면 낭비가 심합니다 (1초에 5번씩 서랍을 여닫는 셈).

`debounce`는 **"문자 입력 중..." 표시와 비슷한 원리**입니다. 카톡에서 상대방이 타이핑하는 동안은 "입력 중..."만 보이다가, 타이핑을 **멈추고 나서야** 메시지가 도착하죠. 이 함수도 그렇습니다:

1. 글자를 입력할 때마다 "0.4초 뒤에 저장할게" 라는 타이머를 새로 겁니다.
2. 그런데 0.4초 안에 또 입력하면, 이전 타이머는 취소(`clearTimeout`)하고 다시 0.4초를 겁니다.
3. 결국 **타이핑을 멈추고 0.4초가 지나야만** 실제 저장이 실행됩니다.

`app.js`에서는 이렇게 씁니다:

```js
const persist = debounce(() => { /* 실제 저장 코드 */ }, 400);
entryInput.addEventListener("input", () => { autoResize(entryInput); persist(); });
```

`400`이 바로 "0.4초"입니다. 이 숫자를 `1000`으로 바꾸면 1초 멈췄을 때 저장되고, `0`으로 바꾸면 debounce가 사실상 없어지는 것과 같습니다 — 실험해보기 좋은 부분입니다.

### 3-4. 화면 3장 중 1장만 보여주기 — `showView`

```js
function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
}
```

앞서 2번에서 설명한 "슬라이드 3장" 로직이 바로 여기서 실행됩니다. `views`는 `{ today: ..., list: ..., detail: ... }` 처럼 화면 3개를 담은 상자입니다. 이 함수는 그 상자를 하나씩 순회하면서:

- 이름이 `name`(내가 보여주고 싶은 화면)과 **같으면** → `hidden = false` (보여줌)
- **다르면** → `hidden = true` (숨김)

`key !== name`이 `false`면 안 숨김, `true`면 숨김이 되는 방식입니다. 스위치 3개 중 딱 1개만 켜는 것과 같습니다.

### 3-5. 오늘 화면을 처음 열 때 — `initToday`

이 함수가 하는 일을 순서대로 풀면:

1. 오늘 날짜를 "7월 22일 수요일"처럼 사람이 읽기 좋은 글자로 바꿔서 화면 위에 표시 (`formatDateLabel`)
2. 서랍(`localStorage`)에 오늘 날짜 키로 저장된 게 있으면 불러오고, 없으면 빈 값으로 시작
3. **어제** 날짜 키로 저장된 내용이 있고, 거기 "내일 목표"가 적혀있으면 → 화면 위에 살짝 보여줌 (오늘이 바로 그 "내일"이니까!)
4. 입력창에 글자를 칠 때마다 `persist()`(자동저장)를 실행하도록 연결

여기서 "어제"를 구하는 코드도 흥미롭습니다:

```js
const yesterdayKey = getDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
```

`now.getTime()`은 "1970년 1월 1일부터 지금까지 몇 밀리초가 지났는지"를 숫자로 줍니다. 거기서 `24 * 60 * 60 * 1000`(하루를 밀리초로 환산한 값)을 빼면 정확히 "어제 이 시각"이 나옵니다. 날짜를 다루는 코드에서 아주 흔하게 쓰는 패턴입니다.

### 3-6. 지난 기록 목록/상세 — `openHistoryList`, `openHistoryDetail`

목록 화면은 "오늘을 제외한, 내용이 있는 날짜들만 골라서 최신순으로 정렬"하는 로직입니다.

```js
const keys = Object.keys(data)
  .filter((k) => k !== todayKey && data[k].entry)
  .sort()
  .reverse();
```

이 한 줄을 소리 내어 읽으면 이렇게 됩니다: *"저장된 모든 날짜 키를 가져와서, 오늘이 아니고 내용이 비어있지 않은 것만 남기고, 오래된 순으로 정렬한 다음, 뒤집어라(최신순으로)."*

날짜 키가 `"2026-07-20"`, `"2026-07-21"` 처럼 **항상 같은 자릿수**로 맞춰져 있기 때문에(3-1에서 `padStart`를 쓴 이유), 그냥 문자로 정렬(`sort()`)해도 시간 순서와 정확히 일치합니다.

상세 화면(`openHistoryDetail`)은 목록에서 클릭한 날짜의 `entry`와 `tomorrowGoal`을 읽기 전용 문단(`<p>`)에 그대로 채워 넣는 단순한 함수입니다.

### 3-7. 맨 아래: 이벤트 연결과 서비스워커

```js
historyIcon.addEventListener("click", openHistoryList);
...
initToday();
showView("today");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
```

- `addEventListener("click", 함수)` = "이 버튼이 클릭되면 이 함수를 실행해라"는 예약입니다.
- 파일 맨 아래 `initToday()`와 `showView("today")`가 실제로 앱을 "시작"시키는 지점입니다. 위에서 정의한 함수들은 이 두 줄이 실행되기 전까지는 그냥 "정의만 되어있고 실행은 안 된" 상태입니다.
- 마지막 블록은 "이 브라우저가 서비스워커라는 기능을 지원하면, `sw.js`를 등록해라"는 뜻입니다. 이게 등록되어야 오프라인에서도 앱이 열립니다.

---

## 4. `sw.js`: 오프라인에서도 되는 이유

```js
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  ...
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

서비스워커는 앱과 인터넷 사이에 서있는 **"창고지기"** 라고 생각하면 됩니다.

1. 앱이 처음 설치될 때, 창고지기가 `index.html`, `style.css`, `app.js` 등을 전부 미리 창고(`caches`)에 챙겨둡니다.
2. 그 다음부터 브라우저가 "이 파일 줘" 라고 요청할 때마다(`fetch` 이벤트), 창고지기가 먼저 **"내 창고에 있나?"** 확인합니다. 있으면 인터넷 없이 바로 줍니다. 없을 때만 진짜 인터넷에 나가서 받아옵니다.

**주의할 점 하나** — 이 창고지기는 `CACHE_NAME`(`"night-diary-v2"`)이라는 이름표가 붙은 창고를 씁니다. 코드를 고쳐서 새로 배포해도, 창고지기는 "예전 이름표 창고"를 계속 쓰기 때문에 **새 코드가 안 보이는 버그**가 실제로 있었습니다. 해결 방법은 이름표를 `v2`, `v3`처럼 바꿔주는 것 — 그러면 `activate` 이벤트에서 옛날 이름표 창고를 지우고 새 창고를 만듭니다. (이것도 실제로 배포하며 겪은 버그였습니다.)

---

## 5. 직접 실험해보기 (제일 빨리 이해하는 방법)

코드를 읽기만 하는 것보다, 살짝 바꿔서 뭐가 달라지는지 보는 게 훨씬 빨리 이해됩니다. 아래는 위험 부담 없이 해볼 수 있는 실험들입니다.

1. **`style.css`의 `--accent: #a68a5c;` 값을 다른 색(`#5c8aa6` 등)으로 바꿔보기** → 저장 후 새로고침하면 포인트 색이 바뀌는 걸 눈으로 확인
2. **`app.js`의 `debounce(fn, 400)`에서 `400`을 `2000`으로 바꿔보기** → 타이핑을 멈추고 2초 있어야 저장되는 걸 느껴보기 (개발자 도구 → Application → Local Storage에서 실시간으로 값이 바뀌는 걸 볼 수 있습니다)
3. **`index.html`의 `placeholder="오늘 있었던 일을..."` 문구를 바꿔보기** → 텍스트만 바꿔도 앱이 안 깨진다는 걸 확인하며 "여기는 그냥 글자구나"를 체감
4. **개발자 도구(F12) → Console 탭에서 `getDateKey(new Date())` 직접 쳐보기** → 함수가 실제로 뭘 돌려주는지 바로 확인 가능

---

## 6. 용어 사전

| 용어 | 쉬운 설명 |
|---|---|
| DOM | 브라우저가 HTML을 읽어서 만든, 화면 요소들의 "목록/지도". `document.getElementById(...)`로 그 지도에서 요소 하나를 찾아옵니다 |
| 이벤트 리스너 (`addEventListener`) | "이 일이 일어나면 이 함수를 실행해줘"라는 예약 |
| `localStorage` | 브라우저 안에 있는, 글자만 저장 가능한 작은 서랍 |
| JSON | 객체를 글자로 포장/개봉하는 공통 포장 방식 (`JSON.stringify`= 포장, `JSON.parse`= 개봉) |
| 디바운스(debounce) | 연속된 동작이 멈춘 뒤 일정 시간이 지나야 실제로 실행되게 미루는 기법 |
| 서비스워커 | 앱과 인터넷 사이에서 파일을 미리 저장해두는 백그라운드 프로그램 (오프라인 지원의 핵심) |
| PWA | 웹사이트를 홈 화면에 설치해서 앱처럼 쓸 수 있게 하는 기술 (이 앱 전체가 PWA) |

---

*이 문서는 [`codebase-documenter`](https://skills.sh/ailabs-393/ai-labs-claude-skills/codebase-documenter) 스킬로 작성되었습니다. 코드가 바뀌면 이 문서도 최신 상태와 다를 수 있으니, 헷갈리는 부분이 있으면 실제 파일과 비교해보세요.*
