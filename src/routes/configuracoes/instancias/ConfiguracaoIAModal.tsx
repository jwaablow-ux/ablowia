import { useState } from "react";
import type { Instancia, ModoResposta } from "../../../types/instancia";

interface ConfiguracaoIAModalProps {
  instancia: Instancia;
  onFechar: () => void;
  onSalvar: (id: string, nomeIA: string, prompt: string, personalidade: string, modoResposta: ModoResposta) => void;
}

const OPCOES_MODO_RESPOSTA: { valor: ModoResposta; rotulo: string; descricao: string }[] = [
  {
    valor: "automatico",
    rotulo: "Automático",
    descricao: "Responde no mesmo formato que a pessoa mandou — texto vira texto, áudio vira áudio.",
  },
  { valor: "texto", rotulo: "Sempre texto", descricao: "Responde sempre em texto, mesmo que a pessoa mande áudio." },
  { valor: "audio", rotulo: "Sempre áudio", descricao: "Responde sempre em áudio, mesmo que a pessoa mande texto." },
];

export function ConfiguracaoIAModal({ instancia, onFechar, onSalvar }: ConfiguracaoIAModalProps) {
  const [nomeIA, setNomeIA] = useState(instancia.configuracaoIA.nomeIA);
  const [prompt, setPrompt] = useState(instancia.configuracaoIA.prompt);
  const [personalidade, setPersonalidade] = useState(instancia.configuracaoIA.personalidade);
  const [modoResposta, setModoResposta] = useState<ModoResposta>(instancia.configuracaoIA.modoResposta);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSalvar(instancia.id, nomeIA, prompt, personalidade, modoResposta);
    onFechar();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-lg font-semibold mb-1">
          Configuração de IA — {instancia.nomeServico}
        </h2>
        <p className="text-sm text-brand-muted mb-4">
          Esta configuração é exclusiva desta instância e nunca é compartilhada com outras. Todas as
          instâncias já compartilham um conhecimento jurídico geral (Cível, Trabalhista, Criminal e
          Empresarial) — aqui você define o nome, a personalidade e a especialização desta em particular.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="nomeIA">
              Nome da IA
            </label>
            <input
              id="nomeIA"
              type="text"
              value={nomeIA}
              onChange={(e) => setNomeIA(e.target.value)}
              placeholder="Ex: Sofia"
              className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm focus:outline-none focus:border-brand-accent"
            />
          </div>
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
            <label className="block text-sm font-medium mb-2">Como ela responde no WhatsApp</label>
            <div className="flex flex-col gap-2">
              {OPCOES_MODO_RESPOSTA.map((opcao) => (
                <label
                  key={opcao.valor}
                  className={`flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm ${
                    modoResposta === opcao.valor ? "border-brand-accent" : "border-brand-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="modoResposta"
                    checked={modoResposta === opcao.valor}
                    onChange={() => setModoResposta(opcao.valor)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">{opcao.rotulo}</span>
                    <br />
                    <span className="text-xs text-brand-muted">{opcao.descricao}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="prompt">
              Especialização e regras de atuação
            </label>
            <textarea
              id="prompt"
              rows={16}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Esta instância atende exclusivamente casos de Direito Trabalhista. Foque em..."
              className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-accent resize-y"
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
