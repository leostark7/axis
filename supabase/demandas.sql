-- Profiles: lets us list "quem é quem" (você/Luan) for assigning demandas.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Authenticated users can read profiles" on profiles;
create policy "Authenticated users can read profiles"
  on profiles for select to authenticated using (true);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill existing users into profiles.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Demandas: the WhatsApp-group-replacement request tracker.
create table if not exists demandas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'aberta' check (status in ('aberta', 'andamento', 'concluida')),
  requested_by uuid references auth.users(id),
  assigned_to uuid references public.profiles(id),
  due_date date,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table demandas enable row level security;

drop policy if exists "Authenticated users can read demandas" on demandas;
create policy "Authenticated users can read demandas"
  on demandas for select to authenticated using (true);

drop policy if exists "Authenticated users can insert demandas" on demandas;
create policy "Authenticated users can insert demandas"
  on demandas for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update demandas" on demandas;
create policy "Authenticated users can update demandas"
  on demandas for update to authenticated using (true);

drop policy if exists "Authenticated users can delete demandas" on demandas;
create policy "Authenticated users can delete demandas"
  on demandas for delete to authenticated using (true);

drop trigger if exists demandas_set_updated_at on demandas;
create trigger demandas_set_updated_at
  before update on demandas
  for each row execute function set_updated_at();

-- Comments thread per demanda.
create table if not exists demanda_comments (
  id uuid primary key default gen_random_uuid(),
  demanda_id uuid not null references demandas(id) on delete cascade,
  author_id uuid references auth.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

alter table demanda_comments enable row level security;

drop policy if exists "Authenticated users can read demanda_comments" on demanda_comments;
create policy "Authenticated users can read demanda_comments"
  on demanda_comments for select to authenticated using (true);

drop policy if exists "Authenticated users can insert demanda_comments" on demanda_comments;
create policy "Authenticated users can insert demanda_comments"
  on demanda_comments for insert to authenticated with check (true);

drop policy if exists "Authenticated users can delete demanda_comments" on demanda_comments;
create policy "Authenticated users can delete demanda_comments"
  on demanda_comments for delete to authenticated using (true);

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'demandas'
  ) then
    alter publication supabase_realtime add table demandas;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'demanda_comments'
  ) then
    alter publication supabase_realtime add table demanda_comments;
  end if;
end $$;

-- Storage bucket for demanda attachments.
insert into storage.buckets (id, name, public)
values ('demandas', 'demandas', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated can upload demanda files" on storage.objects;
create policy "Authenticated can upload demanda files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'demandas');

drop policy if exists "Anyone can read demanda files" on storage.objects;
create policy "Anyone can read demanda files"
  on storage.objects for select
  using (bucket_id = 'demandas');

drop policy if exists "Authenticated can delete demanda files" on storage.objects;
create policy "Authenticated can delete demanda files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'demandas');
