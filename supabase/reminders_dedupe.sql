alter table items add column if not exists reminded_at timestamptz;
alter table demandas add column if not exists reminded_at timestamptz;
