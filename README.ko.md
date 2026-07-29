<p align="center"><img src="assets/readme/logo.png" width="220" alt="all-in-dd — DD 모노그램 로고" /></p>

<img src="assets/readme/hero.svg" width="100%" alt="all-in-dd — 토큰 하나에서 웹, 슬라이드, 카드뉴스, 인쇄로 뻗는 파이프라인" />

<p align="right"><a href="README.md">English</a></p>

**all-in-dd**는 *all in direct design*, 코딩 에이전트와 비주얼 작업을 하기 위한
디자인 시스템 골격이다. 브랜드 하나의 값을 DTCG 토큰 JSON 한 곳에 두고 빌드 한 번으로
네 매체에 뿌린다 — 웹, 슬라이드 덱, 카드뉴스, 인쇄.

나머지 절반은 게이트다. 모델한테 랜딩 페이지를 시키면 학습 데이터의 중앙값이
나온다. 그라디언트 히어로, 가운데 정렬, 똑같은 카드 세 장. 금지 목록은 마감 앞에서
버티지 못하니까, 여기 게이트들은 어휘를 공격한다 — *blur*, *gradient*, *glass*를
발음할 수 없는 토큰셋에는 그리로 돌아갈 지름길이 없다.

아래 페이지는 `brands/example` 토큰만으로 조판했다. 소스에 리터럴 값이 없다.
같은 JSON이 웹에는 `oklch()` 그대로, 인쇄에는 빌드가 변환한 sRGB로 나간다:

<p align="center"><img src="assets/readme/specimen.png" width="560" alt="example 브랜드 토큰만으로 조판한 A4 스페시먼 — 색 역할, 상태, 타입 스케일" /></p>

```
tokens/*.json ──▶ npm run build:tokens ──▶ dist/tokens.css   웹 · 슬라이드 · 카드뉴스
                                      └──▶ dist/tokens.typ   인쇄 (Typst)
```

## 워크플로

값과 게이트는 절반이다. 나머지 절반은 순서 — [`WORKFLOW.md`](WORKFLOW.md)는 6단계
머신이고, 각 단계가 그 안에서 뭘 로드하는지 직접 지정한다.

```
S0 리서치 ─▶ S1 발산 ─▶ S2 락 ─▶ S3 토큰화 ─▶ S4 제작 ─▶ S5 정제
                                    ▲                        │
                                    └──── 없는 값이 필요 ────┘
```

이게 있는 이유는, 이걸 건너뛴 실행이 모든 검사를 통과하고도 생성물 티가 나는
결과를 냈기 때문이다. 무게를 지는 규칙 둘: S1에서는 방향마다 **다른** 저자를 쓴다.
한 목소리는 브리프가 아무리 달라도 수렴한다. 그리고 S4에서는 룩을 강제하는 도구를
막는다. 룩은 이미 잠겼고, 두 번째 권위는 토큰과 다툴 뿐이다.


단계들은 추상 분류가 아니라 실제 스킬명을 지정한다. 먼저 설치할 것 — 체크가 뭐가
없는지 알려주고 고치는 줄까지 찍어준다:

```bash
npm run check:skills

npx skills add Leonxlnx/taste-skill    # S1 저자 5종, imagegen, image-to-code
npx skills add emilkowalski/skills     # apple-design, emil-design-eng, 모션 패스
npx skills add https://github.com/pbakaus/impeccable --skill impeccable   # 감사
```

[`SKILLS.md`](SKILLS.md)에 전부 — 뭘 하는지, 어느 단계가 필요로 하는지. 스킬이 없다고
치명적이진 않지만 반드시 소리 내서 말할 것. S1 저자가 얇으면 아이디어 넷이 아니라 한
아이디어의 변주 넷이 나온다.

## 게이트

전부 실행 가능한 스크립트고, 하나하나가 뭔가 잘못 나간 적이 있어서 생겼다.

| 게이트 | 스크립트 | 잡는 것 |
|---|---|---|
| 하드코딩 | `check-tokens.mjs` | 소스의 hex·px 리터럴, 미정의 `var(--ds-*)` |
| 드리프트 | `check-drift.mjs` | 어휘 층위의 기본값 — 금지 OKLCH 대역, 상태 토큰 부재 |
| 스테일 | `build-tokens.mjs --check` | 소스와 어긋난 dist |
| 렌더 | `shoot.mjs` | 실제 타깃 치수 스크린샷 |

