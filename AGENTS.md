# AGENTS.md — Ablaw IA

Este documento registra, de forma PERMANENTE, as regras absolutas deste projeto. Elas se aplicam DESDE O PRIMEIRO COMMIT, sem exceção, e devem ser lidas e respeitadas em qualquer sessão futura de trabalho neste repositório.

---

## Regras absolutas

1. Este é um projeto NOVO chamado "Ablaw IA", TOTALMENTE SEPARADO de qualquer outro sistema meu (Magnus Consultas, Magnus Control/Limpa Brasil). Não compartilha domínio, banco de dados, repositório, nem credenciais com nenhum projeto anterior. Se você reconhecer padrões de um projeto "Magnus" no seu contexto, ignore — não é este projeto e não deve ser referenciado nem misturado.

2. HONESTIDADE E DADO REAL (regra máxima, sem exceção): NUNCA criar dado, função, integração, resposta ou resultado simulado, mockado, fake ou placeholder — em nenhuma circunstância, mesmo pra demonstração. Se não for possível criar/testar algo de verdade, a resposta correta é dizer explicitamente "não consegui fazer isso, pelo seguinte motivo" — nunca fingir que funcionou ou entregar algo fictício.

3. SEGURANÇA DE AUTENTICAÇÃO:
   - NUNCA usar `GET /auth/v1/admin/users?email=X` esperando que o parâmetro filtre — esse endpoint do Supabase (GoTrue) ignora o filtro e retorna TODOS os usuários. Qualquer busca de usuário por e-mail deve ser feita via SQL direto (RPC/service role com WHERE email=).
   - NUNCA fazer DELETE em loop sobre o resultado de uma listagem de usuários sem confirmar visualmente que a lista contém EXATAMENTE o usuário esperado. Preferir sempre deletar por UID já conhecido, nunca por resultado de busca.
   - Scripts de teste que criem/deletem usuários devem usar prefixo/domínio exclusivo (ex: @ablaw-teste.local) e checar o COUNT antes/depois de qualquer delete, abortando se o count for diferente do esperado.
   - Antes de qualquer DELETE em massa (mais de 1 registro) contra tabelas de auth ou dados de clientes, exigir minha confirmação explícita antes de prosseguir — nunca executar automaticamente em loop sem essa checagem.
   - Se o projeto usar múltiplos grupos de usuário (admin vs cliente vs operador), a separação deve ser validada no SERVIDOR a cada navegação (revalidar JWT/role via getUser(), não confiar em cache local) — nunca só cosmético no frontend.
   - Captcha (se usado no futuro): confirmar propagação/configuração completa ANTES de ativar em produção.

4. DISCIPLINA DE DEPLOY E TESTE:
   - Metodologia de bancada obrigatória para qualquer alteração visual/PDF: criar versão isolada de teste, testar com dado real, só aplicar em produção após minha aprovação visual explícita.
   - Regra atualizada (confirmada em 29/07/2026): deploy acontece automaticamente (commit + push + deploy em produção) sempre que uma tarefa for concluída e testada, sem precisar perguntar a cada vez — vale como confirmação permanente, não pontual. Isso não dispensa mostrar evidência real do teste antes de declarar a tarefa concluída.
   - Sempre mostrar evidência real (screenshot, log, resultado de query) ANTES de declarar qualquer tarefa concluída.
   - Ao trabalhar com múltiplos fornecedores de dados/API no futuro, manter o roteamento sincronizado entre TODOS os canais (WhatsApp, painel web, dashboard).
   - Nenhum fornecedor de API deve falhar silenciosamente pro cliente — sempre entregar resposta honesta sobre o que aconteceu.
   - Ao integrar um novo fornecedor de API, manter registro central (`docs/fornecedores-api-reference.md`) com link da documentação oficial, nome da variável de ambiente do token, e observações importantes.

5. COMUNICAÇÃO:
   - Toda vez que rodar um teste de bancada gerando algum artefato, sempre mostrar o link/local do artefato na mesma mensagem do resultado.
   - Se o projeto usar notificação via WhatsApp para o admin, me perguntar o número correto — não presumir nenhum número de projeto anterior.
   - Me notificar em tempo real sobre progresso em tarefas de correção/investigação.

6. Eu decido opções de negócio/preferência pessoal; você decide autonomamente opções técnicas — só me pergunte quando for julgamento de negócio ou preferência pessoal minha.

---

## Regra adicional confirmada (fase de fundação do projeto)

7. No fluxo de criação de instância ("Configurações > Instâncias"), o nome de exibição do serviço deve ter checagem de duplicidade BLOQUEANTE em caso de duplicidade exata (case-insensitive) — não apenas um aviso amigável. Se já existir uma instância com o mesmo nome de exibição (ignorando maiúsculas/minúsculas), a criação de uma nova instância com esse mesmo nome deve ser impedida, mesmo que o identificador técnico gerado seja diferente. Motivo: evitar confusão de atendentes no dia a dia entre instâncias com nomes visualmente parecidos.

---

## Contexto de negócio (referência, não regra técnica)

Ablaw é um sistema de atendimento via WhatsApp com IA especializada em Direito Trabalhista. Um número de WhatsApp cadastrado gerencia conversas de leads vindos de campanha publicitária voltada pra causas trabalhistas. A IA tira dúvidas jurídicas trabalhistas, qualifica o lead, e é capaz de conduzir o processo até a assinatura de contrato (modelo de negócio: honorários sobre valores a receber no futuro). Futuramente: integração com API de assinatura eletrônica de contrato (provedor ainda não escolhido) e API de consulta processual. Dashboard de gestão de conversas com grupos de qualificação de leads: escopo em discussão, não construído ainda.

## Stack técnica adotada

- Frontend: React + Vite + TypeScript
- Estilo: Tailwind CSS
- Backend/DB: Supabase (Postgres + Auth + Row Level Security) — projeto Supabase próprio, isolado, não reaproveita nenhum projeto anterior
- Lógica de servidor: Supabase Edge Functions (Deno) — usada para operações que precisam ser atômicas/transacionais (ex: criação de instância + configuração de IA + estado de conexão, tudo em uma única transação)
- Gestão de estado/dados no frontend: TanStack Query

Infraestrutura de produção (hospedagem, domínio, projeto Supabase real) ainda não definida — será decidida em fase futura.
