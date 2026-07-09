import { useState } from "react";
import type { Grupo } from "../../types/grupo";

interface ExcluirGrupoModalProps {
  grupo: Grupo;
  onFechar: () => void;
  onConfirmar: (id: string) => Promise<void>;
}

export function ExcluirGrupoModal({ grupo, onFechar, onConfirmar }: ExcluirGrupoModalProps) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleConfirmar() {
    setExcluindo(true);
    setErro(null);
    try {
      await onConfirmar(grupo.id);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível excluir o grupo.");
      setExcluindo(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-1">Excluir grupo</h2>
        <p className="text-sm text-brand-muted mb-4">
          Isso apaga permanentemente <strong>"{grupo.nome}"</strong> e sua configuração de IA associada. Esta
          ação não pode ser desfeita.
        </p>
        {erro && <p className="text-sm text-red-400 mb-2">{erro}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onFechar}
            disabled={excluindo}
            className="px-3 py-2 text-sm rounded-md text-brand-muted hover:bg-brand-surface-hover disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={excluindo}
            className="px-3 py-2 text-sm rounded-md bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-60"
          >
            {excluindo ? "Excluindo..." : "Excluir definitivamente"}
          </button>
        </div>
      </div>
    </div>
  );
}
