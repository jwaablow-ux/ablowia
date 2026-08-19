// Ablaw IA — testa de verdade a conexão com a API da OpenAI usando o
// modelo selecionado, chamando a API real (sem simular nada). Só admin pode
// rodar isto, já que consome tokens reais.

import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
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
  if (!OPENAI_API_KEY) {
    return jsonResponse({ erro: "OPENAI_API_KEY não configurada" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ erro: "Não autenticado" }, 401);

  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return jsonResponse({ erro: "Sessão inválida" }, 401);

  const { data: souAdmin } = await supabase.rpc("eh_admin");
  if (!souAdmin) return jsonResponse({ erro: "Apenas administradores podem testar a conexão" }, 403);

  let modelo: string;
  try {
    const corpo = await req.json();
    modelo = String(corpo?.modelo ?? "");
  } catch {
    return jsonResponse({ erro: "Corpo da requisição inválido" }, 400);
  }
  if (!modelo) return jsonResponse({ erro: "Modelo não informado" }, 400);

  const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 16,
      messages: [{ role: "user", content: "Responda apenas: conexão ok" }],
    }),
  });

  const corpoResposta = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    return jsonResponse(
      { erro: `Falha ao conectar com o modelo "${modelo}": ${JSON.stringify(corpoResposta)}` },
      502
    );
  }

  const texto = corpoResposta?.choices?.[0]?.message?.content ?? "";

  return jsonResponse({ ok: true, modelo, resposta: texto }, 200);
});
