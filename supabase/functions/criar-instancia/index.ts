// Ablaw IA — Edge Function de criação de instância (provedor GoZAP).
//
// O admin escolhe, por instância, o modo de conexão:
// - "companion": QR code — o número já tem WhatsApp instalado num aparelho,
//   que continua sendo o dono da conta. Quem gera/escaneia o QR depois é o
//   usuário final, via link público (ver gozap-obter-qrcode).
// - "mobile": SMS/ligação — o número é registrado direto na API, sem
//   depender de nenhum celular físico manter o WhatsApp instalado. Exige
//   telefone nesta etapa. Quem verifica o código depois é o usuário final,
//   via link público (ver gozap-mobile-opcoes-verificacao,
//   gozap-mobile-solicitar-codigo, gozap-mobile-verificar-codigo).
//
// Nos dois casos: grava o registro local (instância + configuração de IA,
// via RPC criar_instancia) e registra as credenciais do GoZAP + o token de
// pareamento público via RPC registrar_conexao_gozap. Se qualquer etapa
// depois da criação no GoZAP falhar, a instância é removida do GoZAP para
// não deixar órfã.

import { createClient } from "jsr:@supabase/supabase-js@2";

const GOZAP_API_URL = Deno.env.get("GOZAP_API_URL");
const GOZAP_ADMIN_TOKEN = Deno.env.get("GOZAP_ADMIN_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const PREFIXO_ABLAW = "ablaw-";
const MODOS_VALIDOS = ["companion", "mobile"];

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

interface RespostaCriarGozap {
  success: boolean;
  token: string;
  instance: {
    id: string;
    name: string;
    status: string;
    connection_mode: string;
  };
}

function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "");
}

async function criarInstanciaNoGozap(
  identificador: string,
  connectionMode: string,
  telefone: string
): Promise<RespostaCriarGozap> {
  const body: Record<string, unknown> = {
    name: identificador,
    connection_mode: connectionMode,
  };
  if (connectionMode === "mobile") {
    body.phone = telefone;
  }

  const resposta = await fetch(`${GOZAP_API_URL}/instance/create`, {
    method: "POST",
    headers: {
      admintoken: GOZAP_ADMIN_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok || !corpo?.success) {
    throw new Error(`GOZAP_CRIACAO_FALHOU: HTTP ${resposta.status} - ${JSON.stringify(corpo)}`);
  }
  return corpo as RespostaCriarGozap;
}

async function removerInstanciaNoGozap(gozapToken: string) {
  await fetch(`${GOZAP_API_URL}/instance`, {
    method: "DELETE",
    headers: { token: gozapToken },
  }).catch(() => {
    // Best-effort: se a limpeza falhar, a instância órfã no GoZAP fica
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

  if (!GOZAP_API_URL || !GOZAP_ADMIN_TOKEN) {
    return jsonResponse(
      { erro: "GOZAP_NAO_CONFIGURADA: variáveis de ambiente do GoZAP ausentes" },
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
  let connectionMode: string;
  let telefone: string;
  try {
    const corpo = await req.json();
    nomeServico = String(corpo?.nomeServico ?? "").trim();
    connectionMode = String(corpo?.connectionMode ?? "").trim().toLowerCase();
    telefone = normalizarTelefone(String(corpo?.telefone ?? ""));
  } catch {
    return jsonResponse({ erro: "Corpo da requisição inválido" }, 400);
  }

  if (!nomeServico) {
    return jsonResponse({ erro: "Nome do serviço não pode ser vazio" }, 400);
  }

  if (!MODOS_VALIDOS.includes(connectionMode)) {
    return jsonResponse({ erro: "Modo de conexão inválido. Use companion ou mobile." }, 400);
  }

  if (connectionMode === "mobile" && telefone.length < 10) {
    return jsonResponse(
      { erro: "Telefone inválido. Informe com DDI, só números (ex.: 5511999999999)." },
      400
    );
  }

  const identificador = gerarIdentificador(nomeServico);

  let respostaGozap: RespostaCriarGozap;
  try {
    respostaGozap = await criarInstanciaNoGozap(identificador, connectionMode, telefone);
  } catch (e) {
    return jsonResponse({ erro: e instanceof Error ? e.message : "Falha ao criar instância no GoZAP" }, 502);
  }

  const { data: instancia, error: dbError } = await supabase
    .rpc("criar_instancia", {
      p_nome_servico: nomeServico,
      p_identificador_tecnico: identificador,
    })
    .single();

  if (dbError) {
    await removerInstanciaNoGozap(respostaGozap.token);
    const duplicado = dbError.message.includes("NOME_DUPLICADO");
    return jsonResponse(
      { erro: duplicado ? dbError.message : `Falha ao gravar instância no banco: ${dbError.message}` },
      duplicado ? 409 : 500
    );
  }

  const { data: linkPareamentoToken, error: conexaoError } = await supabase.rpc("registrar_conexao_gozap", {
    p_instancia_id: (instancia as { id: string }).id,
    p_gozap_instance_id: respostaGozap.instance.id,
    p_gozap_token: respostaGozap.token,
    p_connection_mode: connectionMode,
  });

  if (conexaoError) {
    await removerInstanciaNoGozap(respostaGozap.token);
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
