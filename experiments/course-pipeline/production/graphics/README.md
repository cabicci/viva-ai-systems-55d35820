# Scientific graphics

The owner confirmed on 13 October 2026 that **all educational illustrations,
including geometric and scientific diagrams, use a consistent stylized 3D
appearance with realistic materials**. This applies to the written lesson and
video. A flat chart with a shadow is insufficient. Text, axes, percentages and
callouts remain separate and editable; perspective must not alter their meaning.

`texture-model.js` builds real extruded geometry, bevels, separate material
specimens, three exact barycentric guides, a marker and studio lighting. Its
orthographic camera projects the scientific coordinates; `modelReady` exposes
those coordinates for the localized overlay. The 40/40/20 example is Loam;
there are no invented classification polygons. Specimens illustrate material,
not measured particle sizes.

Reproduce the model by installing the pinned dependencies in this directory,
opening `/production/graphics/index.html` with the course development server,
and saving `window.modelPng()` and `window.modelReady` to the corresponding
files under `src/assets`. The live learner page uses the saved image, so it
does not need a GPU or load Three.js. Voice assets are unaffected.

Current state: `texture-solid-v3` is a **preview for the owner**, not accepted
video media. The video version needs a different composition from the written
illustration. Do not count old flat-triangle media as current. Inspect all four
overlays and mobile layout before acceptance. Existing Gemini images retain
their checks and hashes; this policy clarification does not require regenerating
images that already meet it.
