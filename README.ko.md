<p align="center"><img src="assets/readme/logo.png" width="220" alt="all-in-dd DD 모노그램 로고" /></p>

<img src="assets/readme/hero.svg" width="100%" alt="all-in-dd. 토큰 하나에서 웹, 슬라이드, 카드뉴스, 인쇄로 뻗는 파이프라인" />

<p align="right"><a href="README.md">English</a></p>

**all-in-dd**는 *all in direct design*의 줄임말로, 코딩 에이전트와 함께 비주얼 작업을 하기 위한
디자인 시스템 골격입니다. 브랜드 하나가 쓰는 모든 값을 DTCG 토큰 JSON 한 곳에 모아두고, 빌드를
한 번 돌리면 네 가지 매체로 동시에 뻗어 나갑니다. 웹 화면, 슬라이드 덱, 카드뉴스 이미지,
그리고 인쇄물입니다.

나머지 절반은 게이트입니다. 능력 있는 모델에게 랜딩 페이지를 맡기면 학습 데이터의 중앙값이
나옵니다. 이걸 막겠다고 "그라디언트 금지, 글래스 금지, 다크모드 금지" 같은 목록을 만들기 쉬운데,
그 방식은 통하지 않습니다. 슬롭은 어휘의 문제가 아니라 완성도의 문제이기 때문입니다. 정성껏
만든 글래스 인터페이스는 슬롭이 아니고, 결정 없이 찍어낸 에디토리얼은 슬롭입니다. 그래서 여기
게이트들은 다른 것을 묻습니다. **여기서 결정이 내려졌는가, 아니면 기본값이 그냥 도착했는가.**

아래 이미지는 `brands/example`의 토큰만으로 조판한 A4 페이지입니다. 문서 소스에는 색이나 크기를
직접 적은 값이 한 군데도 없습니다. 같은 JSON이 웹으로는 `oklch()` 그대로 나가고, 인쇄로는
빌드가 변환한 sRGB로 나갑니다.

<p align="center"><img src="assets/readme/specimen.png" width="560" alt="example 브랜드 토큰만으로 조판한 A4 스페시먼. 색 역할, 상태, 타입 스케일이 보인다" /></p>

```
tokens/*.json ──▶ npm run build:tokens ──▶ dist/tokens.css   웹 · 슬라이드 · 카드뉴스
                                      └──▶ dist/tokens.typ   인쇄 (Typst)
```

## 워크플로

값과 게이트만으로는 절반입니다. 나머지 절반은 어떤 순서로 일하느냐입니다.
[`WORKFLOW.md`](WORKFLOW.md)에 6단계 머신이 정의되어 있고, 각 단계는 자기 안에서 무엇을 불러
쓸지 직접 지정합니다.

```
S0 리서치 ─▶ S1 발산 ─▶ S2 락 ─▶ S3 토큰화 ─▶ S4 제작 ─▶ S5 정제
                                    ▲                        │
                                    └──── 없는 값이 필요 ────┘
```

이 순서가 문서로 남아 있는 이유는, 이 과정을 건너뛴 실행이 모든 검사를 통과하고도 결국 "AI가
만든 티가 나는" 결과를 냈기 때문입니다. 그중 무게를 가장 많이 지는 규칙이 둘 있습니다.

첫째, S1에서는 방향마다 서로 다른 저자를 씁니다. 한 목소리가 만든 시안들은 브리프를 아무리
다르게 줘도 결국 비슷한 곳으로 수렴하기 때문입니다. 둘째, S4에서는 룩을 강제하는 도구를
막습니다. 이 시점에는 룩이 이미 잠겨 있어서, 그런 도구를 부르면 토큰과 다투는 두 번째 권위가
생길 뿐입니다.

각 단계는 추상적인 분류가 아니라 실제 스킬 이름을 지정합니다. 먼저 설치하세요. 아래 체크 명령이
무엇이 빠졌는지 알려주고, 그것을 채우는 설치 줄까지 출력해 줍니다.

