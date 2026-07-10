-- Add card_style to outfits table (maps to 'posts' in the prompt, this app uses 'outfits')
ALTER TABLE outfits
ADD COLUMN IF NOT EXISTS card_style TEXT DEFAULT 'editorial'
  CHECK (card_style IN ('editorial', 'statement', 'streetwear'));

-- Optional: index for filtering by style in future queries
CREATE INDEX IF NOT EXISTS idx_outfits_card_style ON outfits(card_style);
