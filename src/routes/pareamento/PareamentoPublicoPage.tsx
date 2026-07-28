import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

type Etapa =
  | "carregando"
  | "erro"
  // fluxo companion (QR code)
  | "qr_gerando"
  | "qr_aguardando_escaneio"
  // fluxo mobile (SMS/ligação)
  | "mobile_escolher_metodo"
  | "mobile_digitar_codigo"
  // comum aos dois
  | "conectado";

interface MetodoVerificacao {
  id: string;
  label: string;
  description?: string;
  recommended: boolean;
  available: boolean;
}

const INTERVALO_STATUS_MS = 4000;

export function PareamentoPublicoPage() {
  const { token } = useParams<{ token: string }>();
  const [etapa, setEtapa] = useState<Etapa>("carregando");
  const [nomeServico, setNomeServico] = useState<string | null>(null);
  const [telefone, setTelefone] = useState<string | null>(null);
  const [metodos, setMetodos] = useState<MetodoVerificacao[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token) {
      setEtapa("erro");
      setMensagemErro("Link de pareamento inválido.");
      return;
    }

    let cancelado = false;

    async function iniciar() {
      const { data: info, error: infoError } = await supabase.rpc("obter_modo_conexao_publico", {
        p_link_pareamento_token: token,
      });
      if (cancelado) return;

      const registro = Array.isArray(info) ? info[0] : info;
      if (infoError || !registro) {
        setMensagemErro("Link de pareamento inválido ou expirado.");
        setEtapa("erro");
        return;
      }

      setNomeServico(registro.nome_servico ?? null);

      if (registro.connection_mode === "companion") {
        await gerarQrCode();
      } else {
        await carregarOpcoesMobile();
      }
    }

    async function gerarQrCode() {
      setEtapa("qr_gerando");
      const { data, error } = await supabase.functions.invoke("gozap-obter-qrcode", {
        body: { linkToken: token },
      });
      if (cancelado) return;

      if (error || data?.erro) {
        const corpo = await error?.context?.json?.().catch(() => null);
        setMensagemErro(corpo?.erro ?? data?.erro ?? error?.message ?? "Falha ao gerar QR code.");
        setEtapa("erro");
        return;
      }

      setQrCode(data.qrCode ?? null);
      setEtapa("qr_aguardando_escaneio");
      intervaloRef.current = setInterval(verificarStatus, INTERVALO_STATUS_MS);
    }

    async function verificarStatus() {
      const { data, error } = await supabase.functions.invoke("gozap-status-pareamento", {
        body: { linkToken: token },
      });
      if (cancelado || error || data?.erro) return;

      if (data.statusConexao === "conectado") {
        setEtapa("conectado");
        if (intervaloRef.current) clearInterval(intervaloRef.current);
      }
    }

    async function carregarOpcoesMobile() {
      const { data, error } = await supabase.functions.invoke("gozap-mobile-opcoes-verificacao", {
        body: { linkToken: token },
      });
      if (cancelado) return;

      if (error) {
        const corpo = await error.context?.json?.().catch(() => null);
        setMensagemErro(corpo?.erro ?? error.message);
        setEtapa("erro");
        return;
      }
      if (data?.erro) {
        setMensagemErro(data.erro);
        setEtapa("erro");
        return;
      }

      setTelefone(data.telefone ?? null);
      setMetodos((data.metodos ?? []).filter((m: MetodoVerificacao) => m.available));
      setEtapa("mobile_escolher_metodo");
    }

    iniciar();

    return () => {
      cancelado = true;
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [token]);

  async function solicitarCodigo(metodo: string) {
    if (!token) return;
    setEnviando(true);
    setMensagemErro(null);
    const { data, error } = await supabase.functions.invoke("gozap-mobile-solicitar-codigo", {
      body: { linkToken: token, metodo },
    });
    setEnviando(false);

    if (error) {
      const corpo = await error.context?.json?.().catch(() => null);
      setMensagemErro(corpo?.erro ?? error.message);
      return;
    }
    if (data?.erro) {
      setMensagemErro(data.erro);
      return;
    }

    setEtapa("mobile_digitar_codigo");
  }

  async function confirmarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !codigo.trim()) return;
    setEnviando(true);
    setMensagemErro(null);
    const { data, error } = await supabase.functions.invoke("gozap-mobile-verificar-codigo", {
      body: { linkToken: token, codigo: codigo.trim() },
    });
    setEnviando(false);

    if (error) {
      const corpo = await error.context?.json?.().catch(() => null);
      setMensagemErro(corpo?.erro ?? error.message);
      return;
    }
    if (data?.erro) {
      setMensagemErro(data.erro);
      return;
    }

    if (data.statusConexao === "conectado") {
      setEtapa("conectado");
    } else {
      setMensagemErro("Código não confirmou a conexão. Verifique o código e tente novamente.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6">
      <div className="bg-brand-surface border border-brand-border rounded-lg w-full max-w-sm p-8 text-center">
        <div className="text-lg font-semibold tracking-wide mb-6">
          <span className="text-brand-accent">AB</span>LAW IA
        </div>

        {etapa === "carregando" && <p className="text-sm text-brand-muted">Carregando...</p>}

        {etapa === "erro" && (
          <div className="text-sm text-red-400">
            Não foi possível continuar.
            <br />
            {mensagemErro}
          </div>
        )}

        {etapa === "qr_gerando" && <p className="text-sm text-brand-muted">Gerando QR code...</p>}

        {etapa === "qr_aguardando_escaneio" && (
          <>
            <h2 className="text-base font-semibold mb-1">
              {nomeServico ? `Conectar WhatsApp — ${nomeServico}` : "Conectar WhatsApp"}
            </h2>
            <p className="text-sm text-brand-muted mb-4">
              Abra o WhatsApp no celular deste número, vá em Aparelhos conectados → Conectar um
              aparelho e escaneie o código abaixo.
            </p>
            {qrCode ? (
              <div className="rounded-md p-4 bg-white mb-4">
                <img src={qrCode} alt="QR Code para conectar o WhatsApp" className="mx-auto w-56 h-56" />
              </div>
            ) : (
              <div className="border border-dashed border-brand-border rounded-md p-8 text-sm text-brand-muted mb-4">
                QR code não disponível no momento. Atualize a página para tentar novamente.
              </div>
            )}
            <p className="text-xs text-brand-muted">
              Esta página verifica automaticamente quando a conexão for concluída.
            </p>
          </>
        )}

        {etapa === "mobile_escolher_metodo" && (
          <>
            <h2 className="text-base font-semibold mb-1">
              {nomeServico ? `Conectar WhatsApp — ${nomeServico}` : "Conectar WhatsApp"}
            </h2>
            <p className="text-sm text-brand-muted mb-4">
              {telefone ? `Número: ${telefone}` : "Escolha como você quer receber o código de confirmação."}
            </p>
            <div className="flex flex-col gap-2 mb-2">
              {metodos.length === 0 && (
                <p className="text-sm text-brand-muted">Nenhum método de verificação disponível no momento.</p>
              )}
              {metodos.map((metodo) => (
                <button
                  key={metodo.id}
                  onClick={() => solicitarCodigo(metodo.id)}
                  disabled={enviando}
                  className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover disabled:opacity-60"
                >
                  {enviando ? "Enviando..." : `Receber código por ${metodo.label}`}
                </button>
              ))}
            </div>
            {mensagemErro && <p className="text-sm text-red-400 mt-2">{mensagemErro}</p>}
          </>
        )}

        {etapa === "mobile_digitar_codigo" && (
          <>
            <h2 className="text-base font-semibold mb-1">Digite o código recebido</h2>
            <p className="text-sm text-brand-muted mb-4">
              Enviamos um código de verificação. Informe abaixo para concluir a conexão.
            </p>
            <form onSubmit={confirmarCodigo}>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Código"
                className="w-full text-center rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-brand-accent"
              />
              {mensagemErro && <p className="text-sm text-red-400 mb-2">{mensagemErro}</p>}
              <button
                type="submit"
                disabled={enviando}
                className="w-full px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover disabled:opacity-60"
              >
                {enviando ? "Confirmando..." : "Confirmar código"}
              </button>
            </form>
          </>
        )}

        {etapa === "conectado" && (
          <>
            <div className="text-brand-accent text-4xl mb-3">✓</div>
            <h2 className="text-base font-semibold mb-1">WhatsApp conectado!</h2>
            <p className="text-sm text-brand-muted">
              Pode fechar esta página. O atendimento já está ativo.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
