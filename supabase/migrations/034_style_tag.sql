-- Single canonical style tag per outfit for structured filtering
-- Replaces free-form comma-separated tags in the posting flow

alter table outfits
add column if not exists style_tag text;

-- Fast equality filter for feed and explore queries
create index if not exists outfits_style_tag_idx
on outfits (style_tag)
where style_tag is not null;
