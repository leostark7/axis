create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  size bigint not null,
  category text not null default 'geral',
  client_id uuid references clients(id) on delete set null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table documents enable row level security;

drop policy if exists "Authenticated users can read documents" on documents;
create policy "Authenticated users can read documents"
  on documents for select to authenticated using (true);

drop policy if exists "Authenticated users can insert documents" on documents;
create policy "Authenticated users can insert documents"
  on documents for insert to authenticated with check (true);

drop policy if exists "Authenticated users can delete documents" on documents;
create policy "Authenticated users can delete documents"
  on documents for delete to authenticated using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'documents'
  ) then
    alter publication supabase_realtime add table documents;
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated can upload documentos files" on storage.objects;
create policy "Authenticated can upload documentos files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos');

drop policy if exists "Anyone can read documentos files" on storage.objects;
create policy "Anyone can read documentos files"
  on storage.objects for select
  using (bucket_id = 'documentos');

drop policy if exists "Authenticated can delete documentos files" on storage.objects;
create policy "Authenticated can delete documentos files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documentos');
