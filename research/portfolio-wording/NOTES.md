# Portfolio research / 2026-09-26

Entry point: [SANKOU! — ポートフォリオサイト](https://sankoudesign.com/category/portfoliosite/).

Opened the six public websites below, inspected their rendered pages and extracted headings, navigation and project text. Captures and raw observations are stored beside this note. Captures are moments in animated/lazy-loaded pages, not evidence that every image or video had loaded. This is a focused design/content review, not a performance or accessibility audit of those sites.

## Observations and decisions

| Actual site | Observation | Application to hinahina |
| --- | --- | --- |
| [Shogo Tominaga](https://shogotominaga.com/) | A full-screen work video carries the homepage. Personal identity and menu form a compact, high-contrast control over the image. | Keep the creator's original full-screen shader, give the work image visual priority, and make identity/navigation compact. Preserve actual buttons. Do not copy the site's biography, career claims or exact layout. |
| [岡田雄基](https://ykokd.com/) | Creator name and disciplines establish authorship; work images and concrete project accounts carry the content. | Use the supplied name hinahina and specific descriptions of each site's function. No invented clients, roles, dates or awards. |
| [Toshiyuki Hashimoto](https://toshiyukihashimoto.jp/) | Strong differences in typographic scale; personal name is the identity. Actions distinguish projects, biography and video destinations. | Separate author, work title, description and controls through scale. Use Visit website for public sites and Open showcase for studies inside a collection. |
| [Yusuke Fukunaga](https://yusukefukunaga.com/) | Personal name and field of work identify the site; About and Contact are direct labels. | Author plus a factual scope descriptor, Web & interactive works. Avoid the generic MY PORTFOLIO title. Do not invent a job title or contact address. |
| [夜.](https://yoru.design/) | A specific activity name and creator identity; short discipline labels accompany actual project names. | Retain original project names, including Japanese titles, and use English interface/description text. |
| [not-here.jp](https://www.not-here.jp/) | A distinctive site identity with work records and practical metadata. | Content should describe the work rather than add abstract promotional slogans. |

## Composition applied in v2.2.0

- The prior centered, equally weighted text/image pair became a large image at upper right and a lower-left title that crosses its edge. This asymmetry is our adaptation, not an exact composition copied from a reference.
- The real screenshot remains 80% opaque. Hover/focus increases it to 92%.
- Header identity is hinahina, explicitly supplied by the user in this conversation. A smaller descriptor states Web & interactive works.
- A high-contrast Visit website button distinguishes the main external action. English category controls, index, work-selection buttons and original background controls remain usable buttons.
- The first work remains 惑星の放課後. Existing URLs, original WebGL renderers and the seven work entries remain intact.
- No decorative ordinal numbers, diagonal arrows, faux credentials, availability badges, client names or made-up years were added.
- On smaller screens the screenshot sits above the title; the title crosses the bottom edge slightly. Descriptions and actions remain below it in normal reading order.

## Project-copy evidence

- [惑星の放課後](https://gaia-senseware.pages.dev/): the public site's captured text explains a narrative and the conversion of Earth observation/open data into graphics. Evidence: qa/v2/gaia-senseware-content.txt. The portfolio describes this without claiming scientific accuracy or unverified API freshness.
- [GLSL Effects Showcase](https://glsl-effects-showcase.pages.dev/): actual project and original local source contain shader studies, fluid renderers, particles and live controls. Local source reviewed: ../glsl-effects-showcase/src/effects/featured.ts and aquatic.ts. The source project was not edited.
- [鉄道でつなぐ中国の街](https://chinameng.pages.dev/): rendered map exposes railway layers, cities, World Heritage sites, visited-place records and a trip planner. Evidence: qa/v2/chinameng-content.txt.
- [Quiz Pal](https://hinahina-vr.github.io/quiz-pal/): rendered app exposes question creation/editing, quizzes, results/history and local save/export. Evidence: qa/v2/quiz-pal-content.txt. The portfolio does not claim to test all features of this separate app.
- Lilian Kaleido Loom, Botanical Tide and Gesture Cut Field are studies inside GLSL Effects Showcase. Their introductions are based on the corresponding source definitions. Each explicitly identifies the collection and the effect name to select; their button opens the collection homepage.

## Experiments replacement / v2.3.2

- The creator requested replacing Gesture Cut Field with 神話製作機械. Read the live [concept section](https://gaia-senseware.pages.dev/concept/#depth) in real Chrome and captured its actual 1440×900 screen. Evidence: `qa/v2.3.2/myth-source-content.txt`, `qa/v2.3.2/myth-source.png`.
- It is presented as a concept study, not a completed decision-making application. Its central question concerns human agency in relation to data-derived optimal answers; the proposed oracle offers possible futures and leaves acceptance, rejection and interpretation to the person.
- The portfolio uses a Japanese exhibit caption, an English medium label and Open concept button. Both the image and button open the supplied URL with its #depth anchor. Visual studies and the four Web works remain unchanged.

## Limits

The research informs a concrete design direction; passing layout tests does not establish that the user approves the aesthetics. Six references are a focused sample, not an exhaustive survey of the category. Author biography, commissioning availability and contact details have not been supplied and were not invented.
