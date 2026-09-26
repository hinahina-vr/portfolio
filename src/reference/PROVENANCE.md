# Reference source

These renderer and effect sources were copied from the user's own project:

`C:/Users/wdddi/workspace/glsl-effects-showcase/src/`

Public site: https://glsl-effects-showcase.pages.dev/

Copied 2026-09-26 for the user's explicit request to base the portfolio on this site's actual visual world. `FluidFxCanvas.tsx` and `effects/` retain the original rendering code. Integration, content, and layout live outside this directory.

Portfolio v2.1 adds a pause guard to the copied `ShaderCanvas.tsx`: the original continued updating pointer inertia after pausing time. The guard retains the last rendered frame while paused, while allowing initial render, settings changes, and resizing. Effect shaders are unchanged. The source project itself is untouched.

Active effects: `lilian-kaleido-loom`, `kelp-current`, `fluid-chrome-stream`.

`FluidFxCanvas.tsx` uses Three.js and three-fluid-fx (MIT). Dependency versions and licenses are tracked in the lockfile and `public/licenses/`.
