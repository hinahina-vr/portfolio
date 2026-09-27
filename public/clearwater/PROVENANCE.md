# Water optics adaptation

Upstream: https://github.com/Aureliengmz/clearwater
Revision: 4bc826134321043a25df3c2b6fed16fb7b9241e8
Copyright (c) 2026 Lumaris. MIT: see LICENSE.

src/ClearwaterRenderer.js adapts Clearwater FFT waves, wave-focusing caustics and
post-processing. Its landscape, seabed texture, camera interaction and standalone
page are not distributed. A new shader refracts the portfolio's live original
GLSL render, with color-dependent optical thickness and illumination. The source
render remains the fallback. Pausing, disposal and compositor integration are local
adaptations. No separate Clearwater work is listed in the portfolio.
