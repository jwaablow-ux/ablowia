-- Ablaw IA — suporte aos dois modos de conexão GoZAP lado a lado: o admin
-- escolhe por instância, na criação, entre "companion" (QR code — número já
-- tem WhatsApp instalado num aparelho) ou "mobile" (SMS/ligação — sem
-- depender de aparelho nenhum). Serve como contingência: se o registro mobile
-- for bloqueado pelo WhatsApp (visto na prática durante os testes desta
-- integração), a mesma instância pode ser recriada em modo companion sem
-- precisar reescrever nada.

create or replace function public.registrar_conexao_gozap(
  p_instancia_id uuid,
  p_gozap_instance_id text,
  p_gozap_token text,
  p_connection_mode text default 'mobile'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link_token text;
begin
  insert into public.instancias_conexao (instancia_id, gozap_instance_id, gozap_token, connection_mode)
  values (p_instancia_id, p_gozap_instance_id, p_gozap_token, p_connection_mode)
  returning link_pareamento_token into v_link_token;

  return v_link_token;
end;
$$;

grant execute on function public.registrar_conexao_gozap(uuid, text, text, text) to authenticated;

drop function if exists public.registrar_conexao_gozap(uuid, text, text);

-- Devolve o modo de conexão de uma instância a partir do link público, para a
-- página de pareamento decidir se mostra o fluxo de QR code ou o de SMS/ligação.
-- Não expõe gozap_token nem nenhuma credencial — só o modo e o nome do serviço.
create or replace function public.obter_modo_conexao_publico(p_link_pareamento_token text)
returns table (nome_servico text, connection_mode text)
language sql
security definer
set search_path = public
stable
as $$
  select i.nome_servico, ic.connection_mode
  from public.instancias_conexao ic
  join public.instancias i on i.id = ic.instancia_id
  where ic.link_pareamento_token = p_link_pareamento_token;
$$;

grant execute on function public.obter_modo_conexao_publico(text) to anon, authenticated;
