import { useState } from "react";
import { useInstancias } from "../../../lib/useInstancias";
import type { Instancia } from "../../../types/instancia";
import { ConfiguracaoIAModal } from "../instancias/ConfiguracaoIAModal";

export function ConfigurarIAPage() {
  const { instancias, carregando, erro, editarConfiguracaoIA } = useInstancias();
  const [instanciaEmEdicao, setInstanciaEmEdicao] = useState<Instancia | null>(null);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-2">Configurar IA</h1>
      <p className="text-sm text-brand-muted mb-6 max-w-xl">
        Cada instância tem sua própria IA, configurada de forma independente. Crie uma instância em
        "Instâncias" para que ela apareça aqui.
      </p>

      {carregando ? (
        <div className="border border-dashed border-brand-border rounded-lg p-10 text-center text-sm text-brand-muted">
          Carregando...
        </div>
      ) : erro ? (
        <div className="border border-red-900 bg-red-950/30 rounded-lg p-6 text-sm text-red-300">
          Não foi possível carregar as instâncias: {erro instanceof Error ? erro.message : "erro desconhecido"}
        </div>
      ) : instancias.length === 0 ? (
        <div className="border border-dashed border-brand-border rounded-lg p-10 text-center text-sm text-brand-muted">
          Nenhuma instância criada ainda. Vá em "Instâncias" para criar a primeira.
        </div>
      ) : (
        <div className="border border-brand-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Instância</th>
                <th className="px-4 py-2 font-medium">Personalidade</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {instancias.map((instancia) => (
                <tr key={instancia.id} className="border-t border-brand-border">
                  <td className="px-4 py-2">{instancia.nomeServico}</td>
                  <td className="px-4 py-2 text-brand-muted">
                    {instancia.configuracaoIA.personalidade || "— não definida —"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setInstanciaEmEdicao(instancia)}
                      className="text-sm text-brand-accent underline"
                    >
                      Configurar IA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {instanciaEmEdicao && (
        <ConfiguracaoIAModal
          instancia={instanciaEmEdicao}
          onFechar={() => setInstanciaEmEdicao(null)}
          onSalvar={editarConfiguracaoIA}
        />
      )}
    </div>
  );
}
