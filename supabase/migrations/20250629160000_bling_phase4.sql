-- Fase 4: enriquecimento de fornecedores e produtos (Bling)

alter table fornecedores
  add column if not exists email text,
  add column if not exists telefone text;

alter table produtos
  add column if not exists marca text,
  add column if not exists categoria text;

create index if not exists produtos_org_marca_idx on produtos (org_id, marca)
  where marca is not null;

create index if not exists produtos_org_categoria_idx on produtos (org_id, categoria)
  where categoria is not null;
