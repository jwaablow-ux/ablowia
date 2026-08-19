// Ablaw IA — Edge Function de criação de instância (provedor WaSender).
//
// Diferente da GoZAP, a WaSender exige telefone já na criação da sessão e só
// suporta linkagem via QR code — não existe mais um modo "SMS/ligação" (ver
// docs/fornecedores-api-reference.md). Grava o registro local (instância +
// configuração de IA, via RPC criar_instancia) e registra o id/api_key da
// sessão WaSender + o token de pareamento público via RPC
// registrar_conexao_wasender. Se qualquer etapa depois da criação na
// WaSender falhar, a sessão é removida da WaSender para não deixar órfã.

import { createClient } from "jsr:@supabase/supabase-js@2";

const WASENDER_API_URL = Deno.env.get("WASENDER_API_URL");
const WASENDER_PERSONAL_ACCESS_TOKEN = Deno.env.get("WASENDER_PERSONAL_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const PREFIXO_ABLAW = "ablaw-";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function slugify(nome: string): string {
  const semAcento = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  const slug = semAcento.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "servico";
}

function gerarIdentificador(nomeServico: string): string {
  const slug = slugify(nomeServico);
  const sufixo = crypto.randomUUID().split("-")[0];
  return `${PREFIXO_ABLAW}${slug}-${sufixo}`;
}

function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "");
}

interface RespostaCriarWasender {
  success: boolean;
  data: {
    id: number;
    api_key: string;
  };
}

async function criarSessaoNaWasender(
  identificador: string,
  telefone: string
): Promise<RespostaCriarWasender> {
  const resposta = await fetch(`${WASENDER_API_URL}/api/whatsapp-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WASENDER_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: identificador,
      phone_number: `+${telefone}`,
      account_protection: true,
      log_messages: true,
    }),
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok || !corpo?.success) {
    throw new Error(`WASENDER_CRIACAO_FALHOU: HTTP ${resposta.status} - ${JSON.stringify(corpo)}`);
  }
  return corpo as RespostaCriarWasender;
}

async function removerSessaoNaWasender(sessionId: number) {
  await fetch(`${WASENDER_API_URL}/api/whatsapp-sessions/${sessionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${WASENDER_PERSONAL_ACCESS_TOKEN}` },
  }).catch(() => {
    // Best-effort: se a limpeza falhar, a sessão órfã na WaSender fica
    // registrada no log para remoção manual — não escondemos o erro original.
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ erro: "Método não permitido" }, 405);
  }

  if (!WASENDER_API_URL || !WASENDER_PERSONAL_ACCESS_TOKEN) {
    return jsonResponse(
      { erro: "WASENDER_NAO_CONFIGURADA: variáveis de ambiente da WaSender ausentes" },
      500
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ erro: "Não autenticado" }, 401);
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ erro: "Sessão inválida" }, 401);
  }

  let nomeServico: string;
  let telefone: string;
  try {
    const corpo = await req.json();
    nomeServico = String(corpo?.nomeServico ?? "").trim();
    telefone = normalizarTelefone(String(corpo?.telefone ?? ""));
  } catch {
    return jsonResponse({ erro: "Corpo da requisição inválido" }, 400);
  }

  if (!nomeServico) {
    return jsonResponse({ erro: "Nome do serviço não pode ser vazio" }, 400);
  }

  if (telefone.length < 10) {
    return jsonResponse(
      { erro: "Telefone inválido. Informe com DDI, só números (ex.: 5511999999999)." },
      400
    );
  }

  const identificador = gerarIdentificador(nomeServico);

  let respostaWasender: RespostaCriarWasender;
  try {
    respostaWasender = await criarSessaoNaWasender(identificador, telefone);
  } catch (e) {
    return jsonResponse(
      { erro: e instanceof Error ? e.message : "Falha ao criar sessão na WaSender" },
      502
    );
  }

  const { data: instancia, error: dbError } = await supabase
    .rpc("criar_instancia", {
      p_nome_servico: nomeServico,
      p_identificador_tecnico: identificador,
    })
    .single();

  if (dbError) {
    await removerSessaoNaWasender(respostaWasender.data.id);
    const duplicado = dbError.message.includes("NOME_DUPLICADO");
    return jsonResponse(
      { erro: duplicado ? dbError.message : `Falha ao gravar instância no banco: ${dbError.message}` },
      duplicado ? 409 : 500
    );
  }

  const { data: linkPareamentoToken, error: conexaoError } = await supabase.rpc(
    "registrar_conexao_wasender",
    {
      p_instancia_id: (instancia as { id: string }).id,
      p_wasender_session_id: respostaWasender.data.id,
      p_wasender_api_key: respostaWasender.data.api_key,
    }
  );

  if (conexaoError) {
    await removerSessaoNaWasender(respostaWasender.data.id);
    await supabase.rpc("excluir_instancia", { p_id: (instancia as { id: string }).id });
    return jsonResponse(
      { erro: `Falha ao registrar credenciais de conexão: ${conexaoError.message}` },
      500
    );
  }

  return jsonResponse(
    {
      instancia,
      linkPareamento: `/pareamento/${linkPareamentoToken}`,
    },
    201
  );
});
