// Ablaw IA — recebe os webhooks de mensagem da WaSender, monta o prompt da
// IA (conhecimento jurídico geral + configuração específica da instância) e
// responde de volta no mesmo WhatsApp. Se a pessoa mandou texto, responde em
// texto; se mandou áudio, transcreve, responde e devolve em áudio (voz
// feminina, português do Brasil, tom suave e profissional).
//
// Público (sem Authorization de usuário) — a própria WaSender chama esta
// URL. Identifica a instância pelo parâmetro `instancia` na query string,
// configurado automaticamente na criação/atualização da sessão (ver
// criar-instancia). Só processa eventos de mensagem recebida (nunca
// responde a mensagens enviadas pela própria instância).
//
// Limitação conhecida: cada resposta é gerada sem histórico de conversa
// (sem memória entre mensagens) — ainda não existe tabela de conversas.

import { createClient } from "jsr:@supabase/supabase-js@2";

const WASENDER_API_URL = Deno.env.get("WASENDER_API_URL");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Voz feminina brasileira, tom suave e profissional, com controle fino de
// expressão via `instructions` (só o modelo gpt-4o-mini-tts suporta isso).
const VOZ_TTS = "coral";
const MODELO_TTS = "gpt-4o-mini-tts";
const INSTRUCOES_VOZ =
  "Voice: warm, friendly Brazilian Portuguese female voice, like a real person casually texting a friend " +
  "on WhatsApp — not a customer-service agent reading a script. " +
  "Tone: relaxed, natural, with the small imperfections of real speech (natural pauses, gentle inflection, " +
  "no robotic evenness). " +
  "Pacing: conversational speed, not rushed, not overly slow or theatrical. " +
  "Delivery: never sound like a call-center greeting or a canned response — sound like she genuinely means " +
  "what she's saying, especially on short replies like a simple hello.";

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface MensagemWasender {
  key?: {
    id?: string;
    fromMe?: boolean;
    remoteJid?: string;
    cleanedSenderPn?: string;
  };
  messageBody?: string;
  message?: {
    audioMessage?: Record<string, unknown>;
  };
}

async function transcreverAudio(sessionApiKey: string, mensagem: MensagemWasender): Promise<string | null> {
  const respostaDecrypt = await fetch(`${WASENDER_API_URL}/api/decrypt-media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: { messages: mensagem } }),
  });
  const corpoDecrypt = await respostaDecrypt.json().catch(() => null);
  if (!respostaDecrypt.ok || !corpoDecrypt?.success || !corpoDecrypt?.publicUrl) return null;

  const respostaAudio = await fetch(corpoDecrypt.publicUrl);
  if (!respostaAudio.ok) return null;
  const audioBlob = await respostaAudio.blob();

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.ogg");
  formData.append("model", "whisper-1");

  const respostaTranscricao = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  });
  const corpoTranscricao = await respostaTranscricao.json().catch(() => null);
  if (!respostaTranscricao.ok) return null;

  return corpoTranscricao?.text ?? null;
}

async function gerarAudioResposta(texto: string): Promise<Blob | null> {
  const resposta = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO_TTS,
      voice: VOZ_TTS,
      input: texto,
      instructions: INSTRUCOES_VOZ,
    }),
  });
  if (!resposta.ok) return null;
  return await resposta.blob();
}

async function gerarRespostaTexto(
  modelo: string,
  promptBase: string,
  nomeIA: string,
  personalidade: string,
  promptEspecifico: string,
  mensagemUsuario: string
): Promise<string> {
  const systemPrompt = `${promptBase}

## Configuração desta instância
Nome da IA: ${nomeIA || "Assistente"}
Personalidade: ${personalidade || "profissional e cordial"}

${promptEspecifico || ""}`.trim();

  const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: mensagemUsuario },
      ],
    }),
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error(`OPENAI_FALHOU: HTTP ${resposta.status} - ${JSON.stringify(corpo)}`);
  }

  return corpo?.choices?.[0]?.message?.content ?? "";
}

async function enviarTextoWasender(apiKey: string, para: string, texto: string) {
  await fetch(`${WASENDER_API_URL}/api/send-message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: para, text: texto }),
  });
}

