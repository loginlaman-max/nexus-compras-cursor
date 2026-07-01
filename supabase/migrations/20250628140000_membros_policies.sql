-- Owners/admins podem gerenciar membros da própria organização.

create or replace function is_org_admin(target_org uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from membros
    where org_id = target_org
      and user_id = auth.uid()
      and papel in ('owner', 'admin')
  );
$$;

create policy "admins inserem membros" on membros
  for insert with check (is_org_admin(org_id));

create policy "admins atualizam membros" on membros
  for update using (is_org_admin(org_id))
  with check (is_org_admin(org_id));

create policy "admins removem membros" on membros
  for delete using (is_org_admin(org_id));
