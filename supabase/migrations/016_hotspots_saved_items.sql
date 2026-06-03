-- Add hotspot positioning to outfit_items
ALTER TABLE outfit_items
  ADD COLUMN IF NOT EXISTS hotspot_x FLOAT,
  ADD COLUMN IF NOT EXISTS hotspot_y FLOAT;

-- Per-item saves
CREATE TABLE IF NOT EXISTS saved_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  item_id    uuid        NOT NULL REFERENCES outfit_items(id) ON DELETE CASCADE,
  outfit_id  uuid        NOT NULL REFERENCES outfits(id)      ON DELETE CASCADE,
  saved_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_items_select_own"
  ON saved_items FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "saved_items_insert_own"
  ON saved_items FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_items_delete_own"
  ON saved_items FOR DELETE USING (user_id = auth.uid());
