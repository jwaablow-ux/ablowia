// Ablaw IA — Edge Function pública (sem login), passo 1 do pareamento mobile.
//
// A partir do link público de pareamento, consulta no GoZAP quais métodos de
// verificação estão disponíveis para o número já cadastrado nesta instância
// (SMS, ligação, OTP no WhatsApp, e-mail) — usada pela página pública para
// montar a escolha de método antes de pedir o código.
//
// Sem Authorization de usuário: usa a service role key, a única forma de ler
// `instancias_conexao` (sem policy nenhuma para anon/authenticated).

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
    .select("gozap_token, instancias(nome_servico)")
    .eq("link_pareamento_token", linkToken)
    .single();

  if (conexaoError || !conexao) {
    return jsonResponse({ erro: "Link de pareamento inválido ou expirado" }, 404);
  }

  const nomeServico = (conexao as unknown as { instancias: { nome_servico: string } }).instancias
    ?.nome_servico;

  const resposta = await fetch(`${GOZAP_API_URL}/instance/mobile/verification-options`, {
    headers: { token: conexao.gozap_token },
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok || !corpo?.success) {
    return jsonResponse(
      { erro: `GOZAP_OPCOES_FALHOU: HTTP ${resposta.status} - ${JSON.stringify(corpo)}` },
      502
    );
  }

  return jsonResponse(
    {
      nomeServico,
      telefone: corpo.verificationOptions?.phone ?? null,
      metodos: corpo.verificationOptions?.methods ?? [],
      metodoRecomendado: corpo.verificationOptions?.recommendedMethod ?? null,
    },
    200
  );
});
