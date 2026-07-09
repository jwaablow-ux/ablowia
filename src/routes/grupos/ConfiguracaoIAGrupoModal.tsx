import { useState } from "react";
import type { Grupo } from "../../types/grupo";

interface ConfiguracaoIAGrupoModalProps {
  grupo: Grupo;
  onFechar: () => void;
  onSalvar: (id: string, prompt: string, personalidade: string) => void;
}

export function ConfiguracaoIAGrupoModal({ grupo, onFechar, onSalvar }: ConfiguracaoIAGrupoModalProps) {
  const [prompt, setPrompt] = useState(grupo.configuracaoIA.prompt);
  const [personalidade, setPersonalidade] = useState(grupo.configuracaoIA.personalidade);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSalvar(grupo.id, prompt, personalidade);
    onFechar();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">Configuração de IA — {grupo.nome}</h2>
        <p className="text-sm text-brand-muted mb-4">
          Esta configuração é exclusiva deste grupo e nunca é compartilhada com outros.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="personalidadeGrupo">
              Personalidade
            </label>
            <input
              id="personalidadeGrupo"
              type="text"
              value={personalidade}
              onChange={(e) => setPersonalidade(e.target.value)}
              placeholder="Ex: Objetiva e acolhedora"
              className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm focus:outline-none focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="promptGrupo">
              Prompt
            </label>
            <textarea
              id="promptGrupo"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Instruções para a IA deste grupo"
              className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm focus:outline-none focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Base de conhecimento</label>
            <div className="border border-dashed border-brand-border rounded-md p-4 text-xs text-brand-muted">
              Upload de PDF, texto e áudio ainda não implementado nesta fase.
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onFechar}
              className="px-3 py-2 text-sm rounded-md text-brand-muted hover:bg-brand-surface-hover"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
