-- Ablaw IA — permite que o identificador técnico seja gerado fora do banco
-- (pela Edge Function, que primeiro varre as instâncias existentes na Evolution
-- API para evitar colisão antes de decidir o nome final), mantendo a criação
-- de instância + configuração de IA atômica na mesma transação.

create or replace function public.criar_instancia(
  p_nome_servico text,
  p_identificador_tecnico text
)
returns public.instancias
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := trim(p_nome_servico);
  v_identificador text := trim(p_identificador_tecnico);
  v_instancia public.instancias;
begin
  if v_nome = '' then
    raise exception 'NOME_VAZIO: Nome do serviço não pode ser vazio';
  end if;

  if v_identificador = '' then
    raise exception 'IDENTIFICADOR_VAZIO: Identificador técnico não pode ser vazio';
  end if;

  if exists (
    select 1 from public.instancias
    where lower(trim(nome_servico)) = lower(v_nome)
  ) then
    raise exception 'NOME_DUPLICADO: Já existe uma instância chamada "%"', v_nome;
  end if;

  if exists (
    select 1 from public.instancias
    where identificador_tecnico = v_identificador
  ) then
    raise exception 'IDENTIFICADOR_DUPLICADO: O identificador técnico "%" já está em uso', v_identificador;
  end if;

  insert into public.instancias (nome_servico, identificador_tecnico)
  values (v_nome, v_identificador)
  returning * into v_instancia;

  insert into public.configuracoes_ia (instancia_id)
  values (v_instancia.id);

  return v_instancia;
end;
$$;

grant execute on function public.criar_instancia(text, text) to authenticated;

-- Mantém a assinatura antiga por compatibilidade não é necessário: nenhuma
-- Edge Function ou cliente em produção a usa ainda (frontend ainda será
-- atualizado nesta mesma entrega). Remove a versão anterior para não deixar
-- dois caminhos de criação divergentes.
drop function if exists public.criar_instancia(text);
