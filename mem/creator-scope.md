---
name: Creator scope
description: Map of Creator path lessons + image status after deep review 2026-05-19
type: feature
---
18 lessons across 6 modules (registered in curriculum-data.ts + lessons/index.ts + /creator/$creatorId route):
- M1: why-content, attention-economy
- M2: hook, script-structure, cta
- M3: know-audience, content-pillars (use SVG diagrams)
- M4: reality-check, mobile-shooting, ai-writing, editing, thumbnails-captions
- M5: platforms, scheduling, analytics, leads (use SVG diagrams)
- M6: brand-basics, grid-consistency

Block structure: all 18 follow canonical Builder rhythm (Hero → concepts → video → idea → image/diagram → comparison → mission).

Images status (2026-05-19 deep review complete):
- ALL 12 image-based lessons use platform pastel palette (#DCE7EE / #D4ECE0 / #F0DDD8 / #E5DBEA / #F2DBC4 / #FAFCFE bg)
- No duplicates between lessons
- 4 lessons explicitly labeled "استثناء — مش من المنصة" (mobile-shooting=iPhone guide, ai-writing=ChatGPT, reality-check=Hootsuite, cta=mockup)
- 6 lessons use inline SVG diagrams (LessonDiagrams.tsx, palette updated to platform pastels)
- Gallery registry includes 12 Creator images (numbers 36-47), path description updated

Videos: all 18 have `url: ""` placeholder. Pipeline = Remotion `render-lesson.mjs`.
