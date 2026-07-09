import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import type { Papel, Perfil } from "../types/perfil";

interface PerfilRow {
  id: string;
  email: string;
  papel: Papel;
  criado_em: string;
}

function mapRow(row: PerfilRow): Perfil {
  return { id: row.id, email: row.email, papel: row.papel, criadoEm: row.criado_em };
}

async function fetchUsuarios(): Promise<Perfil[]> {
  const { data, error } = await supabase
    .from("perfis")
    .select("id, email, papel, criado_em")
    .order("criado_em", { ascending: true });

  if (error) throw error;
  return (data as unknown as PerfilRow[]).map(mapRow);
}

export function useUsuarios() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ["usuarios"], queryFn: fetchUsuarios });

  const criarUsuarioMutation = useMutation({
    mutationFn: async ({ email, senha, papel }: { email: string; senha: string; papel: Papel }) => {
      const { data, error } = await supabase.functions.invoke("criar-usuario", {
        body: { email, senha, papel },
      });
      if (error) {
        const corpo = await error.context?.json?.().catch(() => null);
        throw new Error(corpo?.erro ?? error.message);
      }
      if (data?.erro) throw new Error(data.erro);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  const alterarPapelMutation = useMutation({
    mutationFn: async ({ id, papel }: { id: string; papel: Papel }) => {
      const { error } = await supabase.from("perfis").update({ papel }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  const criarUsuario = useCallback(
    (email: string, senha: string, papel: Papel) =>
      criarUsuarioMutation.mutateAsync({ email, senha, papel }),
    [criarUsuarioMutation]
  );

  const alterarPapel = useCallback(
    (id: string, papel: Papel) => alterarPapelMutation.mutateAsync({ id, papel }),
    [alterarPapelMutation]
  );

  return {
    usuarios: query.data ?? [],
    carregando: query.isLoading,
    erro: query.error,
    criarUsuario,
    alterarPapel,
  };
}
