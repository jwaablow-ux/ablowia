import { useState } from "react";
import type { Instancia } from "../../../types/instancia";

interface ConfiguracaoIAModalProps {
  instancia: Instancia;
  onFechar: () => void;
  onSalvar: (id: string, prompt: string, personalidade: string) => void;
}

export function ConfiguracaoIAModal({ instancia, onFechar, onSalvar }: ConfiguracaoIAModalProps) {
  const [prompt, setPrompt] = useState(instancia.configuracaoIA.prompt);
  const [personalidade, setPersonalidade] = useState(instancia.configuracaoIA.personalidade);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSalvar(instancia.id, prompt, personalidade);
    onFechar();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">
          Configuração de IA — {instancia.nomeServico}
        </h2>
        <p className="text-sm text-brand-muted mb-4">
          Esta configuração é exclusiva desta instância e nunca é compartilhada com outras.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="personalidade">
              Personalidade
            </label>
            <input
              id="personalidade"
              type="text"
              value={personalidade}
              onChange={(e) => setPersonalidade(e.target.value)}
              placeholder="Ex: Objetiva e acolhedora"
              className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm focus:outline-none focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="prompt">
              Prompt
            </label>
            <textarea
              id="prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Instruções para a IA desta instância"
              className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm focus:outline-none focus:border-brand-accent"
            />
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
