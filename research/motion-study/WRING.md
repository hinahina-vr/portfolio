# Asymmetric wringing — 2026-09-27

Primary reference: Bridson, Marino, Fedkiw, Simulation of Clothing with Folds and Wrinkles (2003), https://www.cs.ubc.ca/~rbridson/docs/cloth2003.pdf . The introduction and abstract distinguish bending/fold detail, contact and large-scale constraints. This implementation borrows that separation as an art-direction guide, not their physical solver. No claim of self-collision or measured material accuracy.

Before: a straight, symmetric axis, uniform fold profile, angle=x*curl/2 and central compression. Same selection was recorded as a still in qa/v2.6.1/wring-before.png.

After: unequal grip heights, off-centre compression, varying material-attached folds and bulk, weighted sag, nonlinear spatial torsion. Leading and following grip have different tightening/release timing; no travelling flag oscillation. Existing 30.6rad/3.2s, progressive bleach, same-surface crossfade and persistent runoff remain. CPU drainage samples the same deformed surface as the GPU; transform-feedback regression compares coordinates and checks conserved outlet flux. This is an art-directed deformation, not a full cloth/contact simulation.
