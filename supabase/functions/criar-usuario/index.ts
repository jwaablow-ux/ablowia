// Ablaw IA — Edge Function de criação de usuário do painel.
//
// Só um admin pode chamar isto. Cria o usuário real no Supabase Auth (via
// service role, nunca exposta ao frontend) e o perfil (admin/comum) na mesma
// operação.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ erro: "Não autenticado" }, 401);
  }

  const supabaseComoUsuario = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabaseComoUsuario.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ erro: "Sessão inválida" }, 401);
  }

  const { data: souAdmin, error: erroAdmin } = await supabaseComoUsuario.rpc("eh_admin");
  if (erroAdmin || !souAdmin) {
    return jsonResponse({ erro: "Apenas administradores podem criar usuários" }, 403);
  }

  let email: string;
  let senha: string;
  let papel: string;
  try {
    const corpo = await req.json();
    email = String(corpo?.email ?? "").trim();
    senha = String(corpo?.senha ?? "");
    papel = String(corpo?.papel ?? "comum");
  } catch {
    return jsonResponse({ erro: "Corpo da requisição inválido" }, 400);
  }

  if (!email || !senha) {
    return jsonResponse({ erro: "E-mail e senha são obrigatórios" }, 400);
  }
  if (papel !== "admin" && papel !== "comum") {
    return jsonResponse({ erro: "Papel inválido" }, 400);
  }

  const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  const { data: novoUsuario, error: erroCriacao } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (erroCriacao || !novoUsuario.user) {
    return jsonResponse({ erro: erroCriacao?.message ?? "Falha ao criar usuário" }, 400);
  }

  const { error: erroPerfil } = await supabaseAdmin
    .from("perfis")
    .insert({ id: novoUsuario.user.id, email, papel });

  if (erroPerfil) {
    await supabaseAdmin.auth.admin.deleteUser(novoUsuario.user.id);
    return jsonResponse({ erro: `Falha ao criar perfil: ${erroPerfil.message}` }, 500);
  }

  return jsonResponse({ id: novoUsuario.user.id, email, papel }, 201);
});
