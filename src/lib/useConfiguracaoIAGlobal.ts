import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";

export interface ModeloOpenAI {
  id: string;
  rotulo: string;
}

export const MODELOS_OPENAI: ModeloOpenAI[] = [
  { id: "gpt-4.1", rotulo: "GPT-4.1 (mais capaz)" },
  { id: "gpt-4o", rotulo: "GPT-4o (equilibrado)" },
  { id: "gpt-4o-mini", rotulo: "GPT-4o mini (mais rápido)" },
];

async function fetchConfiguracao(): Promise<string> {
  const { data, error } = await supabase
    .from("configuracao_ia_global")
    .select("modelo")
    .single();
  if (error) throw error;
  return data.modelo as string;
}

export function useConfiguracaoIAGlobal() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ["configuracao-ia-global"], queryFn: fetchConfiguracao });

  const salvarModeloMutation = useMutation({
    mutationFn: async (modelo: string) => {
      const { error } = await supabase
        .from("configuracao_ia_global")
        .update({ modelo, atualizado_em: new Date().toISOString() })
        .eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["configuracao-ia-global"] }),
  });

  const testarConexaoMutation = useMutation({
    mutationFn: async (modelo: string) => {
      const { data, error } = await supabase.functions.invoke("testar-conexao-ia", {
        body: { modelo },
      });
      if (error) {
        const corpo = await error.context?.json?.().catch(() => null);
        throw new Error(corpo?.erro ?? error.message);
      }
      if (data?.erro) throw new Error(data.erro);
      return data as { ok: boolean; modelo: string; resposta: string };
    },
  });

  const salvarModelo = useCallback(
    (modelo: string) => salvarModeloMutation.mutateAsync(modelo),
    [salvarModeloMutation]
  );

  const testarConexao = useCallback(
    (modelo: string) => testarConexaoMutation.mutateAsync(modelo),
    [testarConexaoMutation]
  );

  return {
    modeloAtual: query.data,
    carregando: query.isLoading,
    erro: query.error,
    salvarModelo,
    testarConexao,
  };
}
