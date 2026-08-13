-- Axis schema: shared workspace between all authenticated users of this project.
-- Since Axis is used by a small trusted team (2 people), any authenticated
-- user can read/write all items — there is no per-user isolation.

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  type text not null check (type in ('idea', 'task', 'event', 'script')),
  date date,
  time text,
  script_stage text check (script_stage in ('rascunho', 'gravacao', 'edicao', 'publicacao')),
  done boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table items enable row level security;

create policy "Authenticated users can read all items"
  on items for select
  to authenticated
  using (true);

create policy "Authenticated users can insert items"
  on items for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update items"
  on items for update
  to authenticated
  using (true);

create policy "Authenticated users can delete items"
  on items for delete
  to authenticated
  using (true);

-- Keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists items_set_updated_at on items;
create trigger items_set_updated_at
  before update on items
  for each row execute function set_updated_at();

-- Enable realtime so both users see changes live
alter publication supabase_realtime add table items;
