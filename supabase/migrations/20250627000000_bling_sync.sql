-- Bling ERP: filiais, OAuth, estoque, vendas e logs de sincronização

-- Filiais (substitui mock FILIAIS)
create table if not exists filiais (
  id            text not null,
  org_id        uuid not null references organizacoes(id) on delete cascade,
  nome          text not null,
  uf            text,
  cnpj          text,
  is_cd         boolean not null default false,
  bling_deposito_id text,
  created_at    timestamptz default now(),
  primary key (org_id, id)
);
create index if not exists filiais_org_idx on filiais (org_id);

-- Conexão OAuth Bling por filial
create table if not exists bling_conexoes (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizacoes(id) on delete cascade,
  filial_id       text not null,
  conta_nome      text,
  access_token    text,
  refresh_token   text,
  expires_at      timestamptz,
  status          text not null default 'desconectado'
    check (status in ('conectado','desconectado','erro','desativado')),
  last_sync_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (org_id, filial_id),
  foreign key (org_id, filial_id) references filiais (org_id, id) on delete cascade
);
create index if not exists bling_conexoes_org_idx on bling_conexoes (org_id);

-- Mapeamento idempotente Bling ↔ Nexus
create table if not exists bling_id_map (
  org_id      uuid not null references organizacoes(id) on delete cascade,
  entidade    text not null,
  bling_id    text not null,
  nexus_id    uuid not null,
  updated_at  timestamptz default now(),
  primary key (org_id, entidade, bling_id)
);
create index if not exists bling_id_map_nexus_idx on bling_id_map (org_id, entidade, nexus_id);

-- Extensões em produtos
alter table produtos
  add column if not exists bling_id text,
  add column if not exists cod_forn text,
  add column if not exists fornecedor_id uuid references fornecedores(id),
  add column if not exists segmento text,
  add column if not exists preco_venda numeric(14,4),
  add column if not exists ativo boolean not null default true,
  add column if not exists updated_at timestamptz default now();

create unique index if not exists produtos_bling_uidx
  on produtos (org_id, bling_id) where bling_id is not null;

-- Extensões em fornecedores
alter table fornecedores
  add column if not exists bling_id text,
  add column if not exists lead_time int default 14,
  add column if not exists tipo_frete text default 'FOB',
  add column if not exists updated_at timestamptz default now();

create unique index if not exists fornecedores_bling_uidx
  on fornecedores (org_id, bling_id) where bling_id is not null;

-- Estoque por filial
create table if not exists estoque_saldos (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizacoes(id) on delete cascade,
  filial_id         text not null,
  produto_id        uuid not null references produtos(id) on delete cascade,
  deposito_bling_id text,
  quantidade        numeric(14,3) not null default 0,
  reservado         numeric(14,3) not null default 0,
  updated_at        timestamptz default now(),
  unique (org_id, filial_id, produto_id, deposito_bling_id),
  foreign key (org_id, filial_id) references filiais (org_id, id) on delete cascade
);
create index if not exists estoque_saldos_prod_idx on estoque_saldos (org_id, produto_id);

-- Vendas diárias (movimentação / giro)
create table if not exists vendas_diarias (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizacoes(id) on delete cascade,
  filial_id   text not null,
  produto_id  uuid not null references produtos(id) on delete cascade,
  data        date not null,
  qtd         numeric(14,3) not null default 0,
  valor       numeric(14,2) not null default 0,
  unique (org_id, filial_id, produto_id, data),
  foreign key (org_id, filial_id) references filiais (org_id, id) on delete cascade
);
create index if not exists vendas_diarias_prod_idx on vendas_diarias (org_id, filial_id, produto_id, data desc);

-- Logs de sincronização
create table if not exists sync_logs (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizacoes(id) on delete cascade,
  filial_id   text,
  funcao      text not null,
  status      text not null check (status in ('sucesso','parcial','erro')),
  registros   int not null default 0,
  mensagem    text,
  duration_ms int,
  started_at  timestamptz default now()
);
create index if not exists sync_logs_org_idx on sync_logs (org_id, started_at desc);

-- RLS
alter table filiais enable row level security;
alter table bling_conexoes enable row level security;
alter table bling_id_map enable row level security;
alter table estoque_saldos enable row level security;
alter table vendas_diarias enable row level security;
alter table sync_logs enable row level security;

create policy "rw filiais" on filiais
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "rw bling_conexoes" on bling_conexoes
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "rw bling_id_map" on bling_id_map
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "rw estoque_saldos" on estoque_saldos
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "rw vendas_diarias" on vendas_diarias
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "rw sync_logs" on sync_logs
  for all using (is_member(org_id)) with check (is_member(org_id));
