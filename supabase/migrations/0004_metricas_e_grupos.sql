-- Ablaw IA — ambiente para o Dashboard (seção "Clientes") e para o novo
-- setor de Gerenciamento de Grupos. Nenhuma integração externa é criada
-- aqui — só a estrutura de dados, pronta para receber dado real quando a
-- IA de atendimento e a integração de grupos existirem.

-- Interações diárias por instância (leads captados, conversas, qualificados).
-- Começa vazia: a alimentação real virá de uma futura Edge Function/webhook
-- ligada ao atendimento de IA, que ainda não existe.
create table public.interacoes_diarias (
  id uuid primary key default gen_random_uuid(),
  instancia_id uuid not null references public.instancias(id) on delete cascade,
  data date not null default current_date,
  leads_captados integer not null default 0,
  conversas integer not null default 0,
  qualificados integer not null default 0,
  unique (instancia_id, data)
);

alter table public.interacoes_diarias enable row level security;

create policy "Autenticados podem ver interacoes"
  on public.interacoes_diarias for select
  to authenticated
  using (true);

-- Sem policy de insert/update: a gravação será feita por uma Edge Function
-- futura (service role), nunca diretamente pelo frontend.

-- Grupos — mesma filosofia de Instâncias: cada grupo terá sua própria IA e
-- base de conhecimento, isoladas. A integração real com grupos do WhatsApp
-- (via Evolution) ainda não existe; por enquanto isto só organiza os grupos
-- que a operação pretende gerenciar.
create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);

create unique index grupos_nome_unico_idx
  on public.grupos (lower(trim(nome)));

create table public.configuracoes_ia_grupos (
  grupo_id uuid primary key references public.grupos(id) on delete cascade,
  prompt text not null default '',
  personalidade text not null default '',
  atualizado_em timestamptz not null default now()
);

alter table public.grupos enable row level security;
alter table public.configuracoes_ia_grupos enable row level security;

create policy "Autenticados podem ver grupos"
  on public.grupos for select
  to authenticated
  using (true);

create policy "Autenticados podem ver configuracoes de grupos"
  on public.configuracoes_ia_grupos for select
  to authenticated
  using (true);

create policy "Autenticados podem editar configuracoes de grupos"
  on public.configuracoes_ia_grupos for update
  to authenticated
  using (true)
  with check (true);

-- Criação e exclusão de grupo seguem o mesmo padrão atômico de instâncias:
-- único caminho controlado, nunca policy de INSERT/DELETE direta.

create or replace function public.criar_grupo(p_nome text)
returns public.grupos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := trim(p_nome);
  v_grupo public.grupos;
begin
  if v_nome = '' then
    raise exception 'NOME_VAZIO: Nome do grupo não pode ser vazio';
  end if;

  if exists (
    select 1 from public.grupos
    where lower(trim(nome)) = lower(v_nome)
  ) then
    raise exception 'NOME_DUPLICADO: Já existe um grupo chamado "%"', v_nome;
  end if;

  insert into public.grupos (nome) values (v_nome)
  returning * into v_grupo;

  insert into public.configuracoes_ia_grupos (grupo_id) values (v_grupo.id);

  return v_grupo;
end;
$$;

grant execute on function public.criar_grupo(text) to authenticated;

create or replace function public.excluir_grupo(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.grupos where id = p_id;
end;
$$;

grant execute on function public.excluir_grupo(uuid) to authenticated;
