-- Ablaw IA — migração de provedor de WhatsApp: GoZAP → WaSender.
--
-- A WaSender exige telefone já na criação da sessão e só suporta linkagem
-- via QR code (Passkey depende de uma extensão de navegador — não serve pro
-- fluxo self-service do cliente final). O modo "mobile" (SMS/ligação) que a
-- GoZAP tinha não existe na WaSender; connection_mode passa a significar
-- sempre 'companion' (QR).
--
-- Cada sessão WaSender tem um `id` (inteiro) e uma `api_key` própria — usada
-- só pra consultar o status dessa sessão via GET /api/status. O Personal
-- Access Token da conta (usado pra criar/conectar/excluir sessões) fica só
-- nas Edge Functions, nunca chega no banco.

alter table public.instancias_conexao
  alter column gozap_instance_id drop not null,
  alter column gozap_token drop not null,
  add column wasender_session_id integer,
  add column wasender_api_key text;

alter table public.instancias_conexao
  drop constraint instancias_conexao_provedor_check;

alter table public.instancias_conexao
  add constraint instancias_conexao_provedor_check
    check (provedor in ('gozap', 'wasender'));

alter table public.instancias_conexao
  alter column provedor set default 'wasender';

-- Registra as credenciais WaSender recém-criadas para uma instância e
-- devolve o token de pareamento público (mesmo padrão do
-- registrar_conexao_gozap que substitui).
create or replace function public.registrar_conexao_wasender(
  p_instancia_id uuid,
  p_wasender_session_id integer,
  p_wasender_api_key text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link_token text;
begin
  insert into public.instancias_conexao (
    instancia_id, provedor, wasender_session_id, wasender_api_key, connection_mode
  )
  values (p_instancia_id, 'wasender', p_wasender_session_id, p_wasender_api_key, 'companion')
  returning link_pareamento_token into v_link_token;

  return v_link_token;
end;
$$;

grant execute on function public.registrar_conexao_wasender(uuid, integer, text) to authenticated;

-- Devolve o id da sessão WaSender de uma instância, pra Edge Function
-- excluir-instancia (já autenticada como admin) poder remover a sessão na
-- WaSender antes de remover o registro local. Mesmo padrão de acesso via
-- função security definer que obter_credenciais_gozap usava.
create or replace function public.obter_credenciais_wasender(p_instancia_id uuid)
returns table (wasender_session_id integer)
language sql
security definer
set search_path = public
stable
as $$
  select wasender_session_id
  from public.instancias_conexao
  where instancia_id = p_instancia_id;
$$;

grant execute on function public.obter_credenciais_wasender(uuid) to authenticated;
