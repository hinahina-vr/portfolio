# Water fusion — local 2.7.0

2026-09-27. Local production build tested in desktop Chrome.

- npm run build: PASS.
- npm test: all 17 checks PASS, including existing navigation, project links,
  controls, reduced motion and all 12 previews at five viewport sizes.
- scripts/check-water-fusion.mjs: five checks PASS. Original GLSL canvas frames
  upload to the FFT optical renderer, with GL error 0. Both renderers pause/resume.
  Visual retains its two original works. Texture resize works at 390px. Losing
  the optical WebGL context exposes the original live scene without blocking UI.
- Botanical and Lilian screenshots visually inspected. Evidence: qa/water-fusion.
- Desktop Chrome only; mobile is viewport emulation. No video recorded.

- scripts/check-handoff.mjs: PASS. Replacement surface is opaque before the transition canvas is removed.

Deployment verification will be recorded after publishing this revision.

CI follow-up: the first Linux run timed out at 15 minutes during continuous software rendering (motion checks had passed). Added a real software-renderer quality profile: 64-point FFT, 256px caustics and reduced optical resolution; hardware profile unchanged. Paused navigation/layout checks after separately testing motion. Full 17 local tests and all 5 fusion checks passed again. Explicit SwiftShader fusion checks also passed (WATER_SOFTWARE=1); no mock rendering used.

Published verification (2026-09-27): GitHub Actions 36289417482 passed build, all browser tests and Pages deploy. Public build.json confirms version 2.7.0, commit f4c6f2338a4f27f31ff6962ff292c05a37cc8a10. check-deployment.mjs passed all five public checks (12 previews, real timed advance, external concept link, mobile navigation, exact revision, no runtime/asset errors). check-water-fusion.mjs against https://hinahina-vr.github.io/portfolio/ passed all five checks. Public Botanical screenshot visually inspected. Physical mobile devices and Safari/Firefox remain untested.
