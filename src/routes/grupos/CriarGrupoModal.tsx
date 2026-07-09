import { useState } from "react";
import { NomeGrupoDuplicadoError } from "../../lib/useGrupos";

interface CriarGrupoModalProps {
  onFechar: () => void;
  onCriar: (nome: string) => Promise<void>;
}

export function CriarGrupoModal({ onFechar, onCriar }: CriarGrupoModalProps) {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro("Informe o nome do grupo.");
      return;
    }
    setEnviando(true);
    try {
      await onCriar(nomeLimpo);
    } catch (e) {
      if (e instanceof NomeGrupoDuplicadoError) {
        setErro(e.message);
        return;
      }
      setErro("Não foi possível criar o grupo. Tente novamente.");
      throw e;
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-1">Criar Grupo</h2>
        <p className="text-sm text-brand-muted mb-4">
          A conexão com grupos reais do WhatsApp ainda não existe — isto só organiza os grupos que você
          pretende gerenciar, cada um com sua própria configuração de IA.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1" htmlFor="nomeGrupo">
            Nome do grupo
          </label>
          <input
            id="nomeGrupo"
            type="text"
            autoFocus
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setErro(null);
            }}
            placeholder="Ex: Clientes VIP"
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
