import { useClientesHoje } from "../../lib/useClientesHoje";

export function ClientesPage() {
  const { clientes, carregando, erro } = useClientesHoje();

  const totalLeads = clientes.reduce((s, c) => s + c.leadsCaptados, 0);
  const totalConversas = clientes.reduce((s, c) => s + c.conversas, 0);
  const totalQualificados = clientes.reduce((s, c) => s + c.qualificados, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold mb-2">Clientes atendidos hoje</h1>
      <p className="text-sm text-brand-muted mb-6 max-w-xl">
        Leads captados, conversas e qualificações de hoje, separados por instância (cada IA atende só a sua
        própria área). Estes números começam em zero até a IA de atendimento estar ativa de verdade em
        alguma instância.
      </p>

      {carregando ? (
        <div className="border border-dashed border-brand-border rounded-lg p-10 text-center text-sm text-brand-muted">
          Carregando...
        </div>
      ) : erro ? (
        <div className="border border-red-900 bg-red-950/30 rounded-lg p-6 text-sm text-red-300">
          Não foi possível carregar os dados: {erro instanceof Error ? erro.message : "erro desconhecido"}
        </div>
      ) : clientes.length === 0 ? (
        <div className="border border-dashed border-brand-border rounded-lg p-10 text-center text-sm text-brand-muted">
          Nenhuma instância criada ainda. Vá em "Instâncias" para criar a primeira.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mb-6">
            <div className="border border-brand-border bg-brand-surface rounded-lg p-4">
              <div className="text-xs uppercase tracking-widest text-brand-muted mb-1">
                Total de leads hoje
              </div>
              <div className="text-2xl font-bold">{totalLeads}</div>
            </div>
            <div className="border border-brand-border bg-brand-surface rounded-lg p-4">
              <div className="text-xs uppercase tracking-widest text-brand-muted mb-1">
                Total de conversas hoje
              </div>
              <div className="text-2xl font-bold">{totalConversas}</div>
            </div>
            <div className="border border-brand-border bg-brand-surface rounded-lg p-4">
              <div className="text-xs uppercase tracking-widest text-brand-muted mb-1">
                Total qualificados hoje
              </div>
              <div className="text-2xl font-bold">{totalQualificados}</div>
            </div>
          </div>

          <div className="border border-brand-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-surface text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Instância (IA)</th>
                  <th className="px-4 py-2 font-medium">Leads captados</th>
                  <th className="px-4 py-2 font-medium">Conversas</th>
                  <th className="px-4 py-2 font-medium">Qualificados</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.instanciaId} className="border-t border-brand-border">
                    <td className="px-4 py-2">{c.nomeServico}</td>
                    <td className="px-4 py-2">{c.leadsCaptados}</td>
                    <td className="px-4 py-2">{c.conversas}</td>
                    <td className="px-4 py-2">{c.qualificados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
