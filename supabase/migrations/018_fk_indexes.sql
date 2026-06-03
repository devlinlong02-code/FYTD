-- FK indexes for high-frequency join columns.
-- PostgREST and row-level security filters on these columns run on every
-- authenticated request; without indexes they default to sequential scans.

CREATE INDEX IF NOT EXISTS idx_outfits_creator_id       ON outfits (creator_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit_id   ON outfit_items (outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_media_outfit_id   ON outfit_media (outfit_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_outfit_id  ON saved_outfits (outfit_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_user_id    ON saved_outfits (user_id);
CREATE INDEX IF NOT EXISTS idx_click_events_outfit_id   ON click_events (outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_views_outfit_id   ON outfit_views (outfit_id);
