-- Credenciais do aplicativo Bling por organização (multi-tenant SaaS)

create table if not exists bling_app_credentials (
  org_id        uuid primary key references organizacoes(id) on delete cascade,
  client_id     text not null,
  client_secret text not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table bling_app_credentials enable row level security;
-- Acesso apenas via service role (API Next.js). Sem policies = membros não leem secrets pelo client.
