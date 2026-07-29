// Ablaw IA — Edge Function pública (sem login), passo 3 (final) do
// pareamento mobile.
//
// A partir do link público de pareamento, confirma o código de verificação
// recebido pelo usuário final. Se o GoZAP confirmar a conexão, sincroniza
// `instancias.status_conexao` para "conectado" imediatamente (sem precisar
// esperar o próximo polling de status).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { interpretarErroGozap } from "../_shared/gozap-erros.ts";

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
  let codigo: string;
  try {
    const corpo = await req.json();
    linkToken = String(corpo?.linkToken ?? "").trim();
    codigo = String(corpo?.codigo ?? "").trim();
  } catch {
    return jsonResponse({ erro: "Corpo da requisição inválido" }, 400);
  }

  if (!linkToken) {
    return jsonResponse({ erro: "Link de pareamento não informado" }, 400);
  }

  if (!codigo) {
    return jsonResponse({ erro: "Informe o código recebido" }, 400);
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

  const resposta = await fetch(`${GOZAP_API_URL}/instance/mobile/verify-code`, {
    method: "POST",
    headers: {
      token: conexao.gozap_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: codigo }),
  });

  const corpo = await resposta.json().catch(() => null);

  if (resposta.status === 409 && corpo?.twoFactorRequired) {
    return jsonResponse(
      {
        erro:
          "Este número tem verificação em duas etapas (2FA) ativada no WhatsApp. " +
          "Desative o 2FA no app e peça um novo código para continuar.",
      },
      409
    );
  }

  if (!resposta.ok || !corpo?.success) {
    if (resposta.status === 409) {
      return jsonResponse(
        { erro: "Código incorreto ou expirado. Confira o código recebido e tente novamente." },
        409
      );
    }
    const { mensagem, retryAfterSegundos } = interpretarErroGozap(corpo, resposta.status);
    return jsonResponse({ erro: mensagem, retryAfterSegundos }, 502);
  }

  const conectado = corpo.instance?.status === "connected";
  if (conectado) {
    await supabase
      .from("instancias")
      .update({ status_conexao: "conectado" })
      .eq("id", conexao.instancia_id);
  }

  return jsonResponse(
    {
      statusConexao: conectado ? "conectado" : "aguardando_pareamento",
      mensagem: corpo.message ?? null,
    },
    200
  );
});
