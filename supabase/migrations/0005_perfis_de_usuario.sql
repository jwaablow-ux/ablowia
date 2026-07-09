-- Ablaw IA — perfis de usuário com papel (admin / comum).
-- A criação de conta em si continua exclusiva do Supabase Auth Admin API
-- (via Edge Function), nunca signup público — este é um painel interno.

create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  papel text not null default 'comum' check (papel in ('admin', 'comum')),
  criado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

-- Função auxiliar: verifica se o usuário autenticado é admin, sem recursão de RLS
-- (security definer lê a tabela ignorando a própria policy).
create or replace function public.eh_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'admin'
  );
$$;

-- Qualquer usuário autenticado vê seu próprio perfil; admins veem todos.
create policy "Ver proprio perfil ou todos se admin"
  on public.perfis for select
  to authenticated
  using (id = auth.uid() or public.eh_admin());

-- Só admin pode alterar papel de qualquer perfil.
create policy "Admin pode atualizar perfis"
  on public.perfis for update
  to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

-- Sem policy de INSERT: perfis nascem junto com o usuário, via Edge Function
-- (security definer / service role), nunca diretamente pelo cliente.

grant execute on function public.eh_admin() to authenticated;
