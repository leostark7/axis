alter table items add column if not exists category text not null default 'empresarial'
  check (category in ('empresarial', 'pessoal'));
