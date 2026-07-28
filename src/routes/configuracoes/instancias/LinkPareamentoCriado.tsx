import { useState } from "react";
import type { Instancia } from "../../../types/instancia";

interface LinkPareamentoCriadoProps {
  instancia: Instancia;
  linkPareamento: string;
  onVoltar: () => void;
}

export function LinkPareamentoCriado({ instancia, linkPareamento, onVoltar }: LinkPareamentoCriadoProps) {
  const [copiado, setCopiado] = useState(false);
  const urlCompleta = `${window.location.origin}${linkPareamento}`;

  async function copiarLink() {
    await navigator.clipboard.writeText(urlCompleta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="border border-brand-border bg-brand-surface rounded-lg p-6 max-w-md">
      <h2 className="text-lg font-semibold mb-1">Instância "{instancia.nomeServico}" criada</h2>
      <p className="text-sm text-brand-muted mb-4">
        Identificador técnico: <code className="text-xs text-brand-accent">{instancia.identificadorTecnico}</code>
      </p>

      <div className="border border-brand-border rounded-md p-4 mb-4">
        <p className="text-sm mb-2">
          Envie este link para o responsável pelo número de WhatsApp deste serviço. Ao abrir, ele mesmo
          escolhe como receber o código (SMS ou ligação) e confirma a conexão sozinho — sem precisar de
          acesso ao painel, e sem precisar manter o WhatsApp instalado em nenhum celular depois disso.
        </p>
        <div className="flex items-stretch gap-2">
          <code className="flex-1 text-xs text-brand-accent bg-brand-bg border border-brand-border rounded-md px-2 py-2 overflow-x-auto whitespace-nowrap">
            {urlCompleta}
          </code>
          <button
            onClick={copiarLink}
            className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover whitespace-nowrap"
          >
            {copiado ? "Copiado!" : "Copiar link"}
          </button>
        </div>
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
