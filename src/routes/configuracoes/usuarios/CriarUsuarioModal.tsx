import { useState } from "react";
import type { Papel } from "../../../types/perfil";

interface CriarUsuarioModalProps {
  onFechar: () => void;
  onCriar: (email: string, senha: string, papel: Papel) => Promise<void>;
}

export function CriarUsuarioModal({ onFechar, onCriar }: CriarUsuarioModalProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<Papel>("comum");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await onCriar(email.trim(), senha, papel);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar o usuário.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-1">Criar Usuário</h2>
        <p className="text-sm text-brand-muted mb-4">
          O usuário poderá entrar imediatamente com o e-mail e senha definidos aqui.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1" htmlFor="emailUsuario">
            E-mail
          </label>
          <input
            id="emailUsuario"
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-brand-accent"
          />
          <label className="block text-sm font-medium mb-1" htmlFor="senhaUsuario">
            Senha
          </label>
          <input
            id="senhaUsuario"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-brand-accent"
          />
          <label className="block text-sm font-medium mb-1" htmlFor="papelUsuario">
            Papel
          </label>
          <select
            id="papelUsuario"
            value={papel}
            onChange={(e) => setPapel(e.target.value as Papel)}
            className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm mb-1 focus:outline-none focus:border-brand-accent"
          >
            <option value="comum">Usuário comum</option>
            <option value="admin">Administrador</option>
          </select>
          {erro && <p className="text-sm text-red-400 mt-2 mb-2">{erro}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onFechar}
              disabled={enviando}
              className="px-3 py-2 text-sm rounded-md text-brand-muted hover:bg-brand-surface-hover disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover disabled:opacity-60"
            >
              {enviando ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
