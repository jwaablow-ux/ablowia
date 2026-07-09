import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import type { Grupo } from "../types/grupo";

export class NomeGrupoDuplicadoError extends Error {
  constructor(nome: string) {
    super(`Já existe um grupo chamado "${nome}". Escolha outro nome para evitar confusão.`);
    this.name = "NomeGrupoDuplicadoError";
  }
}

interface GrupoRow {
  id: string;
  nome: string;
  criado_em: string;
  configuracoes_ia_grupos: { prompt: string; personalidade: string } | null;
}

function mapRow(row: GrupoRow): Grupo {
  return {
    id: row.id,
    nome: row.nome,
    configuracaoIA: {
      prompt: row.configuracoes_ia_grupos?.prompt ?? "",
      personalidade: row.configuracoes_ia_grupos?.personalidade ?? "",
    },
    criadoEm: row.criado_em,
  };
}

async function fetchGrupos(): Promise<Grupo[]> {
  const { data, error } = await supabase
    .from("grupos")
    .select("id, nome, criado_em, configuracoes_ia_grupos(prompt, personalidade)")
    .order("criado_em", { ascending: true });

  if (error) throw error;
  return (data as unknown as GrupoRow[]).map(mapRow);
}

export function useGrupos() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ["grupos"], queryFn: fetchGrupos });

  const criarGrupoMutation = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase.rpc("criar_grupo", { p_nome: nome }).single();
      if (error) {
        if (error.message.includes("NOME_DUPLICADO")) {
          throw new NomeGrupoDuplicadoError(nome.trim());
        }
        throw error;
      }
      return mapRow({ ...(data as object), configuracoes_ia_grupos: null } as GrupoRow);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos"] }),
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
        .from("configuracoes_ia_grupos")
        .update({ prompt, personalidade, atualizado_em: new Date().toISOString() })
        .eq("grupo_id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos"] }),
  });

  const excluirGrupoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("excluir_grupo", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos"] }),
  });

  const criarGrupo = useCallback(
    (nome: string) => criarGrupoMutation.mutateAsync(nome),
    [criarGrupoMutation]
  );

  const editarConfiguracaoIA = useCallback(
    (id: string, prompt: string, personalidade: string) => {
      editarConfiguracaoIAMutation.mutate({ id, prompt, personalidade });
    },
    [editarConfiguracaoIAMutation]
  );

  const excluirGrupo = useCallback(
    (id: string) => excluirGrupoMutation.mutateAsync(id),
    [excluirGrupoMutation]
  );

  return {
    grupos: query.data ?? [],
    carregando: query.isLoading,
    erro: query.error,
    criarGrupo,
    editarConfiguracaoIA,
    excluirGrupo,
  };
}
