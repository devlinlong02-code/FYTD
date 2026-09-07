-- Per-item save count and Q&A system for the breakdown

-- Saves count on outfit_items
alter table outfit_items
add column if not exists saves_count integer default 0;

-- Questions count on outfit_items
alter table outfit_items
add column if not exists questions_count integer default 0;

-- Item Q&A
create table if not exists item_questions (
  id           uuid        primary key default gen_random_uuid(),
  item_id      uuid        not null references outfit_items(id) on delete cascade,
  user_id      uuid        not null references profiles(id) on delete cascade,
  question     text        not null,
  created_at   timestamptz not null default now()
);

create table if not exists item_answers (
  id           uuid        primary key default gen_random_uuid(),
  question_id  uuid        not null references item_questions(id) on delete cascade,
  user_id      uuid        not null references profiles(id) on delete cascade,
  answer       text        not null,
  created_at   timestamptz not null default now()
);

-- RLS
alter table item_questions enable row level security;
alter table item_answers   enable row level security;

create policy "item_questions_select_all" on item_questions for select using (true);
create policy "item_questions_insert_own" on item_questions for insert with check (auth.uid() = user_id);
create policy "item_questions_delete_own" on item_questions for delete using (auth.uid() = user_id);

create policy "item_answers_select_all" on item_answers for select using (true);
create policy "item_answers_insert_own" on item_answers for insert with check (auth.uid() = user_id);
create policy "item_answers_delete_own" on item_answers for delete using (auth.uid() = user_id);

-- Trigger: saves_count increments/decrements when saved_items changes
create or replace function update_item_saves_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update outfit_items set saves_count = saves_count + 1 where id = NEW.item_id;
  elsif TG_OP = 'DELETE' then
    update outfit_items set saves_count = greatest(0, saves_count - 1) where id = OLD.item_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists item_saves_count_trigger on saved_items;
create trigger item_saves_count_trigger
after insert or delete on saved_items
for each row execute function update_item_saves_count();

-- Trigger: questions_count increments/decrements when item_questions changes
create or replace function update_item_questions_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update outfit_items set questions_count = questions_count + 1 where id = NEW.item_id;
  elsif TG_OP = 'DELETE' then
    update outfit_items set questions_count = greatest(0, questions_count - 1) where id = OLD.item_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists item_questions_count_trigger on item_questions;
create trigger item_questions_count_trigger
after insert or delete on item_questions
for each row execute function update_item_questions_count();

-- Backfill saves_count from existing saved_items rows
update outfit_items oi
set saves_count = (select count(*) from saved_items si where si.item_id = oi.id);

-- Indexes for Q&A queries
create index if not exists item_questions_item_id_idx on item_questions (item_id);
create index if not exists item_answers_question_id_idx on item_answers (question_id);