```bash
npm run check:skills

npx skills add nextlevelbuilder/ui-ux-pro-max-skill   # S0 장르 프리셋 (참고용)
npx skills add Leonxlnx/taste-skill    # S1 저자 5종, imagegen, image-to-code
npx skills add emilkowalski/skills     # apple-design, emil-design-eng, 모션 패스
npx skills add https://github.com/pbakaus/impeccable --skill impeccable   # 감사
```

[`SKILLS.md`](SKILLS.md)에 전체 목록이 있습니다. 각각이 무엇을 하고 어느 단계가 필요로 하는지
정리해 두었습니다. 스킬이 없다고 작업이 막히지는 않지만, 없다는 사실은 반드시 소리 내어 말해야
합니다. 특히 S1의 저자가 얇으면 아이디어 넷이 아니라 한 아이디어의 변주 넷이 나옵니다.

## 게이트

모두 실행 가능한 스크립트이고, 하나하나가 실제로 무언가 잘못 나간 뒤에 생겼습니다.

| 게이트 | 실행 방식 | 잡는 것 |
|---|---|---|
| 크래프트 | 판단, S1과 S4에서 | 결정이 있어야 할 자리에 도착한 기본값 |
| 토큰 준비도 | `check-drift.mjs` | 상태·대비·스케일 분화가 빠진 토큰셋 |
| 하드코딩 | `check-tokens.mjs` | 소스에 직접 적힌 hex와 px, 정의되지 않은 `var(--ds-*)` |
| 스테일 | `build-tokens.mjs --check` | 소스와 어긋난 채로 남아 있는 dist |
| 접근성 | axe-core | 의도한 표면이 아니라 실제 렌더된 표면 기준 대비 |
| 렌더 | `shoot.mjs` | 실제 타깃 치수로 찍은 스크린샷 |
| 인터랙션 | `check-interactions.mjs` | hover·focus·모션·reduced-motion. 스크린샷에 안 보이는 것 |

`npm test`는 게이트 스크립트에 오염 입력을 먹입니다. 모든 케이스가 양방향을 검사합니다.
정상 입력은 통과하고, 망가진 입력은 실패하며, **명시한 사유로** 실패해야 합니다. 이게 있는
이유는 하루에 나온 결함 넷이 전부 같은 형태였기 때문입니다. 아무것도 검사하지 않고 성공을
보고하는 검사였습니다.

통과했다는 것은 슬롭이 아니라는 뜻이지, 좋다는 뜻이 아닙니다. 게이트는 바닥이지 목표가
아닙니다.

## 구조

```
all-in-dd/
├── ENGINE.md            브랜드 무관 규칙. 레이어, 매체, 게이트, 모션, 한글 조판
├── WORKFLOW.md          S0~S5 스테이지 머신. 각 단계에 무엇이 로드되는가
├── SKILLS.md            스킬 전체 목록. 무엇을 하고 어떻게 설치하는가
├── ROADMAP.md           앞으로의 방향과 각 단계가 규칙을 어떻게 바꾸는가
├── catalog/             S1 발산 선택용 저자 좌표 (손으로 분류)
├── AGENTS.md            코딩 에이전트용 지침 (CLAUDE.md가 여기를 가리킴)
├── brands/
│   └── example/         복사해서 시작하는 템플릿 브랜드
│       ├── DESIGN.md    브랜드 성격. 값이 아니라 논지를 적는 곳
│       ├── tokens/      primitive → semantic → component 순서의 DTCG JSON
│       └── print/       토큰만으로 조판되는 검증 문서
├── scripts/             빌드, 게이트, 폰트 설치
└── fonts/               (생성됨) 서체 풀. git에는 올라가지 않음
```

값은 `tokens/`에, 성격은 `DESIGN.md`에, 규칙은 `ENGINE.md`에, 순서는 `WORKFLOW.md`에 삽니다.
이것들이 서로에게 새어 들어가기 시작하면 시스템이 죽어가고 있다는 신호입니다.

## 설치

