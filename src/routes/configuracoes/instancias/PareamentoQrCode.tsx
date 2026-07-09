import type { Instancia } from "../../../types/instancia";

interface PareamentoQrCodeProps {
  instancia: Instancia;
  qrCodeBase64: string | null;
  onVoltar: () => void;
}

export function PareamentoQrCode({ instancia, qrCodeBase64, onVoltar }: PareamentoQrCodeProps) {
  return (
    <div className="border border-brand-border bg-brand-surface rounded-lg p-6 max-w-md">
      <h2 className="text-lg font-semibold mb-1">Instância "{instancia.nomeServico}" criada</h2>
      <p className="text-sm text-brand-muted mb-4">
        Identificador técnico: <code className="text-xs text-brand-accent">{instancia.identificadorTecnico}</code>
      </p>

      {qrCodeBase64 ? (
        <div className="rounded-md p-4 text-center mb-4 bg-white">
          <img src={qrCodeBase64} alt="QR Code para parear o WhatsApp" className="mx-auto w-56 h-56" />
          <p className="text-xs text-neutral-600 mt-2">
            Abra o WhatsApp no celular do serviço, vá em Aparelhos conectados e escaneie este código.
          </p>
        </div>
      ) : (
        <div className="border border-dashed border-brand-border rounded-md p-8 text-center text-sm text-brand-muted mb-4">
          A instância foi criada na Evolution, mas o QR Code não veio na resposta desta vez.
          <br />
          Abra a lista de instâncias e tente reconectar esta instância para gerar um novo QR Code.
        </div>
      )}

      <button
        onClick={onVoltar}
        className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover"
      >
        Voltar para a lista de instâncias
      </button>
    </div>
  );
}
