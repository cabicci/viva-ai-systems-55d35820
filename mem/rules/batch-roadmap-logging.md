---
name: Batch roadmap logging
description: Every batch/run (videos, renders, dispatches) must be logged as its own roadmap_items row immediately when planned — not only when started
type: preference
---
When work is split into multiple batches/runs (e.g. Builder videos Batch 1/2/3, any multi-part render or dispatch), EACH batch MUST get its own `roadmap_items` row the moment it's planned — even if it's still pending/waiting. Do NOT lump pending batches into another batch's notes only. Status starts as `todo` until dispatched, then flips to `in_progress`, then `done`. Source marker required per global roadmap rule.

**Why:** User caught Batch 3 missing from roadmap because it was only mentioned in Batch 2's notes. Every batch = its own row, no exceptions.
