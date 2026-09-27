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
