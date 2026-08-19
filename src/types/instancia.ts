export type StatusConexao = "aguardando_pareamento" | "conectado" | "desconectado";

export type ModoResposta = "automatico" | "texto" | "audio";

export interface ConfiguracaoIA {
  nomeIA: string;
  prompt: string;
  personalidade: string;
  modoResposta: ModoResposta;
}

export interface Instancia {
  id: string;
  nomeServico: string;
  identificadorTecnico: string;
  statusConexao: StatusConexao;
  configuracaoIA: ConfiguracaoIA;
  criadaEm: string;
}
