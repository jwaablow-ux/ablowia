import { useState } from "react";
import { useGrupos } from "../../lib/useGrupos";
import type { Grupo } from "../../types/grupo";
import { CriarGrupoModal } from "./CriarGrupoModal";
import { ConfiguracaoIAGrupoModal } from "./ConfiguracaoIAGrupoModal";
import { ExcluirGrupoModal } from "./ExcluirGrupoModal";

export function GruposPage() {
  const { grupos, carregando, erro, criarGrupo, editarConfiguracaoIA, excluirGrupo } = useGrupos();
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [grupoEmEdicao, setGrupoEmEdicao] = useState<Grupo | null>(null);
  const [grupoParaExcluir, setGrupoParaExcluir] = useState<Grupo | null>(null);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">Gerenciamento de Grupos</h1>
        <button
          onClick={() => setModalCriarAberto(true)}
          className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover"
        >
          + Criar Grupo
        </button>
      </div>
      <p className="text-sm text-brand-muted mb-6 max-w-xl">
        Cada grupo de WhatsApp gerenciado tem sua própria IA e base de conhecimento, independentes dos
        demais. A conexão com grupos reais do WhatsApp ainda não foi implementada — este ambiente já fica
        pronto para quando ela existir.
      </p>

      {carregando ? (
        <div className="border border-dashed border-brand-border rounded-lg p-10 text-center text-sm text-brand-muted">
          Carregando grupos...
        </div>
      ) : erro ? (
        <div className="border border-red-900 bg-red-950/30 rounded-lg p-6 text-sm text-red-300">
          Não foi possível carregar os grupos: {erro instanceof Error ? erro.message : "erro desconhecido"}
        </div>
      ) : grupos.length === 0 ? (
        <div className="border border-dashed border-brand-border rounded-lg p-10 text-center text-sm text-brand-muted">
          Nenhum grupo criado ainda.
        </div>
      ) : (
        <div className="border border-brand-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Nome do grupo</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupo) => (
                <tr key={grupo.id} className="border-t border-brand-border">
                  <td className="px-4 py-2">{grupo.nome}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => setGrupoEmEdicao(grupo)}
                      className="text-sm text-brand-accent underline mr-4"
                    >
                      Configurar IA
                    </button>
                    <button
                      onClick={() => setGrupoParaExcluir(grupo)}
                      className="text-sm text-red-400 underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalCriarAberto && (
        <CriarGrupoModal
          onFechar={() => setModalCriarAberto(false)}
          onCriar={async (nome) => {
            await criarGrupo(nome);
            setModalCriarAberto(false);
          }}
        />
      )}

      {grupoEmEdicao && (
        <ConfiguracaoIAGrupoModal
          grupo={grupoEmEdicao}
          onFechar={() => setGrupoEmEdicao(null)}
          onSalvar={editarConfiguracaoIA}
        />
      )}

      {grupoParaExcluir && (
        <ExcluirGrupoModal
          grupo={grupoParaExcluir}
          onFechar={() => setGrupoParaExcluir(null)}
          onConfirmar={async (id) => {
            await excluirGrupo(id);
            setGrupoParaExcluir(null);
          }}
        />
      )}
    </div>
  );
}
