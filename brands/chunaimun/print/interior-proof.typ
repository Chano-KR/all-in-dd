// interior-proof.typ — first real document through the DTCG → tokens.typ pipeline.
// Validates ENGINE §2.3 end-to-end: page geometry, print type scale, leading,
// writable blanks (rule-rhythm), and layer-1 colour — all from ds.*, no literals.
// Print thesis (DESIGN.md): 지면은 채워 넣는 곳이다 — web draws the chain, paper
// gives you the blank. Compile:  typst compile interior-proof.typ

#import "../dist/tokens.typ": *

// CSS line-height (multiplier) -> Typst leading (inter-line gap)
#let lh(n) = (n - 1) * 1em

// Installed spelling of the family differs from the token's CSS-facing name;
// appending it keeps the token tuple authoritative and the fallback local.
#let read-font = ds.font.read + ("NanumMyeongjo",)
#let prose-font = ds.font.prose + ("NanumGothic", "Malgun Gothic")
#let mono-font = ds.font.notation + ("NanumGothic Coding", "Consolas")

#set page(
  width: ds.print.frame.page-w,
  height: ds.print.frame.page-h,
  margin: (
    top: ds.print.frame.margin-top + ds.print.frame.running-head,
    bottom: ds.print.frame.margin-bottom + ds.print.frame.folio,
    inside: ds.print.frame.margin-inner,
    outside: ds.print.frame.margin-outer,
  ),
  fill: ds.ground.at("000"),
  header: text(
    font: prose-font, size: ds.print.text-size.meta,
    tracking: ds.print.tracking.meta, fill: ds.ink.at("500"),
    upper[천AI문 · 구문 워크북 · 시험지 한 부]
  ),
  footer: align(center, text(
    font: mono-font, size: ds.print.text-size.meta, fill: ds.ink.at("500"),
    context counter(page).display()
  )),
)

#set text(
  font: read-font,
  size: ds.print.text-size.body,
  fill: ds.ink.at("900"),
  weight: ds.font-weight.body,
  tracking: ds.print.tracking.body,
  lang: "ko",
)
#set par(leading: lh(ds.print.leading.read), justify: true)

// ---- a writable blank: the interior's whole argument ----
// write-height of clear room above the rule, otherwise the page is a picture
// of a form rather than a form.
#let blank(w) = box(
  width: w,
  height: ds.print.rule-rhythm.write-height,
  stroke: (bottom: ds.print.rule-rhythm.thickness + ds.blank.rule-empty),
)

// a blank the reader has already filled — pen ink, and only here
#let filled(w, body) = box(
  width: w,
  height: ds.print.rule-rhythm.write-height,
  stroke: (bottom: ds.print.rule-rhythm.thickness + ds.blank.rule-filled),
  align(bottom + center, text(
    fill: ds.blank.text-written, weight: ds.font-weight.written,
    font: prose-font, body
  )),
)

// output-role tag: one ink per kind of document the book produces
#let tag(c, label) = box(inset: (x: ds.blank.pad-x, y: 2pt), stroke: 0.5pt + c,
  text(font: mono-font, size: ds.print.text-size.micro, fill: c, tracking: ds.print.tracking.meta, upper(label)))

// ---------------- page ----------------

#text(font: prose-font, size: ds.print.text-size.title,
  weight: ds.font-weight.display, tracking: ds.print.tracking.display,
  fill: ds.ink.at("900"))[2강 — 관계절은 어디에 붙는가]

#v(ds.print.rule-rhythm.pitch - ds.print.text-size.body)

이 페이지는 파이프라인 검증 문서다. 지면의 논지는 하나다: *지면은 채워 넣는 곳이다.*
웹이 연쇄를 그려 보인다면, 종이는 빈칸을 내어준다. 아래 본문은 나눔명조로 조판되고,
행간과 자간, 판면 여백, 괘선의 굵기와 높이까지 전부 토큰에서 왔다 — 이 문서 소스에
리터럴 값은 없다.

#v(ds.print.rule-rhythm.pitch)

#text(font: prose-font, size: ds.print.text-size.lead, weight: ds.font-weight.strong)[확인 1 — 다음 문장의 관계절에 밑줄을 긋고, 선행사를 빈칸에 적으시오.]

#v(ds.print.rule-rhythm.write-height)

#set par(leading: lh(ds.print.leading.body))

The committee rejected the proposal #text(fill: ds.ink.at("600"))[that the
younger members had spent months preparing], a decision nobody defended in
public.

#v(ds.print.rule-rhythm.pitch)

선행사: #filled(8em)[the proposal] #h(1fr) 관계사: #blank(6em) #h(1fr) 격: #blank(4em)

#v(ds.print.rule-rhythm.pitch)

#text(font: prose-font, size: ds.print.text-size.lead, weight: ds.font-weight.strong)[확인 2 — 빈칸을 채워 문장을 완성하시오.]

#v(ds.print.rule-rhythm.write-height)

관계절은 명사를 꾸미는 절이고, 그 명사를 #blank(5em) 라 부른다.
관계사가 절 안에서 주어 노릇을 하면 #blank(5em) 격, 목적어 노릇을 하면
#blank(5em) 격이다. 목적격 관계사는 #blank(6em) 할 수 있다.

#v(ds.print.rule-rhythm.pitch)

#line(length: 100%, stroke: ds.print.rule-rhythm.thickness + ds.ground.at("400"))

#v(ds.print.rule-rhythm.write-height)

#text(font: prose-font, size: ds.print.text-size.small, fill: ds.ink.at("600"))[
이 강의 출력물 — 한 색이 문서 한 종류다: ]
#tag(ds.output.exam)[시험지] #h(0.5em)
#tag(ds.output.drill)[단어 테스트] #h(0.5em)
#tag(ds.output.analysis)[시험 분석지] #h(0.5em)
#tag(ds.output.mock)[동형 모의고사]
