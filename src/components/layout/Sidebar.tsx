import { NavLink } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthProvider";

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 shrink-0 border-r border-brand-border bg-brand-surface h-screen p-4 flex flex-col">
      <div className="mb-6 px-2">
        <div className="text-lg font-semibold tracking-wide">
          <span className="text-brand-accent">AB</span>LAW IA
        </div>
        <div className="text-[11px] text-brand-muted tracking-wide mt-0.5">Bem-vindo ao futuro!</div>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        <div className="px-2 pt-2 pb-1 text-xs font-medium uppercase tracking-widest text-brand-muted">
          Configurações
        </div>
        <NavLink
          to="/configuracoes/instancias"
          className={({ isActive }) =>
            `rounded-md px-3 py-2 text-sm font-medium ${
              isActive
                ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/40"
                : "text-brand-text/80 hover:bg-brand-surface-hover"
            }`
          }
        >
          Instâncias
        </NavLink>
      </nav>
      {user && (
        <div className="px-2 pt-3 border-t border-brand-border">
          <div className="text-xs text-brand-muted mb-2 truncate">{user.email}</div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-brand-muted hover:text-brand-text"
          >
            Sair
          </button>
        </div>
      )}
    </aside>
  );
}
