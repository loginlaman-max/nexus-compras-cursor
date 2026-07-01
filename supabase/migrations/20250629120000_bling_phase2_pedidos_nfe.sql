-- Fase 2: idempotência Bling para pedidos de compra e NF-e de entrada

alter table pedidos_compra
  add column if not exists bling_id text,
  add column if not exists filial_id text,
  add column if not exists updated_at timestamptz default now();

create unique index if not exists pedidos_compra_bling_uidx
  on pedidos_compra (org_id, bling_id)
  where bling_id is not null;

alter table nfe_entrada
  add column if not exists bling_id text,
  add column if not exists filial_id text;

create unique index if not exists nfe_entrada_bling_uidx
  on nfe_entrada (org_id, bling_id)
  where bling_id is not null;
