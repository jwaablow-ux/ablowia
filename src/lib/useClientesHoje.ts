import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";

export interface ClienteHojePorInstancia {
  instanciaId: string;
  nomeServico: string;
  leadsCaptados: number;
  conversas: number;
  qualificados: number;
}

interface InstanciaComInteracaoRow {
  id: string;
  nome_servico: string;
  interacoes_diarias: { leads_captados: number; conversas: number; qualificados: number; data: string }[];
}

/**
 * Parte de todas as instâncias (não só as que já têm linha em interacoes_diarias),
 * pra sempre mostrar cada IA na lista, mesmo com zero atendimentos hoje.
 */
async function fetchClientesHoje(): Promise<ClienteHojePorInstancia[]> {
  const hoje = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("instancias")
    .select(
      "id, nome_servico, interacoes_diarias(leads_captados, conversas, qualificados, data)"
    )
    .order("criado_em", { ascending: true });

  if (error) throw error;

  return (data as unknown as InstanciaComInteracaoRow[]).map((row) => {
    const deHoje = row.interacoes_diarias.find((i) => i.data === hoje);
    return {
      instanciaId: row.id,
      nomeServico: row.nome_servico,
      leadsCaptados: deHoje?.leads_captados ?? 0,
      conversas: deHoje?.conversas ?? 0,
      qualificados: deHoje?.qualificados ?? 0,
    };
  });
}

export function useClientesHoje() {
  const query = useQuery({ queryKey: ["clientes-hoje"], queryFn: fetchClientesHoje });
  return {
    clientes: query.data ?? [],
    carregando: query.isLoading,
    erro: query.error,
  };
}
