import { useCallback, useState } from "react";
import type { Instancia } from "../types/instancia";
import { gerarIdentificadorTecnico } from "./identificadorTecnico";

export class NomeDuplicadoError extends Error {
  constructor(nomeServico: string) {
    super(`Já existe uma instância chamada "${nomeServico}". Escolha outro nome para evitar confusão entre atendentes.`);
    this.name = "NomeDuplicadoError";
  }
}

/**
 * Estado local em memória, sem persistência real. Ainda não existe um projeto
 * Supabase configurado para este app — quando existir, esta função será
 * substituída pela chamada real e atômica à Edge Function de criação de
 * instância (instância + configuração de IA + estado de conexão em uma única
 * transação).
 */
export function useInstancias() {
  const [instancias, setInstancias] = useState<Instancia[]>([]);

  const criarInstancia = useCallback((nomeServico: string): Instancia => {
    const nomeNormalizado = nomeServico.trim();

    const jaExiste = instancias.some(
      (i) => i.nomeServico.toLowerCase() === nomeNormalizado.toLowerCase()
    );
    if (jaExiste) {
      throw new NomeDuplicadoError(nomeNormalizado);
    }

    const novaInstancia: Instancia = {
      id: crypto.randomUUID(),
      nomeServico: nomeNormalizado,
      identificadorTecnico: gerarIdentificadorTecnico(nomeNormalizado),
      statusConexao: "aguardando_pareamento",
      configuracaoIA: { prompt: "", personalidade: "" },
      criadaEm: new Date().toISOString(),
    };

    setInstancias((atual) => [...atual, novaInstancia]);
    return novaInstancia;
  }, [instancias]);

  const editarConfiguracaoIA = useCallback(
    (id: string, prompt: string, personalidade: string) => {
      setInstancias((atual) =>
        atual.map((i) =>
          i.id === id ? { ...i, configuracaoIA: { prompt, personalidade } } : i
        )
      );
    },
    []
  );

  return { instancias, criarInstancia, editarConfiguracaoIA };
}
