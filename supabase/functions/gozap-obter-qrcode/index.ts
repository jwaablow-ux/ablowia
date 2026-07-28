// Ablaw IA — Edge Function pública (sem login) que gera o QR code de
// pareamento de uma instância criada em modo companion, a partir do seu link
// público de pareamento.
//
// Não há Authorization de usuário aqui — quem tem o link (token opaco,
// `link_pareamento_token`) pode gerar o QR code desta instância específica,
// e só desta. Por isso usa a service role key (a única forma de ler
// `instancias_conexao`, que não tem policy nenhuma para `anon`/`authenticated`)
// em vez de depender de RLS.

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
    .select("instancia_id, gozap_token, instancias(nome_servico)")
    .eq("link_pareamento_token", linkToken)
    .single();

  if (conexaoError || !conexao) {
    return jsonResponse({ erro: "Link de pareamento inválido ou expirado" }, 404);
  }

  const nomeServico = (conexao as unknown as { instancias: { nome_servico: string } }).instancias
    ?.nome_servico;

  const resposta = await fetch(`${GOZAP_API_URL}/instance/connect`, {
    method: "POST",
    headers: {
      token: conexao.gozap_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok || !corpo?.success) {
    return jsonResponse(
      { erro: `GOZAP_CONEXAO_FALHOU: HTTP ${resposta.status} - ${JSON.stringify(corpo)}` },
      502
    );
  }

  return jsonResponse(
    {
      nomeServico,
      status: corpo.instance?.status ?? null,
      qrCode: corpo.instance?.qrcode ?? null,
    },
    200
  );
});
