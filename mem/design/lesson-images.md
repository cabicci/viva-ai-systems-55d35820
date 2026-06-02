---
name: Lesson image priority rule
description: Mandatory priority order for choosing images in any lesson (Builder, Creator, Automator, Analyst, Business)
type: design
---

For every lesson, choose the image using this strict priority order. Read the lesson content first, then decide:

1. **First choice:** Real screenshot from the platform itself (Lovable / the app being taught) if it serves the lesson content directly.
2. **Second choice:** Real screenshot from outside the platform (Make.com, n8n, Zapier, ChatGPT UI, etc.) — only when this is the only way to serve the scientific/educational context.
3. **Last resort:** Generated image / diagram / SVG that contains text or info that genuinely serves the lesson context. Never decorative.

Rules:
- Never generate a decorative image just to fill a `screenshot` block.
- AI-generated images that contain text labels (English or Arabic) almost always render broken — keep text out of generated images. Put labels as HTML overlays or in the lesson body instead.
- Style for generated fallbacks: soft neumorphic / claymorphic, pastel palette, minimal composition, no garbled text.