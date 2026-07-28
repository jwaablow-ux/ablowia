-- Ablaw IA — troca do modo de conexão do GoZAP de companion (QR code) para
-- mobile (registro direto do número via SMS/ligação, sem depender de nenhum
-- celular físico permanecer com o WhatsApp instalado — ver decisão registrada
-- em docs/fornecedores-api-reference.md).
--
-- Guarda o modo de conexão por instância (hoje sempre 'mobile', mas registrado
-- explicitamente para auditoria e para o dia em que outro modo for necessário).

alter table public.instancias_conexao
  add column connection_mode text not null default 'mobile'
    check (connection_mode in ('mobile', 'companion'));
