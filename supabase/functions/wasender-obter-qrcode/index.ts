// Ablaw IA — Edge Function pública (sem login) que gera o QR code de
// pareamento de uma instância a partir do seu link público de pareamento.
//
// Diferente da gozap-obter-qrcode que substitui, a WaSender devolve o QR
// como uma STRING de dados brutos (não uma imagem base64 pronta) — quem
// renderiza a imagem é o frontend, usando uma lib de QR code.
//
// Não há Authorization de usuário aqui — quem tem o link (token opaco,
// `link_pareamento_token`) pode gerar o QR code desta instância específica,
// e só desta. Usa a service role key (a única forma de ler
// `instancias_conexao`, que não tem policy nenhuma para `anon`/`authenticated`)
// e o Personal Access Token da conta (nunca exposto ao público) pra chamar
// POST .../connect, que inicia a linkagem e devolve o QR.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { interpretarErroWasender } from "../_shared/wasender-erros.ts";

const WASENDER_API_URL = Deno.env.get("WASENDER_API_URL");
const WASENDER_PERSONAL_ACCESS_TOKEN = Deno.env.get("WASENDER_PERSONAL_ACCESS_TOKEN");
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

  if (!WASENDER_API_URL || !WASENDER_PERSONAL_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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
    .select("instancia_id, wasender_session_id, instancias(nome_servico)")
    .eq("link_pareamento_token", linkToken)
    .single();

  if (conexaoError || !conexao) {
    return jsonResponse({ erro: "Link de pareamento inválido ou expirado" }, 404);
  }

  const nomeServico = (conexao as unknown as { instancias: { nome_servico: string } }).instancias
    ?.nome_servico;
  const sessionId = (conexao as unknown as { wasender_session_id: number }).wasender_session_id;

  const resposta = await fetch(`${WASENDER_API_URL}/api/whatsapp-sessions/${sessionId}/connect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WASENDER_PERSONAL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok || !corpo?.success) {
    const { mensagem, retryAfterSegundos } = interpretarErroWasender(corpo, resposta.status);
    return jsonResponse({ erro: mensagem, retryAfterSegundos }, 502);
  }

  return jsonResponse(
    {
      nomeServico,
      status: corpo.data?.status ?? null,
      qrCode: corpo.data?.qrCode ?? null,
    },
    200
  );
});
