import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";

export interface InteracaoDiaria {
  instanciaId: string;
  nomeServico: string;
  leadsCaptados: number;
  conversas: number;
  qualificados: number;
}

interface InteracaoRow {
  instancia_id: string;
  leads_captados: number;
  conversas: number;
  qualificados: number;
  instancias: { nome_servico: string } | null;
}

async function fetchInteracoesHoje(): Promise<InteracaoDiaria[]> {
  const hoje = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("interacoes_diarias")
    .select("instancia_id, leads_captados, conversas, qualificados, instancias(nome_servico)")
    .eq("data", hoje);

  if (error) throw error;

  return (data as unknown as InteracaoRow[]).map((row) => ({
    instanciaId: row.instancia_id,
    nomeServico: row.instancias?.nome_servico ?? "—",
    leadsCaptados: row.leads_captados,
    conversas: row.conversas,
    qualificados: row.qualificados,
  }));
}

export function useInteracoesDiarias() {
  const query = useQuery({ queryKey: ["interacoes-diarias"], queryFn: fetchInteracoesHoje });
  return {
    interacoes: query.data ?? [],
    carregando: query.isLoading,
    erro: query.error,
  };
}
