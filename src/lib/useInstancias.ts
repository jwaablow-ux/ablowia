import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import type { Instancia } from "../types/instancia";

export class NomeDuplicadoError extends Error {
  constructor(nomeServico: string) {
    super(
      `Já existe uma instância chamada "${nomeServico}". Escolha outro nome para evitar confusão entre atendentes.`
    );
    this.name = "NomeDuplicadoError";
  }
}

interface InstanciaRow {
  id: string;
  nome_servico: string;
  identificador_tecnico: string;
  status_conexao: Instancia["statusConexao"];
  criado_em: string;
  configuracoes_ia: { prompt: string; personalidade: string } | null;
}

function mapRow(row: InstanciaRow): Instancia {
  return {
    id: row.id,
    nomeServico: row.nome_servico,
    identificadorTecnico: row.identificador_tecnico,
    statusConexao: row.status_conexao,
    configuracaoIA: {
      prompt: row.configuracoes_ia?.prompt ?? "",
      personalidade: row.configuracoes_ia?.personalidade ?? "",
    },
    criadaEm: row.criado_em,
  };
}

async function fetchInstancias(): Promise<Instancia[]> {
  const { data, error } = await supabase
    .from("instancias")
    .select(
      "id, nome_servico, identificador_tecnico, status_conexao, criado_em, configuracoes_ia(prompt, personalidade)"
    )
    .order("criado_em", { ascending: true });

  if (error) throw error;
  return (data as unknown as InstanciaRow[]).map(mapRow);
}

export function useInstancias() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["instancias"],
    queryFn: fetchInstancias,
  });

  const criarInstanciaMutation = useMutation({
    mutationFn: async (nomeServico: string) => {
      const { data, error } = await supabase.rpc("criar_instancia", {
        p_nome_servico: nomeServico,
      });
      if (error) {
        if (error.message.includes("NOME_DUPLICADO")) {
          throw new NomeDuplicadoError(nomeServico.trim());
        }
        throw error;
      }
      return data as unknown as {
        id: string;
        nome_servico: string;
        identificador_tecnico: string;
        status_conexao: Instancia["statusConexao"];
        criado_em: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instancias"] });
    },
  });

  const editarConfiguracaoIAMutation = useMutation({
    mutationFn: async ({
      id,
      prompt,
      personalidade,
    }: {
      id: string;
      prompt: string;
      personalidade: string;
    }) => {
      const { error } = await supabase
        .from("configuracoes_ia")
        .update({ prompt, personalidade, atualizado_em: new Date().toISOString() })
        .eq("instancia_id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instancias"] });
    },
  });

  const criarInstancia = useCallback(
    async (nomeServico: string): Promise<Instancia> => {
      const row = await criarInstanciaMutation.mutateAsync(nomeServico);
      return mapRow({ ...row, configuracoes_ia: null });
    },
    [criarInstanciaMutation]
  );

  const editarConfiguracaoIA = useCallback(
    (id: string, prompt: string, personalidade: string) => {
      editarConfiguracaoIAMutation.mutate({ id, prompt, personalidade });
    },
    [editarConfiguracaoIAMutation]
  );

  return {
    instancias: query.data ?? [],
    carregando: query.isLoading,
    erro: query.error,
    criarInstancia,
    editarConfiguracaoIA,
  };
}
