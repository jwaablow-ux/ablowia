export type StatusConexao = "aguardando_pareamento" | "conectado" | "desconectado";

export interface ConfiguracaoIA {
  nomeIA: string;
  prompt: string;
  personalidade: string;
}

export interface Instancia {
  id: string;
  nomeServico: string;
  identificadorTecnico: string;
  statusConexao: StatusConexao;
  configuracaoIA: ConfiguracaoIA;
  criadaEm: string;
}
