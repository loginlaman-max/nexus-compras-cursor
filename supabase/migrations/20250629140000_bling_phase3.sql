-- Fase 3: depósitos Bling, imagem de produto, company id para webhooks

create table if not exists bling_depositos (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizacoes(id) on delete cascade,
  bling_id    text not null,
  descricao   text,
  situacao    text,
  padrao      boolean not null default false,
  updated_at  timestamptz default now(),
  unique (org_id, bling_id)
);
create index if not exists bling_depositos_org_idx on bling_depositos (org_id);

alter table produtos
  add column if not exists imagem_url text;

alter table bling_conexoes
  add column if not exists bling_company_id text;

create index if not exists bling_conexoes_company_idx
  on bling_conexoes (bling_company_id)
  where bling_company_id is not null;

alter table bling_depositos enable row level security;

create policy "rw bling_depositos" on bling_depositos
  for all using (is_member(org_id)) with check (is_member(org_id));
