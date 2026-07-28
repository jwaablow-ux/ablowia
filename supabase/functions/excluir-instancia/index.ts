// Ablaw IA — Edge Function de exclusão de instância (provedor GoZAP).
//
// Remove a instância real no GoZAP e, em seguida, o registro no banco
// (instância + configuração de IA + credenciais de conexão, via cascade). Se
// o GoZAP retornar um erro, a exclusão é abortada e nada é removido do banco
// — para nunca deixar o painel dizendo que a instância sumiu enquanto ela
// ainda existe de verdade no GoZAP.

import { createClient } from "jsr:@supabase/supabase-js@2";

const GOZAP_API_URL = Deno.env.get("GOZAP_API_URL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ erro: "Método não permitido" }, 405);
  }

  if (!GOZAP_API_URL) {
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

  let id: string;
  try {
    const corpo = await req.json();
    id = String(corpo?.id ?? "").trim();
  } catch {
    return jsonResponse({ erro: "Corpo da requisição inválido" }, 400);
  }

  if (!id) {
    return jsonResponse({ erro: "Id da instância não informado" }, 400);
  }

  const { data: credenciais, error: credenciaisError } = await supabase
    .rpc("obter_credenciais_gozap", { p_instancia_id: id })
    .single();

  if (credenciaisError || !credenciais) {
    return jsonResponse({ erro: "Instância não encontrada ou sem credenciais de conexão" }, 404);
  }

  const { gozap_token: gozapToken } = credenciais as { gozap_token: string };

  const respostaGozap = await fetch(`${GOZAP_API_URL}/instance`, {
    method: "DELETE",
    headers: { token: gozapToken },
  });

  if (!respostaGozap.ok && respostaGozap.status !== 401) {
    const corpo = await respostaGozap.json().catch(() => null);
    return jsonResponse(
      { erro: `GOZAP_EXCLUSAO_FALHOU: HTTP ${respostaGozap.status} - ${JSON.stringify(corpo)}` },
      502
    );
  }

  const { error: dbError } = await supabase.rpc("excluir_instancia", { p_id: id });
  if (dbError) {
    return jsonResponse({ erro: `Falha ao remover instância do banco: ${dbError.message}` }, 500);
  }

  return jsonResponse({ ok: true }, 200);
});
