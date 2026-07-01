-- Expande tabelas_preco para o modelo do protótipo TabelaPreco.jsx
alter table tabelas_preco
  add column if not exists status text not null default 'rascunho',
  add column if not exists canal text,
  add column if not exists moeda text not null default 'BRL',
  add column if not exists observacoes text,
  add column if not exists escopo jsonb not null default '{"modo":"todos","filtro":{},"skus":[]}'::jsonb,
  add column if not exists markup jsonb not null default '{"modo":"unico","base":45,"porCategoria":{},"porMarca":{},"porCurva":{"A":35,"B":45,"C":55},"arred":"nenhum","overrides":{}}'::jsonb,
  add column if not exists atualizado date;

-- Itens por SKU (overrides manuais) — codInt quando produto_id ainda não vinculado
alter table tabela_preco_itens
  add column if not exists sku_cod text;

create index if not exists idx_tabela_preco_itens_sku
  on tabela_preco_itens (tabela_id, sku_cod);

alter table tabela_preco_itens
  alter column produto_id drop not null;
