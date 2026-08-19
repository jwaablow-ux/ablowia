import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { supabase } from "../../lib/supabaseClient";

type Etapa = "carregando" | "erro" | "qr_gerando" | "qr_aguardando_escaneio" | "conectado";

// Mesma cadência de renovação do QR code do próprio WhatsApp Web/Multi-Device.
const DURACAO_QR_MS = 20000;
const INTERVALO_STATUS_MS = 4000;

export function PareamentoPublicoPage() {
  const { token } = useParams<{ token: string }>();
  const [etapa, setEtapa] = useState<Etapa>("carregando");
  const [nomeServico, setNomeServico] = useState<string | null>(null);
  const [qrImagem, setQrImagem] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) {
      setEtapa("erro");
      setMensagemErro("Link de pareamento inválido.");
      return;
    }

    let cancelado = false;

    async function gerarQrCode() {
      setEtapa("qr_gerando");
      const { data, error } = await supabase.functions.invoke("wasender-obter-qrcode", {
        body: { linkToken: token },
      });
      if (cancelado) return;

      if (error || data?.erro) {
        const corpo = await error?.context?.json?.().catch(() => null);
        setMensagemErro(
          corpo?.erro ?? data?.erro ?? "Não foi possível gerar o QR code. Atualize a página para tentar de novo."
        );
        setEtapa("erro");
        return;
      }

      setNomeServico(data.nomeServico ?? null);

      if (!data.qrCode) {
        setMensagemErro("QR code não disponível no momento. Atualize a página para tentar novamente.");
        setEtapa("erro");
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(data.qrCode, { margin: 1, width: 320 });
        if (cancelado) return;
        setQrImagem(dataUrl);
        setEtapa("qr_aguardando_escaneio");
      } catch {
        if (cancelado) return;
        setMensagemErro("Não foi possível desenhar o QR code recebido. Atualize a página para tentar de novo.");
        setEtapa("erro");
        return;
      }

      timeoutRef.current = setTimeout(gerarQrCode, DURACAO_QR_MS);
    }

    async function verificarStatus() {
      const { data, error } = await supabase.functions.invoke("wasender-status-pareamento", {
        body: { linkToken: token },
      });
      if (cancelado || error || data?.erro) return;

      if (data.statusConexao === "conectado") {
        setEtapa("conectado");
        if (intervaloRef.current) clearInterval(intervaloRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    }

    gerarQrCode();
    intervaloRef.current = setInterval(verificarStatus, INTERVALO_STATUS_MS);

    return () => {
      cancelado = true;
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [token]);

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

        {etapa === "qr_gerando" && !qrImagem && <p className="text-sm text-brand-muted">Gerando QR code...</p>}

        {etapa === "qr_aguardando_escaneio" && (
          <>
            <h2 className="text-base font-semibold mb-1">
              {nomeServico ? `Conectar WhatsApp — ${nomeServico}` : "Conectar WhatsApp"}
            </h2>
            <p className="text-sm text-brand-muted mb-4">
              Abra o WhatsApp no celular deste número, vá em Aparelhos conectados → Conectar um
              aparelho e escaneie o código abaixo.
            </p>
            {qrImagem ? (
              <div className="rounded-md p-4 bg-white mb-4">
                <img src={qrImagem} alt="QR Code para conectar o WhatsApp" className="mx-auto w-56 h-56" />
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
