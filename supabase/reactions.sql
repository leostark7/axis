alter table items add column if not exists reactions jsonb not null default '[]'::jsonb;
alter table demandas add column if not exists reactions jsonb not null default '[]'::jsonb;
