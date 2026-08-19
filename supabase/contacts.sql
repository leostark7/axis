create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  category text not null default 'outro'
    check (category in ('orgao_publico', 'cliente', 'fornecedor', 'pessoal', 'outro')),
  region text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table contacts enable row level security;

create policy "Authenticated users can read all contacts"
  on contacts for select
  to authenticated
  using (true);

create policy "Authenticated users can insert contacts"
  on contacts for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update contacts"
  on contacts for update
  to authenticated
  using (true);

create policy "Authenticated users can delete contacts"
  on contacts for delete
  to authenticated
  using (true);
