import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }
    const destino = (location.state as { from?: Location })?.from?.pathname ?? "/configuracoes/instancias";
    navigate(destino, { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <form
        onSubmit={handleSubmit}
        className="bg-brand-surface border border-brand-border rounded-lg w-full max-w-sm p-8"
      >
        <div className="text-lg font-semibold tracking-wide mb-6">
          <span className="text-brand-accent">AB</span>LAW IA
        </div>
        <label className="block text-sm font-medium mb-1" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-brand-accent"
        />
        <label className="block text-sm font-medium mb-1" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm mb-1 focus:outline-none focus:border-brand-accent"
        />
        {erro && <p className="text-sm text-red-400 mb-2">{erro}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="w-full mt-4 px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
