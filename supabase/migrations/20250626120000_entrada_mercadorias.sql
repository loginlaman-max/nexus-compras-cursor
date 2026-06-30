-- Entrada de Mercadorias + Histórico NF-e / CT-e (handoff MODULO-ENTRADA-MERCADORIAS.md)

-- Pedidos de compra (referência para vínculo NF-e)
create table if not exists pedidos_compra (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizacoes(id) on delete cascade,
  numero        text not null,
  fornecedor_id uuid references fornecedores(id),
  valor         numeric(14,2),
  status        text not null default 'aprovado'
    check (status in ('aguardando','aprovado','reprovado','cotacao','transito','recebido','cancelado')),
  emissao       date,
  created_at    timestamptz default now(),
  unique (org_id, numero)
);
create index if not exists pedidos_compra_org_idx on pedidos_compra (org_id, emissao desc);

-- NF-e de entrada
create table if not exists nfe_entrada (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizacoes(id) on delete cascade,
  chave           text,
  numero          text not null,
  serie           text,
  emissao         date,
  data_entrada    date,
  fornecedor_id   uuid references fornecedores(id),
  fornecedor_nome text,
  fornecedor_cnpj text,
  tipo_frete      text check (tipo_frete in ('CIF','FOB')),
  valor_produtos  numeric(14,2),
  valor_total     numeric(14,2),
  custo_landed    numeric(14,2),
  situacao        text not null default 'digitacao'
    check (situacao in ('digitacao','registrada','rejeitada')),
  pedido_id       uuid references pedidos_compra(id),
  avulsa          boolean not null default false,
  xml_path        text,
  created_at      timestamptz default now()
);
create unique index if not exists nfe_entrada_chave_uidx on nfe_entrada (chave) where chave is not null;
create index if not exists nfe_entrada_org_data_idx on nfe_entrada (org_id, data_entrada desc);
create index if not exists nfe_entrada_forn_sit_idx on nfe_entrada (fornecedor_id, situacao);

create table if not exists nfe_item (
  id              uuid primary key default gen_random_uuid(),
  nfe_id          uuid not null references nfe_entrada(id) on delete cascade,
  sku             text,
  cod_forn        text,
  ean             text,
  ncm             text,
  nome            text,
  qtd_nf          numeric(14,3) not null,
  qtd_pedido      numeric(14,3),
  custo_nf        numeric(14,4),
  ipi             numeric(14,4) default 0,
  icms_st         numeric(14,4) default 0,
  frete_rateado   numeric(14,4) default 0,
  custo_landed    numeric(14,4),
  novo            boolean default false,
  decisao         text check (decisao in ('nf','ped','div','vinc','criar'))
);
create index if not exists nfe_item_nfe_idx on nfe_item (nfe_id);

-- CT-e
create table if not exists cte_entrada (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organizacoes(id) on delete cascade,
  chave               text,
  numero              text not null,
  serie               text,
  emissao             date,
  transportadora      text,
  transportadora_cnpj text,
  uf_origem           text,
  uf_destino          text,
  valor_frete         numeric(14,2),
  modo_rateio         text default 'valor' check (modo_rateio in ('valor','peso')),
  situacao            text not null default 'pendente'
    check (situacao in ('conciliado','pendente')),
  xml_path            text,
  created_at          timestamptz default now()
);
create unique index if not exists cte_entrada_chave_uidx on cte_entrada (chave) where chave is not null;
create index if not exists cte_entrada_org_idx on cte_entrada (org_id, created_at desc);

create table if not exists cte_nfe (
  cte_id        uuid not null references cte_entrada(id) on delete cascade,
  nfe_id        uuid not null references nfe_entrada(id) on delete cascade,
  frete_alocado numeric(14,2),
  primary key (cte_id, nfe_id)
);
create index if not exists cte_nfe_nfe_idx on cte_nfe (nfe_id);

-- Storage bucket xmls
insert into storage.buckets (id, name, public)
values ('xmls', 'xmls', false)
on conflict (id) do nothing;

-- RLS
alter table pedidos_compra enable row level security;
alter table nfe_entrada enable row level security;
alter table nfe_item enable row level security;
alter table cte_entrada enable row level security;
alter table cte_nfe enable row level security;

create policy "rw pedidos_compra" on pedidos_compra
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "rw nfe_entrada" on nfe_entrada
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "rw nfe_item" on nfe_item
  for all using (
    exists (select 1 from nfe_entrada n where n.id = nfe_id and is_member(n.org_id))
  ) with check (
    exists (select 1 from nfe_entrada n where n.id = nfe_id and is_member(n.org_id))
  );

create policy "rw cte_entrada" on cte_entrada
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "rw cte_nfe" on cte_nfe
  for all using (
    exists (select 1 from cte_entrada c where c.id = cte_id and is_member(c.org_id))
  ) with check (
    exists (select 1 from cte_entrada c where c.id = cte_id and is_member(c.org_id))
  );

create policy "xmls read member" on storage.objects
  for select using (
    bucket_id = 'xmls'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select org_id::text from membros where user_id = auth.uid()
    )
  );

create policy "xmls insert member" on storage.objects
  for insert with check (
    bucket_id = 'xmls'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select org_id::text from membros where user_id = auth.uid()
    )
  );
