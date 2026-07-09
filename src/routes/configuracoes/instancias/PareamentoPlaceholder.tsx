import type { Instancia } from "../../../types/instancia";

interface PareamentoPlaceholderProps {
  instancia: Instancia;
  onVoltar: () => void;
}

export function PareamentoPlaceholder({ instancia, onVoltar }: PareamentoPlaceholderProps) {
  return (
    <div className="border border-brand-border bg-brand-surface rounded-lg p-6 max-w-md">
      <h2 className="text-lg font-semibold mb-1">Instância "{instancia.nomeServico}" criada</h2>
      <p className="text-sm text-brand-muted mb-4">
        Identificador técnico: <code className="text-xs text-brand-accent">{instancia.identificadorTecnico}</code>
      </p>
      <div className="border border-dashed border-brand-border rounded-md p-8 text-center text-sm text-brand-muted mb-4">
        Pareamento de WhatsApp será conectado em fase futura.
        <br />
        Nenhum QR Code é exibido aqui porque a integração real ainda não existe.
      </div>
      <button
        onClick={onVoltar}
        className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover"
      >
        Voltar para a lista de instâncias
      </button>
    </div>
  );
}
