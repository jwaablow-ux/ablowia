// Ablaw IA — interpretação de erros da API GoZAP em mensagens amigáveis,
// nunca expondo JSON cru pro usuário final que está tentando conectar o
// WhatsApp sozinho pelo link público. Compartilhado entre as Edge Functions
// do fluxo de pareamento mobile (e QR, quando aplicável).

export interface ErroGozapInterpretado {
  mensagem: string;
  retryAfterSegundos?: number;
}

function formatarEspera(segundos: number): string {
  if (segundos < 60) return `${segundos} segundo${segundos === 1 ? "" : "s"}`;
  const minutos = Math.ceil(segundos / 60);
  return `${minutos} minuto${minutos === 1 ? "" : "s"}`;
}

export function interpretarErroGozap(corpo: unknown, statusHttp: number): ErroGozapInterpretado {
  const c = corpo as Record<string, unknown> | null;
  const whatsapp = (c?.whatsapp as Record<string, unknown> | undefined) ?? undefined;
  const reason = whatsapp?.reason as string | undefined;

  const retryAfter =
    (c?.retryAfter as number | undefined) ??
    (c?.remainingSeconds as number | undefined) ??
    (whatsapp?.retry_after as number | undefined);

  if (reason === "too_recent" || (typeof retryAfter === "number" && retryAfter > 0)) {
    const segundos = typeof retryAfter === "number" ? retryAfter : 120;
    return {
      mensagem: `Um código já foi enviado recentemente. Aguarde ${formatarEspera(segundos)} antes de pedir um novo.`,
      retryAfterSegundos: segundos,
    };
  }

  if (reason === "blocked") {
    return {
      mensagem:
        "O WhatsApp bloqueou temporariamente o registro desse número por segurança. " +
        "Aguarde um tempo e tente de novo, ou peça pra quem criou a instância trocar pro modo QR code.",
    };
  }

  if (statusHttp === 409) {
    return {
      mensagem: "Não foi possível continuar agora — tente novamente em alguns instantes.",
    };
  }

  if (statusHttp === 503) {
    return {
      mensagem: "O serviço de WhatsApp está temporariamente indisponível. Tente novamente em instantes.",
    };
  }

  return {
    mensagem: "Não foi possível completar essa etapa. Tente novamente em instantes.",
  };
}
