-- Full text search vectors for profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(username, '') || ' ' ||
      COALESCE(display_name, '') || ' ' ||
      COALESCE(bio, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING GIN(search_vector);

-- Full text search vectors for outfits (FYTD uses outfits table, not posts)
ALTER TABLE outfits
ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(title, '') || ' ' ||
      COALESCE(description, '') || ' ' ||
      COALESCE(array_to_string(tags, ' '), '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_outfits_search ON outfits USING GIN(search_vector);
