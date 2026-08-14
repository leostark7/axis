create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'encerrado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clients enable row level security;

drop policy if exists "Authenticated users can read clients" on clients;
create policy "Authenticated users can read clients"
  on clients for select to authenticated using (true);

drop policy if exists "Authenticated users can insert clients" on clients;
create policy "Authenticated users can insert clients"
  on clients for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update clients" on clients;
create policy "Authenticated users can update clients"
  on clients for update to authenticated using (true);

drop policy if exists "Authenticated users can delete clients" on clients;
create policy "Authenticated users can delete clients"
  on clients for delete to authenticated using (true);

drop trigger if exists clients_set_updated_at on clients;
create trigger clients_set_updated_at
  before update on clients
  for each row execute function set_updated_at();

alter table demandas add column if not exists client_id uuid references clients(id) on delete set null;
alter table items add column if not exists client_id uuid references clients(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'clients'
  ) then
    alter publication supabase_realtime add table clients;
  end if;
end $$;
