// Ablaw IA — Edge Function pública (sem login) que consulta o status de
// conexão de uma instância a partir do seu link público de pareamento, e
// sincroniza `instancias.status_conexao` assim que o WhatsApp conectar.
//
// Mesma lógica de acesso da gozap-obter-qrcode: sem Authorization de usuário,
// service role key para ler/escrever direto (sem depender de RLS), acesso
// restrito à instância dona do link_pareamento_token informado.

import { createClient } from "jsr:@supabase/supabase-js@2";

const GOZAP_API_URL = Deno.env.get("GOZAP_API_URL");
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

function mapearStatus(gozapStatus: string | undefined, conectado: boolean): string {
  if (conectado) return "conectado";
  if (gozapStatus === "qr" || gozapStatus === "connecting" || gozapStatus === "needs_verification") {
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

  if (!GOZAP_API_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { erro: "GOZAP_NAO_CONFIGURADA: variáveis de ambiente ausentes" },
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
    .select("instancia_id, gozap_token")
    .eq("link_pareamento_token", linkToken)
    .single();

  if (conexaoError || !conexao) {
    return jsonResponse({ erro: "Link de pareamento inválido ou expirado" }, 404);
  }

  const resposta = await fetch(`${GOZAP_API_URL}/instance/status`, {
    headers: { token: conexao.gozap_token },
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok || !corpo?.success) {
    return jsonResponse(
      { erro: `GOZAP_STATUS_FALHOU: HTTP ${resposta.status} - ${JSON.stringify(corpo)}` },
      502
    );
  }

  const conectado = Boolean(corpo.runtime?.connected && corpo.runtime?.logged_in);
  const statusConexao = mapearStatus(corpo.instance?.status, conectado);

  await supabase
    .from("instancias")
    .update({ status_conexao: statusConexao })
    .eq("id", conexao.instancia_id);

  return jsonResponse({ statusConexao }, 200);
});
