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

export interface ResultadoCriacaoInstancia {
  instancia: Instancia;
  qrCodeBase64: string | null;
}

export function useInstancias() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["instancias"],
    queryFn: fetchInstancias,
  });

  const criarInstanciaMutation = useMutation({
    mutationFn: async (nomeServico: string): Promise<ResultadoCriacaoInstancia> => {
      const { data, error } = await supabase.functions.invoke("criar-instancia", {
        body: { nomeServico },
      });

      if (error) {
        // supabase-js só expõe o corpo de erro da function via error.context;
        // tentamos extrair a mensagem real (ex: NOME_DUPLICADO) de lá.
        const corpo = await error.context?.json?.().catch(() => null);
        const mensagem = corpo?.erro ?? error.message;
        if (typeof mensagem === "string" && mensagem.includes("NOME_DUPLICADO")) {
          throw new NomeDuplicadoError(nomeServico.trim());
        }
        throw new Error(mensagem);
      }

      if (data?.erro) {
        if (typeof data.erro === "string" && data.erro.includes("NOME_DUPLICADO")) {
          throw new NomeDuplicadoError(nomeServico.trim());
        }
        throw new Error(data.erro);
      }

      return {
        instancia: mapRow({ ...data.instancia, configuracoes_ia: null }),
        qrCodeBase64: data.evolution?.qrcode?.base64 ?? null,
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
    async (nomeServico: string): Promise<ResultadoCriacaoInstancia> => {
      return criarInstanciaMutation.mutateAsync(nomeServico);
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
