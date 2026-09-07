-- Perfect Breakdown badge system
-- Automatically awarded when all 6 criteria are met on a post

alter table outfits
add column if not exists is_perfect_breakdown boolean default false;

-- Calculate whether a post qualifies for the Perfect Breakdown badge
create or replace function calculate_perfect_breakdown(outfit_id uuid)
returns boolean as $$
declare
  item_count integer;
  all_have_name boolean;
  all_have_brand boolean;
  all_have_price boolean;
  has_shop_link boolean;
  has_title boolean;
  post_title text;
begin
  select title into post_title from outfits where id = outfit_id;
  has_title := post_title is not null and length(trim(post_title)) > 0;

  select count(*) into item_count
  from outfit_items
  where outfit_items.outfit_id = calculate_perfect_breakdown.outfit_id;

  if item_count < 3 then return false; end if;
  if not has_title then return false; end if;

  select bool_and(
    name is not null and length(trim(name)) > 0
  ) into all_have_name
  from outfit_items
  where outfit_items.outfit_id = calculate_perfect_breakdown.outfit_id;

  select bool_and(
    brand is not null and length(trim(brand)) > 0
  ) into all_have_brand
  from outfit_items
  where outfit_items.outfit_id = calculate_perfect_breakdown.outfit_id;

  select bool_and(
    price is not null and price > 0
  ) into all_have_price
  from outfit_items
  where outfit_items.outfit_id = calculate_perfect_breakdown.outfit_id;

  select exists(
    select 1 from outfit_items
    where outfit_items.outfit_id = calculate_perfect_breakdown.outfit_id
    and shop_link is not null
    and length(trim(shop_link)) > 0
  ) into has_shop_link;

  return (
    has_title and
    item_count >= 3 and
    all_have_name and
    all_have_brand and
    all_have_price and
    has_shop_link
  );
end;
$$ language plpgsql;

-- Update the flag on a single outfit
create or replace function update_perfect_breakdown(outfit_id uuid)
returns void as $$
begin
  update outfits
  set is_perfect_breakdown = calculate_perfect_breakdown(outfit_id)
  where id = outfit_id;
end;
$$ language plpgsql;

-- Trigger: recalculate when outfit_items change
create or replace function trigger_update_perfect_breakdown()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform update_perfect_breakdown(OLD.outfit_id);
  else
    perform update_perfect_breakdown(NEW.outfit_id);
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists perfect_breakdown_trigger on outfit_items;

create trigger perfect_breakdown_trigger
after insert or update or delete on outfit_items
for each row execute function trigger_update_perfect_breakdown();

-- Trigger: recalculate when outfit title changes
create or replace function trigger_update_perfect_breakdown_on_outfit()
returns trigger as $$
begin
  perform update_perfect_breakdown(NEW.id);
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists perfect_breakdown_outfit_trigger on outfits;

create trigger perfect_breakdown_outfit_trigger
after update of title on outfits
for each row execute function trigger_update_perfect_breakdown_on_outfit();

-- Backfill existing posts
update outfits
set is_perfect_breakdown = calculate_perfect_breakdown(id);
