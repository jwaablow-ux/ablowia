// Ablaw IA — Edge Function pública (sem login), passo 2 do pareamento mobile.
//
// A partir do link público de pareamento, pede ao GoZAP o envio do código de
// verificação pelo método escolhido pelo usuário final (sms, call ou email).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { interpretarErroGozap } from "../_shared/gozap-erros.ts";

const GOZAP_API_URL = Deno.env.get("GOZAP_API_URL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const METODOS_VALIDOS = ["sms", "call", "email"];

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

  if (!GOZAP_API_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ erro: "GOZAP_NAO_CONFIGURADA: variáveis de ambiente ausentes" }, 500);
  }

  let linkToken: string;
  let metodo: string;
  try {
    const corpo = await req.json();
    linkToken = String(corpo?.linkToken ?? "").trim();
    metodo = String(corpo?.metodo ?? "").trim().toLowerCase();
  } catch {
    return jsonResponse({ erro: "Corpo da requisição inválido" }, 400);
  }

  if (!linkToken) {
    return jsonResponse({ erro: "Link de pareamento não informado" }, 400);
  }

  if (!METODOS_VALIDOS.includes(metodo)) {
    return jsonResponse({ erro: "Método de verificação inválido. Use sms, call ou email." }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: conexao, error: conexaoError } = await supabase
    .from("instancias_conexao")
    .select("gozap_token")
    .eq("link_pareamento_token", linkToken)
    .single();

  if (conexaoError || !conexao) {
    return jsonResponse({ erro: "Link de pareamento inválido ou expirado" }, 404);
  }

  const resposta = await fetch(`${GOZAP_API_URL}/instance/mobile/request-code`, {
    method: "POST",
    headers: {
      token: conexao.gozap_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ method: metodo }),
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok || !corpo?.success) {
    const { mensagem, retryAfterSegundos } = interpretarErroGozap(corpo, resposta.status);
    return jsonResponse({ erro: mensagem, retryAfterSegundos }, 502);
  }

  return jsonResponse(
    {
      codigoEnviado: Boolean(corpo.codeSent),
      mensagem: corpo.message ?? null,
    },
    200
  );
});
