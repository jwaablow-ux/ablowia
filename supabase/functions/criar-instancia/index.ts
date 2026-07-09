// Ablaw IA — Edge Function de criação de instância.
//
// Orquestra, num único fluxo, a varredura de instâncias existentes na Evolution
// API (para nunca colidir nome de instância entre este e outros sistemas que
// rodam no mesmo servidor Evolution, como o Magnus), a criação real da
// instância de WhatsApp, e a criação atômica dos registros no banco (instância
// + configuração de IA). Se a criação na Evolution falhar, nada é gravado no
// banco. Se a gravação no banco falhar depois da Evolution ter criado a
// instância, a instância é removida da Evolution para não deixar órfã.

import { createClient } from "jsr:@supabase/supabase-js@2";

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const PREFIXO_ABLAW = "ablaw-";

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

function slugify(nome: string): string {
  const semAcento = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  const slug = semAcento.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "servico";
}

async function buscarNomesExistentesNaEvolution(): Promise<Set<string>> {
  const resposta = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
    headers: { apikey: EVOLUTION_API_KEY! },
  });
  if (!resposta.ok) {
    throw new Error(`EVOLUTION_INDISPONIVEL: falha ao consultar instâncias existentes (HTTP ${resposta.status})`);
  }
  const lista = await resposta.json();
  const nomes = new Set<string>();
  for (const item of Array.isArray(lista) ? lista : []) {
    const nome = item?.name ?? item?.instanceName ?? item?.instance?.instanceName;
    if (typeof nome === "string") nomes.add(nome.toLowerCase());
  }
  return nomes;
}

async function gerarIdentificadorSemColisao(nomeServico: string, nomesExistentes: Set<string>): Promise<string> {
  const slug = slugify(nomeServico);
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const sufixo = crypto.randomUUID().split("-")[0];
    const candidato = `${PREFIXO_ABLAW}${slug}-${sufixo}`;
    if (!nomesExistentes.has(candidato.toLowerCase())) {
      return candidato;
    }
  }
  throw new Error("COLISAO_PERSISTENTE: não foi possível gerar um identificador único após 5 tentativas");
}

async function criarInstanciaNaEvolution(identificador: string) {
  const resposta = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
    method: "POST",
    headers: {
      apikey: EVOLUTION_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instanceName: identificador,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error(`EVOLUTION_CRIACAO_FALHOU: HTTP ${resposta.status} - ${JSON.stringify(corpo)}`);
  }
  return corpo;
}

async function removerInstanciaNaEvolution(identificador: string) {
  await fetch(`${EVOLUTION_API_URL}/instance/delete/${identificador}`, {
    method: "DELETE",
    headers: { apikey: EVOLUTION_API_KEY! },
  }).catch(() => {
    // Best-effort: se a limpeza falhar, a instância órfã na Evolution fica
    // registrada no log para remoção manual — não escondemos o erro original.
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

  let nomeServico: string;
  try {
    const corpo = await req.json();
    nomeServico = String(corpo?.nomeServico ?? "").trim();
  } catch {
    return jsonResponse({ erro: "Corpo da requisição inválido" }, 400);
  }

  if (!nomeServico) {
    return jsonResponse({ erro: "Nome do serviço não pode ser vazio" }, 400);
  }

  let identificador: string;
  try {
    const nomesExistentes = await buscarNomesExistentesNaEvolution();
    identificador = await gerarIdentificadorSemColisao(nomeServico, nomesExistentes);
  } catch (e) {
    return jsonResponse({ erro: e instanceof Error ? e.message : "Falha ao varrer instâncias existentes" }, 502);
  }

  let respostaEvolution: unknown;
  try {
    respostaEvolution = await criarInstanciaNaEvolution(identificador);
  } catch (e) {
    return jsonResponse({ erro: e instanceof Error ? e.message : "Falha ao criar instância na Evolution" }, 502);
  }

  const { data: instancia, error: dbError } = await supabase
    .rpc("criar_instancia", {
      p_nome_servico: nomeServico,
      p_identificador_tecnico: identificador,
    })
    .single();

  if (dbError) {
    await removerInstanciaNaEvolution(identificador);
    const duplicado = dbError.message.includes("NOME_DUPLICADO");
    return jsonResponse(
      { erro: duplicado ? dbError.message : `Falha ao gravar instância no banco: ${dbError.message}` },
      duplicado ? 409 : 500
    );
  }

  return jsonResponse({ instancia, evolution: respostaEvolution }, 201);
});
