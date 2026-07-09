import { NavLink } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthProvider";
import { InstallPwaButton } from "./InstallPwaButton";

function itemClasse({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-2 text-sm font-medium ${
    isActive
      ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/40"
      : "text-brand-text/80 hover:bg-brand-surface-hover"
  }`;
}

function subItemClasse({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-1.5 text-sm ml-3 ${
    isActive
      ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/40"
      : "text-brand-text/70 hover:bg-brand-surface-hover"
  }`;
}

interface SidebarProps {
  aberta: boolean;
  onFechar: () => void;
}

export function Sidebar({ aberta, onFechar }: SidebarProps) {
  const { user } = useAuth();

  return (
    <>
      {aberta && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onFechar}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-brand-border bg-brand-surface p-4 flex flex-col
          transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto
          ${aberta ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-6 px-2 flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold tracking-wide">
              <span className="text-brand-accent">AB</span>LAW IA
            </div>
            <div className="text-[11px] text-brand-muted tracking-wide mt-0.5">Bem-vindo ao futuro!</div>
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar menu"
            className="lg:hidden text-brand-muted hover:text-brand-text text-xl leading-none px-1"
          >
            ×
          </button>
        </div>
        <nav
          onClick={onFechar}
          className="flex flex-col gap-1 flex-1 overflow-y-auto"
        >
          <NavLink to="/" end className={itemClasse}>
            Dashboard
          </NavLink>

          <div className="px-2 pt-4 pb-1 text-xs font-medium uppercase tracking-widest text-brand-muted">
            Campanhas
          </div>
          <NavLink to="/campanhas/meta-ads" className={subItemClasse}>
            Meta Ads
          </NavLink>
          <NavLink to="/campanhas/google-ads" className={subItemClasse}>
            Google Ads
          </NavLink>

          <div className="px-2 pt-4 pb-1 text-xs font-medium uppercase tracking-widest text-brand-muted">
            Grupos
          </div>
          <NavLink to="/grupos" className={itemClasse}>
            Gerenciamento de Grupos
          </NavLink>

          <div className="px-2 pt-4 pb-1 text-xs font-medium uppercase tracking-widest text-brand-muted">
            Configurações
          </div>
          <NavLink to="/configuracoes/instancias" className={itemClasse}>
            Instâncias
          </NavLink>
          <NavLink to="/clientes" className={itemClasse}>
            Clientes
          </NavLink>
          <NavLink to="/configuracoes/configurar-ia" className={itemClasse}>
            Configurar IA
          </NavLink>
        </nav>
        <div className="px-2 pt-3 border-t border-brand-border">
          <InstallPwaButton />
        </div>
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
    </>
  );
}
