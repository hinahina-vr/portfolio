# Motion study — 2026-09-26

## User constraints

The user rejected both sequential, presentation-like timing and the effects themselves. Keep full-viewport scope, flexible/jelly material, motion typography, real screenshots, buttons, English menus, Japanese exhibition copy and the original WebGL world. Remove the black television-like frame. Do not treat a faster sequence as the solution.

## Direct observation and sources

- SANKOU portfolio category: https://sankoudesign.com/category/portfoliosite/ — opened the supplied index; selected 夜. for a Japanese portfolio comparison. Its small fixed identity / work list is a hierarchy reference, not an animation model for this request. https://yoru.design/ was opened in Chrome; initial capture only.
- Original https://glsl-effects-showcase.pages.dev/ — opened in Chrome, original-initial.png. Preserve its flowing continuous background and palette. Its controls are tools surrounding a work, not a reason to add a monitor casing to every image.
- https://tympanus.net/Development/LiquidDistortion/ — actually clicked next in Chrome, captured at approximately 123, 527, 997 and 1715ms plus video. The displayed image deforms as a surface rather than becoming a rotating cylinder. Borrow the displacement principle, not its pacing: the primary article's example explicitly chains distortion, outgoing fade, incoming fade and recovery, which is contrary to this user's overlap request. https://tympanus.net/codrops/2017/10/10/liquid-distortion-effects/
- https://tympanus.net/Development/KineticTypePageTransition/ — actually clicked the first work. Captures at 126, 465, 872 and 1502ms show background typography becoming an overall transition layer. Useful for treating type as composition, but the full-screen word wall/rotation is unsuitable here after the user's rejection of giant title demonstrations. Do not reproduce that effect.
- https://unseen.co/ — entered without audio, waited for scene, opened menu and captured transition. The coherent visual scene and foreground hierarchy are useful. Pink architecture, serif/sans branding and exact assets are not to be copied. Captures unseen-ready.png and unseen-motion-*.png.
- https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/ — primary author explanation: outgoing and incoming section callbacks fire together. Technical basis for non-blocking overlap.
- https://tympanus.net/codrops/2026/04/07/r-k-26-the-thinking-and-code-behind-a-portfolio-led-by-presence/ — primary author explanation: removed an excessive peel/rotation approach, coordinated masks and text with common easing and overlap. Opened the live site too, but the captures mostly show loading; do not claim its full live transitions were visually verified.

## Design decision

Use one broad deformation field crossing the viewport. The screenshot mesh and typography sample the same field, rather than spinning, enlarging and bouncing independently. Begin the outgoing and incoming contents on the same clock. No full-screen title stop, per-letter entrance schedule, cylindrical roll, or bezel. Keep the opaque resting screenshot for separation. Secondary controls should remain legible with restrained material feedback; motion is not a reason to turn each button into a separate attraction.

Prototype duration and displacement values are our tuning decisions, not measured facts about reference sites. The recorded screenshots have wall-clock labels, not exact video frame timing. Desktop headless Chrome observations do not establish mobile smoothness.


## 2026-09-26 — gathered cloth and liquid refinement

Read primary sources:
- https://matthias-research.github.io/pages/tenMinutePhysics/14-cloth.pdf — strong cloth stretch limits; too much elongation is a visible artifact; bend resistance is distinct from stretch.
- https://matthias-research.github.io/pages/publications/XPBD.pdf — constraint stiffness independent of timestep/iteration count; force estimates from constraints.
- https://three-fluid-fx.artcreativecode.com/tutorials/effects-guide/ — velocity/density outputs and application-specific compositing.

The new image deformation is a kinematic gathered cross-section with longitudinal folds and opposing end torsion, plus normals derived from the actual deformed surface. It is not an XPBD solver and does not solve self-contact. Eliminated the old expanding ends and zero-thickness waist. White describes albedo: shaded folds remain visible.

Stock video pages were located (PIXTA 114616478 / Envato EAM33SF); the PIXTA open failed and no video was inspected. Do not claim real video analysis.

Liquid now uses a free-fall speed law v²=v0²+2g*distance at 980 screen-pixels/s² (an artistic screen-space scale, not calibrated metres). Added source shutoff that actually clears pigment at the emitter: multiplying injection by zero had left old material feeding long tails. Short pulses form separated loads. Shading and source-colour weighting were adjusted; fine glitter was then explicitly requested by user and added only inside the pigment mask.


## 2026-09-26 — three-fluid-fx particle investigation, v2.5.11

Official demo: https://three-fluid-fx.artcreativecode.com/examples/glsl/full/particles-2d/
Source: https://github.com/artcodev/three-fluid-fx/blob/main/examples-js/extras/particles/glsl/flowParticles.js
Guide: https://three-fluid-fx.artcreativecode.com/tutorials/particles-guide/

Opened the live official demo in Chrome and moved the pointer across the canvas. Still captures: official-fluid-rest.png, official-fluid-flow.png. No recording. The demo is a dense field of individually shaded colored particles, not an acrylic-paint dripping preset. Source uses persistent GPU position/velocity, external flow forces, drag and surface-normal lighting.

Local adaptation: PigmentFlow.js maintains GPU position and velocity, samples the real three-fluid-fx velocity texture, integrates screen-space gravity and drag, and adds particle kernels into a pigment field. It is custom code following this architecture, not a claim that the package exports an acrylic or SPH solver. Overlapping kernels mix source-image colors and form connected silhouettes. Source timing and radius respond to wring pressure. Lighting follows field gradients; screen-space glitter grid removed.

Browser debugging reproduced then fixed a reserved GLSL identifier and winding/culling error in the new shader. Persistent state readback verifies increasing downward velocity after release. Visual checks include stills of rest and peak wring. This remains a stylized effect, not measured acrylic rheology or cloth physics.