async function enviarAudioWasender(apiKey: string, para: string, audioUrl: string) {
  await fetch(`${WASENDER_API_URL}/api/send-message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: para, audioUrl }),
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ erro: "Método não permitido" }, 405);
  }

  if (!WASENDER_API_URL || !OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ erro: "WASENDER_NAO_CONFIGURADA: variáveis de ambiente ausentes" }, 500);
  }

  const url = new URL(req.url);
  const instanciaId = url.searchParams.get("instancia");
  if (!instanciaId) {
    return jsonResponse({ erro: "Parâmetro instancia ausente" }, 400);
  }

  let payload: { event?: string; data?: { messages?: MensagemWasender } };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: true }, 200);
  }

  const mensagem = payload?.data?.messages;
  const remetente = mensagem?.key?.cleanedSenderPn ?? mensagem?.key?.remoteJid;
  const ehAudio = Boolean(mensagem?.message?.audioMessage);
  const corpoTexto = mensagem?.messageBody?.trim();

  // Ignora mensagens sem conteúdo utilizável, enviadas pela própria
  // instância, ou fora do evento de mensagem recebida — sempre confirma
  // recebimento pra WaSender não ficar reentregando o mesmo evento.
  if (!remetente || mensagem?.key?.fromMe || (!corpoTexto && !ehAudio)) {
    return jsonResponse({ ok: true }, 200);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const [{ data: instancia }, { data: conexao }, { data: configGlobal }] = await Promise.all([
    supabase
      .from("instancias")
      .select("id, status_conexao, configuracoes_ia(nome_ia, prompt, personalidade, modo_resposta)")
      .eq("id", instanciaId)
      .single(),
    supabase
      .from("instancias_conexao")
      .select("wasender_api_key")
      .eq("instancia_id", instanciaId)
      .single(),
    supabase.from("configuracao_ia_global").select("modelo, prompt_base").eq("id", true).single(),
  ]);

  if (!instancia || !conexao?.wasender_api_key || !configGlobal) {
    return jsonResponse({ ok: true }, 200);
  }

  const apiKey = conexao.wasender_api_key as string;
  const configIA = (instancia as unknown as {
    configuracoes_ia: {
      nome_ia: string;
      prompt: string;
      personalidade: string;
      modo_resposta: "automatico" | "texto" | "audio";
    } | null;
  }).configuracoes_ia;

  const modoResposta = configIA?.modo_resposta ?? "automatico";
  const respondeEmAudio = modoResposta === "audio" || (modoResposta === "automatico" && ehAudio);

  try {
    let mensagemUsuario = corpoTexto ?? "";
    if (ehAudio && mensagem) {
      const transcricao = await transcreverAudio(apiKey, mensagem);
      if (!transcricao) {
        console.error("Não foi possível transcrever o áudio recebido");
        return jsonResponse({ ok: true }, 200);
      }
      mensagemUsuario = transcricao;
    }

    const textoResposta = await gerarRespostaTexto(
      configGlobal.modelo,
      configGlobal.prompt_base,
      configIA?.nome_ia ?? "Assistente",
      configIA?.personalidade ?? "",
      configIA?.prompt ?? "",
      mensagemUsuario
    );

    if (!textoResposta) return jsonResponse({ ok: true }, 200);

    if (respondeEmAudio) {
      const audioBlob = await gerarAudioResposta(textoResposta);
      if (audioBlob) {
        const caminho = `${instanciaId}/${crypto.randomUUID()}.mp3`;
        const { error: uploadError } = await supabase.storage
          .from("audios-ia")
          .upload(caminho, audioBlob, { contentType: "audio/mpeg" });

        if (!uploadError) {
          const { data: urlPublica } = supabase.storage.from("audios-ia").getPublicUrl(caminho);
          await enviarAudioWasender(apiKey, remetente, urlPublica.publicUrl);
        } else {
          await enviarTextoWasender(apiKey, remetente, textoResposta);
        }
      } else {
        await enviarTextoWasender(apiKey, remetente, textoResposta);
      }
    } else {
      await enviarTextoWasender(apiKey, remetente, textoResposta);
    }
  } catch (e) {
    console.error("Falha ao gerar/enviar resposta da IA:", e);
  }

  return jsonResponse({ ok: true }, 200);
});