통과했다는 건 슬롭이 아니라는 뜻이다. 좋다는 뜻이 아니다 — 게이트는 바닥이지
목표가 아니다.

## 구조

```
all-in-dd/
├── ENGINE.md            브랜드 무관 규칙 — 레이어, 매체, 게이트, 모션, 한글 조판
├── WORKFLOW.md          S0–S5 스테이지 머신 — 각 단계에 뭐가 로드되는가
├── SKILLS.md            스킬 전체 목록 — 뭘 하는지, 어떻게 설치하는지
├── AGENTS.md            코딩 에이전트용 지침 (CLAUDE.md가 여길 가리킴)
├── brands/
│   └── example/         복사해서 시작하는 템플릿 브랜드
│       ├── DESIGN.md    브랜드 성격 — 값이 아니라 논지
│       ├── tokens/      primitive → semantic → component, DTCG JSON
│       └── print/       토큰만으로 조판되는 검증 문서
├── scripts/             빌드 + 게이트 + 폰트 설치
└── fonts/               (생성됨) 서체 풀 — git에는 안 들어감
```

값은 `tokens/`에, 성격은 `DESIGN.md`에, 규칙은 `ENGINE.md`에, 순서는
`WORKFLOW.md`에 산다. 서로 새기 시작하면 시스템이 죽어가는 중인 거다.

## 설치

공통으로 Node 20+, 인쇄를 쓰면 [Typst](https://typst.app).

**Windows**

```powershell
git clone https://github.com/Chano-KR/all-in-dd
cd all-in-dd
npm install
npm run fetch:fonts      # 서체 풀 다운로드 (~50 MB, 전부 OFL)
npm run install:fonts    # 사용자 스코프 등록, 관리자 권한 불필요
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
bash scripts/fonts.sh    # 다운로드 + ~/.local/share/fonts 설치, fc-cache 실행
# typst: 배포판 패키지 또는 https://github.com/typst/typst/releases
```

폰트 스크립트는 멱등이라 몇 번을 다시 돌려도 있는 건 건너뛴다. 확인은 한 줄:

```bash
npm run build:tokens && npm run print:example
```

`brands/example/print/proof.pdf`가 나오면 전부 살아 있는 것.

## 새 브랜드 시작

```bash
cp -r brands/example brands/mybrand
```

순서가 생각보다 중요하다.

1. `tokens/primitive/` — 팔레트, 서체, 스케일. 색은 `oklch()`로 저작한다. 웹은
   그대로 읽고, 인쇄 변환은 빌드가 책임진다 (`scripts/lib/color.mjs`).
2. `tokens/semantic/` — 역할. hover / press / focus를 **컴포넌트가 생기기 전에**
   정의할 것. 상태 토큰 없는 표면은 스크린샷 게이트를 전부 통과하고도 죽은 채
   출고된다. 실제로 그렇게 나간 적이 있다.
3. `DESIGN.md` — 클레임과 시그니처 장치. 여기가 비어 있으면 토큰은 그냥 색
   목록이다.
4. `npm run build:tokens` — dist가 생기고, 이후는 게이트가 지킨다.

브랜드별 규칙과 매체 분기 — 화면과 지면에서 갈라도 되는 값, 절대 안 되는 값 —
는 `ENGINE.md`에 있다. 길지만, 규칙마다 그걸 만들게 한 실패가 붙어 있다.

## 서체

하우스 풀은 전부 OFL이다. Wanted Sans · SUITE · SUIT · IBM Plex Sans KR
(산세리프), Hahmlet (세리프), [Jetendard](https://github.com/kuskhan/jetendard)
(모노 — JetBrains Mono에 Pretendard 한글). 셀프호스팅도 인쇄 임베드도 깨끗하다.

한글 조판 규칙은 `ENGINE.md` §5. `word-break: keep-all`, 한글 우선 행간 바닥,
그리고 라틴 서체에 OS 폴백 한글을 얹는 건 폴백이 아니라 실패다.

## 에이전트

이 레포에서 에이전트를 돌린다면 [`AGENTS.md`](AGENTS.md)부터 — 불변 규칙, 커맨드,
그리고 취향·크래프트·감사 스킬이 워크플로 어디에 속하는지가 있다.

---

<p align="center">
  <a href="https://github.com/oil-oil/beautify-github-readme"><img src="assets/readme/made-with-beautify.svg" width="300" alt="README made with beautify-github-readme"></a>
</p>
