import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Instancia } from "../../../types/instancia";
import { Confetti } from "../../../components/Confetti";

// Mesma cadência de renovação do QR code do próprio WhatsApp Web/Multi-Device:
// o código expira sozinho e precisa ser substituído por um novo até a conexão
// acontecer. Aqui isso é automático — sem exigir nenhuma ação do usuário.
const DURACAO_QR_MS = 20000;
const INTERVALO_STATUS_MS = 4000;
const DURACAO_COMEMORACAO_MS = 2600;

interface QrConexaoInlineProps {
  instancia: Instancia;
  linkPareamentoToken: string;
  onConectado: () => void;
  onCancelar: () => void;
}

export function QrConexaoInline({ instancia, linkPareamentoToken, onConectado, onCancelar }: QrConexaoInlineProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [conectado, setConectado] = useState(false);

  const canceladoRef = useRef(false);
  const conectadoRef = useRef(false);
  const qrTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gerarQr = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const { data, error } = await supabase.functions.invoke("gozap-obter-qrcode", {
      body: { linkToken: linkPareamentoToken },
    });
    if (canceladoRef.current) return;
    setCarregando(false);

    if (error || data?.erro) {
      const corpo = await error?.context?.json?.().catch(() => null);
      setErro(corpo?.erro ?? data?.erro ?? "Não foi possível gerar o QR code.");
      setQrCode(null);
      return;
    }

    setQrCode(data.qrCode ?? null);
    if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
    qrTimeoutRef.current = setTimeout(() => {
      if (!canceladoRef.current && !conectadoRef.current) gerarQr();
    }, DURACAO_QR_MS);
  }, [linkPareamentoToken]);

  useEffect(() => {
    canceladoRef.current = false;

    async function verificarStatus() {
      if (conectadoRef.current) return;
      const { data, error } = await supabase.functions.invoke("gozap-status-pareamento", {
        body: { linkToken: linkPareamentoToken },
      });
      if (canceladoRef.current || error || data?.erro) return;

      if (data.statusConexao === "conectado") {
        conectadoRef.current = true;
        setConectado(true);
        if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
        if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      }
    }

    gerarQr();
    statusIntervalRef.current = setInterval(verificarStatus, INTERVALO_STATUS_MS);

    return () => {
      canceladoRef.current = true;
      if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [linkPareamentoToken, gerarQr]);

  useEffect(() => {
    if (!conectado) return;
    const id = setTimeout(onConectado, DURACAO_COMEMORACAO_MS);
    return () => clearTimeout(id);
  }, [conectado, onConectado]);

  if (conectado) {
    return (
      <div className="border border-brand-border bg-brand-surface rounded-lg p-8 max-w-md text-center">
        <Confetti />
        <div className="text-brand-accent text-5xl mb-3">✓</div>
        <h2 className="text-lg font-semibold mb-1">WhatsApp conectado!</h2>
        <p className="text-sm text-brand-muted">
          A instância "{instancia.nomeServico}" já está pronta pra atender.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-brand-border bg-brand-surface rounded-lg p-6 max-w-md">
      <h2 className="text-lg font-semibold mb-1">Conectar WhatsApp — {instancia.nomeServico}</h2>
      <p className="text-sm text-brand-muted mb-4">
        Abra o WhatsApp no celular deste número, vá em Aparelhos conectados → Conectar um aparelho e
        escaneie o código abaixo. Ele se renova sozinho até a conexão acontecer.
      </p>

      {erro ? (
        <div className="border border-red-900 bg-red-950/30 rounded-md p-4 text-sm text-red-300 mb-4">
          {erro}
          <button
            onClick={gerarQr}
            className="block mt-3 px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover"
          >
            Tentar de novo
          </button>
        </div>
      ) : carregando && !qrCode ? (
        <div className="border border-dashed border-brand-border rounded-md p-8 text-center text-sm text-brand-muted mb-4">
          Gerando QR code...
        </div>
      ) : qrCode ? (
        <div className="rounded-md p-4 bg-white mb-4">
          <img src={qrCode} alt="QR Code para conectar o WhatsApp" className="mx-auto w-56 h-56" />
        </div>
      ) : null}

      <p className="text-xs text-brand-muted mb-4">
        Esta tela verifica automaticamente quando a conexão for concluída.
      </p>

      <button onClick={onCancelar} className="text-sm text-brand-muted underline hover:text-brand-text">
        Cancelar e voltar para a lista de instâncias
      </button>
    </div>
  );
}