공통으로 Node 20 이상이 필요하고, 인쇄를 쓴다면 [Typst](https://typst.app)도 있어야 합니다.

**Windows**

```powershell
git clone https://github.com/Chano-KR/all-in-dd
cd all-in-dd
npm install
npm run fetch:fonts      # 서체 풀 다운로드 (약 50 MB, 전부 OFL)
npm run install:fonts    # 사용자 스코프 등록. 관리자 권한이 필요 없습니다
winget install Typst.Typst
```

**macOS**

```bash
git clone https://github.com/Chano-KR/all-in-dd
cd all-in-dd
npm install
bash scripts/fonts.sh    # 다운로드 후 ~/Library/Fonts에 설치
brew install typst
```

**Linux**

```bash
git clone https://github.com/Chano-KR/all-in-dd
cd all-in-dd
npm install
bash scripts/fonts.sh    # 다운로드 후 ~/.local/share/fonts에 설치하고 fc-cache 실행
# typst는 배포판 패키지 또는 https://github.com/typst/typst/releases 에서 받습니다
```

폰트 스크립트는 멱등이라 몇 번을 다시 돌려도 이미 있는 것은 건너뜁니다. 전체가 제대로
설치됐는지는 한 줄로 확인할 수 있습니다.

```bash
npm run build:tokens && npm run print:example
```

`brands/example/print/proof.pdf`가 만들어지면 파이프라인 전체가 살아 있는 것입니다.

## 새 브랜드 시작하기

```bash
cp -r brands/example brands/mybrand
```

작업 순서가 생각보다 중요합니다.

1. **`tokens/primitive/`** 부터 채웁니다. 팔레트, 서체, 스케일입니다. 색은 `oklch()`로
   저작하기를 권합니다. 웹은 그 값을 그대로 읽고, 인쇄용 변환은 빌드가 책임집니다
   (`scripts/lib/color.mjs`).
2. **`tokens/semantic/`** 에서 역할을 정의합니다. hover, press, focus 상태를 **컴포넌트가
   생기기 전에** 만들어 두세요. 상태 토큰이 없는 표면은 스크린샷 게이트를 전부 통과하고도
   반응이 죽은 채로 출고됩니다. 실제로 그렇게 내보낸 적이 있어서 드리는 말씀입니다.
3. **`DESIGN.md`** 에 클레임과 시그니처 장치를 적습니다. 이 문서가 비어 있으면 토큰은 그냥
   색 목록에 지나지 않습니다.
4. **`npm run build:tokens`** 를 돌리면 `dist/`가 생기고, 그 뒤로는 게이트가 지켜 줍니다.

브랜드별 규칙과 매체 분기, 즉 화면과 지면에서 달라져도 되는 값과 절대 달라지면 안 되는 값은
`ENGINE.md`에 정리되어 있습니다. 분량이 적지는 않지만, 규칙마다 그것을 만들게 한 실패가 함께
적혀 있습니다.

## 서체

하우스 풀은 전부 OFL 라이선스입니다. 산세리프는 Wanted Sans, SUITE, SUIT, IBM Plex Sans KR을
쓰고, 세리프는 Hahmlet, 모노는 [Jetendard](https://github.com/kuskhan/jetendard)를 씁니다.
Jetendard는 JetBrains Mono에 Pretendard 한글을 얹은 서체입니다. 셀프호스팅도 인쇄 임베드도
라이선스 문제가 없습니다.

한글 조판 규칙은 `ENGINE.md` 5절에 있습니다. `word-break: keep-all`을 걸고, 행간 바닥을 한글
기준으로 잡으며, 라틴 서체에 OS 기본 한글 폴백을 얹는 것은 폴백이 아니라 실패로 봅니다.

## 에이전트

이 저장소에서 에이전트를 돌린다면 [`AGENTS.md`](AGENTS.md)를 먼저 읽히세요. 불변 규칙, 커맨드
목록, 그리고 취향·크래프트·감사 스킬이 워크플로 어디에 속하는지가 정리되어 있습니다.

---

<p align="center">
  <a href="https://github.com/oil-oil/beautify-github-readme"><img src="assets/readme/made-with-beautify.svg" width="300" alt="README made with beautify-github-readme"></a>
</p>
