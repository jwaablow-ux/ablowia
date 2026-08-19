// Ablaw IA — Edge Function pública (sem login) que consulta o status de
// conexão de uma instância a partir do seu link público de pareamento, e
// sincroniza `instancias.status_conexao` assim que o WhatsApp conectar.
//
// Mesma lógica de acesso da wasender-obter-qrcode: sem Authorization de
// usuário, service role key para ler/escrever direto (sem depender de RLS),
// acesso restrito à instância dona do link_pareamento_token informado.
//
// Diferente das outras chamadas WaSender (que usam o Personal Access Token
// da conta), o endpoint GET /api/status é autenticado com a api_key PRÓPRIA
// da sessão — por isso lemos wasender_api_key aqui, não o token da conta.

import { createClient } from "jsr:@supabase/supabase-js@2";

const WASENDER_API_URL = Deno.env.get("WASENDER_API_URL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

function mapearStatus(wasenderStatus: string | undefined): string {
  if (wasenderStatus === "connected") return "conectado";
  if (wasenderStatus === "connecting" || wasenderStatus === "need_scan" || wasenderStatus === "need_passkey") {
    return "aguardando_pareamento";
  }
  return "desconectado";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ erro: "Método não permitido" }, 405);
  }

  if (!WASENDER_API_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { erro: "WASENDER_NAO_CONFIGURADA: variáveis de ambiente ausentes" },
      500
    );
  }

  let linkToken: string;
  try {
    const corpo = await req.json();
    linkToken = String(corpo?.linkToken ?? "").trim();
  } catch {
    return jsonResponse({ erro: "Corpo da requisição inválido" }, 400);
  }

  if (!linkToken) {
    return jsonResponse({ erro: "Link de pareamento não informado" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: conexao, error: conexaoError } = await supabase
    .from("instancias_conexao")
    .select("instancia_id, wasender_api_key")
    .eq("link_pareamento_token", linkToken)
    .single();

  if (conexaoError || !conexao) {
    return jsonResponse({ erro: "Link de pareamento inválido ou expirado" }, 404);
  }

  const resposta = await fetch(`${WASENDER_API_URL}/api/status`, {
    headers: { Authorization: `Bearer ${conexao.wasender_api_key}` },
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    return jsonResponse(
      { erro: `WASENDER_STATUS_FALHOU: HTTP ${resposta.status} - ${JSON.stringify(corpo)}` },
      502
    );
  }

  const statusConexao = mapearStatus(corpo?.status);

  await supabase
    .from("instancias")
    .update({ status_conexao: statusConexao })
    .eq("id", conexao.instancia_id);

  return jsonResponse({ statusConexao }, 200);
});
