import { useState } from "react";
import { NomeDuplicadoError } from "../../../lib/useInstancias";

interface CriarInstanciaModalProps {
  onFechar: () => void;
  onCriar: (nomeServico: string) => Promise<void>;
}

export function CriarInstanciaModal({ onFechar, onCriar }: CriarInstanciaModalProps) {
  const [nomeServico, setNomeServico] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nome = nomeServico.trim();
    if (!nome) {
      setErro("Informe o nome do serviço.");
      return;
    }
    setEnviando(true);
    try {
      await onCriar(nome);
    } catch (e) {
      if (e instanceof NomeDuplicadoError) {
        setErro(e.message);
        return;
      }
      setErro("Não foi possível criar a instância. Tente novamente.");
      throw e;
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-1">Criar Instância</h2>
        <p className="text-sm text-brand-muted mb-4">
          Cada área de atuação jurídica tem sua própria instância de WhatsApp e configuração de IA independente.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1" htmlFor="nomeServico">
            Nome do serviço
          </label>
          <input
            id="nomeServico"
            type="text"
            autoFocus
            value={nomeServico}
            onChange={(e) => {
              setNomeServico(e.target.value);
              setErro(null);
            }}
            placeholder="Ex: Trabalhista"
            className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm mb-1 focus:outline-none focus:border-brand-accent"
          />
          {erro && <p className="text-sm text-red-400 mb-2">{erro}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onFechar}
              className="px-3 py-2 text-sm rounded-md text-brand-muted hover:bg-brand-surface-hover"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover disabled:opacity-60"
            >
              {enviando ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
