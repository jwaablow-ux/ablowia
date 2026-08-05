import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInstancias } from "../../../lib/useInstancias";
import type { Instancia } from "../../../types/instancia";
import { CriarInstanciaModal, type MetodoConexao } from "./CriarInstanciaModal";
import { LinkPareamentoCriado } from "./LinkPareamentoCriado";
import { QrConexaoInline } from "./QrConexaoInline";
import { ConfiguracaoIAModal } from "./ConfiguracaoIAModal";
import { ExcluirInstanciaModal } from "./ExcluirInstanciaModal";

const rotuloStatus: Record<Instancia["statusConexao"], string> = {
  aguardando_pareamento: "Aguardando pareamento",
  conectado: "Conectado",
  desconectado: "Desconectado",
};

export function InstanciasPage() {
  const {
    instancias,
    carregando,
    erro,
    criarInstancia,
    editarConfiguracaoIA,
    excluirInstancia,
    obterLinkPareamento,
  } = useInstancias();
  const queryClient = useQueryClient();
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [instanciaRecemCriada, setInstanciaRecemCriada] = useState<Instancia | null>(null);
  const [connectionModeRecente, setConnectionModeRecente] = useState<MetodoConexao | null>(null);
  const [linkPareamentoRecente, setLinkPareamentoRecente] = useState<string>("");
  const [instanciaEmEdicao, setInstanciaEmEdicao] = useState<Instancia | null>(null);
  const [instanciaParaExcluir, setInstanciaParaExcluir] = useState<Instancia | null>(null);
  const [copiandoLinkId, setCopiandoLinkId] = useState<string | null>(null);

  async function handleCriar(nomeServico: string, connectionMode: MetodoConexao, telefone: string) {
    const { instancia, linkPareamento } = await criarInstancia(nomeServico, connectionMode, telefone);
    setModalCriarAberto(false);
    setInstanciaRecemCriada(instancia);
    setConnectionModeRecente(connectionMode);
    setLinkPareamentoRecente(linkPareamento);
  }

  function fecharTelaRecemCriada() {
    setInstanciaRecemCriada(null);
    setConnectionModeRecente(null);
    setLinkPareamentoRecente("");
  }

  async function handleCopiarLinkExistente(id: string) {
    setCopiandoLinkId(id);
    try {
      const link = await obterLinkPareamento(id);
      await navigator.clipboard.writeText(`${window.location.origin}${link}`);
    } finally {
      setCopiandoLinkId(null);
    }
  }

  if (instanciaRecemCriada) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {connectionModeRecente === "companion" ? (
          <QrConexaoInline
            instancia={instanciaRecemCriada}
            linkPareamentoToken={linkPareamentoRecente.replace("/pareamento/", "")}
            onConectado={() => {
              queryClient.invalidateQueries({ queryKey: ["instancias"] });
              fecharTelaRecemCriada();
            }}
            onCancelar={fecharTelaRecemCriada}
          />
        ) : (
          <LinkPareamentoCriado
            instancia={instanciaRecemCriada}
            linkPareamento={linkPareamentoRecente}
            onVoltar={fecharTelaRecemCriada}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h1 className="text-xl font-semibold">Instâncias</h1>
        <button
          onClick={() => setModalCriarAberto(true)}
          className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover"
        >
          + Criar Instância
        </button>
      </div>
      <p className="text-sm text-brand-muted mb-6 max-w-xl">
        Cada área de atuação jurídica tem sua própria instância de WhatsApp e configuração de IA independente.
      </p>

      {carregando ? (
        <div className="border border-dashed border-brand-border rounded-lg p-10 text-center text-sm text-brand-muted">
          Carregando instâncias...
        </div>
      ) : erro ? (
        <div className="border border-red-900 bg-red-950/30 rounded-lg p-6 text-sm text-red-300">
          Não foi possível carregar as instâncias: {erro instanceof Error ? erro.message : "erro desconhecido"}
        </div>
      ) : instancias.length === 0 ? (
        <div className="border border-dashed border-brand-border rounded-lg p-10 text-center text-sm text-brand-muted">
          Nenhuma instância criada ainda.
        </div>
      ) : (
        <div className="border border-brand-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Nome do serviço</th>
                <th className="px-4 py-2 font-medium">Identificador técnico</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {instancias.map((instancia) => (
                <tr key={instancia.id} className="border-t border-brand-border">
                  <td className="px-4 py-2">{instancia.nomeServico}</td>
                  <td className="px-4 py-2">
                    <code className="text-xs text-brand-accent">{instancia.identificadorTecnico}</code>
                  </td>
                  <td className="px-4 py-2">{rotuloStatus[instancia.statusConexao]}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleCopiarLinkExistente(instancia.id)}
                      disabled={copiandoLinkId === instancia.id}
                      className="text-sm text-brand-accent underline mr-4 disabled:opacity-60"
                    >
                      {copiandoLinkId === instancia.id ? "Copiando..." : "Copiar link de pareamento"}
                    </button>
                    <button
                      onClick={() => setInstanciaEmEdicao(instancia)}
                      className="text-sm text-brand-accent underline mr-4"
                    >
                      Editar configuração de IA
                    </button>
                    <button
                      onClick={() => setInstanciaParaExcluir(instancia)}
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
        <CriarInstanciaModal
          onFechar={() => setModalCriarAberto(false)}
          onCriar={handleCriar}
        />
      )}

      {instanciaEmEdicao && (
        <ConfiguracaoIAModal
          instancia={instanciaEmEdicao}
          onFechar={() => setInstanciaEmEdicao(null)}
          onSalvar={editarConfiguracaoIA}
        />
      )}

      {instanciaParaExcluir && (
        <ExcluirInstanciaModal
          instancia={instanciaParaExcluir}
          onFechar={() => setInstanciaParaExcluir(null)}
          onConfirmar={async (id) => {
            await excluirInstancia(id);
            setInstanciaParaExcluir(null);
          }}
        />
      )}
    </div>
  );
}
