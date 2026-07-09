# Registro central de fornecedores de API — Ablaw IA

Quando um fornecedor for integrado (WhatsApp, assinatura eletrônica, consulta processual, IA jurídica etc.), registrar aqui:

- Nome do fornecedor
- Link da documentação oficial
- Nome da variável de ambiente do token/chave (ver `.env.example`)
- Observações importantes (limites, particularidades, pontos de falha conhecidos)

| Fornecedor | Documentação | Variável de ambiente | Observações |
|---|---|---|---|
| Evolution API (WhatsApp) | https://doc.evolution-api.com/ | `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` (secrets da Edge Function `criar-instancia`, nunca em `.env` do frontend) | Servidor compartilhado com outro sistema (Magnus), que não usa prefixo de nome. O Ablaw usa prefixo `ablaw-` em todo `identificador_tecnico` para nunca colidir. Toda criação de instância varre `GET /instance/fetchInstances` antes de decidir o nome final. |
