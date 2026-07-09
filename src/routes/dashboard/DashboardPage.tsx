import { useInstancias } from "../../lib/useInstancias";

function CardMetrica({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="border border-brand-border bg-brand-surface rounded-lg p-5">
      <div className="text-xs uppercase tracking-widest text-brand-muted mb-1">{titulo}</div>
      <div className="text-2xl font-semibold">{valor}</div>
    </div>
  );
}

export function DashboardPage() {
  const { instancias, carregando } = useInstancias();

  const total = instancias.length;
  const conectadas = instancias.filter((i) => i.statusConexao === "conectado").length;
  const aguardando = instancias.filter((i) => i.statusConexao === "aguardando_pareamento").length;

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-2">Dashboard</h1>
      <p className="text-sm text-brand-muted mb-6 max-w-xl">
        Visão geral do Ablaw IA: instâncias, campanhas e atendimento por IA.
      </p>

      <div className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-muted mb-3">Instâncias</h2>
        {carregando ? (
          <div className="text-sm text-brand-muted">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            <CardMetrica titulo="Total de instâncias" valor={total} />
            <CardMetrica titulo="Conectadas" valor={conectadas} />
            <CardMetrica titulo="Aguardando pareamento" valor={aguardando} />
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-muted mb-3">Campanhas</h2>
        <div className="border border-dashed border-brand-border rounded-lg p-6 text-sm text-brand-muted max-w-2xl">
          Nenhuma conta de Meta Ads ou Google Ads conectada ainda. Configure em "Campanhas" no menu lateral.
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-muted mb-3">
          Atendimento por IA
        </h2>
        <div className="border border-dashed border-brand-border rounded-lg p-6 text-sm text-brand-muted max-w-2xl">
          A IA jurídica de atendimento ainda não está configurada. Quando o motor de IA for definido, as
          conversas e qualificações de leads aparecerão aqui.
        </div>
      </div>
    </div>
  );
}
