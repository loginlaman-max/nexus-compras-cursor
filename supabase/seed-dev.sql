-- Owner / super admin: login.laman@gmail.com
-- UID: 2ee9d682-e13a-465c-9da2-8f8ab403b997
-- (já aplicado via npm run supabase:seed-admin)

insert into organizacoes (nome, cnpj)
values ('Nexus Compras Distribuição LTDA', '12.345.678/0001-90')
on conflict do nothing;

insert into membros (org_id, user_id, papel)
select id, '2ee9d682-e13a-465c-9da2-8f8ab403b997'::uuid, 'owner'
from organizacoes
where nome = 'Nexus Compras Distribuição LTDA'
on conflict do nothing;
