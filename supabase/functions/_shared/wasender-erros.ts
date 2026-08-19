// Ablaw IA — interpretação de erros da API WaSender em mensagens amigáveis,
// nunca expondo JSON cru pro usuário final que está tentando conectar o
// WhatsApp sozinho. Compartilhado entre as Edge Functions do fluxo de
// pareamento por QR code.

export interface ErroWasenderInterpretado {
  mensagem: string;
  retryAfterSegundos?: number;
}

export function interpretarErroWasender(corpo: unknown, statusHttp: number): ErroWasenderInterpretado {
  const c = corpo as Record<string, unknown> | null;
  const mensagem = typeof c?.message === "string" ? c.message : undefined;

  if (statusHttp === 429) {
    return {
      mensagem: "Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.",
      retryAfterSegundos: 30,
    };
  }

  if (statusHttp === 403 && mensagem?.toLowerCase().includes("subscription")) {
    return {
      mensagem: "A conta da WaSender está sem assinatura ativa para essa operação.",
    };
  }

  if (statusHttp === 403 && mensagem?.toLowerCase().includes("session limit")) {
    return {
      mensagem: "O limite de instâncias do plano atual da WaSender foi atingido.",
    };
  }

  if (statusHttp === 404) {
    return {
      mensagem: "Sessão não encontrada na WaSender — ela pode ter sido removida.",
    };
  }

  return {
    mensagem: "Não foi possível completar essa etapa. Tente novamente em instantes.",
  };
}
