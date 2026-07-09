-- Ablaw IA — configuração global do motor de IA (Claude/Anthropic), universal
-- para o sistema. Escolha de modelo, ainda sem uso real na conversa (isso é
-- o próximo passo, quando a IA de atendimento existir de verdade).

create table public.configuracao_ia_global (
  id boolean primary key default true,
  modelo text not null default 'claude-sonnet-5',
  atualizado_em timestamptz not null default now(),
  constraint configuracao_ia_global_singleton check (id)
);

insert into public.configuracao_ia_global (id, modelo) values (true, 'claude-sonnet-5');

alter table public.configuracao_ia_global enable row level security;

create policy "Autenticados podem ver configuracao global de IA"
  on public.configuracao_ia_global for select
  to authenticated
  using (true);

create policy "Admin pode atualizar configuracao global de IA"
  on public.configuracao_ia_global for update
  to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());
