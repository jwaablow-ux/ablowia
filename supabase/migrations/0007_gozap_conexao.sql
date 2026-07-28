-- Ablaw IA — migração de provedor de WhatsApp: Evolution API → GoZAP, com
-- pareamento self-service (o usuário final gera e escaneia o próprio QR code,
-- via link público, sem precisar de login nem da presença do admin).
--
-- Credenciais do GoZAP (gozap_instance_id, gozap_token) nunca podem ser lidas
-- por um usuário autenticado comum: ficam numa tabela própria, sem nenhuma
-- policy de SELECT para `authenticated`. O único jeito de lê-las é via função
-- security definer específica (para o fluxo administrativo já logado) ou via
-- Edge Function usando a service role key (para o fluxo público de pareamento,
-- que não tem usuário autenticado nenhum).
--
-- O que É seguro expor ao público é o `link_pareamento_token`: um valor opaco,
-- de uso único por instância, que só permite consultar/gerar QR code e status
-- de conexão desta instância específica — nunca lista outras instâncias, nunca
-- expõe token do GoZAP, nunca permite ações administrativas.

create table public.instancias_conexao (
  instancia_id uuid primary key references public.instancias(id) on delete cascade,
  provedor text not null default 'gozap' check (provedor in ('gozap')),
  gozap_instance_id text not null,
  gozap_token text not null,
  link_pareamento_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  criado_em timestamptz not null default now()
);

alter table public.instancias_conexao enable row level security;

-- Nenhuma policy criada de propósito: sem SELECT/INSERT/UPDATE/DELETE para
-- `authenticated` nem `anon`. Acesso só via funções security definer abaixo
-- ou via service role key (Edge Functions públicas de pareamento).

-- Registra as credenciais GoZAP recém-criadas para uma instância e devolve o
-- token de pareamento público. Chamada pela Edge Function criar-instancia
-- logo após criar a instância no GoZAP e no banco (`instancias`).
create or replace function public.registrar_conexao_gozap(
  p_instancia_id uuid,
  p_gozap_instance_id text,
  p_gozap_token text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link_token text;
begin
  insert into public.instancias_conexao (instancia_id, gozap_instance_id, gozap_token)
  values (p_instancia_id, p_gozap_instance_id, p_gozap_token)
  returning link_pareamento_token into v_link_token;

  return v_link_token;
end;
$$;

grant execute on function public.registrar_conexao_gozap(uuid, text, text) to authenticated;

-- Devolve o link de pareamento (token opaco) de uma instância já criada, para
-- o admin copiar e enviar ao usuário final. Nunca devolve o gozap_token.
create or replace function public.obter_link_pareamento(p_instancia_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select link_pareamento_token
  from public.instancias_conexao
  where instancia_id = p_instancia_id;
$$;

grant execute on function public.obter_link_pareamento(uuid) to authenticated;

-- Devolve o gozap_token de uma instância para a Edge Function excluir-instancia
-- (já autenticada como admin) poder remover a instância no GoZAP antes de
-- remover o registro local.
create or replace function public.obter_credenciais_gozap(p_instancia_id uuid)
returns table (gozap_token text)
language sql
security definer
set search_path = public
stable
as $$
  select gozap_token
  from public.instancias_conexao
  where instancia_id = p_instancia_id;
$$;

grant execute on function public.obter_credenciais_gozap(uuid) to authenticated;
