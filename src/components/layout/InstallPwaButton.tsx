import { useState } from "react";
import { usePwaInstall } from "../../lib/usePwaInstall";

export function InstallPwaButton() {
  const { podeInstalarAgora, mostrarInstrucaoIOS, jaInstalado, instalar } = usePwaInstall();
  const [mostrarInstrucao, setMostrarInstrucao] = useState(false);

  if (jaInstalado || (!podeInstalarAgora && !mostrarInstrucaoIOS)) {
    return null;
  }

  if (podeInstalarAgora) {
    return (
      <button
        onClick={instalar}
        className="w-full text-left text-sm text-brand-accent hover:text-brand-text px-2 py-1.5 rounded-md hover:bg-brand-surface-hover"
      >
        ⬇ Instalar aplicativo
      </button>
    );
  }

  // iOS não permite instalar via prompt programático — só instruções.
  return (
    <div className="px-2">
      <button
        onClick={() => setMostrarInstrucao((v) => !v)}
        className="w-full text-left text-sm text-brand-accent hover:text-brand-text py-1.5 rounded-md hover:bg-brand-surface-hover"
      >
        ⬇ Instalar aplicativo
      </button>
      {mostrarInstrucao && (
        <p className="text-xs text-brand-muted mt-1 leading-relaxed">
          No iPhone/iPad: toque em <strong>Compartilhar</strong> (o ícone com a seta) na barra do Safari e
          depois em <strong>Adicionar à Tela de Início</strong>.
        </p>
      )}
    </div>
  );
}
