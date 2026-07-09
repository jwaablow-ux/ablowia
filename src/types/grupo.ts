export interface ConfiguracaoIAGrupo {
  prompt: string;
  personalidade: string;
}

export interface Grupo {
  id: string;
  nome: string;
  configuracaoIA: ConfiguracaoIAGrupo;
  criadoEm: string;
}
