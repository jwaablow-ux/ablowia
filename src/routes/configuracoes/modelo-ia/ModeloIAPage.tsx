import { useEffect, useState } from "react";
import { MODELOS_CLAUDE, useConfiguracaoIAGlobal } from "../../../lib/useConfiguracaoIAGlobal";

export function ModeloIAPage() {
  const { modeloAtual, carregando, erro, salvarModelo, testarConexao } = useConfiguracaoIAGlobal();
  const [selecionado, setSelecionado] = useState<string>("");
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [mensagemSalvar, setMensagemSalvar] = useState<string | null>(null);
  const [resultadoTeste, setResultadoTeste] = useState<
    { ok: true; resposta: string } | { ok: false; erro: string } | null
  >(null);

  useEffect(() => {
    if (modeloAtual) setSelecionado(modeloAtual);
  }, [modeloAtual]);

  async function handleSalvar() {
    setSalvando(true);
    setMensagemSalvar(null);
    try {
      await salvarModelo(selecionado);
      setMensagemSalvar("Modelo salvo com sucesso.");
    } catch (e) {
      setMensagemSalvar(e instanceof Error ? `Erro ao salvar: ${e.message}` : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleTestar() {
    setTestando(true);
    setResultadoTeste(null);
    try {
      const resultado = await testarConexao(selecionado);
      setResultadoTeste({ ok: true, resposta: resultado.resposta });
    } catch (e) {
      setResultadoTeste({ ok: false, erro: e instanceof Error ? e.message : "Erro desconhecido" });
    } finally {
      setTestando(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold mb-2">Modelo de IA</h1>
      <p className="text-sm text-brand-muted mb-6 max-w-xl">
        Escolha o modelo Claude (Anthropic) que será usado universalmente pelo Ablaw IA. A conexão com a
        Anthropic já está ativa; a ligação deste modelo com o atendimento real via WhatsApp ainda não foi
        construída.
      </p>

      {carregando ? (
        <div className="text-sm text-brand-muted">Carregando...</div>
      ) : erro ? (
        <div className="border border-red-900 bg-red-950/30 rounded-lg p-6 text-sm text-red-300 max-w-xl">
          Não foi possível carregar a configuração: {erro instanceof Error ? erro.message : "erro desconhecido"}
        </div>
      ) : (
        <div className="border border-brand-border bg-brand-surface rounded-lg p-6 max-w-xl">
          <label className="block text-sm font-medium mb-1" htmlFor="modelo">
            Modelo universal
          </label>
          <select
            id="modelo"
            value={selecionado}
            onChange={(e) => {
              setSelecionado(e.target.value);
              setResultadoTeste(null);
              setMensagemSalvar(null);
            }}
            className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-brand-accent"
          >
            {MODELOS_CLAUDE.map((m) => (
              <option key={m.id} value={m.id}>
                {m.rotulo}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handleSalvar}
              disabled={salvando || selecionado === modeloAtual}
              className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            <button
              onClick={handleTestar}
              disabled={testando}
              className="px-3 py-2 text-sm rounded-md border border-brand-border text-brand-text hover:bg-brand-surface-hover disabled:opacity-50"
            >
              {testando ? "Testando..." : "Testar conexão real"}
            </button>
          </div>

          {mensagemSalvar && <p className="text-sm text-brand-muted mb-2">{mensagemSalvar}</p>}

          {resultadoTeste && (
            <div
              className={`text-sm rounded-md p-3 ${
                resultadoTeste.ok
                  ? "bg-teal-400/10 text-teal-300 border border-teal-400/30"
                  : "bg-red-950/30 text-red-300 border border-red-900"
              }`}
            >
              {resultadoTeste.ok
                ? `Conexão real confirmada. Resposta do modelo: "${resultadoTeste.resposta}"`
                : resultadoTeste.erro}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
