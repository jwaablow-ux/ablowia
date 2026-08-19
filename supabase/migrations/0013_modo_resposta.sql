-- Ablaw IA — permite escolher, por instância, se a IA sempre responde em
-- texto, sempre em áudio, ou automático (no mesmo formato que a pessoa
-- mandou — comportamento padrão até aqui, agora explícito e configurável).

alter table public.configuracoes_ia
  add column modo_resposta text not null default 'automatico'
    check (modo_resposta in ('automatico', 'texto', 'audio'));
