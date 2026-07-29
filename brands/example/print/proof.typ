// proof.typ — proves the DTCG -> tokens.typ print pipeline with the example brand.
// Every value on this page comes from ds.*; the source contains no literals.
//   npm run print:example      (checks token staleness first, then compiles)

#import "../dist/tokens.typ": *

#let lh(n) = (n - 1) * 1em   // CSS line-height multiplier -> Typst leading

#set page(
  width: ds.print.frame.page-w,
  height: ds.print.frame.page-h,
  margin: ds.print.frame.margin,
  fill: ds.surface.page,
)
#set text(
  font: ds.font.serif,
  size: ds.print.text-size.body,
  fill: ds.text.primary,
  weight: ds.font-weight.body,
  lang: "ko",
)
#set par(leading: lh(ds.print.leading.body))

#let swatch(c, label) = box(inset: (y: 2pt))[
  #box(width: 28pt, height: 14pt, fill: c, radius: 2pt)
  #h(6pt)
  #text(font: ds.font.mono, size: ds.print.text-size.meta, fill: ds.text.secondary, label)
]

#text(font: ds.font.sans, size: ds.print.text-size.title,
  weight: ds.font-weight.display)[Token specimen — 한 원천, 네 매체]

#v(ds.space.at("4"))

이 페이지는 같은 토큰 JSON에서 웹과 함께 빌드된다. 화면은 `tokens.css`의
`oklch()`를 그대로 읽고, 이 지면은 빌드가 미리 변환한 sRGB를 받는다 — 감마맵을
Typst가 아니라 빌드가 소유한다. 본문은 Hahmlet, 제목은 Wanted Sans, 코드는
Jetendard. 세 얼굴 모두 한글이 일급이다.

#v(ds.space.at("5"))

#text(font: ds.font.sans, weight: ds.font-weight.strong)[Colour roles]
#v(ds.space.at("2"))
#swatch(ds.text.primary, "text.primary")
#h(10pt) #swatch(ds.text.secondary, "text.secondary")
#h(10pt) #swatch(ds.surface.panel, "surface.panel")
#linebreak()
#swatch(ds.action.base, "action.base")
#h(10pt) #swatch(ds.action.hover, "action.hover")
#h(10pt) #swatch(ds.action.press, "action.press")
#h(10pt) #swatch(ds.action.wash, "action.wash")

#v(ds.space.at("5"))
#line(length: 100%, stroke: 0.5pt + ds.surface.line)
#v(ds.space.at("5"))

#text(font: ds.font.sans, weight: ds.font-weight.strong)[Type scale]
#v(ds.space.at("2"))
#text(font: ds.font.mono, size: ds.print.text-size.meta,
  fill: ds.text.secondary)[meta — Jetendard #ds.print.text-size.meta]
#linebreak()
body — 국립국어원 표기 기준을 따르는 본문 한 줄. The quick brown fox.
#linebreak()
#text(font: ds.font.sans, size: ds.print.text-size.title,
  weight: ds.font-weight.display)[title — 제목은 산세리프가 맡는다]
