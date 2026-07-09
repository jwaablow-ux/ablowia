// Ablaw IA — Edge Function de exclusão de instância.
//
// Remove a instância real na Evolution API e, em seguida, o registro no banco
// (instância + configuração de IA, via cascade). Se a Evolution retornar um
// erro que não seja "instância não encontrada", a exclusão é abortada e nada
// é removido do banco — para nunca deixar o painel dizendo que a instância
// sumiu enquanto ela ainda existe de verdade na Evolution.

import { createClient } from "jsr:@supabase/supabase-js@2";

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
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

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return jsonResponse(
      { erro: "EVOLUTION_NAO_CONFIGURADA: variáveis de ambiente da Evolution API ausentes" },
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

  const { data: instancia, error: buscaError } = await supabase
    .from("instancias")
    .select("id, identificador_tecnico")
    .eq("id", id)
    .single();

  if (buscaError || !instancia) {
    return jsonResponse({ erro: "Instância não encontrada" }, 404);
  }

  const respostaEvolution = await fetch(
    `${EVOLUTION_API_URL}/instance/delete/${instancia.identificador_tecnico}`,
    { method: "DELETE", headers: { apikey: EVOLUTION_API_KEY } }
  );

  if (!respostaEvolution.ok && respostaEvolution.status !== 404) {
    const corpo = await respostaEvolution.json().catch(() => null);
    return jsonResponse(
      { erro: `EVOLUTION_EXCLUSAO_FALHOU: HTTP ${respostaEvolution.status} - ${JSON.stringify(corpo)}` },
      502
    );
  }

  const { error: dbError } = await supabase.rpc("excluir_instancia", { p_id: id });
  if (dbError) {
    return jsonResponse({ erro: `Falha ao remover instância do banco: ${dbError.message}` }, 500);
  }

  return jsonResponse({ ok: true }, 200);
});
