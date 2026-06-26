-- ============================================================
-- Nexus Compras — Esquema inicial (Supabase / Postgres)
-- Cobre: organizações + RLS, fornecedores, produtos, NF-e, CT-e,
-- itens, rateio de custo real, tabelas de preço.
-- Rode no SQL Editor do Supabase. Ajuste conforme evoluir.
-- ============================================================

-- ---------- Extensões ----------
create extension if not exists "uuid-ossp";

-- ============================================================
-- ORGANIZAÇÕES & MEMBROS (multi-empresa)
-- ============================================================
create table organizacoes (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  cnpj        text,
  created_at  timestamptz default now()
);

create type papel as enum ('owner','admin','comprador','visualizador');

create table membros (
  org_id      uuid references organizacoes(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  papel       papel not null default 'comprador',
  created_at  timestamptz default now(),
  primary key (org_id, user_id)
);

create table convites (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid references organizacoes(id) on delete cascade,
  email       text not null,
  papel       papel not null default 'comprador',
  aceito      boolean default false,
  created_at  timestamptz default now()
);

-- helper: o usuário atual pertence à org?
create or replace function is_member(target_org uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from membros
    where org_id = target_org and user_id = auth.uid()
  );
$$;

-- ============================================================
-- FORNECEDORES
-- ============================================================
create table fornecedores (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizacoes(id) on delete cascade,
  cnpj        text,
  razao_social text not null,
  nome_fantasia text,
  uf          text,
  created_at  timestamptz default now()
);
create index on fornecedores (org_id);

-- ============================================================
-- PRODUTOS
-- ============================================================
create table produtos (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizacoes(id) on delete cascade,
  sku         text not null,
  ean         text,
  descricao   text not null,
  ncm         text,
  unidade     text default 'UN',
  curva_abc   char(1),                 -- A / B / C
  custo_real  numeric(14,4),           -- landed mais recente
  created_at  timestamptz default now(),
  unique (org_id, sku)
);
create index on produtos (org_id);
create index on produtos (org_id, ean);

-- ============================================================
-- NOTAS FISCAIS (NF-e)
-- ============================================================
create type nf_status as enum ('recebida','conciliada','consolidada');

create table notas_fiscais (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizacoes(id) on delete cascade,
  fornecedor_id uuid references fornecedores(id),
  chave       text unique,             -- chave de acesso 44 dígitos
  numero      text,
  serie       text,
  emissao     date,
  valor_produtos numeric(14,2),
  valor_frete numeric(14,2) default 0, -- frete embutido na NF
  valor_total numeric(14,2),
  xml_path    text,                    -- caminho no Storage (bucket xmls)
  status      nf_status default 'recebida',
  created_at  timestamptz default now()
);
create index on notas_fiscais (org_id);

-- ============================================================
-- ITENS DA NOTA
-- ============================================================
create table itens_nota (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizacoes(id) on delete cascade,
  nota_id     uuid not null references notas_fiscais(id) on delete cascade,
  produto_id  uuid references produtos(id),
  c_prod      text,                    -- código no XML
  descricao   text,
  ncm         text,
  ean         text,
  quantidade  numeric(14,4),
  valor_unit  numeric(14,4),
  valor_total numeric(14,2),
  peso_kg     numeric(14,4),
  -- impostos
  icms        numeric(14,2) default 0,
  icms_st     numeric(14,2) default 0,
  ipi         numeric(14,2) default 0,
  pis         numeric(14,2) default 0,
  cofins      numeric(14,2) default 0,
  -- resultado do rateio
  frete_rateado numeric(14,4) default 0,
  custo_real_landed numeric(14,4)
);
create index on itens_nota (org_id);
create index on itens_nota (nota_id);

-- ============================================================
-- CT-e (conhecimento de transporte / frete)
-- ============================================================
create table ctes (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizacoes(id) on delete cascade,
  chave       text unique,
  numero      text,
  transportadora text,
  uf_origem   text,
  uf_destino  text,
  valor_frete numeric(14,2),           -- vTPrest
  xml_path    text,
  created_at  timestamptz default now()
);
create index on ctes (org_id);

-- relação N:N — um CT-e pode cobrir várias NF-e e vice-versa
create table cte_notas (
  cte_id      uuid references ctes(id) on delete cascade,
  nota_id     uuid references notas_fiscais(id) on delete cascade,
  primary key (cte_id, nota_id)
);

-- ============================================================
-- TABELAS DE PREÇO
-- ============================================================
create table tabelas_preco (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizacoes(id) on delete cascade,
  nome        text not null,
  vigencia_ini date,
  vigencia_fim date,
  created_at  timestamptz default now()
);

create table tabela_preco_itens (
  id          uuid primary key default uuid_generate_v4(),
  tabela_id   uuid not null references tabelas_preco(id) on delete cascade,
  produto_id  uuid not null references produtos(id),
  markup_pct  numeric(8,4),
  preco_venda numeric(14,4)
);

-- ============================================================
-- RLS — cada org só vê os próprios dados
-- ============================================================
alter table organizacoes        enable row level security;
alter table membros             enable row level security;
alter table convites            enable row level security;
alter table fornecedores        enable row level security;
alter table produtos            enable row level security;
alter table notas_fiscais       enable row level security;
alter table itens_nota          enable row level security;
alter table ctes                enable row level security;
alter table cte_notas           enable row level security;
alter table tabelas_preco       enable row level security;
alter table tabela_preco_itens  enable row level security;

-- organizações: vê as que é membro
create policy "org visivel a membros" on organizacoes
  for select using (is_member(id));

-- membros: vê os da própria org
create policy "membros da org" on membros
  for select using (is_member(org_id));

-- padrão para tabelas com org_id: tudo condicionado a is_member(org_id)
create policy "rw fornecedores" on fornecedores
  for all using (is_member(org_id)) with check (is_member(org_id));
create policy "rw produtos" on produtos
  for all using (is_member(org_id)) with check (is_member(org_id));
create policy "rw notas" on notas_fiscais
  for all using (is_member(org_id)) with check (is_member(org_id));
create policy "rw itens" on itens_nota
  for all using (is_member(org_id)) with check (is_member(org_id));
create policy "rw ctes" on ctes
  for all using (is_member(org_id)) with check (is_member(org_id));
create policy "rw tabelas" on tabelas_preco
  for all using (is_member(org_id)) with check (is_member(org_id));

-- cte_notas e tabela_preco_itens herdam via join — política por subquery:
create policy "rw cte_notas" on cte_notas
  for all using (exists (select 1 from ctes c where c.id = cte_id and is_member(c.org_id)));
create policy "rw tp_itens" on tabela_preco_itens
  for all using (exists (select 1 from tabelas_preco t where t.id = tabela_id and is_member(t.org_id)));

-- convites: visíveis a membros da org
create policy "rw convites" on convites
  for all using (is_member(org_id)) with check (is_member(org_id));

-- ============================================================
-- Nota sobre rateio de frete (Edge Function calc-custo-real):
--   Para cada CT-e, distribuir valor_frete entre os itens das
--   NF-e ligadas (cte_notas), por VALOR ou por PESO:
--     frete_rateado_item = valor_frete * (base_item / soma_base)
--   onde base = valor_total (modo valor) ou peso_kg (modo peso).
--   custo_real_landed = (valor_total + impostos_nao_recuperaveis
--                        + frete_rateado) / quantidade
--   Atualiza produtos.custo_real com o landed mais recente.
-- ============================================================
