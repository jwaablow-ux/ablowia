import { useInstancias } from "../../lib/useInstancias";
import { useInteracoesDiarias } from "../../lib/useInteracoesDiarias";

type CorCard = "teal" | "violeta" | "ambar" | "rosa";

const coresCard: Record<CorCard, { faixa: string; icone: string; fundo: string }> = {
  teal: { faixa: "bg-teal-400", icone: "text-teal-300", fundo: "bg-teal-400/10" },
  violeta: { faixa: "bg-violet-400", icone: "text-violet-300", fundo: "bg-violet-400/10" },
  ambar: { faixa: "bg-amber-400", icone: "text-amber-300", fundo: "bg-amber-400/10" },
  rosa: { faixa: "bg-pink-400", icone: "text-pink-300", fundo: "bg-pink-400/10" },
};

function CardMetrica({
  titulo,
  valor,
  cor,
  simbolo,
}: {
  titulo: string;
  valor: number | string;
  cor: CorCard;
  simbolo: string;
}) {
  const c = coresCard[cor];
  return (
    <div className="relative overflow-hidden rounded-xl border border-brand-border bg-brand-surface p-5 shadow-lg shadow-black/20">
      <div className={`absolute top-0 left-0 right-0 h-1 ${c.faixa}`} />
      <div className={`w-9 h-9 rounded-lg ${c.fundo} ${c.icone} flex items-center justify-center text-lg font-semibold mb-3`}>
        {simbolo}
      </div>
      <div className="text-xs uppercase tracking-widest text-brand-muted mb-1">{titulo}</div>
      <div className="text-3xl font-bold">{valor}</div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-muted mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

export function DashboardPage() {
  const { instancias, carregando: carregandoInstancias } = useInstancias();
  const { interacoes, carregando: carregandoInteracoes } = useInteracoesDiarias();

  const total = instancias.length;
  const conectadas = instancias.filter((i) => i.statusConexao === "conectado").length;
  const aguardando = instancias.filter((i) => i.statusConexao === "aguardando_pareamento").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-brand-muted mb-8 max-w-xl">
        Visão geral do Ablaw IA: instâncias, clientes, campanhas e atendimento por IA.
      </p>

      <Secao titulo="Instâncias">
        {carregandoInstancias ? (
          <div className="text-sm text-brand-muted">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            <CardMetrica titulo="Total de instâncias" valor={total} cor="teal" simbolo="◆" />
            <CardMetrica titulo="Conectadas" valor={conectadas} cor="violeta" simbolo="✓" />
            <CardMetrica titulo="Aguardando pareamento" valor={aguardando} cor="ambar" simbolo="…" />
          </div>
        )}
      </Secao>

      <Secao titulo="Clientes — hoje por instância">
        {carregandoInteracoes ? (
          <div className="text-sm text-brand-muted">Carregando...</div>
        ) : interacoes.length === 0 ? (
          <div className="border border-dashed border-brand-border rounded-lg p-6 text-sm text-brand-muted max-w-2xl">
            Nenhum dado de atendimento registrado hoje. Esta seção será alimentada automaticamente quando a
            IA de atendimento estiver ativa em alguma instância.
          </div>
        ) : (
          <div className="border border-brand-border rounded-lg overflow-x-auto max-w-3xl">
            <table className="w-full text-sm">
              <thead className="bg-brand-surface text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Instância</th>
                  <th className="px-4 py-2 font-medium">Leads captados</th>
                  <th className="px-4 py-2 font-medium">Conversas</th>
                  <th className="px-4 py-2 font-medium">Qualificados</th>
                </tr>
              </thead>
              <tbody>
                {interacoes.map((i) => (
                  <tr key={i.instanciaId} className="border-t border-brand-border">
                    <td className="px-4 py-2">{i.nomeServico}</td>
                    <td className="px-4 py-2">{i.leadsCaptados}</td>
                    <td className="px-4 py-2">{i.conversas}</td>
                    <td className="px-4 py-2">{i.qualificados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Secao>

      <Secao titulo="Campanhas">
        <div className="border border-dashed border-brand-border rounded-lg p-6 text-sm text-brand-muted max-w-2xl">
          Nenhuma conta de Meta Ads ou Google Ads conectada ainda. Configure em "Campanhas" no menu lateral.
        </div>
      </Secao>

      <Secao titulo="Atendimento por IA">
        <div className="border border-dashed border-brand-border rounded-lg p-6 text-sm text-brand-muted max-w-2xl">
          A IA jurídica de atendimento ainda não está configurada. Quando o motor de IA for definido, as
          conversas e qualificações de leads aparecerão aqui.
        </div>
      </Secao>
    </div>
  );
}
