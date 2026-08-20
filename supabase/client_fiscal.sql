alter table clients add column if not exists state_registration text;
alter table clients add column if not exists tax_regime text
  check (tax_regime in ('simples_nacional', 'lucro_presumido', 'lucro_real', 'mei'));
