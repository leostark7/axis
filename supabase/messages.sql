create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id),
  body text,
  attachment_url text,
  attachment_name text,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

drop policy if exists "Authenticated users can read messages" on messages;
create policy "Authenticated users can read messages"
  on messages for select to authenticated using (true);

drop policy if exists "Authenticated users can insert messages" on messages;
create policy "Authenticated users can insert messages"
  on messages for insert to authenticated with check (true);

drop policy if exists "Authenticated users can delete own messages" on messages;
create policy "Authenticated users can delete own messages"
  on messages for delete to authenticated using (auth.uid() = sender_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('mensagens', 'mensagens', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated can upload message files" on storage.objects;
create policy "Authenticated can upload message files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'mensagens');

drop policy if exists "Anyone can read message files" on storage.objects;
create policy "Anyone can read message files"
  on storage.objects for select
  using (bucket_id = 'mensagens');
