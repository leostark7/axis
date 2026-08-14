alter table demandas add column if not exists linked_item_id uuid references items(id) on delete set null;
