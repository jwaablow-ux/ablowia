export type Papel = "admin" | "comum";

export interface Perfil {
  id: string;
  email: string;
  papel: Papel;
  criadoEm: string;
}
