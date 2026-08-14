-- Recurring items support
alter table items add column if not exists recurring_group_id uuid;
alter table items add column if not exists recurrence_label text;

-- Activity log: real accountability trail across the whole app
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  verb text not null,
  entity_type text not null,
  entity_title text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

alter table activity_log enable row level security;

drop policy if exists "Authenticated users can read activity_log" on activity_log;
create policy "Authenticated users can read activity_log"
  on activity_log for select to authenticated using (true);

drop policy if exists "Authenticated users can insert activity_log" on activity_log;
create policy "Authenticated users can insert activity_log"
  on activity_log for insert to authenticated with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'activity_log'
  ) then
    alter publication supabase_realtime add table activity_log;
  end if;
end $$;
