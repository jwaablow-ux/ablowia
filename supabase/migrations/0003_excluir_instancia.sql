-- Ablaw IA — exclusão de instância. Mesma filosofia da criação: único caminho
-- controlado (security definer), nunca exposto como policy de DELETE direta.

create or replace function public.excluir_instancia(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.instancias where id = p_id;
end;
$$;

grant execute on function public.excluir_instancia(uuid) to authenticated;
