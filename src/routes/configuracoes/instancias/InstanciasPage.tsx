import { useState } from "react";
import { useInstancias } from "../../../lib/useInstancias";
import type { Instancia } from "../../../types/instancia";
import { CriarInstanciaModal } from "./CriarInstanciaModal";
import { PareamentoQrCode } from "./PareamentoQrCode";
import { ConfiguracaoIAModal } from "./ConfiguracaoIAModal";
import { ExcluirInstanciaModal } from "./ExcluirInstanciaModal";

const rotuloStatus: Record<Instancia["statusConexao"], string> = {
  aguardando_pareamento: "Aguardando pareamento",
  conectado: "Conectado",
  desconectado: "Desconectado",
};

export function InstanciasPage() {
  const { instancias, carregando, erro, criarInstancia, editarConfiguracaoIA, excluirInstancia } =
    useInstancias();
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [instanciaRecemCriada, setInstanciaRecemCriada] = useState<Instancia | null>(null);
  const [qrCodeRecente, setQrCodeRecente] = useState<string | null>(null);
  const [instanciaEmEdicao, setInstanciaEmEdicao] = useState<Instancia | null>(null);
  const [instanciaParaExcluir, setInstanciaParaExcluir] = useState<Instancia | null>(null);

  async function handleCriar(nomeServico: string) {
    const { instancia, qrCodeBase64 } = await criarInstancia(nomeServico);
    setModalCriarAberto(false);
    setInstanciaRecemCriada(instancia);
    setQrCodeRecente(qrCodeBase64);
  }

  if (instanciaRecemCriada) {
    return (
      <div className="p-8">
        <PareamentoQrCode
          instancia={instanciaRecemCriada}
          qrCodeBase64={qrCodeRecente}
          onVoltar={() => setInstanciaRecemCriada(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
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
