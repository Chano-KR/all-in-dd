<img src="assets/readme/hero.svg" width="100%" alt="all-in-dd — 토큰 하나에서 웹, 슬라이드, 카드뉴스, 인쇄 네 매체로 뻗는 파이프라인" />

**all-in-dd** (all in direct design)는 브랜드 하나의 값을 DTCG 토큰 JSON 한 곳에 두고,
웹·슬라이드·카드뉴스·인쇄 네 매체로 빌드하는 디자인 시스템 골격이다.
이름은 all-in-bb의 오마주. 직관으로 그리되, 그 직관이 AI의 기본값으로
미끄러지는 걸 게이트가 막는다.

아래는 `brands/example`의 토큰만으로 조판된 A4 스페시먼이다. 소스에 리터럴 값이
하나도 없고, 같은 JSON이 웹에서는 `oklch()` 그대로, 인쇄에서는 빌드가 변환한
sRGB로 나간다.

<p align="center"><img src="assets/readme/specimen.png" width="560" alt="example 브랜드 토큰만으로 조판된 A4 스페시먼 — 색 역할, 상태, 타입 스케일" /></p>

```
tokens/*.json ──▶ npm run build:tokens ──▶ dist/tokens.css   웹 · 슬라이드 · 카드뉴스
                                      └──▶ dist/tokens.typ   인쇄 (Typst)
```

## 왜 만들었나

에이전트한테 화면을 맡기면 통계적 평균이 나온다. 그라디언트 히어로, 가운데 정렬
스택, 똑같은 카드 세 장. 금지 목록으로 막아봐야 마감 직전에 다시 나타난다.

그래서 이 골격은 질문을 뒤집는다. "이 화면이 기본값인가?"가 아니라 **"이 브랜드의
어휘로 기본값을 발음할 수 있는가?"** 토큰셋에 blur와 gradient가 없으면 지름길
자체가 없다. 검사는 전부 실행 가능한 스크립트다:

| 게이트 | 스크립트 | 잡는 것 |
|---|---|---|
| 하드코딩 | `check-tokens.mjs` | 소스의 색·px 리터럴, 미정의 `var(--ds-*)` |
| 드리프트 | `check-drift.mjs` | 어휘 층위의 기본값 — 금지된 OKLCH 대역, 상태 토큰 부재 |
| 스테일 | `build-tokens.mjs --check` | 소스와 어긋난 dist (빌드 안 하고 컴파일하는 사고) |
| 렌더 | `shoot.mjs` | 실제 타깃 치수 스크린샷 |

게이트는 바닥이지 목표가 아니다. 전부 통과했다는 건 슬롭이 아니라는 뜻이지,
좋다는 뜻이 아니다.

## 구조

```
all-in-dd/
├── ENGINE.md            브랜드 무관 규칙 — 레이어, 매체, 게이트, 모션, 한글 조판
├── brands/
│   └── example/         복사해서 시작하는 템플릿 브랜드
│       ├── DESIGN.md    브랜드 성격 (9개 섹션, 값이 아니라 논지)
│       ├── tokens/      primitive → semantic → component 3층 DTCG JSON
│       └── print/       토큰만으로 조판되는 검증 문서
├── scripts/             빌드 + 게이트 + 폰트 설치
└── fonts/               (생성됨) 하우스 서체 풀 — git에는 없음
```

값은 `tokens/`에, 성격은 `DESIGN.md`에, 규칙은 `ENGINE.md`에 산다. 셋이 섞이기
시작하면 시스템이 죽는 거다.

## 설치

공통 준비물: Node 20+, [Typst](https://typst.app)(인쇄를 쓸 때만).

**Windows**

```powershell
git clone https://github.com/Chano-KR/all-in-dd
cd all-in-dd
npm install
npm run fetch:fonts      # 서체 풀 다운로드 (~50 MB, OFL)
npm run install:fonts    # 사용자 스코프 등록 — 관리자 권한 불필요
winget install Typst.Typst
```

**macOS**

```bash
git clone https://github.com/Chano-KR/all-in-dd
cd all-in-dd
npm install
bash scripts/fonts.sh    # 다운로드 + ~/Library/Fonts 설치
brew install typst
```

**Linux**

```bash
git clone https://github.com/Chano-KR/all-in-dd
cd all-in-dd
npm install
bash scripts/fonts.sh    # 다운로드 + ~/.local/share/fonts 설치 + fc-cache
# typst: 배포판 패키지 또는 https://github.com/typst/typst/releases
```

폰트 스크립트는 전부 멱등이라 몇 번을 다시 돌려도 있는 건 건너뛴다.
확인은 한 줄이면 된다:

```bash
npm run build:tokens && npm run print:example
```

`brands/example/print/proof.pdf`가 나오면 파이프라인 전체가 살아 있는 것.

## 새 브랜드 시작하기

```bash
cp -r brands/example brands/mybrand
```

그리고 순서가 중요하다.

1. `tokens/primitive/` — 팔레트·서체·스케일. 색은 `oklch()`로 저작하는 걸 권장한다.
   화면은 그대로 읽고, 인쇄용 변환은 빌드가 책임진다 (`scripts/lib/color.mjs`).
2. `tokens/semantic/` — 역할. **hover / press / focus 상태를 컴포넌트보다 먼저**
   정의할 것. 상태 토큰이 없으면 스크린샷은 전부 통과하는데 인터페이스는 죽어서
   나간다. 실제로 그렇게 출고해본 적이 있어서 하는 말이다.
3. `DESIGN.md` — 클레임과 시그니처 장치. 여기가 비어 있으면 토큰은 그냥 색 목록이다.
4. `npm run build:tokens` — `dist/`가 생기고, 이후는 게이트가 지킨다.

브랜드별 규칙과 매체 분기(웹/인쇄에서 갈라도 되는 값, 안 되는 값)는 `ENGINE.md`에
전부 있다. 긴 문서지만, 각 규칙마다 그게 왜 생겼는지가 붙어 있다 — 대부분은
실패 한 번의 값이다.

## 서체

하우스 풀은 전부 OFL이다: Wanted Sans · SUITE · SUIT · IBM Plex Sans KR (산세리프),
Hahmlet (세리프), [Jetendard](https://github.com/kuskhan/jetendard) (모노 — JetBrains
Mono에 Pretendard 한글). 셀프호스팅과 인쇄 임베드 모두 라이선스 문제가 없다.

한글 조판 규칙은 `ENGINE.md` §5에 있다. `word-break: keep-all`, 한글 우선 행간
바닥, 그리고 라틴 서체에 OS 폴백 한글을 얹는 건 폴백이 아니라 실패로 친다.
