-- Ablaw IA — schema inicial de Instâncias
-- Cada instância (área de atuação jurídica) tem uma configuração de IA própria,
-- criada atomicamente junto com a instância via a função criar_instancia().

create extension if not exists pgcrypto;
create extension if not exists unaccent;

create table public.instancias (
  id uuid primary key default gen_random_uuid(),
  nome_servico text not null,
  identificador_tecnico text not null unique,
  status_conexao text not null default 'aguardando_pareamento'
    check (status_conexao in ('aguardando_pareamento', 'conectado', 'desconectado')),
  criado_em timestamptz not null default now()
);

-- Bloqueio de duplicidade case-insensitive no próprio banco (defesa em profundidade,
-- além da checagem que a aplicação já faz).
create unique index instancias_nome_servico_unico_idx
  on public.instancias (lower(trim(nome_servico)));

create table public.configuracoes_ia (
  instancia_id uuid primary key references public.instancias(id) on delete cascade,
  prompt text not null default '',
  personalidade text not null default '',
  atualizado_em timestamptz not null default now()
);

alter table public.instancias enable row level security;
alter table public.configuracoes_ia enable row level security;

-- Leitura liberada para qualquer usuário autenticado (ferramenta administrativa interna).
create policy "Autenticados podem ver instancias"
  on public.instancias for select
  to authenticated
  using (true);

create policy "Autenticados podem ver configuracoes"
  on public.configuracoes_ia for select
  to authenticated
  using (true);

-- Edição da configuração de IA é permitida diretamente (cada instância só edita a própria,
-- via instancia_id — nunca há fallback para configuração de outra instância).
create policy "Autenticados podem editar configuracoes"
  on public.configuracoes_ia for update
  to authenticated
  using (true)
  with check (true);

-- Não há política de INSERT para authenticated em nenhuma das duas tabelas:
-- a única forma de criar uma instância é através da função criar_instancia(),
-- que roda como security definer e insere nas duas tabelas na mesma transação.
-- Isso garante, a nível de banco, que instância e configuração nascem sempre juntas.

create or replace function public.criar_instancia(p_nome_servico text)
returns public.instancias
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := trim(p_nome_servico);
  v_slug text;
  v_identificador text;
  v_instancia public.instancias;
begin
  if v_nome = '' then
    raise exception 'NOME_VAZIO: Nome do serviço não pode ser vazio';
  end if;

  if exists (
    select 1 from public.instancias
    where lower(trim(nome_servico)) = lower(v_nome)
  ) then
    raise exception 'NOME_DUPLICADO: Já existe uma instância chamada "%"', v_nome;
  end if;

  v_slug := lower(regexp_replace(unaccent(v_nome), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'servico';
  end if;
  v_identificador := v_slug || '-' || substr(md5(gen_random_uuid()::text), 1, 8);

  insert into public.instancias (nome_servico, identificador_tecnico)
  values (v_nome, v_identificador)
  returning * into v_instancia;

  insert into public.configuracoes_ia (instancia_id)
  values (v_instancia.id);

  return v_instancia;
end;
$$;

grant execute on function public.criar_instancia(text) to authenticated;
