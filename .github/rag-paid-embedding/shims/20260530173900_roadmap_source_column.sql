-- Validation shim: roadmap_items.source is referenced before any canonical migration adds it.
ALTER TABLE public.roadmap_items ADD COLUMN IF NOT EXISTS source text;
