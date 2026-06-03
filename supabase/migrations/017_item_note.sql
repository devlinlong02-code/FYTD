-- 017: Add item_note to outfit_items for "How I found it" context
ALTER TABLE public.outfit_items
  ADD COLUMN IF NOT EXISTS item_note text;
